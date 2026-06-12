import type { SupabaseClient } from '@supabase/supabase-js'
import { getEffectiveUserPlan } from '@/lib/billing/entitlements'

export interface SolutionAccess {
  unlocked: boolean
  isPro: boolean
  hasCompletedAttempt: boolean
}

/**
 * Attempt-or-Pro gate for the Solutions tab. Pro (or admin) users are always
 * unlocked; free users unlock a challenge's solution by completing at least
 * one attempt (any score). Quick-take submissions also insert completed
 * challenge_attempts rows, so one check covers every challenge type.
 */
export async function getSolutionAccess(
  admin: SupabaseClient,
  userId: string,
  challengeId: string
): Promise<SolutionAccess> {
  const [{ plan, isAdmin }, attemptResult] = await Promise.all([
    getEffectiveUserPlan(admin, userId),
    admin
      .from('challenge_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle(),
  ])

  const isPro = plan === 'pro' || isAdmin
  const hasCompletedAttempt = Boolean(attemptResult.data)
  return { unlocked: isPro || hasCompletedAttempt, isPro, hasCompletedAttempt }
}
