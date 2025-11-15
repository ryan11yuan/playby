"use client"

import { useEffect, useRef, useState } from "react"

type Sensitivity = "conservative" | "balanced" | "aggressive"
type Mode = "auto" | "mic" | "stream"

interface UseAudioExcitementOptions {
  sensitivity?: Sensitivity
  // Minimum seconds between spikes to avoid spam
  cooldownSeconds?: number
  // Optional external audio stream (e.g., getDisplayMedia)
  mediaStream?: MediaStream
  // Input mode. "stream" avoids prompting for mic when no stream.
  mode?: Mode
  // If false, detector is idle until enabled.
  enabled?: boolean
}

interface UseAudioExcitementResult {
  score: number
  spike: boolean
  error: string | null
  permissionState: "pending" | "granted" | "denied"
  centroid: number // normalized spectral centroid 0..1
  voiceLikely: boolean // heuristic: commentator speech likely
}

// Lightweight real-time audio excitement detector based on RMS and spectral flux.
export function useAudioExcitement(options?: UseAudioExcitementOptions): UseAudioExcitementResult {
  const sensitivity = options?.sensitivity ?? "balanced"
  const cooldownSeconds = options?.cooldownSeconds ?? 10
  const externalStream = options?.mediaStream ?? null
  const mode: Mode = options?.mode ?? "auto"
  const enabled = options?.enabled ?? true

  const [score, setScore] = useState(0)
  const [spike, setSpike] = useState(false)
  const [centroid, setCentroid] = useState(0)
  const [voiceLikely, setVoiceLikely] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied">("pending")

  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastFluxRef = useRef<Float32Array | null>(null)
  const lastSpikeAtRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  // Rolling windows for baseline
  const rmsWindowRef = useRef<number[]>([])
  const fluxWindowRef = useRef<number[]>([])

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!enabled) return
      try {
        let stream: MediaStream
        if (externalStream) {
          stream = externalStream
          setPermissionState("granted")
        } else if (mode === "stream") {
          // Waiting for an external stream; stay idle
          setPermissionState("pending")
          return
        } else {
          if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("getUserMedia not available in this environment")
          }
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: false,
          })
        }

        if (cancelled) {
          // If effect already cleaned up
          stream.getTracks().forEach(t => t.stop())
          return
        }

        if (mode !== "stream") setPermissionState("granted")

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        ctxRef.current = ctx

        const source = ctx.createMediaStreamSource(stream)
        sourceRef.current = source

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.2
        analyserRef.current = analyser

        source.connect(analyser)

        const timeDomain = new Float32Array(analyser.fftSize)
        const freqDomain = new Uint8Array(analyser.frequencyBinCount)
        const sampleRate = ctx.sampleRate
        // Rolling voice flag stability
        let consecutiveVoiceFrames = 0

        const targetFps = 20
        const frameIntervalMs = 1000 / targetFps
        let lastFrameTime = 0

        const loop = (now: number) => {
          if (cancelled) return
          rafRef.current = requestAnimationFrame(loop)
          if (now - lastFrameTime < frameIntervalMs) return
          lastFrameTime = now

          analyser.getFloatTimeDomainData(timeDomain)
          analyser.getByteFrequencyData(freqDomain)

          // RMS
          let sumSq = 0
          for (let i = 0; i < timeDomain.length; i++) {
            const v = timeDomain[i]
            sumSq += v * v
          }
          const rms = Math.sqrt(sumSq / timeDomain.length)

          // Spectral flux (positive differences of normalized magnitudes)
          const mags = new Float32Array(freqDomain.length)
          let sumMag = 0
          for (let i = 0; i < freqDomain.length; i++) {
            const m = freqDomain[i] / 255
            mags[i] = m
            sumMag += m
          }
          let flux = 0
          const last = lastFluxRef.current
          if (last && last.length === mags.length) {
            for (let i = 0; i < mags.length; i++) {
              const diff = mags[i] - last[i]
              if (diff > 0) flux += diff
            }
          }
          lastFluxRef.current = mags

          // Spectral centroid (weighted average frequency)
          let weightedSum = 0
          for (let i = 0; i < mags.length; i++) {
            // frequency of bin i:
            const freq = (i * sampleRate) / 2 / mags.length
            weightedSum += freq * mags[i]
          }
          const centroidFreq = sumMag > 0 ? weightedSum / sumMag : 0
          const normCentroid = centroidFreq / (sampleRate / 2)
          setCentroid(normCentroid)

          // High-frequency energy ratio (> ~2.5kHz)
          const highFreqStart = Math.floor((2500 / (sampleRate / 2)) * mags.length)
          let highSum = 0
          for (let i = highFreqStart; i < mags.length; i++) highSum += mags[i]
          const highRatio = sumMag > 0 ? highSum / sumMag : 0

          // Voice heuristic: centroid in speech band and limited high-frequency energy
          const centroidSpeechBand = normCentroid > 0.05 && normCentroid < 0.35
          const lowHighRatio = highRatio < 0.28 // crowd noise tends to push more high freq randomness
          const voiceFrame = centroidSpeechBand && lowHighRatio
          consecutiveVoiceFrames = voiceFrame ? consecutiveVoiceFrames + 1 : 0
          const voiceDetected = consecutiveVoiceFrames >= 8 // ~400ms at 20fps
          setVoiceLikely(voiceDetected)

          // Update rolling windows (cap to ~5s of history at 20fps -> 100 frames)
          const MAX_FRAMES = 100
          rmsWindowRef.current.push(rms)
          if (rmsWindowRef.current.length > MAX_FRAMES) rmsWindowRef.current.shift()
          fluxWindowRef.current.push(flux)
          if (fluxWindowRef.current.length > MAX_FRAMES) fluxWindowRef.current.shift()

          // Compute z-scores
          const zr = zScore(rms, rmsWindowRef.current)
          const zf = zScore(flux, fluxWindowRef.current)

          // Weighted excitement score favoring spectral changes
          const excitement = Math.max(0, 0.3 * zr + 0.7 * zf)
          setScore(excitement)

          const threshold = thresholdFor(sensitivity)
          const nowMs = Date.now()
          const inCooldown = nowMs - lastSpikeAtRef.current < cooldownSeconds * 1000
          if (!inCooldown && excitement >= threshold && !voiceDetected) {
            lastSpikeAtRef.current = nowMs
            setSpike(true)
            setTimeout(() => setSpike(false), 200)
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Audio initialization failed")
        setPermissionState(e?.name === "NotAllowedError" ? "denied" : "pending")
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      try {
        sourceRef.current?.mediaStream.getTracks().forEach(t => t.stop())
        sourceRef.current?.disconnect()
      } catch {}
      try {
        analyserRef.current?.disconnect()
      } catch {}
      try {
        ctxRef.current?.close()
      } catch {}
      ctxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
      lastFluxRef.current = null
      rmsWindowRef.current = []
      fluxWindowRef.current = []
    }
  }, [sensitivity, cooldownSeconds, externalStream, mode, enabled])

  return { score, spike, error, permissionState, centroid, voiceLikely }
}

function meanStd(arr: number[]) {
  if (arr.length < 8) return { mean: 0, std: 1 }
  let sum = 0
  for (const v of arr) sum += v
  const mean = sum / arr.length
  let varSum = 0
  for (const v of arr) varSum += (v - mean) * (v - mean)
  const std = Math.sqrt(varSum / arr.length) || 1
  return { mean, std }
}

function zScore(value: number, ref: number[]) {
  const { mean, std } = meanStd(ref)
  return (value - mean) / std
}

function thresholdFor(s: Sensitivity) {
  switch (s) {
    case "aggressive":
      return 1.5
    case "conservative":
      return 3.0
    case "balanced":
    default:
      return 2.2
  }
}
