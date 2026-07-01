import { NextResponse, type NextRequest } from 'next/server'
import {
  sendActivationDay1Email,
  sendActivationDay3Email,
  sendActivationDay7Email,
} from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import { effectivePlanFromRows } from '@/lib/billing/entitlements'
import type { ProfileEntitlementRow, SubscriptionEntitlementRow } from '@/lib/billing/entitlements'
import type { SupabaseClient } from '@supabase/supabase-js'

// Activation drip steps: Day 1 / Day 3 / Day 7 after signup, for users who
// never started an interview or challenge. Each step has a 24h-wide window
// keyed off profiles.created_at so a given user lands in exactly one window
// per step per cron run.
const STEPS = [
  { key: 'activation_day1' as const, minHours: 24, maxHours: 48, send: sendActivationDay1Email },
  { key: 'activation_day3' as const, minHours: 72, maxHours: 96, send: sendActivationDay3Email },
  { key: 'activation_day7' as const, minHours: 168, maxHours: 192, send: sendActivationDay7Email },
]

type StepKey = (typeof STEPS)[number]['key']

type ProfileRow = ProfileEntitlementRow & {
  id: string
  display_name: string | null
  onboarding_completed_at: string | null
  created_at: string
}

type SubscriptionRow = SubscriptionEntitlementRow & {
  user_id: string
}

type NotificationPrefRow = {
  user_id: string
  lifecycle: boolean | null
}

type NotificationLogRow = {
  dedupe_key: string
}

type AttemptRow = {
  user_id: string
}

type InterviewSessionRow = {
  user_id: string
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function hoursAgoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

async function runStep(
  request: NextRequest,
  admin: SupabaseClient,
  step: (typeof STEPS)[number]
) {
  let attempted = 0
  let sent = 0
  let skipped = 0
  let error: string | null = null

  // Window: users created between minHours and maxHours ago. Each step's
  // window is 24h wide and non-overlapping with the others, so a user hits
  // each step at most once as the cron runs daily.
  const windowStart = hoursAgoIso(step.maxHours)
  const windowEnd = hoursAgoIso(step.minHours)

  const { data: rawProfiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, display_name, plan, role, pro_access, subscription_status, payment_failures, past_due_since, onboarding_completed_at, created_at')
    .neq('role', 'admin')
    .gte('created_at', windowStart)
    .lte('created_at', windowEnd)
    .limit(1000)

  if (profilesError) {
    return { key: step.key, attempted, sent, skipped, error: 'Could not load activation-drip candidates.' }
  }

  const profiles = (rawProfiles ?? []) as ProfileRow[]
  if (profiles.length === 0) {
    return { key: step.key, attempted, sent, skipped, error }
  }

  const userIds = profiles.map(p => p.id)
  const dedupeKeys = userIds.map(id => `${step.key}:${id}`)

  // "Never activated" = no row in challenge_attempts AND no row in
  // live_interview_sessions for that user, ever (not windowed). Onboarding
  // completion is intentionally NOT required — signing up without finishing
  // onboarding is exactly the dormant behavior this drip targets.
  const [subsResult, attemptsResult, interviewsResult, prefsResult, logsResult] = await Promise.all([
    admin
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end, cancel_at_period_end')
      .in('user_id', userIds),
    admin
      .from('challenge_attempts')
      .select('user_id')
      .in('user_id', userIds)
      .limit(5000),
    admin
      .from('live_interview_sessions')
      .select('user_id')
      .in('user_id', userIds)
      .limit(5000),
    admin
      .from('notification_prefs')
      .select('user_id, lifecycle')
      .in('user_id', userIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', step.key)
      .in('dedupe_key', dedupeKeys),
  ])

  if (subsResult.error || attemptsResult.error || interviewsResult.error || prefsResult.error || logsResult.error) {
    return { key: step.key, attempted, sent, skipped, error: 'Could not load notification state.' }
  }

  const subsByUser = new Map<string, SubscriptionRow>()
  for (const row of (subsResult.data ?? []) as SubscriptionRow[]) {
    subsByUser.set(row.user_id, row)
  }

  const activated = new Set<string>()
  for (const row of (attemptsResult.data ?? []) as AttemptRow[]) {
    activated.add(row.user_id)
  }
  for (const row of (interviewsResult.data ?? []) as InterviewSessionRow[]) {
    activated.add(row.user_id)
  }

  const lifecyclePrefs = new Map<string, boolean>()
  for (const row of (prefsResult.data ?? []) as NotificationPrefRow[]) {
    lifecyclePrefs.set(row.user_id, row.lifecycle !== false)
  }

  const alreadyLogged = new Set(((logsResult.data ?? []) as NotificationLogRow[]).map(r => r.dedupe_key))

  for (const profile of profiles) {
    const dedupeKey = `${step.key}:${profile.id}`

    // Skip anyone who has ever started an interview or challenge — they activated.
    if (activated.has(profile.id)) {
      skipped += 1
      continue
    }

    // Skip Pro / admin — target free, never-activated signups only.
    const sub = subsByUser.get(profile.id) ?? null
    const plan = effectivePlanFromRows(profile, sub)
    if (plan !== 'free') {
      skipped += 1
      continue
    }

    // Respect lifecycle opt-out (default true if no row).
    if (lifecyclePrefs.get(profile.id) === false) {
      skipped += 1
      continue
    }

    // Once-ever per user per step.
    if (alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    attempted += 1
    const token = createUnsubscribeToken({ userId: profile.id, preference: 'lifecycle' })
    const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null

    await step.send(admin, {
      dedupeKey,
      userId: profile.id,
      name: profile.display_name,
      url: appUrl(request, '/first-run'),
      unsubscribeUrl,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert(
        {
          user_id: profile.id,
          kind: step.key,
          channel: 'email',
          dedupe_key: dedupeKey,
          metadata: {},
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'dedupe_key' }
      )
      sent += 1
    }
  }

  return { key: step.key, attempted, sent, skipped, error }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const results = await Promise.all(STEPS.map(step => runStep(request, admin, step)))

  const byKey = new Map(results.map(r => [r.key, r]))
  const errors = results.filter(r => r.error).map(r => ({ step: r.key, error: r.error }))

  const summary: Record<string, unknown> = {
    ok: errors.length === 0,
    day1Sent: byKey.get('activation_day1' as StepKey)?.sent ?? 0,
    day3Sent: byKey.get('activation_day3' as StepKey)?.sent ?? 0,
    day7Sent: byKey.get('activation_day7' as StepKey)?.sent ?? 0,
    errors,
    detail: results,
  }

  return NextResponse.json(summary, { status: errors.length === 0 ? 200 : 502 })
}
