'use client'

import { useEffect, useState } from 'react'
import { X, Zap, AlertTriangle, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationBannerProps {
  type: string
  label: string
  onDismiss: () => void
}

const notificationConfig = {
  counterattack: {
    icon: Zap,
    color: 'from-blue-500/10 to-blue-600/10 border-blue-500/30',
    iconColor: 'text-blue-400',
    bgGlow: 'bg-blue-500/5',
  },
  threat: {
    icon: AlertTriangle,
    color: 'from-red-500/10 to-red-600/10 border-red-500/30',
    iconColor: 'text-red-400',
    bgGlow: 'bg-red-500/5',
  },
  'set-piece': {
    icon: Target,
    color: 'from-orange-500/10 to-orange-600/10 border-orange-500/30',
    iconColor: 'text-orange-400',
    bgGlow: 'bg-orange-500/5',
  },
  'goal-attempt': {
    icon: TrendingUp,
    color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    bgGlow: 'bg-emerald-500/5',
  },
}

export function NotificationBanner({ type, label, onDismiss }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const config = notificationConfig[type as keyof typeof notificationConfig] || notificationConfig.threat
  const Icon = config.icon

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }

  return (
    <div
      className={cn(
        'fixed top-6 left-4 right-4 z-50 transition-all duration-500 ease-out max-w-lg mx-auto',
        isVisible && !isLeaving ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      )}
    >
      <div
        className={cn(
          'bg-gradient-to-r backdrop-blur-2xl border rounded-3xl shadow-2xl p-5 relative overflow-hidden',
          config.color
        )}
      >
        <div className={cn('absolute inset-0 blur-2xl opacity-50', config.bgGlow)} />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className={cn('animate-[pulse-soft_2s_ease-in-out_infinite]', config.iconColor)}>
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base">{label}</div>
            <div className="text-white/50 text-xs font-medium">Tap for details</div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white active:scale-90 transition-all duration-200 rounded-full p-1 hover:bg-white/10"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-4 h-0.5 bg-white/10 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-white/40 rounded-full animate-[shrink_5s_linear]"
            style={{
              animation: 'shrink 5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}
