import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationPreferenceKey } from '@/lib/notifications/unsubscribe'

const DEFAULT_PREFS: Record<NotificationPreferenceKey, boolean> = {
  streak_reminder: true,
  weekly_digest: true,
  completion_email: true,
  marketing: false,
  push_enabled: false,
  discussion_reply: true,
  billing_alerts: true,
}

const PREF_KEYS = Object.keys(DEFAULT_PREFS) as NotificationPreferenceKey[]

type PreferenceRow = Record<NotificationPreferenceKey, boolean> & {
  user_id: string
  updated_at: string | null
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

function normalizeRow(row: Partial<PreferenceRow> | null | undefined, userId: string): PreferenceRow {
  return {
    user_id: userId,
    updated_at: row?.updated_at ?? null,
    ...DEFAULT_PREFS,
    ...Object.fromEntries(
      PREF_KEYS.map(key => [key, typeof row?.[key] === 'boolean' ? row[key] : DEFAULT_PREFS[key]])
    ) as Record<NotificationPreferenceKey, boolean>,
  }
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notification_prefs')
    .select('user_id, streak_reminder, weekly_digest, completion_email, marketing, push_enabled, discussion_reply, billing_alerts, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Could not load notification preferences.' }, { status: 500 })

  return NextResponse.json(normalizeRow(data as Partial<PreferenceRow> | null, user.id))
}

export async function PATCH(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

  const updates = Object.fromEntries(
    PREF_KEYS
      .filter(key => typeof body[key] === 'boolean')
      .map(key => [key, body[key]])
  ) as Partial<Record<NotificationPreferenceKey, boolean>>

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No notification preferences to update.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notification_prefs')
    .upsert({
      user_id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('user_id, streak_reminder, weekly_digest, completion_email, marketing, push_enabled, discussion_reply, billing_alerts, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Could not update notification preferences.' }, { status: 500 })

  return NextResponse.json(normalizeRow(data as Partial<PreferenceRow>, user.id))
}
