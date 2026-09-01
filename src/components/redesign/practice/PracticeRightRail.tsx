'use client'

import type { ReactNode } from 'react'
import type { ChallengeWithDomain } from '@/lib/types'
import type { PracticeCoverageItem } from '@/lib/data/challenges'
import { NextBestRepCard } from './NextBestRepCard'
import { SkillCoverageCard } from './SkillCoverageCard'
import { SavedFiltersCard } from './SavedFiltersCard'

export interface PracticeRightRailProps {
  inProgress: ChallengeWithDomain[]
  coverage: PracticeCoverageItem[]
  /** Slot rendered above Next best rep, e.g. HatchPick's rail card variant —
   *  keeps both "what to do next" surfaces (Hatch's pick, resume-in-progress)
   *  together in one column instead of splitting across the main column and
   *  the rail. */
  topSlot?: ReactNode
  /** Slot appended at the bottom, e.g. the freemium usage meter. */
  children?: ReactNode
}

/**
 * Stacks the Practice right-rail modules. Visibility (hidden below lg) is
 * the parent's concern, not this component's.
 *
 * FocusQueueCard used to sit here too, but once its Hatch-recommendation and
 * static "add medium reps" items were cut as duplicates/filler (see
 * FocusQueueCard.tsx), its one remaining item — "resume the paused rep" —
 * was identical to what NextBestRepCard already shows, so the whole card
 * was removed from the rail rather than kept as a second copy of the same
 * fact.
 */
export function PracticeRightRail({ inProgress, coverage, topSlot, children }: PracticeRightRailProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {topSlot}
      <NextBestRepCard inProgress={inProgress} />
      <SkillCoverageCard coverage={coverage} />
      <SavedFiltersCard />
      {children}
    </div>
  )
}
