'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'

interface ControlsPanelProps {
  onClose: () => void
}

export function ControlsPanel({ onClose }: ControlsPanelProps) {
  const [sensitivity, setSensitivity] = useState([50])
  const [isSilenced, setIsSilenced] = useState(false)
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null)

  const handleSilence = () => {
    setIsSilenced(true)
    setSilenceCountdown(600) // 10 minutes in seconds
    
    const interval = setInterval(() => {
      setSilenceCountdown(prev => {
        if (prev === null || prev <= 1) {
          setIsSilenced(false)
          clearInterval(interval)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const getSensitivityLabel = (value: number) => {
    if (value < 33) return 'Conservative'
    if (value < 66) return 'Balanced'
    return 'Aggressive'
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-black/40 backdrop-blur-2xl border-t border-white/[0.08] shadow-2xl">
      <Card className="bg-transparent border-0 shadow-none p-8 space-y-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold tracking-tight">Controls</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </Button>
        </div>

        {/* Sensitivity Slider */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-white/60 font-medium text-sm">Sensitivity</label>
            <span className="text-blue-400 font-bold text-sm">
              {getSensitivityLabel(sensitivity[0])}
            </span>
          </div>
          
          <Slider
            value={sensitivity}
            onValueChange={setSensitivity}
            max={100}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-white/40 font-medium px-1">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Silence Button */}
        <div className="pt-2">
          <Button
            onClick={handleSilence}
            disabled={isSilenced}
            className={`w-full py-6 text-sm font-semibold rounded-2xl transition-all duration-200 ${
              isSilenced
                ? 'bg-white/5 text-white/40 cursor-not-allowed'
                : 'bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-400 border border-red-500/30'
            }`}
          >
            {isSilenced && silenceCountdown !== null
              ? `Silenced for ${formatCountdown(silenceCountdown)}`
              : 'Silence for 10 min'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
