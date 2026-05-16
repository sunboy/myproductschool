'use client'

import { useIsAtLimit } from '@/context/UsageContext'
import { MotionListItem } from '@/components/motion'
import { ChallengeCard } from './ChallengeCard'
import type { ChallengeWithDomain } from '@/lib/types'

interface LockedChallengeGridProps {
  challenges: ChallengeWithDomain[]
  paradigms: Record<string, string>
  listView: boolean
  returnHref?: string
}

export function LockedChallengeGrid({ challenges, paradigms, listView, returnHref }: LockedChallengeGridProps) {
  const isAtLimit = useIsAtLimit('challenges')

  return (
    <>
      {challenges.map(challenge => (
        <MotionListItem
          key={challenge.id}
          layoutId={`challenge-${challenge.id}`}
          layoutDependency={listView}
          className="min-w-0"
        >
          <ChallengeCard
            challenge={challenge}
            paradigm={paradigms[challenge.id] ?? 'Traditional'}
            listView={listView}
            locked={isAtLimit}
            returnHref={returnHref}
            layoutId={`challenge-card-${challenge.id}`}
          />
        </MotionListItem>
      ))}
    </>
  )
}
