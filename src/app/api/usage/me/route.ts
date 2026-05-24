import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { plan } = await getEffectiveUserPlan(admin, user.id)
  const usage = await getUsageForUser(user.id, plan)

  // Derive AI spend display values from hatchAiCents (stored in cents)
  const aiSpendCents = usage.hatchAiCents.used
  const aiCapCents = usage.hatchAiCents.limit
  const aiSpendUsd = aiSpendCents / 100
  const aiCapUsd = aiCapCents / 100
  const pctConsumed = aiCapCents > 0 ? Math.min(aiSpendCents / aiCapCents, 1) : 0

  // Compute reset date: window is rolling 30 days from oldest event boundary
  // Use a simple approximation: now + (windowDays - used days) — just show
  // the end of the rolling window as "resets in ~windowDays"
  const windowDays = usage.hatchAiCents.windowDays
  const periodResetsAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString()

  return NextResponse.json({
    // Original usage shape (kept for backward compatibility with UsageContext)
    challenges: usage.challenges,
    interviews: usage.interviews,
    hatchAiCents: usage.hatchAiCents,
    // Extended spend-indicator fields
    ai_spend_usd: aiSpendUsd,
    ai_spend_cap_usd: aiCapUsd,
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
