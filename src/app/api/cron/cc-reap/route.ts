// GET /api/cron/cc-reap
//
// Idle reaper for Claude Code Analytics sandboxes. Each active session pins one
// Cloud Run instance (1 vCPU, min=max=1) until its 30-min TTL — so an abandoned
// or idle session holds an instance the whole time, which is the real cap on
// concurrent users. This sweep frees the INSTANCE of any `active` session whose
// last_activity_at is stale, WITHOUT losing work: the workspace autosaves every
// 30s, so the session is set to `idle` (resumable), not `terminated` (finalized).
// A returning user re-provisions a fresh container hydrated from the last
// autosave (see session/start WORKSPACE_RESTORE_URL).
//
// This is the backstop for the closed-tab case; the client idle modal handles
// the polite tab-open case. Auth: CRON_SECRET bearer (matches other crons).

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Reap an active session after this long with no activity. Generous so a user
// who steps away briefly keeps their warm instance (instant reconnect); past it
// the instance is freed and the user resumes from autosave. Override via env.
const IDLE_REAP_SECONDS = parseInt(process.env.CC_IDLE_REAP_SECONDS ?? '900', 10) // 15 min

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - IDLE_REAP_SECONDS * 1000).toISOString()

  // Active sessions whose last activity is older than the idle cutoff. Also
  // catch any past their TTL that the lazy /state flip never ran for.
  const nowIso = new Date().toISOString()
  const { data: stale, error } = await admin
    .from('claude_code_sessions')
    .select('id, host_instance_id, last_activity_at, expires_at')
    .eq('status', 'active')
    .or(`last_activity_at.lt.${cutoff},expires_at.lt.${nowIso}`)
    .limit(200)

  if (error) {
    console.error('[cc-reap] query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sessions = stale ?? []
  const sandbox = getSandbox()
  let reaped = 0
  const failures: string[] = []

  for (const s of sessions) {
    const hostId = s.host_instance_id as string | null
    try {
      if (hostId) {
        // Drops the tag from the service traffic + deletes the revision,
        // releasing the pinned instance. (See destroySession.)
        await sandbox.destroySession(hostId)
      }
      // `idle` = reaped-but-resumable (NOT `terminated`, the finalized end state).
      // The workspace snapshot lives on in cc-sessions for resume.
      await admin
        .from('claude_code_sessions')
        .update({ status: 'idle', ended_at: nowIso })
        .eq('id', s.id as string)
      reaped++
    } catch (err) {
      failures.push(`${s.id}: ${String(err)}`)
    }
  }

  if (failures.length) console.error('[cc-reap] partial failures:', failures)

  return NextResponse.json({
    scanned: sessions.length,
    reaped,
    failures: failures.length,
    idle_cutoff_seconds: IDLE_REAP_SECONDS,
  })
}
