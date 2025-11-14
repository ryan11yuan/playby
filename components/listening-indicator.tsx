'use client'

import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'

export function ListeningIndicator() {
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex items-center gap-3 px-6 py-3.5 bg-white/[0.06] backdrop-blur-2xl rounded-full border border-white/[0.08] shadow-xl">
      <div className={`absolute inset-0 rounded-full bg-blue-500/10 blur-lg transition-opacity duration-1000 ${pulse ? 'opacity-100' : 'opacity-40'}`} />
      
      <div className="relative">
        <Mic className="w-4 h-4 text-blue-400 relative z-10" strokeWidth={2.5} />
      </div>
      
      <span className="text-white text-sm font-semibold tracking-wide relative z-10">
        Listening Active
      </span>
      
      <div className="relative flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full bg-emerald-400 transition-all duration-1000 ${pulse ? 'scale-100 opacity-100' : 'scale-75 opacity-60'}`} />
      </div>
    </div>
  )
}
