'use client'

// The verdict moment shared by every feedback surface: Hatch's sentence IS
// the hero, in Literata at display size; the score is quiet metadata in the
// corner, never a red-shamed ring standing alone. Fades in over ~400ms so the
// review card feels like it settles into the verdict rather than page-swapping.

import { useEffect, useState, type ReactNode } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'
import {
  normalizeToTen, gradeBand, bandClasses, bandHatchState,
  GRADE_LABELS, type ScoreScale,
} from '@/lib/feedback/score'

interface VerdictBandProps {
  /** The grader's headline sentence — the hero of the whole screen. */
  headline: string
  raw: number
  scale: ScoreScale
  /** Action buttons rendered inside the band (usually two). */
  actions?: ReactNode
  /** Skip the entrance fade (history views re-opening a past verdict). */
  immediate?: boolean
}

export function VerdictBand({ headline, raw, scale, actions, immediate = false }: VerdictBandProps) {
  const score = normalizeToTen(raw, scale)
  const band = gradeBand(score)
  const colors = bandClasses(band)
  const [settled, setSettled] = useState(immediate)
  const [displayScore, setDisplayScore] = useState(immediate ? score : 0)

  useEffect(() => {
    if (immediate) return
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setSettled(true)
      setDisplayScore(score)
      return
    }
    const t = requestAnimationFrame(() => setSettled(true))
    // Quick count-up: fast, no slot-machine suspense on a low score.
    const start = performance.now()
    const duration = 450
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplayScore(parseFloat((score * (1 - Math.pow(1 - p, 3))).toFixed(1)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(t); cancelAnimationFrame(frame) }
  }, [immediate, score])

  const accent = band === 'sharp' ? 'var(--color-primary)'
    : band === 'needs_work' ? 'var(--color-error)'
    : 'var(--color-tertiary)'

  return (
    <div
      className="border-y border-outline-variant bg-surface-container-lowest px-5 py-5 transition-all duration-400 ease-out"
      style={{
        opacity: settled ? 1 : 0,
        transform: settled ? 'translateY(0)' : 'translateY(8px)',
        borderLeft: `3px solid ${accent}`,
      }}
      data-testid="verdict-band"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <HatchImage size={34} state={bandHatchState(band)} />
          <span className={`font-label text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {GRADE_LABELS[band]}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-headline text-xl font-bold text-on-surface tabular-nums">
            {displayScore.toFixed(1)}
          </span>
          <span className="font-label text-xs text-on-surface-variant"> /10</span>
        </div>
      </div>

      <p className="mt-3 font-headline text-xl sm:text-2xl font-semibold leading-snug text-on-surface">
        {headline}
      </p>

      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
