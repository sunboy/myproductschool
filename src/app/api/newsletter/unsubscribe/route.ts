import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-click unsubscribe for The HackProduct Letter. Token = newsletter_subscribers.unsubscribe_token
// (a uuid, not the HMAC scheme used by /api/notifications/unsubscribe — this
// audience includes leads/footer subscribers who never had a userId to sign
// against). Flips the subscriber row, then best-effort mirrors the opt-out
// into notification_prefs.marketing (when the row has a user_id) and
// leads.unsubscribed_at (matched by email) so suppression is consistent
// across all three surfaces without ever un-suppressing anyone.

interface SubscriberRow {
  id: string
  email: string
  email_norm: string
  user_id: string | null
  status: string
}

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f3ea;color:#233028;padding:32px;"><main style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d7d2c8;border-radius:18px;padding:24px;"><h1 style="font-size:22px;margin:0 0 12px;">The HackProduct Letter</h1><p style="font-size:15px;line-height:1.6;margin:0;">${message}</p></main></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

const GENERIC_INVALID_MESSAGE = "You're unsubscribed (or already were). You won't get any more issues of The HackProduct Letter."

async function unsubscribe(token: string) {
  const admin = createAdminClient()

  const { data: subscriber, error } = await admin
    .from('newsletter_subscribers')
    .select('id, email, email_norm, user_id, status')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  // Never leak whether a token is valid — invalid/missing tokens get the
  // same friendly confirmation copy as a successful unsubscribe.
  if (error || !subscriber) {
    return htmlResponse(GENERIC_INVALID_MESSAGE)
  }

  const row = subscriber as SubscriberRow
  const now = new Date().toISOString()

  if (row.status !== 'unsubscribed') {
    await admin
      .from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: now })
      .eq('id', row.id)
  }

  // Best-effort: mirror into notification_prefs.marketing when this
  // subscriber is a real user. Failures here must never block the
  // unsubscribe confirmation.
  if (row.user_id) {
    await admin
      .from('notification_prefs')
      .upsert(
        { user_id: row.user_id, marketing: false, updated_at: now },
        { onConflict: 'user_id' }
      )
      .then(null, () => null)
  }

  // Best-effort: mirror into leads.unsubscribed_at matched by email
  // (case-insensitive — leads.email has no normalized column), so the
  // lead-nurture cron also stops emailing this address.
  await admin
    .from('leads')
    .update({ unsubscribed_at: now })
    .ilike('email', row.email_norm)
    .then(null, () => null)

  return htmlResponse("You're unsubscribed. You won't get any more issues of The HackProduct Letter.")
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  if (!token) return htmlResponse(GENERIC_INVALID_MESSAGE)

  return unsubscribe(token)
}
