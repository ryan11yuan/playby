'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ListeningIndicator } from '@/components/listening-indicator'
import { MatchCard } from '@/components/match-card'
import { AlertFeed } from '@/components/alert-feed'
import { ControlsPanel } from '@/components/controls-panel'
import { NotificationBanner } from '@/components/notification-banner'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Home() {
  const [showControls, setShowControls] = useState(false)
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'counterattack', label: 'Counterattack', timestamp: new Date(Date.now() - 120000) },
    { id: 2, type: 'set-piece', label: 'Set Piece Building', timestamp: new Date(Date.now() - 180000) },
    { id: 3, type: 'threat', label: 'Box Entry Threat', timestamp: new Date(Date.now() - 240000) },
  ])
  const [currentNotification, setCurrentNotification] = useState<{ id: number; type: string; label: string } | null>(null)

  // Simulate new alerts coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const alertTypes = [
        { type: 'counterattack', label: 'Counterattack' },
        { type: 'set-piece', label: 'Set Piece Building' },
        { type: 'threat', label: 'Box Entry Threat' },
        { type: 'goal-attempt', label: 'Goal Attempt' },
        { type: 'possession', label: 'Possession Change' },
      ]
      
      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const newAlert = { id: Date.now(), ...randomAlert, timestamp: new Date() }
      
      setAlerts(prev => [
        newAlert,
        ...prev.slice(0, 9), // Keep only last 10 alerts
      ])
      
      setCurrentNotification(newAlert)
    }, 15000) // New alert every 15 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#0a0a12] to-[#0f0f1a] animate-[gradient-shift_15s_ease_infinite] bg-[length:200%_200%]" />
      
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
            onClick={() => window.location.href = '/settings'}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Listening Indicator */}
        <div className="flex justify-center mb-12">
          <ListeningIndicator />
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
        <ControlsPanel onClose={() => setShowControls(false)} />
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
