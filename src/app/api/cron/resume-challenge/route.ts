import { NextResponse, type NextRequest } from 'next/server'
import { sendResumeChallengeEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import { effectivePlanFromRows } from '@/lib/billing/entitlements'
import type { ProfileEntitlementRow, SubscriptionEntitlementRow } from '@/lib/billing/entitlements'

type AttemptRow = {
  id: string
  user_id: string
  challenge_id: string
  current_step: string | null
  started_at: string
}

type ChallengeRow = {
  id: string
  title: string
}

type ProfileRow = ProfileEntitlementRow & {
  id: string
  display_name: string | null
  email: string | null
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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const now = new Date()

  // Window: attempts started between ~14 days and ~1 day ago
  const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch in_progress attempts within the window — one most-recent per user
  // We select the raw rows and dedupe in code to keep the query simple.
  const { data: rawAttempts, error: attemptsError } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, current_step, started_at')
    .eq('status', 'in_progress')
    .gte('started_at', windowStart)
    .lte('started_at', windowEnd)
    .order('started_at', { ascending: false })
    .limit(1000)

  if (attemptsError) {
    return NextResponse.json({ error: 'Could not load in-progress attempts.' }, { status: 500 })
  }

  const attempts = (rawAttempts ?? []) as AttemptRow[]
  if (attempts.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  // Keep only the most-recent attempt per user
  const byUser = new Map<string, AttemptRow>()
  for (const row of attempts) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, row)
    }
  }
  const candidates = Array.from(byUser.values())
  const userIds = candidates.map(r => r.user_id)
  const challengeIds = [...new Set(candidates.map(r => r.challenge_id))]
  const attemptIds = candidates.map(r => r.id)
  const dedupeKeys = candidates.map(r => `resume_challenge:${r.id}`)

  // Fan-out: profiles + subscriptions + challenges + prefs + dedupes
  const [profilesResult, subscriptionsResult, challengesResult, prefsResult, logsResult] = await Promise.all([
    admin
      .from('profiles')
      .select('id, display_name, email, plan, role, pro_access, subscription_status, payment_failures, past_due_since, onboarding_completed_at')
      .in('id', userIds),
    admin
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end, cancel_at_period_end')
      .in('user_id', userIds),
    admin
      .from('challenges')
      .select('id, title')
      .in('id', challengeIds),
    admin
      .from('notification_prefs')
      .select('user_id, lifecycle')
      .in('user_id', userIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'resume_challenge')
      .in('dedupe_key', dedupeKeys),
  ])

  if (profilesResult.error || subscriptionsResult.error || challengesResult.error || prefsResult.error || logsResult.error) {
    return NextResponse.json({ error: 'Could not load notification state.' }, { status: 500 })
  }

  const profiles = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map(p => [p.id, p])
  )
  const subscriptions = new Map(
    ((subscriptionsResult.data ?? []) as SubscriptionRow[]).map(s => [s.user_id, s])
  )
  const challenges = new Map(
    ((challengesResult.data ?? []) as ChallengeRow[]).map(c => [c.id, c])
  )
  const prefs = new Map(
    ((prefsResult.data ?? []) as NotificationPrefRow[]).map(p => [p.user_id, p.lifecycle])
  )
  const alreadyLogged = new Set(
    ((logsResult.data ?? []) as NotificationLogRow[]).map(r => r.dedupe_key)
  )

  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const row of candidates) {
    const profile = profiles.get(row.user_id)
    const subscription = subscriptions.get(row.user_id) ?? null
    const challenge = challenges.get(row.challenge_id)
    const dedupeKey = `resume_challenge:${row.id}`

    // Skip non-onboarded users
    if (!profile?.onboarding_completed_at) {
      skipped += 1
      continue
    }

    // Skip Pro and admin users — target free users only
    const plan = effectivePlanFromRows(profile ?? null, subscription)
    if (plan !== 'free') {
      skipped += 1
      continue
    }

    // Skip if lifecycle pref is explicitly opted out
    if (prefs.get(row.user_id) === false) {
      skipped += 1
      continue
    }

    // Skip if already sent for this attempt
    if (alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    // Skip if no challenge record (shouldn't happen, but defensive)
    if (!challenge) {
      skipped += 1
      continue
    }

    attempted += 1
    const token = createUnsubscribeToken({ userId: row.user_id, preference: 'lifecycle' })
    const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null
    const resumeUrl = appUrl(request, `/workspace/challenges/${row.challenge_id}?resume=1`)

    await sendResumeChallengeEmail(admin, {
      dedupeKey,
      userId: row.user_id,
      name: profile?.display_name ?? null,
      challengeTitle: challenge.title,
      currentStep: row.current_step,
      resumeUrl,
      unsubscribeUrl,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert({
        user_id: row.user_id,
        kind: 'resume_challenge',
        channel: 'email',
        dedupe_key: dedupeKey,
        metadata: { challenge_id: row.challenge_id, attempt_id: row.id },
        sent_at: new Date().toISOString(),
      }, { onConflict: 'dedupe_key' })
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, attempted, sent, skipped })
}
