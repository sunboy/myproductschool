// Casebook Loop — XP award for a graded Challenge (cc_case_attempts) session.
//
// Integration point: the grading route (owned by devBA, NOT this file) calls
// `awardCaseXp` exactly once, on the winner side of its own atomic
// filed->graded status claim (the same CAS pattern
// challenges/[id]/complete/route.ts uses: `.update(...).eq('id',
// attemptId).neq('status', 'graded').select('id')`, award only if a row
// comes back). This module does not implement its own idempotency guard —
// unlike review-queue seeding (which is safe to re-call via ON CONFLICT DO
// NOTHING), calling this twice for the same attempt WILL double-award XP.
// The caller's atomic claim is the only thing that may gate it.
//
// Reuses the EXISTING XP system verbatim — no parallel XP math:
//   base_xp            = difficulty_base × (total_score / max_score)
//   difficulty_base     easy=50, medium=100, hard=150 (src/lib/scoring/xp-calculator.ts)
//   streak_multiplier   = min(1 + streak_days × 0.05, 1.5)
//   xp_earned           = round(base_xp × streak_multiplier)
// via calculateChallengeXp() + the update_user_streak / increment_user_xp
// RPCs, exactly as challenges/[id]/complete/route.ts does.
//
// cc_case_attempts HAS NO total_score/max_score COLUMNS OF ITS OWN — those
// numbers live inside its `grade` JSONB (devBA's territory), so this module
// takes them as a ratio parameter rather than reading any column. It never
// writes to challenge_attempts.max_score (DECIMAL(4,2), migration 024) or to
// any cc_case_attempts column — XP is derived purely from the (totalScore,
// maxScore) ratio the caller supplies.
//
// No usage_events are recorded here. cc_case_attempts_total is already
// metered at session-provisioning time (case/start/route.ts), not at grading
// time — grading is not a distinct metered feature, so trap #2 (the
// usage_events.feature CHECK constraint) does not apply to this module.

import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateChallengeXp } from '@/lib/scoring/xp-calculator'

export type CcCaseDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface AwardCaseXpInput {
  userId: string
  totalScore: number
  maxScore: number
  /** cc_cases.difficulty — 'beginner' | 'intermediate' | 'advanced'. Maps
   *  cleanly onto the existing easy/medium/hard buckets via coerceDifficulty. */
  difficulty: CcCaseDifficulty | string | null | undefined
}

export interface AwardCaseXpResult {
  xpEarned: number
  streakDays: number
}

/**
 * Awards XP for a graded Challenge session using the SAME formula and RPCs
 * as challenges/[id]/complete/route.ts. Runs update_user_streak first (so
 * the multiplier reflects today's rep), reads the resulting streak_days,
 * computes xp via calculateChallengeXp, then increments via
 * increment_user_xp. On any RPC failure, returns xpEarned: 0 rather than
 * reporting an award that was not actually persisted — mirrors the complete
 * route's failure semantics exactly.
 */
export async function awardCaseXp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  input: AwardCaseXpInput,
): Promise<AwardCaseXpResult> {
  const { userId, totalScore, maxScore, difficulty } = input

  const { error: streakError } = await admin.rpc('update_user_streak', { p_user_id: userId })
  if (streakError) {
    console.error('[casebook][case-xp] update_user_streak failed:', streakError.message)
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('streak_days')
    .eq('id', userId)
    .single()
  const streakDays = profile?.streak_days ?? 0

  // calculateChallengeXp coerces legacy/canonical difficulty strings
  // internally (coerceDifficulty), including cc_cases' own
  // beginner/intermediate/advanced values — no pre-coercion needed here.
  const xpEarned = calculateChallengeXp(totalScore, maxScore, difficulty ?? null, streakDays)

  if (xpEarned <= 0) {
    return { xpEarned: 0, streakDays }
  }

  const { error: xpError } = await admin.rpc('increment_user_xp', { p_user_id: userId, p_amount: xpEarned })
  if (xpError) {
    console.error('[casebook][case-xp] increment_user_xp failed:', xpError.message)
    return { xpEarned: 0, streakDays }
  }

  return { xpEarned, streakDays }
}
