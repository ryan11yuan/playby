'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, ChevronRight, Vibrate, Volume2, Bell, Info } from 'lucide-react'
import { SettingsSheet } from '@/components/settings-sheet'

export default function SettingsPage() {
  const [haptics, setHaptics] = useState(true)
  const [audioCues, setAudioCues] = useState(true)
  const [goalAlerts, setGoalAlerts] = useState(true)
  const [threatAlerts, setThreatAlerts] = useState(true)
  const [setPieceAlerts, setSetPieceAlerts] = useState(true)
  const [possessionAlerts, setPossessionAlerts] = useState(false)
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  const settingsSections = [
    {
      title: 'Feedback',
      items: [
        {
          id: 'haptics',
          icon: Vibrate,
          label: 'Haptic Feedback',
          description: 'Vibrate on important moments',
          value: haptics,
          onChange: setHaptics,
        },
        {
          id: 'audio',
          icon: Volume2,
          label: 'Audio Cues',
          description: 'Play sounds for alerts',
          value: audioCues,
          onChange: setAudioCues,
        },
      ],
    },
    {
      title: 'Notification Types',
      items: [
        {
          id: 'goals',
          icon: Bell,
          label: 'Goal Attempts',
          description: 'Shots on target and near misses',
          value: goalAlerts,
          onChange: setGoalAlerts,
        },
        {
          id: 'threats',
          icon: Bell,
          label: 'Threat Detection',
          description: 'Dangerous attacks and box entries',
          value: threatAlerts,
          onChange: setThreatAlerts,
        },
        {
          id: 'setpieces',
          icon: Bell,
          label: 'Set Pieces',
          description: 'Corners, free kicks, and throw-ins',
          value: setPieceAlerts,
          onChange: setSetPieceAlerts,
        },
        {
          id: 'possession',
          icon: Bell,
          label: 'Possession Changes',
          description: 'Major shifts in ball control',
          value: possessionAlerts,
          onChange: setPossessionAlerts,
        },
      ],
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#0a0a12] to-[#0f0f1a]" />
      
      <div className="relative z-10 min-h-screen">
        <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-2xl border-b border-white/[0.08]">
          <div className="flex items-center gap-4 p-6 max-w-2xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/'}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </Button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          </div>
        </div>

        <div className="p-6 space-y-10 pb-24 max-w-2xl mx-auto">
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest px-1">
                {section.title}
              </h2>
              
              <Card className="bg-white/[0.04] backdrop-blur-2xl border-white/[0.08] divide-y divide-white/[0.05] overflow-hidden rounded-2xl">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon
                  
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors"
                    >
                      <div className="text-blue-400">
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      
                      <button
                        onClick={() => setActiveSheet(item.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-white font-semibold text-sm">{item.label}</div>
                        <div className="text-white/40 text-xs font-medium">{item.description}</div>
                      </button>

                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  )
                })}
              </Card>
            </div>
          ))}

          <div className="space-y-4">
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest px-1">
              About
            </h2>
            
            <Card className="bg-white/[0.04] backdrop-blur-2xl border-white/[0.08] rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveSheet('about')}
                className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors"
              >
                <div className="text-blue-400">
                  <Info className="w-5 h-5" strokeWidth={2} />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-semibold text-sm">App Information</div>
                  <div className="text-white/40 text-xs font-medium">Version 1.0.0</div>
                </div>

                <ChevronRight className="w-5 h-5 text-white/30" strokeWidth={2} />
              </button>
            </Card>
          </div>
        </div>
      </div>

      <SettingsSheet
        isOpen={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        settingId={activeSheet}
      />
    </div>
  )
}
