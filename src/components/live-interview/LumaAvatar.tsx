'use client'

import { cn } from '@/lib/utils'
import { LumaGlyph, LumaState } from '@/components/shell/LumaGlyph'

interface LumaAvatarProps {
  state: 'idle' | 'listening' | 'speaking'
  audioBuffer?: ArrayBuffer  // accepted but unused in fallback
  className?: string
}

export default function LumaAvatar({ state, className }: LumaAvatarProps) {
  const lumaState: LumaState = state === 'speaking' ? 'speaking'
    : state === 'listening' ? 'listening'
    : 'idle'

  return (
    <div className={cn('flex items-center justify-center rounded-2xl bg-surface-container p-8', className)}>
      <LumaGlyph size={120} state={lumaState} className="text-primary" />
    </div>
  )
}
