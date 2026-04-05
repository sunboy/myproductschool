'use client'

import { cn } from '@/lib/utils'
import { LumaGlyph, LumaState } from '@/components/shell/LumaGlyph'

interface LumaAvatarProps {
  state: 'idle' | 'listening' | 'speaking' | 'thinking'
  audioAnalyser?: AnalyserNode | null
  className?: string
}

export default function LumaAvatar({ state, className }: LumaAvatarProps) {
  const lumaState: LumaState = state === 'speaking' ? 'speaking'
    : state === 'listening' ? 'listening'
    : state === 'thinking' ? 'reviewing'
    : 'idle'

  return (
    <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden', className)}>
      <div className="flex items-center justify-center w-full h-full">
        <LumaGlyph size={120} state={lumaState} className="text-primary" />
      </div>
    </div>
  )
}
