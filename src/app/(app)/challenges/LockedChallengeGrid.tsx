'use client'

import { useIsAtLimit } from '@/context/UsageContext'
import { ChallengeCard } from './ChallengeCard'
import type { ChallengeWithDomain } from '@/lib/types'

interface LockedChallengeGridProps {
  challenges: ChallengeWithDomain[]
  paradigms: Record<string, string>
  listView: boolean
}

export function LockedChallengeGrid({ challenges, paradigms, listView }: LockedChallengeGridProps) {
  const isAtLimit = useIsAtLimit('challenges')

  return (
    <>
      {challenges.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          paradigm={paradigms[challenge.id] ?? 'Traditional'}
          listView={listView}
          locked={isAtLimit}
        />
      ))}
    </>
  )
}
