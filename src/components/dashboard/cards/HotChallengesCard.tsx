import Link from 'next/link'
import type { HotChallenge } from '@/lib/data/dashboard'

interface HotChallengesCardProps {
  challenges: HotChallenge[]
}

export function HotChallengesCard({ challenges }: HotChallengesCardProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3 border border-outline-variant/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[18px] leading-none"
            style={{ fontVariationSettings: "'FILL' 1", color: '#c94b1b' }}
          >
            local_fire_department
          </span>
          <h3 className="font-headline font-semibold text-sm text-on-surface">Trending</h3>
        </div>
        <Link href="/challenges" className="text-[11px] text-primary font-label font-semibold hover:underline">
          All challenges
        </Link>
      </div>

      <div className="flex flex-col gap-0.5">
        {challenges.map((ch, i) => (
          <Link
            key={ch.id}
            href={`/workspace/challenges/${ch.id}`}
            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-surface-container-high transition-colors duration-150 group"
          >
            <span className="text-xs font-bold text-tertiary w-4 text-center tabular-nums shrink-0 font-label">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-on-surface truncate font-semibold leading-snug">{ch.title}</p>
              <p className="text-[11px] text-on-surface-variant font-label mt-0.5">{ch.domain}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
