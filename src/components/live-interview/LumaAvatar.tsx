'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { LumaGlyph, LumaState } from '@/components/shell/LumaGlyph'

const LumaAvatarR3F = dynamic(() => import('./LumaAvatarR3F'), { ssr: false })

const AVATAR_URL =
  process.env.NEXT_PUBLIC_RPM_AVATAR_URL ?? 'https://readyplayerme.github.io/visage/male.glb'

interface LumaAvatarProps {
  state: 'idle' | 'listening' | 'speaking'
  audioAnalyser?: AnalyserNode | null
  className?: string
}

export default function LumaAvatar({ state, audioAnalyser, className }: LumaAvatarProps) {
  const lumaState: LumaState = state === 'speaking' ? 'speaking'
    : state === 'listening' ? 'listening'
    : 'idle'

  return (
    <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden', className)}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center w-full h-full">
            <LumaGlyph size={120} state={lumaState} className="text-primary" />
          </div>
        }
      >
        <LumaAvatarR3F
          modelSrc={AVATAR_URL}
          audioAnalyser={audioAnalyser ?? null}
          isSpeaking={state === 'speaking'}
          className="w-full h-full"
        />
      </Suspense>
    </div>
  )
}
