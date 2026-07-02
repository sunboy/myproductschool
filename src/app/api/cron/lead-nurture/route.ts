import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendLeadMagnetUnlockEmail } from '@/lib/email/transactional'
import { LEAD_MAGNETS } from '@/lib/lead-magnets/config'

// Batched lead-nurture cron. Runs daily at 15:00 UTC.
//
// Sends two nurture emails per gate-magnet lead:
//   d2  — day-2 value email: one sharper insight the gate did not include.
//   d5  — day-5 signup push: what training that specific skill looks like inside
//         HackProduct.
//
// Candidate windows (inclusive of upper bound so the cron can be added late
// without back-filling every old lead):
//   d2: created_at between 9 days ago and 2 days ago
//   d5: created_at between 12 days ago and 5 days ago
//
// Dedupe keys: lead_nurture_d2:{slug}:{email} and lead_nurture_d5:{slug}:{email}
// The email_dedupes mechanism makes re-runs idempotent at no extra cost.
//
// Registered users are skipped (email matches a record in auth.users). This
// keeps nurture focused on unconverted leads and avoids emailing people who
// already have accounts.

const SEND_CAP = 200

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.com'
  return new URL(path, base).toString()
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d
}

type LeadRow = {
  id: string
  email: string
  name: string | null
  source_slug: string
  report_token: string
  created_at: string
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()

  // Build the set of slugs that have nurture copy.
  const nurtureSlugSet = new Set(
    Object.values(LEAD_MAGNETS)
      .filter((m) => m.capture === 'gate' && m.nurture)
      .map((m) => m.slug)
  )

  if (nurtureSlugSet.size === 0) {
    return NextResponse.json({ ok: true, d2Sent: 0, d5Sent: 0, skipped: 0 })
  }

  const now = new Date()

  // d2 window: 2-9 days ago
  const d2Upper = daysAgo(2)
  const d2Lower = daysAgo(9)

  // d5 window: 5-12 days ago
  const d5Upper = daysAgo(5)
  const d5Lower = daysAgo(12)

  // Fetch both candidate pools in one shot: created_at in the union of both
  // windows (9 days ago to 2 days ago is widest possible).
  const { data: leadsData, error: leadsError } = await admin
    .from('leads')
    .select('id, email, name, source_slug, report_token, created_at')
    .is('unsubscribed_at', null)
    .in('source_slug', Array.from(nurtureSlugSet))
    .gte('created_at', d5Lower.toISOString())
    .lte('created_at', d2Upper.toISOString())
    .order('created_at', { ascending: true })
    .limit(1000)

  if (leadsError) {
    console.error('[lead-nurture] leads fetch error', leadsError)
    return NextResponse.json({ error: 'Could not load leads.' }, { status: 500 })
  }

  const leads = (leadsData ?? []) as LeadRow[]
  if (leads.length === 0) {
    return NextResponse.json({ ok: true, d2Sent: 0, d5Sent: 0, skipped: 0, ranAt: now.toISOString() })
  }

  // Batch-check which emails already belong to registered users. We look up
  // auth.users via the admin client's listUsers pagination to build a set of
  // known emails. For small installs, a single page covers everything; for
  // larger installs we do up to 10 pages of 1000 users each.
  const knownUserEmails = new Set<string>()
  try {
    let page = 1
    while (page <= 10) {
      const { data: { users }, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (usersError || !users || users.length === 0) break
      for (const u of users) {
        if (u.email) knownUserEmails.add(u.email.toLowerCase())
      }
      if (users.length < 1000) break
      page += 1
    }
  } catch (err) {
    console.error('[lead-nurture] listUsers error (non-fatal, proceeding)', err)
  }

  // Partition leads into d2 and d5 buckets. A lead can appear in both buckets
  // if it falls inside both windows (edge case: 5-9 days ago). That is fine —
  // the dedupe keys are different so both emails will fire, which is correct.
  const d2Leads: LeadRow[] = []
  const d5Leads: LeadRow[] = []

  for (const lead of leads) {
    const createdAt = new Date(lead.created_at)
    if (knownUserEmails.has(lead.email.toLowerCase())) continue
    if (createdAt >= d2Lower && createdAt <= d2Upper) d2Leads.push(lead)
    if (createdAt >= d5Lower && createdAt <= d5Upper) d5Leads.push(lead)
  }

  let d2Sent = 0
  let d5Sent = 0
  let skipped = 0
  let totalSent = 0

  async function sendNurture(
    lead: LeadRow,
    touch: 'd2' | 'd5'
  ): Promise<boolean> {
    if (totalSent >= SEND_CAP) return false
    const magnet = LEAD_MAGNETS[lead.source_slug]
    if (!magnet?.nurture) return false

    const copy = touch === 'd2' ? magnet.nurture.d2 : magnet.nurture.d5
    if (!copy) return false

    const dedupeKey = `lead_nurture_${touch}:${lead.source_slug}:${lead.email}`

    const unsubscribeUrl = appUrl(`/api/leads/unsubscribe?t=${lead.report_token}`)

    // ctaUrl from config is a path; convert to absolute.
    const ctaUrl = /^https?:\/\//.test(copy.ctaUrl) ? copy.ctaUrl : appUrl(copy.ctaUrl)

    try {
      await sendLeadMagnetUnlockEmail(admin, {
        to: lead.email,
        name: lead.name ?? null,
        sourceSlug: lead.source_slug,
        dedupeKey,
        subject: copy.subject,
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        body: copy.body,
        ctaLabel: copy.ctaLabel,
        ctaUrl,
        valueBullets: copy.valueBullets ?? null,
        unsubscribeUrl,
      })
    } catch (err) {
      console.error('[lead-nurture] send error', {
        touch,
        source_slug: lead.source_slug,
        error: err instanceof Error ? err.message : 'unknown',
      })
      return false
    }

    // Check whether the send actually went through (dedupe may have short-circuited).
    const { data: record } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (record?.status === 'sent') {
      totalSent += 1
      return true
    }

    return false
  }

  for (const lead of d2Leads) {
    if (totalSent >= SEND_CAP) break
    const sent = await sendNurture(lead, 'd2')
    if (sent) {
      d2Sent += 1
    } else {
      skipped += 1
    }
  }

  for (const lead of d5Leads) {
    if (totalSent >= SEND_CAP) break
    const sent = await sendNurture(lead, 'd5')
    if (sent) {
      d5Sent += 1
    } else {
      skipped += 1
    }
  }

  return NextResponse.json({
    ok: true,
    d2Sent,
    d5Sent,
    skipped,
    ranAt: now.toISOString(),
  })
}
