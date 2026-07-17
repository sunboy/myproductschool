'use client'

import { cn } from '@/lib/utils'
import { HatchImage, type HatchImageState } from '@/components/redesign/HatchImage'

export type HatchAvatarState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'intrigued' | 'challenging' | 'delighted'

interface HatchAvatarProps {
  state: HatchAvatarState
  audioAnalyser?: AnalyserNode | null
  className?: string
}

const STATE_MAP: Record<HatchAvatarState, HatchImageState> = {
  speaking: 'speaking',
  listening: 'listening',
  thinking: 'reviewing',
  idle: 'idle',
  intrigued: 'thinking',
  challenging: 'pointing',
  delighted: 'celebrating',
}

export default function HatchAvatar({ state, className }: HatchAvatarProps) {
  const hatchState = STATE_MAP[state]

  return (
    <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden', className)}>
      <div className="flex items-center justify-center w-full h-full">
        <HatchImage size={120} state={hatchState} />
      </div>
    </div>
  )
}
