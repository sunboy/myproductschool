'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

export const HATCH_MASCOT_STATES = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'celebrating',
  'waiting',
  'failed',
  'clapping',
  'interview-listening',
  'interview-speaking',
] as const

export type HatchMascotState = (typeof HATCH_MASCOT_STATES)[number]

type HatchMascotStateConfig = {
  row: number
  frames: number
  fps: number
}

const CELL_WIDTH = 192
const CELL_HEIGHT = 208
const COLUMNS: number = 8
const ROWS: number = 10
const SPRITESHEET_PATH = '/mascots/hatch/app/spritesheet.webp'

export const HATCH_MASCOT_STATE_CONFIG: Record<HatchMascotState, HatchMascotStateConfig> = {
  idle: { row: 0, frames: 8, fps: 8 },
  listening: { row: 1, frames: 8, fps: 8 },
  thinking: { row: 2, frames: 8, fps: 8 },
  speaking: { row: 3, frames: 8, fps: 13 },
  celebrating: { row: 4, frames: 8, fps: 11 },
  waiting: { row: 5, frames: 8, fps: 7 },
  failed: { row: 6, frames: 8, fps: 7 },
  clapping: { row: 7, frames: 8, fps: 13 },
  'interview-listening': { row: 8, frames: 8, fps: 8 },
  'interview-speaking': { row: 9, frames: 8, fps: 13 },
}

function framePosition(row: number, frame: number) {
  const x = COLUMNS === 1 ? 0 : (frame / (COLUMNS - 1)) * 100
  const y = ROWS === 1 ? 0 : (row / (ROWS - 1)) * 100
  return `${x}% ${y}%`
}

function normalizedFrame(frame: number, frameCount: number) {
  const modulo = frame % frameCount
  return modulo < 0 ? modulo + frameCount : modulo
}

function shouldReduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function toHatchMascotState(state: string | null | undefined): HatchMascotState {
  switch (state) {
    case 'listening':
      return 'listening'
    case 'reviewing':
    case 'intrigued':
    case 'thinking':
    case 'drawing':
    case 'observing':
      return 'thinking'
    case 'speaking':
    case 'lead':
      return 'speaking'
    case 'celebrating':
    case 'delighted':
    case 'dance':
    case 'jumping':
    case 'jump':
      return 'celebrating'
    case 'failed':
    case 'challenging':
    case 'caution':
    case 'stuck-check':
      return 'failed'
    case 'waiting':
    case 'wave':
    case 'waving':
    case 'nudging':
      return 'waiting'
    case 'clapping':
      return 'clapping'
    case 'interview-listening':
      return 'interview-listening'
    case 'interview-speaking':
      return 'interview-speaking'
    default:
      return 'idle'
  }
}

export function toInterviewHatchMascotState(state: string | null | undefined): HatchMascotState {
  switch (state) {
    case 'speaking':
    case 'interview-speaking':
      return 'interview-speaking'
    case 'listening':
    case 'interview-listening':
      return 'interview-listening'
    default:
      return toHatchMascotState(state)
  }
}

interface HatchMascotSpriteProps {
  state?: HatchMascotState
  size?: number
  frame?: number
  paused?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

export function HatchMascotSprite({
  state = 'idle',
  size = 96,
  frame,
  paused = false,
  ariaLabel,
  className,
  style,
}: HatchMascotSpriteProps) {
  const config = HATCH_MASCOT_STATE_CONFIG[state]
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
  }, [state])

  useEffect(() => {
    if (paused || frame !== undefined || shouldReduceMotion()) return

    let animationId = 0
    let lastTime = performance.now()
    let accumulated = 0
    const frameMs = 1000 / config.fps

    const tick = (time: number) => {
      accumulated += time - lastTime
      lastTime = time

      if (accumulated >= frameMs) {
        const steps = Math.floor(accumulated / frameMs)
        accumulated -= steps * frameMs
        setFrameIndex((current) => normalizedFrame(current + steps, config.frames))
      }

      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(animationId)
    }
  }, [config.fps, config.frames, frame, paused])

  const activeFrame = normalizedFrame(frame ?? frameIndex, config.frames)
  const height = Math.round(size * (CELL_HEIGHT / CELL_WIDTH))
  const spriteStyle = useMemo<CSSProperties>(
    () => ({
      width: size,
      height,
      backgroundImage: `url(${SPRITESHEET_PATH})`,
      backgroundPosition: framePosition(config.row, activeFrame),
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${COLUMNS * 100}% ${ROWS * 100}%`,
      ...style,
    }),
    [activeFrame, config.row, height, size, style],
  )

  return (
    <span
      aria-label={ariaLabel ?? `Hatch ${state}`}
      className={cn('inline-block shrink-0 bg-transparent align-middle', className)}
      data-hatch-mascot-state={state}
      role="img"
      style={spriteStyle}
    />
  )
}
