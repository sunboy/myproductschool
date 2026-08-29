// Casebook Loop — review-queue seeding from a graded Challenge attempt's misses.
//
// Integration point: the grading route (owned by devBA, NOT this file) calls
// `seedReviewQueueFromMisses` exactly once, on the winner side of its own
// atomic filed->graded status claim (the same CAS pattern
// challenges/[id]/complete/route.ts uses for XP) so a concurrent double-grade
// cannot seed the queue twice from two different requests. Seeding itself is
// ALSO safely re-callable on its own — see the upsert-vs-skip decision below —
// so even a retry from a non-atomic caller cannot corrupt state, but it does
// not substitute for that caller-side gate (a double-file would otherwise
// insert two clean_count-tracking histories worth of work if this function
// were the only guard).
//
// UPSERT-VS-SKIP DECISION: skip via `ON CONFLICT (user_id, item_type,
// item_id) DO NOTHING` (Supabase `ignoreDuplicates: true`). A repeat miss of
// an item ALREADY in the queue (not yet retired) carries no new scheduling
// information — the item is already due for review. Resetting its
// interval_idx/clean_count back to 0 on a repeat miss would erase spaced-rep
// progress the learner already made, which the brief explicitly says must
// not happen. So: insert-if-absent, never overwrite.
//
// RETIRED-ITEM SUB-CASE: a row with retired_at set (the learner cleaned it
// twice already) that gets missed again is NOT touched by the plain
// ON CONFLICT DO NOTHING insert below — it already exists, so the insert is
// silently skipped and the item stays retired forever. We deliberately do
// NOT resurrect it. Rationale: retirement is a hard signal that the learner
// demonstrated mastery on two separate clean reps; a single subsequent miss
// (which may be attributable to an unrelated case, a fluke, or measurement
// noise) is a much weaker signal than the two clean reps that retired it.
// Resurrecting on any miss would make retirement non-monotonic and noisy. If
// product wants "N misses after retirement un-retires," that is a distinct
// policy decision belonging to whoever owns the review-queue read path — flag
// it to the orchestrator rather than deciding it here.

import type { SupabaseClient } from '@supabase/supabase-js'
import { initialReviewQueueState } from './review-schedule'
import type { MoveDiffResult } from './move-diff'

export type ReviewItemType = 'scene' | 'prediction' | 'concept'

export interface ReviewMiss {
  itemType: ReviewItemType
  itemId: string
}

/**
 * Seed cc_review_queue rows for a set of misses, sourced with
 * source='case_debrief'. Safe to call multiple times for the same
 * (user, item_type, item_id) — repeats are silently skipped, never reset.
 *
 * `admin` must be a service-role client (RLS has no service-role policy on
 * this table by design; callers pass createAdminClient()).
 */
export async function seedReviewQueueFromMisses(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  userId: string,
  misses: ReviewMiss[],
  now: Date,
): Promise<{ seeded: number; error: string | null }> {
  if (misses.length === 0) return { seeded: 0, error: null }

  // De-dupe within this single call — the same item missed twice in one
  // diff (shouldn't happen, but cheap to guard) would otherwise submit two
  // rows with the same conflict key in one insert statement, which Postgres
  // rejects ("ON CONFLICT DO UPDATE/NOTHING command cannot affect row a
  // second time").
  const seen = new Set<string>()
  const rows = misses
    .filter((m) => {
      const key = `${m.itemType}:${m.itemId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((m) => {
      const { dueAt } = initialReviewQueueState(now)
      return {
        user_id: userId,
        item_type: m.itemType,
        item_id: m.itemId,
        source: 'case_debrief',
        due_at: dueAt.toISOString(),
        interval_idx: 0,
        clean_count: 0,
      }
    })

  const { data, error } = await admin
    .from('cc_review_queue')
    .upsert(rows, {
      onConflict: 'user_id,item_type,item_id',
      ignoreDuplicates: true,
    })
    .select('id')

  if (error) {
    return { seeded: 0, error: error.message }
  }
  return { seeded: data?.length ?? 0, error: null }
}

/**
 * Maps a graded attempt's diff.missed expert moves onto ReviewMiss
 * descriptors. Accepts devBA's actual MoveDiffResult shape
 * ({matched, missed: {id,label}[], extra, expert_moves_total}, see
 * move-diff.ts) — confirmed against that file rather than assumed. Expert
 * moves are neither scenes nor predictions, so item_type='concept' with
 * itemId = the move's id is the only fit in cc_review_queue's item_type
 * CHECK constraint; flagged for orchestrator sign-off in the phase report.
 */
export function missesFromDiff(
  diff: Pick<MoveDiffResult, 'missed'> | { missed?: Array<{ id: string }> } | null | undefined,
): ReviewMiss[] {
  if (!diff?.missed) return []
  return diff.missed
    .filter((m): m is { id: string } => typeof m?.id === 'string' && m.id.length > 0)
    .map((m) => ({ itemType: 'concept' as const, itemId: m.id }))
}
