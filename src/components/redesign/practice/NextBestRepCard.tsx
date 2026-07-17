'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'
import type { ChallengeWithDomain } from '@/lib/types'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { cleanDisplayCopy } from '@/lib/copy/display'
import { useNextChallenge } from './useNextChallenge'

export interface NextBestRepCardProps {
  inProgress: ChallengeWithDomain[]
}

/**
 * Rail hero card: resume the paused rep if one exists, otherwise fall back to
 * the Hatch recommendation from useNextChallenge. Renders null once loading
 * settles with nothing to show, rather than an empty shell.
 */
export function NextBestRepCard({ inProgress }: NextBestRepCardProps) {
  const paused = inProgress[0]
  const { data, loading } = useNextChallenge()

  if (paused) {
    return (
      <div className="rounded-2xl border border-note-mint-border bg-note-mint p-4">
        <div className="mb-1.5 font-body text-[15.5px] font-bold text-ink-strong">Next best rep</div>
        <p className="mb-3 text-[13px] leading-[1.45] text-ink-secondary">
          Resume <b className="font-bold text-ink-strong">{paused.title}</b>. You already started it, so finishing it
          beats opening a new branch.
        </p>
        <Link
          href={challengePath(paused)}
          className="inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-4 py-2 text-[12.5px] font-bold text-white"
        >
          <Play size={13} />
          Resume rep
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-note-mint-border bg-note-mint p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-white/50" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/40" />
        <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-white/40" />
        <div className="mt-3 h-8 w-28 animate-pulse rounded-full bg-white/50" />
      </div>
    )
  }

  if (!data) return null

  const body = cleanDisplayCopy(data.tip ?? data.reason)

  return (
    <div className="rounded-2xl border border-note-mint-border bg-note-mint p-4">
      <div className="mb-1.5 font-body text-[15.5px] font-bold text-ink-strong">Next best rep</div>
      {body && <p className="mb-3 text-[13px] leading-[1.45] text-ink-secondary">{body}</p>}
      <Link
        href={`/workspace/challenges/${data.challenge.slug ?? data.challenge.id}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-4 py-2 text-[12.5px] font-bold text-white"
      >
        <Play size={13} />
        Start rep
      </Link>
    </div>
  )
}
