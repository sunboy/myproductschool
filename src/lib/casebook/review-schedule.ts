// Casebook Loop — spaced-repetition scheduling for cc_review_queue.
//
// Pure logic only. Every function takes an injected `now: Date` — never
// `new Date()` internally — so behavior is deterministic and testable (see
// the project's no-date('now')-time-bomb rule).
//
// Contract (cc_review_queue, supabase/migrations/20260826100100_casebook_user_state.sql):
//   interval_idx 0 -> +2d, 1 -> +5d, 2 -> +12d
//   clean_count  retires at 2
//   UNIQUE (user_id, item_type, item_id)

/** Interval ladder in days, indexed by interval_idx. */
export const REVIEW_INTERVAL_DAYS = [2, 5, 12] as const

/** clean_count at which a review-queue item retires. */
export const RETIRE_AT_CLEAN_COUNT = 2

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * due_at for a given interval_idx, computed from an injected `from` timestamp.
 * Clamps out-of-range indices to the ladder's bounds rather than throwing —
 * callers pass DB-sourced ints that should already be in range, but a clamp
 * is safer than a crash on a stray value.
 */
export function dueAtForInterval(intervalIdx: number, from: Date): Date {
  const clampedIdx = Math.min(Math.max(intervalIdx, 0), REVIEW_INTERVAL_DAYS.length - 1)
  const days = REVIEW_INTERVAL_DAYS[clampedIdx]
  return new Date(from.getTime() + days * MS_PER_DAY)
}

export interface ReviewQueueRepState {
  intervalIdx: number
  cleanCount: number
}

export interface ReviewQueueRepResult {
  intervalIdx: number
  cleanCount: number
  dueAt: Date | null
  /** true when this rep pushed clean_count to RETIRE_AT_CLEAN_COUNT. */
  retired: boolean
}

/**
 * Apply one clean rep to a review-queue item: advance the interval ladder by
 * one step (capped at the top rung) and increment clean_count. At
 * clean_count === RETIRE_AT_CLEAN_COUNT the item retires — dueAt becomes null
 * (nothing left to schedule).
 */
export function applyCleanRep(state: ReviewQueueRepState, now: Date): ReviewQueueRepResult {
  const nextCleanCount = state.cleanCount + 1
  if (nextCleanCount >= RETIRE_AT_CLEAN_COUNT) {
    return {
      intervalIdx: state.intervalIdx,
      cleanCount: nextCleanCount,
      dueAt: null,
      retired: true,
    }
  }
  const nextIntervalIdx = Math.min(state.intervalIdx + 1, REVIEW_INTERVAL_DAYS.length - 1)
  return {
    intervalIdx: nextIntervalIdx,
    cleanCount: nextCleanCount,
    dueAt: dueAtForInterval(nextIntervalIdx, now),
    retired: false,
  }
}

/**
 * The initial state + due_at for a freshly-seeded review-queue row (a first
 * miss on an item). interval_idx starts at 0, clean_count at 0.
 */
export function initialReviewQueueState(now: Date): { intervalIdx: number; cleanCount: number; dueAt: Date } {
  return {
    intervalIdx: 0,
    cleanCount: 0,
    dueAt: dueAtForInterval(0, now),
  }
}
