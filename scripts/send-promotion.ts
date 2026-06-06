/**
 * scripts/send-promotion.ts
 *
 * Ad-hoc promotional email blast.
 *
 * Audience: users with notification_prefs.marketing === true ONLY.
 * This is a legal opt-in requirement — never send to non-opted-in users.
 *
 * Usage:
 *   npx tsx scripts/send-promotion.ts
 *
 * Set CAMPAIGN_ID and content in the CAMPAIGN config object below before running.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// ── Campaign config ────────────────────────────────────────────────────────────
// Edit this before each send. campaignId must be unique per campaign.
const CAMPAIGN: {
  campaignId: string
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  eyebrow?: string
  valueBullets?: string[]
  heroImageUrl?: string
} = {
  campaignId: 'example-campaign-2026-06',
  heading: 'New challenges just dropped',
  body: 'This week we added 12 new practice reps across AI Agents, SQL, and System Design. Pick one and sharpen a weak spot before the weekend.',
  ctaLabel: 'Explore new challenges',
  ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.com'}/explore`,
  eyebrow: 'What\'s new on HackProduct',
  valueBullets: [
    '12 new challenges live',
    'AI Agents · SQL · System Design',
    'Rated by difficulty — start where it counts',
  ],
}
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.com'
  return new URL(path, base).toString()
}

type NotificationPrefRow = {
  user_id: string
  marketing: boolean | null
}

type NotificationLogRow = {
  dedupe_key: string
}

type EmailDedupeRow = {
  status: string | null
}

async function main() {
  const admin = createSupabaseClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  // Dynamically import transactional sender (ESM/CJS bridge via tsx)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sendPromotionEmail } = await import('../src/lib/email/transactional')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createUnsubscribeToken } = await import('../src/lib/notifications/unsubscribe')

  console.log(`[promo] campaign=${CAMPAIGN.campaignId}`)

  let offset = 0
  let totalAttempted = 0
  let totalSent = 0
  let totalSkipped = 0

  while (true) {
    // Fetch a page of users who have explicitly opted in to marketing emails.
    // The marketing=true check is the legal gate — never send promos without it.
    const { data: optIns, error: optInsError } = await admin
      .from('notification_prefs')
      .select('user_id, marketing')
      .eq('marketing', true)
      .range(offset, offset + BATCH_SIZE - 1)

    if (optInsError) {
      console.error('[promo] Failed to load opted-in users:', optInsError.message)
      process.exit(1)
    }

    const rows = (optIns ?? []) as NotificationPrefRow[]
    if (rows.length === 0) break

    const userIds = rows.map(r => r.user_id)
    const dedupeKeys = userIds.map(userId => `promotion:${CAMPAIGN.campaignId}:${userId}`)

    // Check which have already received this campaign (idempotent re-runs)
    const { data: logsData, error: logsError } = await admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'promotion')
      .in('dedupe_key', dedupeKeys)

    if (logsError) {
      console.error('[promo] Failed to load notification log:', logsError.message)
      process.exit(1)
    }

    const alreadyLogged = new Set(
      ((logsData ?? []) as NotificationLogRow[]).map(r => r.dedupe_key)
    )

    for (const row of rows) {
      const dedupeKey = `promotion:${CAMPAIGN.campaignId}:${row.user_id}`

      // Skip if already sent this campaign to this user
      if (alreadyLogged.has(dedupeKey)) {
        totalSkipped += 1
        continue
      }

      // Double-check: only send to marketing=true (the opt-in gate)
      if (row.marketing !== true) {
        totalSkipped += 1
        continue
      }

      totalAttempted += 1

      const token = createUnsubscribeToken({ userId: row.user_id, preference: 'marketing' })
      const unsubscribeUrl = token ? appUrl(`/api/notifications/unsubscribe?token=${token}`) : null

      await sendPromotionEmail(admin, {
        dedupeKey,
        userId: row.user_id,
        unsubscribeUrl,
        heading: CAMPAIGN.heading,
        body: CAMPAIGN.body,
        ctaLabel: CAMPAIGN.ctaLabel,
        ctaUrl: CAMPAIGN.ctaUrl,
        eyebrow: CAMPAIGN.eyebrow,
        valueBullets: CAMPAIGN.valueBullets,
        heroImageUrl: CAMPAIGN.heroImageUrl ?? null,
      })

      // Confirm the send landed in email_dedupes before logging
      const { data: emailEvent } = await admin
        .from('email_dedupes')
        .select('status')
        .eq('dedupe_key', dedupeKey)
        .maybeSingle() as { data: EmailDedupeRow | null }

      if (emailEvent?.status === 'sent') {
        await admin.from('notification_log').upsert({
          user_id: row.user_id,
          kind: 'promotion',
          channel: 'email',
          dedupe_key: dedupeKey,
          metadata: { campaign_id: CAMPAIGN.campaignId },
          sent_at: new Date().toISOString(),
        }, { onConflict: 'dedupe_key' })
        totalSent += 1
        console.log(`[promo] sent → ${row.user_id}`)
      } else {
        console.warn(`[promo] send did not confirm for ${row.user_id} (status=${emailEvent?.status ?? 'none'})`)
      }
    }

    if (rows.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`[promo] done — attempted=${totalAttempted} sent=${totalSent} skipped=${totalSkipped}`)
}

main().catch(err => {
  console.error('[promo] fatal:', err)
  process.exit(1)
})
