import Link from 'next/link'
import type { HotChallenge } from '@/lib/data/dashboard'
import { challengePath, formatChallengeNumber } from '@/lib/challenges/challengeNumber'

interface HotChallengesCardProps {
  challenges: HotChallenge[]
  compact?: boolean
  limit?: number
}

export function HotChallengesCard({ challenges, compact = false, limit }: HotChallengesCardProps) {
  const visibleChallenges = typeof limit === 'number' ? challenges.slice(0, limit) : challenges

  return (
    <div className={`flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low ${compact ? 'gap-2 p-3.5' : 'gap-3 p-5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined leading-none ${compact ? 'text-[16px]' : 'text-[18px]'}`}
            style={{ fontVariationSettings: "'FILL' 1", color: '#c94b1b' }}
          >
            local_fire_department
          </span>
          <h3 className={`font-headline font-semibold text-on-surface ${compact ? 'text-[13px]' : 'text-sm'}`}>Trending</h3>
        </div>
        <Link href="/challenges" className="text-[11px] text-primary font-label font-semibold hover:underline">
          All challenges
        </Link>
      </div>

      <div className="flex flex-col gap-0.5">
        {visibleChallenges.map((ch, i) => {
          const numberLabel = formatChallengeNumber(ch.challenge_type, ch.display_number)
          return (
          <Link
            key={ch.id}
            href={challengePath(ch)}
            className={`group -mx-2 flex items-center gap-3 rounded-xl px-2 transition-colors duration-150 hover:bg-surface-container-high ${compact ? 'py-1.5' : 'py-2'}`}
          >
            <span className="text-xs font-bold text-tertiary w-4 text-center tabular-nums shrink-0 font-label">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className={`${compact ? 'text-[12px]' : 'text-[13px]'} truncate font-semibold leading-snug text-on-surface`}>{ch.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-label text-[11px] text-on-surface-variant">
                {numberLabel && (
                  <span className="font-mono text-[10px] px-1.5 py-px rounded-full bg-surface-container-highest text-on-surface-variant">{numberLabel}</span>
                )}
                {ch.domain === 'General' ? 'Practice' : ch.domain}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
            </div>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
