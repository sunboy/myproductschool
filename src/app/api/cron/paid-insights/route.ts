import { NextResponse, type NextRequest } from 'next/server'
import { sendPaidInsightEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import { effectivePlanFromRows } from '@/lib/billing/entitlements'
import type {
  ProfileEntitlementRow,
  SubscriptionEntitlementRow,
} from '@/lib/billing/entitlements'

// ── Competency key → human label (no jargon openers) ─────────────────────────
const COMPETENCY_HUMAN_LABELS: Record<string, string> = {
  motivation_theory: 'spotting what drives user behaviour',
  cognitive_empathy: 'simulating how others think',
  taste: 'knowing a real tradeoff from a preference',
  strategic_thinking: 'long-term positioning decisions',
  creative_execution: 'generating structurally distinct options',
  domain_expertise: 'applying specific product knowledge',
}

function humanLabel(competencyKey: string): string {
  return COMPETENCY_HUMAN_LABELS[competencyKey] ?? competencyKey.replace(/_/g, ' ')
}

// ── ISO year-week key (e.g. "2026-W23") ──────────────────────────────────────
function isoYearWeek(d: Date): string {
  // Thursday-based ISO week (ISO 8601)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
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

// ── Row shapes ────────────────────────────────────────────────────────────────
type ProfileCandidateRow = ProfileEntitlementRow & {
  id: string
  display_name: string | null
}

type SubscriptionRow = SubscriptionEntitlementRow & {
  user_id: string
}

type CompetencyRow = {
  user_id: string
  competency: string
  score: number
  trend: string | null
}

type NotificationPrefRow = {
  user_id: string
  lifecycle: boolean | null
}

type NotificationLogRow = {
  dedupe_key: string
}

type EmailDedupeRow = {
  status: string | null
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const weekKey = isoYearWeek(new Date())

  // Fetch profiles with entitlement columns
  const { data: profilesData, error: profilesError } = await admin
    .from('profiles')
    .select('id, display_name, plan, role, pro_access, subscription_status, payment_failures, past_due_since')
    .limit(2000)

  if (profilesError) {
    return NextResponse.json({ error: 'Could not load profiles.' }, { status: 500 })
  }

  const allProfiles = (profilesData ?? []) as ProfileCandidateRow[]
  if (allProfiles.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  const allUserIds = allProfiles.map(p => p.id)

  // Fetch subscriptions, notification prefs, logs, and competencies in parallel
  const dedupeKeys = allUserIds.map(userId => `paid_insight:${userId}:${weekKey}`)

  const [subsResult, prefsResult, logsResult, competenciesResult] = await Promise.all([
    admin
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end, cancel_at_period_end, past_due_since')
      .in('user_id', allUserIds),
    admin
      .from('notification_prefs')
      .select('user_id, lifecycle')
      .in('user_id', allUserIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'paid_insight')
      .in('dedupe_key', dedupeKeys),
    admin
      .from('learner_competencies')
      .select('user_id, competency, score, trend')
      .in('user_id', allUserIds),
  ])

  if (subsResult.error || prefsResult.error || logsResult.error || competenciesResult.error) {
    return NextResponse.json({ error: 'Could not load notification state.' }, { status: 500 })
  }

  // Index by user_id for O(1) lookups
  const subscriptionsByUser = new Map<string, SubscriptionRow>()
  for (const row of ((subsResult.data ?? []) as SubscriptionRow[])) {
    subscriptionsByUser.set(row.user_id, row)
  }

  const prefs = new Map<string, boolean | null>(
    ((prefsResult.data ?? []) as NotificationPrefRow[]).map(r => [r.user_id, r.lifecycle])
  )

  const alreadyLogged = new Set(
    ((logsResult.data ?? []) as NotificationLogRow[]).map(r => r.dedupe_key)
  )

  // Group competencies by user
  const competenciesByUser = new Map<string, CompetencyRow[]>()
  for (const row of ((competenciesResult.data ?? []) as CompetencyRow[])) {
    const existing = competenciesByUser.get(row.user_id) ?? []
    existing.push(row)
    competenciesByUser.set(row.user_id, existing)
  }

  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const profile of allProfiles) {
    const userId = profile.id
    const dedupeKey = `paid_insight:${userId}:${weekKey}`

    // 1. Check if already sent this week
    if (alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    // 2. Only target Pro users
    const subscription = subscriptionsByUser.get(userId) ?? null
    const plan = effectivePlanFromRows(profile, subscription)
    if (plan !== 'pro') {
      skipped += 1
      continue
    }

    // 3. Respect lifecycle opt-out (default = send; skip only if explicitly false)
    if (prefs.get(userId) === false) {
      skipped += 1
      continue
    }

    // 4. Derive strongest + focus competency from learner_competencies
    const userCompetencies = competenciesByUser.get(userId) ?? []
    let strongestCompetency: string | null = null
    let strongestLabel: string | null = null
    let focusCompetency: string | null = null
    let focusLabel: string | null = null

    if (userCompetencies.length > 0) {
      const sorted = [...userCompetencies].sort((a, b) => b.score - a.score)
      const strongest = sorted[0]
      const focus = sorted[sorted.length - 1]
      strongestCompetency = strongest.competency
      strongestLabel = humanLabel(strongest.competency)
      if (focus.competency !== strongest.competency) {
        focusCompetency = focus.competency
        focusLabel = humanLabel(focus.competency)
      }
    }

    attempted += 1

    const token = createUnsubscribeToken({ userId, preference: 'lifecycle' })
    const unsubscribeUrl = token
      ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`)
      : null

    await sendPaidInsightEmail(admin, {
      dedupeKey,
      userId,
      name: profile.display_name,
      unsubscribeUrl,
      strongestCompetency,
      strongestLabel,
      focusCompetency,
      focusLabel,
      url: appUrl(request, '/progress'),
    })

    // Confirm the send landed before logging
    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle() as { data: EmailDedupeRow | null }

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert({
        user_id: userId,
        kind: 'paid_insight',
        channel: 'email',
        dedupe_key: dedupeKey,
        metadata: {
          week: weekKey,
          strongest_competency: strongestCompetency,
          focus_competency: focusCompetency,
        },
        sent_at: new Date().toISOString(),
      }, { onConflict: 'dedupe_key' })
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, attempted, sent, skipped })
}
