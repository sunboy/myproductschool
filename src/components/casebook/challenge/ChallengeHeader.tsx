'use client'

import { useEffect, useState } from 'react'
import type { ChallengeSessionStatus } from './types'

interface ChallengeHeaderProps {
  caseTitle: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  status: ChallengeSessionStatus
  /** ISO timestamp the live session expires at, from the start response's
   *  session.expires_at. Absent until a session is provisioned. */
  expiresAt: string | null
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const DIFFICULTY_LABEL: Record<ChallengeHeaderProps['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/**
 * Soft timer driven by the live session's own expires_at (not a fixed
 * per-scene budget like Practice — a Challenge session's wall clock comes
 * from the server-issued TTL, see case/start/route.ts's ttlSeconds). Counts
 * down for display only; it never enforces a hard cutoff in the UI.
 */
function useChallengeClock(expiresAt: string | null, status: ChallengeSessionStatus) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'active' || !expiresAt) {
      setRemaining(null)
      return
    }

    const expiresAtMs = new Date(expiresAt).getTime()
    const tick = () => setRemaining(Math.max(0, (expiresAtMs - Date.now()) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [status, expiresAt])

  return remaining
}

export function ChallengeHeader({ caseTitle, difficulty, status, expiresAt }: ChallengeHeaderProps) {
  const remaining = useChallengeClock(expiresAt, status)
  const isLow = status === 'active' && remaining !== null && remaining <= 300

  return (
    <div className="flex flex-col gap-2 border-b border-outline-variant pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-label text-xs uppercase tracking-wide text-on-surface-variant">Challenge</p>
          <h1 className="font-headline text-xl font-semibold text-on-surface">{caseTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
            {DIFFICULTY_LABEL[difficulty]}
          </span>
          {status === 'active' && remaining !== null && (
            <span
              className={
                'rounded-full px-3 py-1 font-label text-xs font-semibold tabular-nums ' +
                (isLow ? 'bg-error/10 text-error' : 'bg-primary-container text-on-primary-container')
              }
              aria-live="polite"
            >
              {formatClock(remaining)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
