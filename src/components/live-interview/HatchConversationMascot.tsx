'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import manifest from '../../../public/mascots/hatch/generated/interview-conversation-v1/manifest.json'

export type HatchConversationMascotState = 'listening' | 'speaking'

type ManifestStateKey = 'interview-listening' | 'interview-speaking'

type HatchConversationManifestState = {
  webp: string
  gif: string
  strip: string
  frames: number
  durationsMs: number[]
  loopDurationMs: number
}

const STATE_TO_MANIFEST_KEY: Record<HatchConversationMascotState, ManifestStateKey> = {
  listening: 'interview-listening',
  speaking: 'interview-speaking',
}

const CELL_WIDTH = manifest.cellWidth
const CELL_HEIGHT = manifest.cellHeight
const FIRST_FRAME = 0

function framePosition(frame: number, frameCount: number) {
  const x = frameCount <= 1 ? 0 : (frame / (frameCount - 1)) * 100
  return `${x}% 0%`
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

interface HatchConversationMascotProps {
  state: HatchConversationMascotState
  size?: number
  className?: string
  style?: CSSProperties
}

export function HatchConversationMascot({
  state,
  size = 244,
  className,
  style,
}: HatchConversationMascotProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const manifestKey = STATE_TO_MANIFEST_KEY[state]
  const stateConfig = manifest.states[manifestKey] as HatchConversationManifestState
  const [frameIndex, setFrameIndex] = useState(FIRST_FRAME)
  const durationKey = stateConfig.durationsMs.join(',')

  useEffect(() => {
    setFrameIndex(FIRST_FRAME)
  }, [state])

  useEffect(() => {
    if (prefersReducedMotion) {
      setFrameIndex(FIRST_FRAME)
      return
    }

    const durations = stateConfig.durationsMs
    const frameCount = stateConfig.frames
    let animationId = 0
    let frame = FIRST_FRAME
    let elapsedInFrame = 0
    let lastTime = performance.now()

    const tick = (time: number) => {
      elapsedInFrame += time - lastTime
      lastTime = time

      let nextFrame = frame
      while (elapsedInFrame >= durations[nextFrame]) {
        elapsedInFrame -= durations[nextFrame]
        nextFrame = (nextFrame + 1) % frameCount
      }

      if (nextFrame !== frame) {
        frame = nextFrame
        setFrameIndex(frame)
      }

      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(animationId)
  }, [durationKey, prefersReducedMotion, stateConfig.durationsMs, stateConfig.frames])

  useEffect(() => {
    for (const asset of Object.values(manifest.states) as HatchConversationManifestState[]) {
      const strip = new Image()
      strip.src = asset.strip
      const webp = new Image()
      webp.src = asset.webp
    }
  }, [])

  const height = Math.round(size * (CELL_HEIGHT / CELL_WIDTH))
  const spriteStyle = useMemo<CSSProperties>(
    () => ({
      width: size,
      height,
      backgroundImage: `url(${stateConfig.strip})`,
      backgroundPosition: framePosition(frameIndex, stateConfig.frames),
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${stateConfig.frames * 100}% 100%`,
    }),
    [frameIndex, height, size, stateConfig.frames, stateConfig.strip],
  )

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      data-hatch-conversation-state={state}
      style={{ width: size, height, ...style }}
    >
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: Math.round(size * 0.9),
          height: Math.round(size * 0.9),
          background: state === 'speaking'
            ? 'radial-gradient(circle, rgba(126,224,153,0.2), rgba(74,124,89,0.08) 52%, transparent 72%)'
            : 'radial-gradient(circle, rgba(126,224,153,0.12), rgba(74,124,89,0.05) 54%, transparent 74%)',
          filter: 'blur(4px)',
          transform: 'translateY(8px)',
        }}
      />
      <span
        aria-label={state === 'speaking' ? 'Hatch speaking' : 'Hatch listening'}
        className="relative block bg-transparent"
        role="img"
        style={spriteStyle}
      />
    </div>
  )
}
