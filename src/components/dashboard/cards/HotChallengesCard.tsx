import Link from 'next/link'

interface HotChallenge {
  title: string
  attempts: number
  avgScore: number
  domain: string
}

interface HotChallengesCardProps {
  challenges: HotChallenge[]
}

export function HotChallengesCard({ challenges }: HotChallengesCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-tertiary text-xl">local_fire_department</span>
        <h3 className="font-headline font-semibold text-base text-on-surface">Hot Challenges</h3>
      </div>

      <div className="flex flex-col gap-2">
        {challenges.map((ch, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-outline-variant/20 last:border-0">
            <span className="text-sm font-bold text-tertiary w-5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-surface truncate font-semibold">{ch.title}</p>
              <p className="text-xs text-on-surface-variant font-label">{ch.domain}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-on-surface-variant font-label">{ch.attempts} attempts</p>
              <p className="text-xs text-on-surface-variant font-label">avg {ch.avgScore}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/challenges"
        className="text-xs text-primary font-label font-semibold hover:underline self-start"
      >
        View all challenges
      </Link>
    </div>
  )
}
