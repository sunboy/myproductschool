'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'

/** After this long, stop showing the loading skeleton even if the
 *  recommendation fetch never resolves — the band should never stay
 *  half-empty indefinitely. */
const SKELETON_TIMEOUT_MS = 15_000

export function PracticeBand() {
  const sp = useSearchParams(); const resume = sp.get('resume') === '1'
  const { data, loading } = useNextChallenge()
  const c = data?.challenge

  const [skeletonTimedOut, setSkeletonTimedOut] = useState(false)
  useEffect(() => {
    if (!loading) {
      setSkeletonTimedOut(false)
      return
    }
    const timer = setTimeout(() => setSkeletonTimedOut(true), SKELETON_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [loading])

  const showSkeleton = loading && !skeletonTimedOut

  return (
    <HeaderBand
      title="Practice"
      chips={[{ label: 'Practice interviews →', href: '/live-interviews', testId: 'chip-interviews' }, { label: 'Resume only', href: resume ? '/challenges' : '/challenges?resume=1', active: resume, testId: 'chip-resume' }]}
      right={c ? <HatchPickCard eyebrow="Hatch's pick" title={c.title} reason={data.tip ?? data.reason} href={`/workspace/challenges/${c.slug ?? c.id}?returnTo=%2Fchallenges`} ctaLabel="Try now" dismissScope="practice" testId="practice-hatch-pick" /> : showSkeleton ? <div className="h-[56px] animate-pulse rounded-xl bg-surface-container-high" /> : null}
    />
  )
}
