'use client'

import { cn } from '@/lib/utils'
import { LumaGlyph, LumaState } from '@/components/shell/LumaGlyph'

export type LumaAvatarState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'intrigued' | 'challenging' | 'delighted'

interface LumaAvatarProps {
  state: LumaAvatarState
  audioAnalyser?: AnalyserNode | null
  className?: string
}

const STATE_MAP: Record<LumaAvatarState, LumaState> = {
  speaking: 'speaking',
  listening: 'listening',
  thinking: 'reviewing',
  idle: 'idle',
  intrigued: 'intrigued',
  challenging: 'challenging',
  delighted: 'delighted',
}

export default function LumaAvatar({ state, className }: LumaAvatarProps) {
  const lumaState = STATE_MAP[state]

  return (
    <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden', className)}>
      <div className="flex items-center justify-center w-full h-full">
        <LumaGlyph size={120} state={lumaState} className="text-primary" />
      </div>
    </div>
  )
}
