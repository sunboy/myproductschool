'use client'
import { useSearchParams } from 'next/navigation'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'
import { useNextChallenge } from '@/components/redesign/practice/useNextChallenge'

export function PracticeBand() {
  const sp = useSearchParams(); const resume = sp.get('resume') === '1'
  const { data, loading } = useNextChallenge()
  const c = data?.challenge
  return (
    <HeaderBand
      title="Practice"
      chips={[{ label: 'Practice interviews →', href: '/live-interviews', testId: 'chip-interviews' }, { label: 'Resume only', href: resume ? '/challenges' : '/challenges?resume=1', active: resume, testId: 'chip-resume' }]}
      right={c ? <HatchPickCard eyebrow="Hatch's pick" title={c.title} reason={data.tip ?? data.reason} href={`/workspace/challenges/${c.slug ?? c.id}?returnTo=%2Fchallenges`} ctaLabel="Try now" dismissScope="practice" testId="practice-hatch-pick" /> : loading ? <div className="h-[56px] animate-pulse rounded-xl bg-surface-container-high" /> : null}
    />
  )
}
