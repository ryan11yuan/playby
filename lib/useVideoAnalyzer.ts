"use client"

import { useEffect, useRef, useState } from "react"

interface UseVideoAnalyzerOptions {
  mediaStream?: MediaStream | null
  enabled?: boolean
  targetSize?: number
  fps?: number
  cooldownSeconds?: number
  heatmapScale?: number
  heatmapDecay?: number
}

interface UseVideoAnalyzerResult {
  impact: number
  spike: boolean
  error: string | null
  heatmapDataUrl: string | null
}

export function useVideoAnalyzer(opts: UseVideoAnalyzerOptions): UseVideoAnalyzerResult {
  const mediaStream = opts.mediaStream ?? null
  const enabled = opts.enabled ?? true
  const size = opts.targetSize ?? 416
  const fps = opts.fps ?? 8
  const cooldownSeconds = opts.cooldownSeconds ?? 15
  const heatmapScale = opts.heatmapScale ?? 8
  const heatmapDecay = opts.heatmapDecay ?? 0.92

  const [impact, setImpact] = useState(0)
  const [spike, setSpike] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastSpikeAtRef = useRef<number>(0)
  const prevLumaRef = useRef<Uint8ClampedArray | null>(null)
  const heatAccumRef = useRef<Float32Array | null>(null)
  const heatCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const windowRef = useRef<number[]>([])

  useEffect(() => {
    let cancelled = false
    if (!enabled || !mediaStream) return

    const video = document.createElement("video")
    videoRef.current = video
    video.srcObject = mediaStream
    video.muted = true
    video.playsInline = true

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    canvasRef.current = canvas
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!

    const heatW = Math.max(1, Math.floor(size / heatmapScale))
    const heatCanvas = document.createElement("canvas")
    heatCanvas.width = heatW
    heatCanvas.height = heatW
    heatCanvasRef.current = heatCanvas
    heatAccumRef.current = new Float32Array(heatW * heatW)
    const heatCtx = heatCanvas.getContext("2d")!

    const start = async () => {
      try { await video.play() } catch (e: any) {
        setError(e?.message || "Failed to play captured video")
        return
      }
      const frameIntervalMs = 1000 / fps
      let lastTime = 0
      const step = (now: number) => {
        if (cancelled) return
        rafRef.current = requestAnimationFrame(step)
        if (now - lastTime < frameIntervalMs) return
        lastTime = now
        const w = video.videoWidth || 0
        const h = video.videoHeight || 0
        if (w < 2 || h < 2) return
        const scale = Math.min(size / w, size / h)
        const dw = Math.floor(w * scale), dh = Math.floor(h * scale)
        const ox = Math.floor((size - dw) / 2)
        const oy = Math.floor((size - dh) / 2)
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(video, 0, 0, w, h, ox, oy, dw, dh)
        const frame = ctx.getImageData(0, 0, size, size)
        const data = frame.data
        const prev = prevLumaRef.current
        const luma = new Uint8ClampedArray(size * size)
        let diffSum = 0
        for (let i = 0; i < data.length; i += 4) {
          const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            const idx = i / 4
            luma[idx] = y
            if (prev) diffSum += Math.abs(y - prev[idx])
        }
        prevLumaRef.current = luma
        const pixels = size * size
        const meanDiff = prev ? diffSum / pixels : 0
        const MAX = 80
        windowRef.current.push(meanDiff)
        if (windowRef.current.length > MAX) windowRef.current.shift()
        const { mean, std } = meanStd(windowRef.current)
        const z = std > 0 ? (meanDiff - mean) / std : 0
        const score = Math.max(0, z)
        setImpact(score)
        if (prev) {
          const heatAccum = heatAccumRef.current!
          const grid = heatCanvas.width
          const cellSize = size / grid
          for (let gy = 0; gy < grid; gy++) {
            for (let gx = 0; gx < grid; gx++) {
              let cellDiff = 0, samples = 0
              const xStart = Math.floor(gx * cellSize)
              const yStart = Math.floor(gy * cellSize)
              const xEnd = Math.min(size, Math.floor((gx + 1) * cellSize))
              const yEnd = Math.min(size, Math.floor((gy + 1) * cellSize))
              for (let y = yStart; y < yEnd; y++) {
                const base = y * size
                for (let x = xStart; x < xEnd; x++) {
                  const p = base + x
                  cellDiff += Math.abs(luma[p] - prev[p])
                  samples++
                }
              }
              const avg = samples ? cellDiff / samples : 0
              const i = gy * grid + gx
              const decayed = heatAccum[i] * heatmapDecay
              const impulse = Math.min(1, avg / 64)
              heatAccum[i] = decayed + impulse * (1 - heatmapDecay)
            }
          }
          const imageData = heatCtx.createImageData(grid, grid)
          for (let i = 0; i < heatAccumRef.current!.length; i++) {
            const v = Math.min(1, heatAccumRef.current![i])
            const r = Math.floor(255 * v)
            const g = Math.floor(255 * Math.pow(v, 0.5))
            const b = Math.floor(255 * (1 - v))
            const a = Math.floor(210 * v)
            const o = i * 4
            imageData.data[o] = r
            imageData.data[o + 1] = g
            imageData.data[o + 2] = b
            imageData.data[o + 3] = a
          }
          heatCtx.putImageData(imageData, 0, 0)
          const upscale = document.createElement("canvas")
          upscale.width = size
          upscale.height = size
          const uctx = upscale.getContext("2d")!
          uctx.imageSmoothingEnabled = true
          uctx.drawImage(heatCanvas, 0, 0, size, size)
          setHeatmapDataUrl(upscale.toDataURL("image/png"))
        }
        const nowMs = Date.now()
        const inCooldown = nowMs - lastSpikeAtRef.current < cooldownSeconds * 1000
        if (!inCooldown && score >= 2.0) {
          lastSpikeAtRef.current = nowMs
          setSpike(true)
          setTimeout(() => setSpike(false), 220)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }
    start()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      try { video.pause() } catch {}
      video.srcObject = null
      prevLumaRef.current = null
      heatAccumRef.current = null
      heatCanvasRef.current = null
      windowRef.current = []
    }
  }, [mediaStream, enabled, size, fps, cooldownSeconds, heatmapScale, heatmapDecay])

  return { impact, spike, error, heatmapDataUrl }
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
