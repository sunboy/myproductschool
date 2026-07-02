import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendGrowthReportEmail } from '@/lib/email/transactional'
import { isInternalUser } from '@/lib/posthog/internal'
import type { SupabaseClient } from '@supabase/supabase-js'

// Monday funnel report for the founder: trailing 7 days vs the 7 days before,
// with internal/test accounts excluded everywhere. Scheduled via pg_cron
// (growth-report-weekly) alongside the other vault-authenticated crons.

export const maxDuration = 60

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

async function collectInternalUserIds(admin: SupabaseClient) {
  const internal = new Set<string>()
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    for (const user of data.users) {
      if (isInternalUser(user.email ?? null)) internal.add(user.id)
    }
    if (data.users.length < 1000) break
    page += 1
  }
  return internal
}

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? '±0' : `+${current}`
  const pct = Math.round(((current - previous) / previous) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

async function recipientEmail(admin: SupabaseClient) {
  const configured = process.env.GROWTH_REPORT_EMAIL
  if (configured) return configured

  const { data: adminProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!adminProfile) return null

  const { data } = await admin.auth.admin.getUserById(adminProfile.id)
  return data.user?.email ?? null
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const now = Date.now()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()

  const internal = await collectInternalUserIds(admin)
  const external = (userId: string | null) => Boolean(userId && !internal.has(userId))

  const [{ data: recentProfiles }, { data: recentAttempts }, { data: paidSubs }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, created_at, onboarding_completed_at')
      .gte('created_at', twoWeeksAgo),
    admin
      .from('challenge_attempts')
      .select('user_id, status, created_at')
      .gte('created_at', twoWeeksAgo),
    admin
      .from('subscriptions')
      .select('user_id, plan, status')
      .neq('plan', 'free')
      .in('status', ['active', 'trialing']),
  ])

  const signupsThisWeek = (recentProfiles ?? []).filter(
    (p) => external(p.id) && p.created_at >= weekAgo
  )
  const signupsLastWeek = (recentProfiles ?? []).filter(
    (p) => external(p.id) && p.created_at < weekAgo
  )
  const onboarded = signupsThisWeek.filter((p) => p.onboarding_completed_at).length
  const onboardingRate = signupsThisWeek.length
    ? Math.round((onboarded / signupsThisWeek.length) * 100)
    : 0

  const attemptsThisWeek = (recentAttempts ?? []).filter(
    (a) => external(a.user_id) && a.created_at >= weekAgo
  )
  const attemptsLastWeek = (recentAttempts ?? []).filter(
    (a) => external(a.user_id) && a.created_at < weekAgo
  )
  const wauThisWeek = new Set(attemptsThisWeek.map((a) => a.user_id)).size
  const wauLastWeek = new Set(attemptsLastWeek.map((a) => a.user_id)).size
  const completedThisWeek = attemptsThisWeek.filter((a) => a.status === 'completed').length
  const completedLastWeek = attemptsLastWeek.filter((a) => a.status === 'completed').length

  const realPaid = (paidSubs ?? []).filter((s) => external(s.user_id)).length

  const metrics = [
    `Signups: ${signupsThisWeek.length} (${delta(signupsThisWeek.length, signupsLastWeek.length)} WoW)`,
    `Onboarding completion (this week's cohort): ${onboardingRate}% (${onboarded}/${signupsThisWeek.length})`,
    `Weekly active practitioners: ${wauThisWeek} (${delta(wauThisWeek, wauLastWeek)} WoW)`,
    `Reps started: ${attemptsThisWeek.length} (${delta(attemptsThisWeek.length, attemptsLastWeek.length)} WoW)`,
    `Reps completed: ${completedThisWeek} (${delta(completedThisWeek, completedLastWeek)} WoW)`,
    `Real paying subscribers: ${realPaid}`,
  ]

  const weekLabel = new Date(now).toISOString().slice(0, 10)
  const headline =
    realPaid > 0
      ? `${signupsThisWeek.length} signups, ${realPaid} paying`
      : `${signupsThisWeek.length} signups this week`

  const to = await recipientEmail(admin)
  if (!to) {
    return NextResponse.json({ ok: false, error: 'no recipient resolved' }, { status: 500 })
  }

  await sendGrowthReportEmail(admin, {
    to,
    weekLabel,
    headline,
    metrics,
    detail:
      'Internal accounts (founder + hackproduct.com test users) are excluded from every number. Paid count reads the subscriptions table; treat Stripe as the revenue source of truth.',
  })

  return NextResponse.json({
    ok: true,
    weekLabel,
    metrics,
    excludedInternalUsers: internal.size,
  })
}
