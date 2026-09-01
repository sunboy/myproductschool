'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'
import type { ChallengeWithDomain } from '@/lib/types'
import { challengePath } from '@/lib/challenges/challengeNumber'

export interface NextBestRepCardProps {
  inProgress: ChallengeWithDomain[]
}

/**
 * Rail hero card: resume the paused rep, when one exists. This used to fall
 * back to the same useNextChallenge() recommendation HatchPick already shows
 * in the main column — with no paused rep, this card duplicated that pick
 * instead of adding new information, so it now renders nothing in that case.
 */
export function NextBestRepCard({ inProgress }: NextBestRepCardProps) {
  const paused = inProgress[0]
  if (!paused) return null

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
