 'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { ListeningIndicator } from '@/components/listening-indicator'
import { MatchCard } from '@/components/match-card'
import { AlertFeed } from '@/components/alert-feed'
import { ControlsPanel } from '@/components/controls-panel'
import { NotificationBanner } from '@/components/notification-banner'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudioExcitement } from '@/lib/useAudioExcitement'
import { useRouter } from 'next/navigation'
import { captureTabAudio } from '@/lib/captureTabAudio'

export default function Home() {
  const router = useRouter()
  const [showControls, setShowControls] = useState(false)
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'counterattack', label: 'Counterattack', timestamp: new Date(Date.now() - 120000) },
    { id: 2, type: 'set-piece', label: 'Set Piece Building', timestamp: new Date(Date.now() - 180000) },
    { id: 3, type: 'threat', label: 'Box Entry Threat', timestamp: new Date(Date.now() - 240000) },
  ])
  const [currentNotification, setCurrentNotification] = useState<{ id: number; type: string; label: string } | null>(null)
  const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null)
  const [sensitivityValue, setSensitivityValue] = useState(50)

  const sensitivityLabel = useMemo(() => {
    if (sensitivityValue < 33) return 'conservative'
    if (sensitivityValue < 66) return 'balanced'
    return 'aggressive'
  }, [sensitivityValue])

  const { spike, score, centroid, voiceLikely, error: audioError } = useAudioExcitement({
    sensitivity: sensitivityLabel as any,
    cooldownSeconds: 25, // longer cooldown to reduce spam
    mediaStream: capturedStream ?? undefined,
    mode: 'stream',
    enabled: !!capturedStream,
  })

  const startCapture = async () => {
    try {
      const stream = await captureTabAudio()
      setCapturedStream(stream)
    } catch (e: any) {
      setCurrentNotification({ id: Date.now(), type: 'threat', label: e?.message || 'Failed to capture audio', timestamp: new Date() } as any)
    }
  }

  const stopCapture = () => {
    capturedStream?.getTracks().forEach(t => t.stop())
    setCapturedStream(null)
  }

  // Generate alerts from audio excitement spikes
  // Refined spike gating: require score above dynamic threshold
  useEffect(() => {
    if (!spike) return
    const baseThreshold = sensitivityLabel === 'conservative' ? 3.0 : sensitivityLabel === 'balanced' ? 2.2 : 1.5
    const triggerThreshold = baseThreshold + 0.6 // extra margin to suppress speech spikes
    if (score < triggerThreshold) return
    if (voiceLikely) return // commentator speech, ignore
    const newAlert = { id: Date.now(), type: 'threat', label: 'Crowd surge detected', timestamp: new Date() }
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
    setCurrentNotification(newAlert)
  }, [spike, score, sensitivityLabel, voiceLikely])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-linear-to-br from-[#000000] via-[#0a0a12] to-[#0f0f1a] animate-[gradient-shift_15s_ease_infinite] bg-size-[200%_200%]" />
      
      {/* Surface capture errors */}
      {audioError && (
        <NotificationBanner
          type="threat"
          label="Audio capture unavailable. Try selecting a tab with audio."
          onDismiss={() => {}}
        />
      )}

      {currentNotification && (
        <NotificationBanner
          type={currentNotification.type}
          label={currentNotification.label}
          onDismiss={() => setCurrentNotification(null)}
        />
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen p-6 pb-32 max-w-2xl mx-auto">
        {/* Header with settings */}
        <div className="flex justify-end mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            aria-label="Settings"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <div className="ml-2" />
          {capturedStream ? (
            <Button
              variant="outline"
              size="sm"
              className="text-white/80 border-white/20 hover:bg-white/10"
              onClick={stopCapture}
            >
              Stop Capture
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-white/80 border-white/20 hover:bg-white/10"
              onClick={startCapture}
            >
              Capture Tab Audio
            </Button>
          )}
        </div>

        {/* Listening Indicator */}
        <div className="flex flex-col items-center mb-12 gap-4">
          <ListeningIndicator />
          {capturedStream && (
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium backdrop-blur">
              Excitement: <span className="text-white">{score.toFixed(2)}</span> · Centroid: {centroid.toFixed(2)} · Voice: {voiceLikely ? 'yes' : 'no'} · Mode: {sensitivityLabel}
            </div>
          )}
        </div>

        {/* Match Card */}
        <div className="flex justify-center mb-12">
          <MatchCard />
        </div>

        {/* Alert Feed */}
        <div className="flex-1">
          <AlertFeed alerts={alerts} />
        </div>
      </div>

      {/* Controls Panel Overlay */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-500 ease-out',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <ControlsPanel
          onClose={() => setShowControls(false)}
          sensitivityValue={sensitivityValue}
          onSensitivityChange={setSensitivityValue}
        />
      </div>

      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/10 backdrop-blur-xl px-8 py-3.5 rounded-full text-white text-sm font-medium hover:bg-white/15 active:scale-95 transition-all duration-200 shadow-lg border border-white/10"
      >
        {showControls ? 'Close' : 'Controls'}
      </button>
    </div>
  )
}
