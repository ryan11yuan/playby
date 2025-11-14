'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface SettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  settingId: string | null
}

const settingsInfo = {
  haptics: {
    title: 'Haptic Feedback',
    description: 'Feel the action with subtle vibrations that match the intensity of match moments. Stronger vibrations for goals and critical plays, gentle pulses for possession changes.',
  },
  audio: {
    title: 'Audio Cues',
    description: 'Distinct sounds accompany each type of alert, allowing you to identify moments without looking at your device. Each alert type has a unique audio signature.',
  },
  goals: {
    title: 'Goal Attempts',
    description: 'Get notified when teams take shots on target, hit the post, or have near-miss opportunities. Includes both inside and outside the box attempts.',
  },
  threats: {
    title: 'Threat Detection',
    description: 'Advanced AI detects dangerous attacking patterns, box entries, and developing threats before they result in shots. Stay ahead of the action.',
  },
  setpieces: {
    title: 'Set Pieces',
    description: 'Receive alerts for corners, free kicks in dangerous areas, and important throw-ins. Set pieces often lead to goals, so stay informed.',
  },
  possession: {
    title: 'Possession Changes',
    description: 'Track major shifts in ball control and field position. Helps you understand momentum changes and tactical adjustments during the match.',
  },
  about: {
    title: 'About Sports AI Listener',
    description: 'Version 1.0.0\n\nPowered by advanced AI to analyze live sports matches in real-time, providing intelligent alerts for key moments. Our system uses machine learning to understand game flow and deliver contextual notifications.\n\n© 2025 Sports AI Listener',
  },
}

export function SettingsSheet({ isOpen, onClose, settingId }: SettingsSheetProps) {
  if (!settingId || !settingsInfo[settingId as keyof typeof settingsInfo]) {
    return null
  }

  const info = settingsInfo[settingId as keyof typeof settingsInfo]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-black/80 backdrop-blur-2xl border-white/[0.08] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-white text-xl font-bold">{info.title}</SheetTitle>
          <SheetDescription className="text-white/60 text-sm leading-relaxed whitespace-pre-line pt-4">
            {info.description}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
