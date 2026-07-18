import { NextResponse, type NextRequest } from 'next/server'
import { sendStreakReminderEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'

type StreakCandidate = {
  id: string
  display_name: string | null
  streak_days: number | null
}

type NotificationPrefRow = {
  user_id: string
  streak_reminder: boolean | null
}

type UserStreakRow = {
  user_id: string
}

type NotificationLogRow = {
  dedupe_key: string
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

/** XP multiplier formula from CLAUDE.md: min(1 + streakDays*0.05, 1.5), rounded to 2dp. */
function streakMultiplier(streakDays: number) {
  const multiplier = Math.min(1 + streakDays * 0.05, 1.5)
  return Math.round(multiplier * 100) / 100
}

/**
 * Next midnight PT (America/Los_Angeles) as an ISO timestamp, used as the
 * streak-reset deadline. We derive it from the wall-clock date components in
 * the LA timezone (via Intl) rather than hardcoding a UTC offset, since PT is
 * UTC-8 (PST) or UTC-7 (PDT) depending on daylight saving. Approach: read
 * today's Y/M/D as seen in Los Angeles, then find the UTC instant for
 * midnight of (that day + 1) in the same timezone by walking forward from a
 * UTC guess and correcting for the observed offset.
 */
function nextMidnightPacificIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const year = get('year')
  const month = get('month')
  const day = get('day')

  // Midnight tomorrow in LA, expressed as a naive UTC guess first.
  const naiveUtcGuess = Date.UTC(year, month - 1, day + 1, 0, 0, 0)

  // Find the actual UTC offset LA observes at that guessed instant, then
  // correct: the wall-clock "00:00 LA" instant is naiveUtcGuess - offset.
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset',
  })
  const offsetPart = offsetFormatter.formatToParts(new Date(naiveUtcGuess)).find(p => p.type === 'timeZoneName')
  const offsetMatch = offsetPart?.value.match(/GMT([+-]\d+)/)
  const offsetHours = offsetMatch ? Number(offsetMatch[1]) : -8

  const realUtcMs = naiveUtcGuess - offsetHours * 60 * 60 * 1000
  return new Date(realUtcMs).toISOString()
}

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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const admin = createAdminClient()
  const today = todayIsoDate()

  const { data: candidates, error: candidatesError } = await admin
    .from('profiles')
    .select('id, display_name, streak_days')
    .gte('streak_days', 2)
    .limit(500)

  if (candidatesError) {
    return NextResponse.json({ error: 'Could not load streak candidates.' }, { status: 500 })
  }

  const rows = (candidates ?? []) as StreakCandidate[]
  const userIds = rows.map(row => row.id)
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, attempted: 0, sent: 0, skipped: 0 })
  }

  const dedupeKeys = userIds.map(userId => `streak_reminder:${today}:${userId}`)
  const [prefsResult, streaksResult, logsResult] = await Promise.all([
    admin
      .from('notification_prefs')
      .select('user_id, streak_reminder')
      .in('user_id', userIds),
    admin
      .from('user_streaks')
      .select('user_id')
      .eq('date', today)
      .in('user_id', userIds),
    admin
      .from('notification_log')
      .select('dedupe_key')
      .eq('kind', 'streak_reminder')
      .in('dedupe_key', dedupeKeys),
  ])

  if (prefsResult.error || streaksResult.error || logsResult.error) {
    return NextResponse.json({ error: 'Could not load notification state.' }, { status: 500 })
  }

  const prefs = new Map(
    ((prefsResult.data ?? []) as NotificationPrefRow[]).map(row => [row.user_id, row.streak_reminder])
  )
  const completedToday = new Set(((streaksResult.data ?? []) as UserStreakRow[]).map(row => row.user_id))
  const alreadyLogged = new Set(((logsResult.data ?? []) as NotificationLogRow[]).map(row => row.dedupe_key))

  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const row of rows) {
    const dedupeKey = `streak_reminder:${today}:${row.id}`
    if (completedToday.has(row.id) || prefs.get(row.id) === false || alreadyLogged.has(dedupeKey)) {
      skipped += 1
      continue
    }

    attempted += 1
    const token = createUnsubscribeToken({ userId: row.id, preference: 'streak_reminder' })
    const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null

    const streakDays = row.streak_days ?? 0
    await sendStreakReminderEmail(admin, {
      dedupeKey,
      userId: row.id,
      name: row.display_name,
      streakDays,
      url: appUrl(request, '/challenges'),
      unsubscribeUrl,
      multiplier: streakMultiplier(streakDays),
      resetAtIso: nextMidnightPacificIso(),
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') {
      await admin.from('notification_log').upsert({
        user_id: row.id,
        kind: 'streak_reminder',
        channel: 'email',
        dedupe_key: dedupeKey,
        metadata: { streak_days: row.streak_days ?? 0 },
        sent_at: new Date().toISOString(),
      }, { onConflict: 'dedupe_key' })
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, attempted, sent, skipped })
}
