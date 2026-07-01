import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Sweeps sessions and attempts that were started and abandoned but never marked
// terminal, so they stop accumulating as 'active'/'in_progress' forever. Two
// completion triggers (chat closing detection, SSE done) can miss, and users
// close the tab without a beforeunload firing, so without this reaper the tables
// fill with fake-live rows that pollute analytics and block the resume-nudge
// audience. Runs from daily-maintenance.
//
// Thresholds are conservative on purpose: all currently-stuck rows are >1 day old,
// so a 6h interview / 24h attempt cutoff cannot touch a genuinely live session.
const INTERVIEW_STALE_HOURS = 6
const ATTEMPT_STALE_HOURS = 24

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
  const now = Date.now()
  const interviewCutoff = new Date(now - INTERVIEW_STALE_HOURS * 3600_000).toISOString()
  const attemptCutoff = new Date(now - ATTEMPT_STALE_HOURS * 3600_000).toISOString()

  // Interviews: candidates are active/paused sessions created before the cutoff.
  // We then spare any that had a turn after the cutoff so a long-but-live session
  // is never reaped. Turn activity is the truest liveness signal we have.
  const { data: candidates, error: candErr } = await admin
    .from('live_interview_sessions')
    .select('id')
    .in('status', ['active', 'paused'])
    .lt('created_at', interviewCutoff)

  let interviewsReaped = 0
  const interviewErrors: string[] = []

  if (candErr) {
    interviewErrors.push(`select: ${candErr.message}`)
  } else if (candidates && candidates.length > 0) {
    const ids = candidates.map((row) => row.id)

    const { data: recentTurns, error: turnsErr } = await admin
      .from('live_interview_turns')
      .select('session_id')
      .in('session_id', ids)
      .gt('created_at', interviewCutoff)

    if (turnsErr) {
      interviewErrors.push(`turns: ${turnsErr.message}`)
    } else {
      const stillLive = new Set((recentTurns ?? []).map((t) => t.session_id))
      const staleIds = ids.filter((id) => !stillLive.has(id))

      if (staleIds.length > 0) {
        const { error: updErr, count } = await admin
          .from('live_interview_sessions')
          .update({ status: 'abandoned', ended_at: new Date().toISOString() }, { count: 'exact' })
          .in('id', staleIds)
          .in('status', ['active', 'paused'])

        if (updErr) interviewErrors.push(`update: ${updErr.message}`)
        else interviewsReaped = count ?? staleIds.length
      }
    }
  }

  // Attempts: in_progress rows whose last touch (draft edit, start, create) is
  // older than the cutoff. draft_updated_at is the freshest activity marker; fall
  // back to started_at / created_at via the filter below.
  const { error: attemptErr, count: attemptsReaped } = await admin
    .from('challenge_attempts')
    .update({ status: 'abandoned' }, { count: 'exact' })
    .eq('status', 'in_progress')
    .lt('started_at', attemptCutoff)
    .or(`draft_updated_at.is.null,draft_updated_at.lt.${attemptCutoff}`)

  const attemptErrors = attemptErr ? [attemptErr.message] : []

  const ok = interviewErrors.length === 0 && attemptErrors.length === 0
  return NextResponse.json(
    {
      ok,
      interviewsReaped,
      attemptsReaped: attemptsReaped ?? 0,
      ...(interviewErrors.length ? { interviewErrors } : {}),
      ...(attemptErrors.length ? { attemptErrors } : {}),
    },
    { status: ok ? 200 : 500 },
  )
}
