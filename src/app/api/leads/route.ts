import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { authEmailSchema, honeypotSchema } from '@/lib/auth/validation'
import { getLeadMagnet } from '@/lib/lead-magnets/config'
import { sendLeadMagnetUnlockEmail } from '@/lib/email/transactional'

// Lead capture for the /go/* paid-social landing pages. Mirrors the waitlist
// route (admin client, IS_MOCK short-circuit, 23505 -> 409) and adds:
//  - source_slug routing (which magnet earned the lead)
//  - magnet_result jsonb (the computed surface result + utm, for personalised
//    unlock emails and per-magnet segmentation)
//  - honeypot spam defence
//  - fire-and-forget unlock email (gate magnets only)

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
    return NextResponse.json({ success: true })
  }

  const supabase = createAdminClient()
  const row: {
    email: string
    source_slug: string
    name?: string
    magnet_result?: Record<string, unknown>
  } = { email, source_slug }
  if (name) row.name = name
  if (magnet_result) row.magnet_result = magnet_result

  const { error } = await supabase.from('leads').insert(row)

  // Duplicate (same email + same magnet) is a friendly success, not a hard
  // error — the visitor already has the result; just re-send is unnecessary.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  const alreadyCaptured = error?.code === '23505'

  // Fire-and-forget unlock email for gate magnets (skip on duplicate to avoid
  // re-sending). Never block the HTTP response on email delivery.
  if (!alreadyCaptured && magnet.capture === 'gate' && magnet.unlockEmail) {
    const copy = magnet.unlockEmail
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
      ctaUrl: absoluteUrl(req, copy.ctaUrl),
      valueBullets: copy.valueBullets ?? null,
    }).catch((err) => {
      console.error('[leads] unlock email failed', {
        source_slug,
        error: err instanceof Error ? err.message : 'unknown',
      })
    })
  }

  return NextResponse.json({ success: true, alreadyCaptured })
}
