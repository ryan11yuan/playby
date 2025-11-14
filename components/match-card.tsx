'use client'

import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export function MatchCard() {
  const [score, setScore] = useState({ home: 2, away: 1 })
  const [time, setTime] = useState(67)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => (t < 90 ? t + 1 : 67))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl border-white/[0.08] shadow-2xl p-8 relative overflow-hidden rounded-3xl">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-blue-500/5 blur-3xl rounded-full" />
      
      <div className="relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">
            Live
          </span>
          <span className="text-white/40 text-xs font-medium">
            {time}'
          </span>
        </div>

        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 text-center">
            <div className="text-white/50 text-xs mb-3 font-medium tracking-wide">Manchester City</div>
            <div className="text-7xl font-bold text-white tabular-nums">{score.home}</div>
          </div>

          <div className="text-white/20 text-2xl font-extralight">–</div>

          <div className="flex-1 text-center">
            <div className="text-white/50 text-xs mb-3 font-medium tracking-wide">Liverpool</div>
            <div className="text-7xl font-bold text-white tabular-nums">{score.away}</div>
          </div>
        </div>

        <div className="mt-6 text-center text-white/40 text-xs font-medium tracking-wide">
          Premier League · Etihad Stadium
        </div>
      </div>
    </Card>
  )
}
