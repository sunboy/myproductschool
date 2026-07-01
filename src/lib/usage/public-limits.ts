import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEFAULT_PLAN_LIMITS,
  type PlanLimitNumbers,
  type PublicPlanLimits,
} from '@/lib/usage/plan-limits-shared'

// User-facing plan allowances, read live from plan_limits so marketing copy
// follows the /admin/paywall-config knobs without a deploy. These are the
// numbers quoted in pricing cards and paywall gates — NOT the enforcement
// path (that's checkUsageLimit in ./check-limit.ts, which reads the same
// table). Full operator guide: docs/runbooks/limits-and-pricing.md.
//
// SERVER ONLY (imports the admin client). Client components use
// usePlanLimits() (./use-plan-limits.ts) or plan-limits-shared.ts directly.

export { DEFAULT_PLAN_LIMITS }
export type { PlanLimitNumbers, PublicPlanLimits }

const CACHE_TTL_MS = 60_000
let cache: { value: PublicPlanLimits; fetchedAt: number } | null = null

export async function getPublicPlanLimits(): Promise<PublicPlanLimits> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.value

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('plan_limits')
      .select('plan, feature, limit_value')
      .in('plan', ['free', 'pro'])
      .in('feature', ['challenges', 'interviews'])

    if (error || !data) return DEFAULT_PLAN_LIMITS

    const value: PublicPlanLimits = {
      free: { ...DEFAULT_PLAN_LIMITS.free },
      pro: { ...DEFAULT_PLAN_LIMITS.pro },
    }
    for (const row of data) {
      const plan = row.plan as keyof PublicPlanLimits
      const feature = row.feature as keyof PlanLimitNumbers
      if (value[plan] && feature in value[plan] && typeof row.limit_value === 'number') {
        value[plan][feature] = row.limit_value
      }
    }

    cache = { value, fetchedAt: Date.now() }
    return value
  } catch {
    return DEFAULT_PLAN_LIMITS
  }
}
