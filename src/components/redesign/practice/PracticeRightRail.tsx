'use client'

import type { ReactNode } from 'react'
import type { ChallengeWithDomain } from '@/lib/types'
import type { PracticeCoverageItem } from '@/lib/data/challenges'
import { NextBestRepCard } from './NextBestRepCard'
import { FocusQueueCard } from './FocusQueueCard'
import { SkillCoverageCard } from './SkillCoverageCard'
import { SavedFiltersCard } from './SavedFiltersCard'

export interface PracticeRightRailProps {
  inProgress: ChallengeWithDomain[]
  coverage: PracticeCoverageItem[]
  disciplineLabel: string
  /** Slot appended at the bottom, e.g. the freemium usage meter. */
  children?: ReactNode
}

/**
 * Stacks the Practice right-rail modules. Visibility (hidden below lg) is
 * the parent's concern, not this component's.
 */
export function PracticeRightRail({ inProgress, coverage, disciplineLabel, children }: PracticeRightRailProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <NextBestRepCard inProgress={inProgress} />
      <FocusQueueCard inProgress={inProgress} disciplineLabel={disciplineLabel} />
      <SkillCoverageCard coverage={coverage} />
      <SavedFiltersCard />
      {children}
    </div>
  )
}
