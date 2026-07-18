import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-helpers'
import { createClient } from '@/lib/supabase/server'
import { getResendClient, configuredReplyTo } from '@/lib/email/client'
import { renderEmailForPreview, type TransactionalEmailKind } from '@/lib/email/send-core'
import { renderNewsletterEmail } from '@/lib/email/newsletter'
import { EMAIL_SAMPLES, NEWSLETTER_SAMPLE, SAMPLE_FROM } from '@/lib/email/samples'

/**
 * Test-send endpoint for the /admin/emails preview harness. Sends the sample
 * payload for a given kind to the signed-in admin's own email. Never writes to
 * email_dedupes and never passes an idempotencyKey — these sends must be
 * repeatable on every click.
 */
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({})) as { kind?: string }
  const kind = body.kind

  if (!kind) {
    return NextResponse.json({ error: 'kind is required' }, { status: 400 })
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const to = authUser?.email
  if (!to) {
    return NextResponse.json({ error: 'Signed-in admin has no email on file' }, { status: 400 })
  }

  try {
    if (kind === 'newsletter') {
      const { html, text } = renderNewsletterEmail(NEWSLETTER_SAMPLE)
      const { data, error: sendError } = await resend.emails.send({
        from: process.env.RESEND_NEWSLETTER_FROM?.trim() || 'Hatch (HackProduct) <founders@hackproduct.com>',
        to,
        replyTo: configuredReplyTo(),
        subject: `[TEST] ${NEWSLETTER_SAMPLE.title}`,
        html,
        text,
      })
      if (sendError) return NextResponse.json({ error: sendError.message ?? 'Resend error' }, { status: 500 })
      return NextResponse.json({ id: data?.id ?? null })
    }

    const sample = EMAIL_SAMPLES[kind as TransactionalEmailKind]
    if (!sample) {
      return NextResponse.json({ error: `Unknown email kind: ${kind}` }, { status: 400 })
    }

    const { html, text } = renderEmailForPreview(sample)
    const from = SAMPLE_FROM[kind as TransactionalEmailKind] ?? sample.from

    const { data, error: sendError } = await resend.emails.send({
      from: from ?? 'HackProduct <billing@hackproduct.com>',
      to,
      replyTo: configuredReplyTo(),
      subject: `[TEST] ${sample.subject}`,
      html,
      text,
    })

    if (sendError) return NextResponse.json({ error: sendError.message ?? 'Resend error' }, { status: 500 })
    return NextResponse.json({ id: data?.id ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send test email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
