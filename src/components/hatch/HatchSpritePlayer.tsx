'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react'

import { cn } from '@/lib/utils'

const FRAME_COUNT = 32
const COLUMNS: number = 8
const ROWS: number = 4
const FRAME_DURATION_MS = 42
const DEFAULT_FPS = Math.round(1000 / FRAME_DURATION_MS)
const SPRITE_PATH = '/videos/hatch/clap-32-sprite-sheet.png'

function framePosition(frame: number) {
  const column = frame % COLUMNS
  const row = Math.floor(frame / COLUMNS)
  const x = COLUMNS === 1 ? 0 : (column / (COLUMNS - 1)) * 100
  const y = ROWS === 1 ? 0 : (row / (ROWS - 1)) * 100

  return `${x}% ${y}%`
}

const cssFrameStops = Array.from({ length: FRAME_COUNT }, (_, frame) => {
  const start = (frame / FRAME_COUNT) * 100
  const end = ((frame + 1) / FRAME_COUNT) * 100 - 0.01

  return `${start.toFixed(3)}%, ${end.toFixed(3)}% { background-position: ${framePosition(frame)}; }`
}).join('\n')

function spriteStyle(frame: number): CSSProperties {
  return {
    backgroundImage: `url(${SPRITE_PATH})`,
    backgroundPosition: framePosition(frame),
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${COLUMNS * 100}% ${ROWS * 100}%`,
  }
}

interface HatchSpriteSurfaceProps {
  frame?: number
  className?: string
  style?: CSSProperties
}

function HatchSpriteSurface({ frame = 0, className, style }: HatchSpriteSurfaceProps) {
  return (
    <div
      aria-label="Hatch clapping"
      className={cn('aspect-square w-full rounded-lg bg-[#f4f0e6]', className)}
      role="img"
      style={{ ...spriteStyle(frame), ...style }}
    />
  )
}

export function HatchCssSpriteLoop({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes hatch-clap-sprite-32 {
          ${cssFrameStops}
          100% { background-position: ${framePosition(0)}; }
        }

        .hatch-css-sprite-loop {
          animation: hatch-clap-sprite-32 ${FRAME_COUNT * FRAME_DURATION_MS}ms steps(1, end) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hatch-css-sprite-loop {
            animation: none;
          }
        }
      `}</style>
      <HatchSpriteSurface className={cn('hatch-css-sprite-loop', className)} />
    </>
  )
}

export function HatchSpritePlayer({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0)
  const [fps, setFps] = useState(DEFAULT_FPS)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let animationId = 0
    let lastTime = performance.now()
    let accumulated = 0
    const frameMs = 1000 / fps

    const tick = (time: number) => {
      accumulated += time - lastTime
      lastTime = time

      if (accumulated >= frameMs) {
        const steps = Math.floor(accumulated / frameMs)
        accumulated -= steps * frameMs
        setFrame((current) => (current + steps) % FRAME_COUNT)
      }

      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(animationId)
    }
  }, [fps, isPlaying])

  const frameLabel = useMemo(() => `${String(frame + 1).padStart(2, '0')} / ${FRAME_COUNT}`, [frame])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <HatchSpriteSurface frame={frame} />

      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d8d0bd] bg-white/75 px-3 py-2 text-[#173f2b] shadow-sm">
        <div className="flex items-center gap-1">
          <button
            aria-label={isPlaying ? 'Pause Hatch clap' : 'Play Hatch clap'}
            className="grid size-9 place-items-center rounded-md text-[#173f2b] transition hover:bg-[#e9f2e7]"
            onClick={() => setIsPlaying((current) => !current)}
            title={isPlaying ? 'Pause' : 'Play'}
            type="button"
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            aria-label="Restart Hatch clap"
            className="grid size-9 place-items-center rounded-md text-[#173f2b] transition hover:bg-[#e9f2e7]"
            onClick={() => setFrame(0)}
            title="Restart"
            type="button"
          >
            <RotateCcw size={17} />
          </button>
          <button
            aria-label="Step Hatch clap forward"
            className="grid size-9 place-items-center rounded-md text-[#173f2b] transition hover:bg-[#e9f2e7]"
            onClick={() => {
              setIsPlaying(false)
              setFrame((current) => (current + 1) % FRAME_COUNT)
            }}
            title="Step forward"
            type="button"
          >
            <StepForward size={17} />
          </button>
        </div>

        <span className="w-16 text-right font-mono text-xs tabular-nums text-[#446551]">{frameLabel}</span>
      </div>

      <label className="flex items-center gap-3 text-xs font-medium text-[#446551]">
        <span className="w-12 tabular-nums">{fps} fps</span>
        <input
          aria-label="Hatch clap playback speed"
          className="h-2 flex-1 accent-[#2f7048]"
          max={30}
          min={8}
          onChange={(event) => setFps(Number(event.target.value))}
          step={1}
          type="range"
          value={fps}
        />
      </label>
    </div>
  )
}
