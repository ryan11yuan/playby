'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { MatchCard } from '@/components/match-card'
import { AlertFeed } from '@/components/alert-feed'
import { ControlsPanel } from '@/components/controls-panel'
import { NotificationBanner } from '@/components/notification-banner'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVideoAnalyzer } from '@/lib/useVideoAnalyzer'
import { useRouter } from 'next/navigation'
import { captureTabVideo } from '@/lib/captureTabVideo'

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

  const { spike, impact, error: videoError, heatmapDataUrl } = useVideoAnalyzer({
    mediaStream: capturedStream,
    enabled: !!capturedStream,
    targetSize: 416,
    fps: 8,
    cooldownSeconds: 12,
  })

  const startCapture = async () => {
    try {
      const stream = await captureTabVideo()
      setCapturedStream(stream)
    } catch (e: any) {
      setCurrentNotification({ id: Date.now(), type: 'threat', label: e?.message || 'Failed to capture video', timestamp: new Date() } as any)
    }
  }

  const stopCapture = () => {
    capturedStream?.getTracks().forEach(t => t.stop())
    setCapturedStream(null)
  }

  // Generate alerts from video impact spikes
  useEffect(() => {
    if (!spike) return
    const baseThreshold = sensitivityLabel === 'conservative' ? 2.5 : sensitivityLabel === 'balanced' ? 2.0 : 1.3
    if (impact < baseThreshold) return
    const newAlert = { id: Date.now(), type: 'threat', label: 'Visual surge detected', timestamp: new Date() }
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
    setCurrentNotification(newAlert)
  }, [spike, impact, sensitivityLabel])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-linear-to-br from-[#000000] via-[#0a0a12] to-[#0f0f1a] animate-[gradient-shift_15s_ease_infinite] bg-size-[200%_200%]" />
      
      {/* Surface capture errors */}
      {videoError && (
        <NotificationBanner
          type="threat"
          label="Video capture unavailable. Try selecting a tab with video."
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
        </div>

        {/* Heatmap primary view */}
        <div className="mx-auto w-[416px] mb-6">
          <div className="relative w-[416px] h-[416px] rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-lg">
            {heatmapDataUrl ? (
              <img src={heatmapDataUrl} alt="motion heatmap" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white/40 text-sm">
                Start capture to see heatmap
              </div>
            )}
            {/* Impact debug pill */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-mono text-white/80">
              <span className="px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur">impact z: {impact.toFixed(2)}</span>
              {spike && <span className="px-3 py-1 rounded-full bg-fuchsia-600/40 border border-fuchsia-500/40 text-fuchsia-100">spike</span>}
            </div>
          </div>
        </div>

        {/* Capture/Stop button directly under the heatmap */}
        <div className="flex items-center justify-center mb-10">
          {capturedStream ? (
            <Button
              variant="outline"
              size="lg"
              className="text-white/80 border-white/20 hover:bg-white/10 px-8 py-6 text-lg rounded-full shadow-lg backdrop-blur-xl bg-white/5 transition-all duration-200"
              onClick={stopCapture}
            >
              Stop Capture
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="text-white/80 border-white/20 hover:bg-white/10 px-8 py-6 text-lg rounded-full shadow-lg backdrop-blur-xl bg-white/5 transition-all duration-200"
              onClick={startCapture}
            >
              Capture Tab Video
            </Button>
          )}
        </div>

        {/* Recent Alerts list */}
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
