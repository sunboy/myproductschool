import { NextResponse, type NextRequest } from 'next/server'
import { sendUpgradeNudgeEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import { effectivePlanFromRows } from '@/lib/billing/entitlements'
import type { ProfileEntitlementRow, SubscriptionEntitlementRow } from '@/lib/billing/entitlements'

// How far back to look for recent activity (14 days)
const ACTIVITY_WINDOW_DAYS = 14

type ProfileRow = ProfileEntitlementRow & {
  id: string
  display_name: string | null
  onboarding_completed_at: string | null
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

/** Returns YYYY-MM for the current month — used as the monthly dedupe key suffix. */
function currentYearMonth() {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

/** ISO date string for `daysAgo` days before now. */
function daysAgoIso(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const yearMonth = currentYearMonth()
  const activityCutoff = daysAgoIso(ACTIVITY_WINDOW_DAYS)

  // 1. Load onboarded, non-admin profiles with billing columns needed for plan check.
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, display_name, plan, role, pro_access, subscription_status, payment_failures, past_due_since, onboarding_completed_at')
    .not('onboarding_completed_at', 'is', null)
    .neq('role', 'admin')
    .limit(1000)

  if (profilesError) {
    return NextResponse.json({ error: 'Could not load profiles.' }, { status: 500 })
  }

  const allProfiles = (profiles ?? []) as ProfileRow[]
  if (allProfiles.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  const allUserIds = allProfiles.map(p => p.id)

  // 2. Load subscriptions, recent activity, notification prefs, and existing dedupe logs in parallel.
  const dedupeKeys = allUserIds.map(id => `upgrade_nudge:${id}:${yearMonth}`)

  const [subsResult, attemptsResult, prefsResult, logsResult] = await Promise.all([
    admin
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end, cancel_at_period_end')
      .in('user_id', allUserIds),
    admin
      .from('challenge_attempts')
      .select('user_id')
      .in('user_id', allUserIds)
      .gte('created_at', activityCutoff)
      .eq('status', 'completed')
      .limit(5000),
    admin
      .from('notification_prefs')
      .select('user_id, lifecycle')
      .in('user_id', allUserIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'upgrade_nudge')
      .in('dedupe_key', dedupeKeys),
  ])

  if (subsResult.error || attemptsResult.error || prefsResult.error || logsResult.error) {
    return NextResponse.json({ error: 'Could not load notification state.' }, { status: 500 })
  }

  // Index subscriptions by user_id for O(1) lookup.
  const subsByUser = new Map<string, SubscriptionRow>()
  for (const row of (subsResult.data ?? []) as SubscriptionRow[]) {
    subsByUser.set(row.user_id, row)
  }

  // Build set of users with recent activity.
  const recentlyActive = new Set<string>()
  for (const row of (attemptsResult.data ?? []) as AttemptRow[]) {
    recentlyActive.add(row.user_id)
  }

  // Index lifecycle pref — absence means default (true).
  const lifecyclePrefs = new Map<string, boolean>()
  for (const row of (prefsResult.data ?? []) as NotificationPrefRow[]) {
    lifecyclePrefs.set(row.user_id, row.lifecycle !== false)
  }

  // Build set of already-sent dedupe keys this month.
  const alreadyLogged = new Set<string>()
  for (const row of (logsResult.data ?? []) as NotificationLogRow[]) {
    alreadyLogged.add(row.dedupe_key)
  }

  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const profile of allProfiles) {
    const dedupeKey = `upgrade_nudge:${profile.id}:${yearMonth}`
    const sub = subsByUser.get(profile.id) ?? null

    // Confirm user is on the free plan.
    const plan = effectivePlanFromRows(profile, sub)
    if (plan !== 'free') {
      skipped += 1
      continue
    }

    // Require recent activity.
    if (!recentlyActive.has(profile.id)) {
      skipped += 1
      continue
    }

    // Respect lifecycle pref (default true if no row).
    if (lifecyclePrefs.get(profile.id) === false) {
      skipped += 1
      continue
    }

    // Monthly dedupe cap.
    if (alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    attempted += 1
    const token = createUnsubscribeToken({ userId: profile.id, preference: 'lifecycle' })
    const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null

    await sendUpgradeNudgeEmail(admin, {
      dedupeKey,
      userId: profile.id,
      name: profile.display_name,
      url: appUrl(request, '/pricing'),
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
          kind: 'upgrade_nudge',
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

  return NextResponse.json({ ok: true, attempted, sent, skipped })
}
