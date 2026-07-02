import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { authEmailSchema, honeypotSchema } from '@/lib/auth/validation'
import { rateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

// Public opt-in for The HackProduct Letter (blog index/post + footer boxes).
// Single opt-in: subscribed immediately, no confirmation email. Upserts on
// email_norm so re-subscribing an existing row keeps its unsubscribe_token
// stable rather than minting a new one.

const RATE_LIMIT_WINDOW_SEC = 60
const RATE_LIMIT_MAX = 5

const subscribeSchema = z.object({
  email: authEmailSchema,
  name: z.string().trim().max(80).optional(),
  source: z.enum(['blog', 'footer']),
  // Honeypot — must stay empty.
  website: honeypotSchema,
})

interface ExistingSubscriberRow {
  id: string
  status: string
}

function ok() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0]?.trim() : 'unknown'

  const throttle = await rateLimit({
    key: `newsletter_subscribe:${ip || 'unknown'}`,
    limit: RATE_LIMIT_MAX,
    windowSec: RATE_LIMIT_WINDOW_SEC,
  })
  if (!throttle.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email.' }, { status: 400 })
  }

  const { email, name, source, website } = parsed.data

  // Silent honeypot success — never tell a bot it failed.
  if (website && website.trim()) {
    return ok()
  }

  const admin = createAdminClient()
  const emailNorm = email // authEmailSchema already lowercases + trims

  const { data: existing, error: lookupError } = await admin
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email_norm', emailNorm)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ ok: false, error: 'Something went wrong. Try again in a moment.' }, { status: 500 })
  }

  const now = new Date().toISOString()

  if (!existing) {
    const { error: insertError } = await admin.from('newsletter_subscribers').insert({
      email,
      email_norm: emailNorm,
      name: name ?? null,
      source,
      status: 'subscribed',
      confirmed_at: now,
    })
    // A unique-violation race (23505) means another request just inserted the
    // same email — treat as success either way, never leak which happened.
    if (insertError && (insertError as { code?: string }).code !== '23505') {
      return NextResponse.json({ ok: false, error: 'Something went wrong. Try again in a moment.' }, { status: 500 })
    }
    return ok()
  }

  const row = existing as ExistingSubscriberRow
  if (row.status === 'unsubscribed') {
    // Resubscribe: keep the same row (and unsubscribe_token) so the existing
    // suppression history stays intact; just flip status back on.
    const { error: updateError } = await admin
      .from('newsletter_subscribers')
      .update({
        status: 'subscribed',
        unsubscribed_at: null,
        confirmed_at: now,
        ...(name ? { name } : {}),
      })
      .eq('id', row.id)
    if (updateError) {
      return NextResponse.json({ ok: false, error: 'Something went wrong. Try again in a moment.' }, { status: 500 })
    }
    return ok()
  }

  // Already subscribed (or bounced/complained — leave those alone rather
  // than silently re-enrolling a suppressed address). Idempotent either way.
  return ok()
}
