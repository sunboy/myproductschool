/**
 * Pure, client-safe challenge status helpers.
 *
 * Kept free of any server-only imports (no `@/lib/supabase/server`) so that
 * client components (ChallengeCard, GroupedChallengeList) can import the
 * derivation without dragging `next/headers` into the browser bundle.
 */
import type { ChallengeAttemptV2 } from '@/lib/types'

export type ChallengeStatus = 'not_started' | 'attempted' | 'completed'

export interface ChallengeStats {
  attempt_count: number
  best_score: number | null
  is_completed: boolean
  is_in_progress: boolean
}

export const EMPTY_STATS: ChallengeStats = {
  attempt_count: 0,
  best_score: null,
  is_completed: false,
  is_in_progress: false,
}

export type AttemptRow = Pick<ChallengeAttemptV2, 'challenge_id' | 'total_score' | 'status'>

/**
 * Single source of truth for a challenge's three-way status. A challenge is
 * completed if any attempt completed; attempted if it has an in-progress (or
 * any non-completed) attempt; not started otherwise. The attempt_count fallback
 * keeps legacy/abandoned rows (no live in_progress) reading as "attempted".
 */
export function deriveChallengeStatus(c: {
  is_completed?: boolean
  is_in_progress?: boolean
  attempt_count?: number
}): ChallengeStatus {
  if (c.is_completed) return 'completed'
  if (c.is_in_progress || (c.attempt_count ?? 0) > 0) return 'attempted'
  return 'not_started'
}

export function buildStatsMap(
  challengeIds: string[],
  attempts: AttemptRow[],
): Map<string, ChallengeStats> {
  const map = new Map<string, ChallengeStats>()
  for (const id of challengeIds) {
    map.set(id, { ...EMPTY_STATS })
  }
  for (const attempt of attempts) {
    const existing = map.get(attempt.challenge_id)
    if (!existing) continue
    existing.attempt_count += 1
    if (attempt.status === 'completed') {
      existing.is_completed = true
      if (attempt.total_score !== null) {
        existing.best_score =
          existing.best_score === null
            ? attempt.total_score
            : Math.max(existing.best_score, attempt.total_score)
      }
    } else if (attempt.status === 'in_progress') {
      existing.is_in_progress = true
    }
  }
  return map
}
