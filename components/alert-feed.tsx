'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, AlertTriangle, Target, Zap, ArrowRightLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: number
  type: string
  label: string
  timestamp: Date
}

interface AlertFeedProps {
  alerts: Alert[]
}

const alertIcons = {
  counterattack: Zap,
  'set-piece': Target,
  threat: AlertTriangle,
  'goal-attempt': TrendingUp,
  possession: ArrowRightLeft,
}

const alertColors = {
  counterattack: 'text-[var(--color-neon-blue)]',
  'set-piece': 'text-orange-400',
  threat: 'text-red-400',
  'goal-attempt': 'text-[var(--color-neon-green)]',
  possession: 'text-cyan-400',
}

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-6 px-1">
        Recent Alerts
      </h3>
      
      <div className="space-y-2.5">
        {alerts.map((alert, index) => {
          const Icon = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle
          const colorClass = alertColors[alert.type as keyof typeof alertColors] || 'text-white'
          
          return (
            <Card
              key={alert.id}
              className="bg-white/[0.04] backdrop-blur-2xl border-white/[0.08] p-4 hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer group rounded-2xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`${colorClass} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm">{alert.label}</div>
                  <div className="text-white/40 text-xs font-medium">
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </div>
                </div>

                <div className="text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
