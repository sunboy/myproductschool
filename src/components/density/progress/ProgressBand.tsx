'use client'
import { usePathname } from 'next/navigation'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'

export function ProgressBand({ weakest }: { weakest: { move: string; pct: number } | null }) {
  const p = usePathname() ?? '/progress'
  const label = weakest ? weakest.move.charAt(0).toUpperCase() + weakest.move.slice(1) : null
  return (
    <HeaderBand
      title="Progress"
      chips={[
        { label: 'Overview', href: '/progress', active: p === '/progress', testId: 'chip-overview' },
        { label: 'Skill ladder', href: '/progress/skill-ladder', active: p.startsWith('/progress/skill-ladder'), testId: 'chip-ladder' },
        { label: 'History', href: '/history', active: p.startsWith('/history'), testId: 'chip-history' },
      ]}
      right={label ? (
        <HatchPickCard
          eyebrow="Your next focus"
          title={`Build confidence in ${label}`}
          reason={`${Math.round(weakest!.pct)}% on the ${label} move. One targeted rep moves it most.`}
          href={`/challenges?move=${weakest!.move}`}
          ctaLabel="Find a challenge"
          testId="progress-next-focus"
        />
      ) : null}
    />
  )
}
