'use client'

// The honest waiting state shared by every grading surface: one Hatch card,
// mascot in `reviewing`, and a single line of what it is actually doing that
// cross-fades through the real phases of a review. No progress bar, no
// countdown, no skeleton bars — the card later settles into the verdict in
// the same position (see VerdictBand).

import { useEffect, useState } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'

export const CODING_REVIEW_PHASES = [
  'Reading your session…',
  'Checking your solution against the tests…',
  'Writing your feedback…',
]

export const SQL_REVIEW_PHASES = [
  'Reading your session…',
  'Checking your query logic…',
  'Writing your feedback…',
]

export const CANVAS_REVIEW_PHASES = [
  'Reading your diagram…',
  'Weighing your tradeoffs…',
  'Writing your feedback…',
]

export const DATA_MODEL_REVIEW_PHASES = [
  'Reading your schema…',
  'Checking keys and relationships…',
  'Writing your feedback…',
]

interface HatchReviewCardProps {
  /** Phase lines, shown in order and held on the last one. */
  phases?: string[]
  /** ms per phase before advancing. */
  phaseMs?: number
  /** Compact renders inline in a column; large centers itself (full-screen interstitials). */
  size?: 'compact' | 'large'
}

export function HatchReviewCard({ phases = CODING_REVIEW_PHASES, phaseMs = 4000, size = 'compact' }: HatchReviewCardProps) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (idx >= phases.length - 1) return
    const advance = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => Math.min(i + 1, phases.length - 1))
        setVisible(true)
      }, 250)
    }, phaseMs)
    return () => clearTimeout(advance)
  }, [idx, phases.length, phaseMs])

  if (size === 'large') {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4">
        <HatchImage size={96} state="reviewing" />
        <p className="font-headline text-xl font-semibold text-on-surface">Hatch is reading your work</p>
        <p
          className="font-body text-sm text-on-surface-variant transition-opacity duration-250 min-h-5"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
        >
          {phases[idx]}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 flex items-center gap-3">
      <HatchImage size={40} state="reviewing" />
      <div className="min-w-0">
        <p className="font-label text-sm font-bold text-on-surface">Hatch is reading your session</p>
        <p
          className="mt-0.5 font-body text-xs text-on-surface-variant transition-opacity duration-250 min-h-4"
          style={{ opacity: visible ? 1 : 0 }}
          aria-live="polite"
        >
          {phases[idx]}
        </p>
      </div>
    </div>
  )
}
