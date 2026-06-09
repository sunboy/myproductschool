import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { authEmailSchema, honeypotSchema } from '@/lib/auth/validation'
import { getLeadMagnet } from '@/lib/lead-magnets/config'
import { sendLeadMagnetUnlockEmail } from '@/lib/email/transactional'
import { captureServerImmediate } from '@/lib/posthog/server'
import { EVENT_MAGNET_LEAD_CAPTURED } from '@/lib/posthog/events'

// Lead capture for the /go/* paid-social landing pages. Mirrors the waitlist
// route (admin client, IS_MOCK short-circuit, 23505 -> 409) and adds:
//  - source_slug routing (which magnet earned the lead)
//  - magnet_result jsonb (the computed surface result + utm, for personalised
//    unlock emails and per-magnet segmentation)
//  - honeypot spam defence
//  - fire-and-forget unlock email (gate magnets only)
//  - upsert on retake (same email + same magnet updates magnet_result)
//  - tokenized report URL in the response when magnet.hasReport is true

const leadSchema = z.object({
  email: authEmailSchema,
  name: z.string().trim().max(80).optional(),
  source_slug: z.string().trim().min(1).max(64),
  // The computed surface result + utm. Bounded so a bad client cannot store
  // arbitrarily large blobs.
  magnet_result: z.record(z.string(), z.unknown()).optional(),
  // Honeypot — must stay empty. Reuses the auth honeypot schema shape.
  website: honeypotSchema,
})

function absoluteUrl(req: NextRequest, path: string) {
  if (/^https?:\/\//.test(path)) return path
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    'https://hackproduct.com'
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email, name, source_slug, magnet_result, website } = parsed.data

  // Silent honeypot success — never tell a bot it failed.
  if (website && website.trim()) {
    return NextResponse.json({ success: true })
  }

  const magnet = getLeadMagnet(source_slug)
  if (!magnet) {
    return NextResponse.json({ error: 'Unknown source' }, { status: 400 })
  }

  if (IS_MOCK) {
    return NextResponse.json({ success: true, alreadyCaptured: false, reportUrl: null })
  }

  const supabase = createAdminClient()

  // Pre-check: does a row already exist for this (email, source_slug)? This is
  // the reliable retake signal — comparing created_at vs updated_at can race on
  // the same-millisecond initial insert.
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('email', email)
    .eq('source_slug', source_slug)
    .maybeSingle()

  const alreadyCaptured = !!existing

  const row: {
    email: string
    source_slug: string
    name?: string
    magnet_result?: Record<string, unknown>
    updated_at: string
  } = { email, source_slug, updated_at: new Date().toISOString() }
  if (name) row.name = name
  if (magnet_result) row.magnet_result = magnet_result

  const { data: upserted, error } = await supabase
    .from('leads')
    .upsert(row, { onConflict: 'email,source_slug' })
    .select('id, report_token, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  const reportToken = upserted?.report_token as string | null
  const reportUrl =
    magnet.hasReport && reportToken
      ? absoluteUrl(req, `/go/${source_slug}/r/${reportToken}`)
      : null

  // Fire-and-forget unlock email for new gate captures only (skip retakes to
  // avoid re-sending). The email_dedupes table is a secondary guard.
  if (!alreadyCaptured && magnet.capture === 'gate' && magnet.unlockEmail) {
    const copy = magnet.unlockEmail
    // When the magnet has a personal report, the email CTA links it directly.
    const ctaUrl = reportUrl ?? absoluteUrl(req, copy.ctaUrl)
    void sendLeadMagnetUnlockEmail(supabase, {
      to: email,
      name: name ?? null,
      sourceSlug: source_slug,
      dedupeKey: `lead_magnet_unlock:${source_slug}:${email}`,
      subject: copy.subject,
      eyebrow: copy.eyebrow,
      heading: copy.heading,
      body: copy.body,
      ctaLabel: copy.ctaLabel,
      ctaUrl,
      valueBullets: copy.valueBullets ?? null,
    }).catch((err) => {
      console.error('[leads] unlock email failed', {
        source_slug,
        error: err instanceof Error ? err.message : 'unknown',
      })
    })
  }

  // Server-side PostHog analytics — fire-and-forget, never breaks the response.
  const utm = magnet_result && typeof magnet_result.utm === 'object' && magnet_result.utm !== null
    ? magnet_result.utm as Record<string, string>
    : {}

  void captureServerImmediate({
    distinctId: upserted?.id ?? email,
    event: EVENT_MAGNET_LEAD_CAPTURED,
    properties: {
      source_slug,
      already_captured: alreadyCaptured,
      band: typeof magnet_result?.band === 'string' ? magnet_result.band : undefined,
      ...(utm.utm_source ? { utm_source: utm.utm_source } : {}),
      ...(utm.utm_campaign ? { utm_campaign: utm.utm_campaign } : {}),
      ...(utm.utm_content ? { utm_content: utm.utm_content } : {}),
    },
  }).catch(() => {
    // Analytics failure must never break the response — already guarded in
    // captureServerImmediate, but belt-and-suspenders here too.
  })

  return NextResponse.json({ success: true, alreadyCaptured, reportUrl })
}
