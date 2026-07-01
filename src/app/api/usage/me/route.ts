import { NextResponse } from 'next/server'
import { getCachedUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsageForUser } from '@/lib/usage/check-limit'
import { getEffectiveUserPlan } from '@/lib/billing/entitlements'

type Severity = 'calm' | 'notice' | 'warn' | 'critical'

function computeSeverity(pct: number): Severity {
  if (pct >= 0.9) return 'critical'
  if (pct >= 0.7) return 'warn'
  if (pct >= 0.5) return 'notice'
  return 'calm'
}

export async function GET() {
  const { user } = await getCachedUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { plan } = await getEffectiveUserPlan(admin, user.id)
  const usage = await getUsageForUser(user.id, plan)

  // The usage meter measures free reps (challenges + interviews), not AI dollar
  // spend. Severity is driven by whichever rep type is closest to its cap, so the
  // user is nudged to upgrade the moment either runs out. The hatch_ai_cents spend
  // is still recorded in the backend for monitoring, but never shown or used to gate.
  const ratio = (used: number, cap: number) => (cap > 0 ? Math.min(used / cap, 1) : 0)
  const challPct = ratio(usage.challenges.used, usage.challenges.limit)
  const intPct = ratio(usage.interviews.used, usage.interviews.limit)
  const pctConsumed = Math.max(challPct, intPct)

  // Reset date reflects the rep window (rolling 30 days).
  const windowDays = usage.challenges.windowDays
  const periodResetsAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString()

  return NextResponse.json({
    // Original usage shape (kept for backward compatibility with UsageContext)
    challenges: usage.challenges,
    interviews: usage.interviews,
    hatchAiCents: usage.hatchAiCents,
    // Extended usage-indicator fields (rep-based)
    pct_consumed: pctConsumed,
    period_resets_at: periodResetsAt,
    severity: computeSeverity(pctConsumed),
    challenges_used: usage.challenges.used,
    challenges_cap: usage.challenges.limit,
    interviews_used: usage.interviews.used,
    interviews_cap: usage.interviews.limit,
    plan_tier: plan,
  })
}
