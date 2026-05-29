import { NextResponse, type NextRequest } from 'next/server'
import {
  verifyUnsubscribeToken,
  type NotificationPreferenceKey,
} from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'

const PREFERENCE_LABELS: Record<NotificationPreferenceKey, string> = {
  streak_reminder: 'Streak reminders',
  weekly_digest: 'Weekly digests',
  completion_email: 'Challenge completion emails',
  marketing: 'Marketing emails',
  push_enabled: 'Push notifications',
  discussion_reply: 'Discussion reply emails',
  billing_alerts: 'Billing alerts',
}

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f3ea;color:#233028;padding:32px;"><main style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d7d2c8;border-radius:18px;padding:24px;"><h1 style="font-size:22px;margin:0 0 12px;">HackProduct</h1><p style="font-size:15px;line-height:1.6;margin:0;">${message}</p></main></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return htmlResponse('This unsubscribe link is invalid.', 400)

  const payload = verifyUnsubscribeToken(token)
  if (!payload) return htmlResponse('This unsubscribe link is invalid or expired.', 400)

  const admin = createAdminClient()
  const { error } = await admin
    .from('notification_prefs')
    .upsert({
      user_id: payload.userId,
      [payload.preference]: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return htmlResponse('We could not update your notification settings.', 500)

  const label = PREFERENCE_LABELS[payload.preference]
  return htmlResponse(`${label} are off. You can turn them back on from notification settings.`)
}
