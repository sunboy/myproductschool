'use client'

// The verdict moment shared by every feedback surface. Hatch's sentence is
// the hero at display size; the score is large but secondary, right-aligned;
// a 4px left accent carries the band color. Zero tinted fills — color lives
// only in the accent rule, the icon, and the outline pill. Same card family
// as HatchReviewCard so loading settles into the verdict in place.

import { useEffect, useState, type ReactNode } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'
import {
  normalizeToTen, gradeBand, bandHatchState,
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
      className="rounded-xl border border-outline-variant bg-surface-container p-6 shadow-sm transition-all duration-400 ease-out"
      style={{
        opacity: settled ? 1 : 0,
        transform: settled ? 'translateY(0)' : 'translateY(8px)',
        borderLeft: `4px solid ${accent}`,
      }}
      data-testid="verdict-band"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <HatchImage size={36} state={bandHatchState(band)} />
          <span
            className="rounded-full border px-2.5 py-0.5 font-label text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ borderColor: accent, color: accent }}
          >
            {GRADE_LABELS[band]}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="font-headline text-[40px] font-semibold leading-none text-on-surface tabular-nums">
            {displayScore.toFixed(1)}
          </span>
          <span className="font-headline text-base text-on-surface-variant">/10</span>
        </div>
      </div>

      <p className="mt-4 font-headline text-[22px] font-medium leading-[1.35] text-on-surface">
        {headline}
      </p>

      {actions && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
