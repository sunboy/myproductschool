'use client'

import { useIsAtLimit } from '@/context/UsageContext'
import { MotionListItem } from '@/components/motion'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeCardV3 } from '@/components/density/practice/ChallengeCardV3'
import { useUiShell } from '@/components/shell-v2/UiShellContext'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'
import type { ChallengeWithDomain } from '@/lib/types'

interface LockedChallengeGridProps {
  challenges: ChallengeWithDomain[]
  paradigms: Record<string, string>
  listView: boolean
  returnHref?: string
  /** Precomputed grid-blurb summaries keyed by challenge id. */
  summaries?: Record<string, string>
}

export function LockedChallengeGrid({ challenges, paradigms, listView, returnHref, summaries }: LockedChallengeGridProps) {
  const isAtLimit = useIsAtLimit('challenges')
  const { density } = useUiShell()
  const { data: nextChallenge } = useNextChallenge()
  const nextPickId = nextChallenge?.challenge?.id

  return (
    <>
      {challenges.map(challenge => (
        <MotionListItem
          key={challenge.id}
          layoutId={`challenge-${challenge.id}`}
          layoutDependency={listView}
          className="min-w-0"
        >
          {density && !listView ? (
            <ChallengeCardV3
              challenge={challenge}
              summary={summaries?.[challenge.id]}
              returnHref={returnHref}
              locked={isAtLimit}
              hatchPick={challenge.id === nextPickId}
            />
          ) : (
            <ChallengeCard
              challenge={challenge}
              paradigm={paradigms[challenge.id] ?? 'Traditional'}
              listView={listView}
              locked={isAtLimit}
              returnHref={returnHref}
              layoutId={`challenge-card-${challenge.id}`}
              summary={summaries?.[challenge.id]}
            />
          )}
        </MotionListItem>
      ))}
    </>
  )
}
