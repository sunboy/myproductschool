import { NextResponse, type NextRequest } from 'next/server'
import { sendResumeArticleEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  effectivePlanFromRows,
  type ProfileEntitlementRow,
  type SubscriptionEntitlementRow,
} from '@/lib/billing/entitlements'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HogQLResponse {
  results: unknown[][]
  columns: string[]
  error?: string
}

/** Row returned by the HogQL query: PostHog distinct_id + autopsy slug */
interface ArticleCandidate {
  distinct_id: string
  slug: string
}

/** Profile row joined with subscription for plan resolution */
interface ProfileRow extends ProfileEntitlementRow {
  id: string
  display_name: string | null
}

interface SubscriptionRow extends SubscriptionEntitlementRow {
  user_id: string
}

interface NotificationLogRow {
  dedupe_key: string
}

interface NotificationPrefRow {
  user_id: string
  lifecycle: boolean | null
}

interface AutopsySlugRow {
  slug: string
  name: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Returns the ISO year-week string for a date, e.g. "2026-W22".
 * Used for weekly deduplication — one article-resume email per user per article per week.
 */
function isoYearWeek(date: Date): string {
  // Algorithm: find Thursday of the current week (ISO weeks start Monday).
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayOfWeek = d.getUTCDay() || 7 // Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek) // Adjust to Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Query PostHog via HogQL to find users who:
 *   - fired `autopsy_section_viewed` (with max pct < 80) in the last 7 days
 *   - did NOT fire `autopsy_finished` for the same slug in the last 7 days
 *
 * Returns up to 200 {distinct_id, slug} pairs.
 *
 * HogQL reference: https://posthog.com/docs/hogql
 */
async function runHogQLQuery(
  projectId: string,
  personalApiKey: string,
  query: string,
): Promise<HogQLResponse> {
  const resp = await fetch(
    `https://us.posthog.com/api/projects/${projectId}/query/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    },
  )
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`PostHog query failed (${resp.status}): ${text.slice(0, 300)}`)
  }
  const json = (await resp.json()) as HogQLResponse
  if (json.error) throw new Error(`PostHog HogQL error: ${json.error}`)
  return json
}

/**
 * Query PostHog via HogQL to find users who:
 *   - fired `autopsy_section_viewed` (max pct < 80) in the last 7 days
 *   - did NOT fire `autopsy_finished` for the same slug in the last 7 days
 *
 * Uses two queries (viewed + finished) and post-filters in memory, because
 * HogQL correlated NOT EXISTS across a GROUP BY is not well-supported.
 *
 * Returns up to 200 {distinct_id, slug} pairs.
 */
async function fetchArticleCandidates(
  projectId: string,
  personalApiKey: string,
): Promise<ArticleCandidate[]> {
  const viewedQuery = `
    SELECT
      distinct_id,
      properties.slug AS slug
    FROM events
    WHERE event = 'autopsy_section_viewed'
      AND timestamp >= now() - interval 7 day
      AND properties.slug IS NOT NULL
    GROUP BY distinct_id, properties.slug
    HAVING max(toFloat64OrNull(properties.pct)) < 80
    ORDER BY distinct_id
    LIMIT 200
  `

  const finishedQuery = `
    SELECT DISTINCT
      distinct_id,
      properties.slug AS slug
    FROM events
    WHERE event = 'autopsy_finished'
      AND timestamp >= now() - interval 7 day
      AND properties.slug IS NOT NULL
    LIMIT 500
  `

  const [viewedResult, finishedResult] = await Promise.all([
    runHogQLQuery(projectId, personalApiKey, viewedQuery),
    runHogQLQuery(projectId, personalApiKey, finishedQuery),
  ])

  // Build a set of "distinct_id:slug" combos that finished the article
  const finishedKeys = new Set(
    (finishedResult.results ?? []).map((row) => `${String(row[0] ?? '')}:${String(row[1] ?? '')}`),
  )

  // Return candidates who have NOT finished
  return (viewedResult.results ?? [])
    .map((row) => ({
      distinct_id: String(row[0] ?? ''),
      slug: String(row[1] ?? ''),
    }))
    .filter((c) => c.distinct_id && c.slug && !finishedKeys.has(`${c.distinct_id}:${c.slug}`))
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY

  if (!posthogProjectId || !posthogApiKey) {
    return NextResponse.json({ ok: true, skipped: 'posthog_not_configured' })
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekKey = isoYearWeek(now)

  // ── 1. Fetch candidates from PostHog ─────────────────────────────────────
  let candidates: ArticleCandidate[]
  try {
    candidates = await fetchArticleCandidates(posthogProjectId, posthogApiKey)
  } catch (err) {
    console.error('[resume-article cron] PostHog query failed:', err)
    return NextResponse.json(
      { error: 'PostHog query failed', detail: String(err) },
      { status: 500 },
    )
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  // ── 2. PostHog distinct_id == Supabase user UUID (same value) ────────────
  const userIds = [...new Set(candidates.map((c) => c.distinct_id))]
  const slugs = [...new Set(candidates.map((c) => c.slug))]

  // ── 3. Load user profiles + subscriptions ────────────────────────────────
  const [profilesResult, subscriptionsResult, prefsResult, logsResult, articlesResult] =
    await Promise.all([
      admin
        .from('profiles')
        .select('id, display_name, plan, role, pro_access, subscription_status, past_due_since')
        .in('id', userIds),
      admin
        .from('subscriptions')
        .select('user_id, plan, status, current_period_end, cancel_at_period_end')
        .in('user_id', userIds),
      admin
        .from('notification_prefs')
        .select('user_id, lifecycle')
        .in('user_id', userIds),
      admin
        .from('notification_log')
        .select('dedupe_key')
        .eq('kind', 'resume_article')
        .in(
          'dedupe_key',
          candidates.map((c) => `resume_article:${c.distinct_id}:${c.slug}:${weekKey}`),
        ),
      admin
        .from('autopsy_products')
        .select('slug, name')
        .in('slug', slugs),
    ])

  if (
    profilesResult.error ||
    subscriptionsResult.error ||
    prefsResult.error ||
    logsResult.error ||
    articlesResult.error
  ) {
    return NextResponse.json({ error: 'Could not load notification state.' }, { status: 500 })
  }

  // ── 4. Build lookup maps ──────────────────────────────────────────────────

  const profileMap = new Map<string, ProfileRow>(
    ((profilesResult.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  )

  const subscriptionMap = new Map<string, SubscriptionRow>(
    ((subscriptionsResult.data ?? []) as SubscriptionRow[]).map((s) => [s.user_id, s]),
  )

  const prefMap = new Map<string, boolean | null>(
    ((prefsResult.data ?? []) as NotificationPrefRow[]).map((p) => [p.user_id, p.lifecycle]),
  )

  const alreadyLogged = new Set(
    ((logsResult.data ?? []) as NotificationLogRow[]).map((r) => r.dedupe_key),
  )

  const articleTitleMap = new Map<string, string>(
    ((articlesResult.data ?? []) as AutopsySlugRow[]).map((a) => [a.slug, a.name]),
  )

  // ── 5. Process candidates ─────────────────────────────────────────────────
  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const candidate of candidates) {
    const { distinct_id: userId, slug } = candidate
    const dedupeKey = `resume_article:${userId}:${slug}:${weekKey}`

    // Skip if already sent this week
    if (alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    // Skip if lifecycle emails disabled
    if (prefMap.get(userId) === false) {
      skipped += 1
      continue
    }

    const profile = profileMap.get(userId)
    // Skip if we have no profile (user may have been deleted)
    if (!profile) {
      skipped += 1
      continue
    }

    // Only send to FREE users
    const subscription = subscriptionMap.get(userId) ?? null
    const plan = effectivePlanFromRows(profile, subscription, now)
    if (plan !== 'free') {
      skipped += 1
      continue
    }

    // Resolve article title
    const articleTitle = articleTitleMap.get(slug)
    if (!articleTitle) {
      // Unknown slug — PostHog may have stale/invalid data; skip silently
      skipped += 1
      continue
    }

    attempted += 1

    const token = createUnsubscribeToken({ userId, preference: 'lifecycle' })
    const unsubscribeUrl = token
      ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`)
      : null

    const articleUrl = appUrl(request, `/explore/autopsies/${slug}`)

    await sendResumeArticleEmail(admin, {
      userId,
      name: profile.display_name,
      articleTitle,
      articleUrl,
      unsubscribeUrl,
      dedupeKey,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert(
        {
          user_id: userId,
          kind: 'resume_article',
          channel: 'email',
          dedupe_key: dedupeKey,
          metadata: { slug, article_title: articleTitle },
          sent_at: now.toISOString(),
        },
        { onConflict: 'dedupe_key' },
      )
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, attempted, sent, skipped })
}
