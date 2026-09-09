import { readAnalyticsProgress } from '@/lib/sandbox/analytics-progress'
// GET /api/claude-code/session/current?challenge_id=...
//
// Read-only "is there a LIVE sandbox for this challenge right now?" probe, used by
// the analytics medium to auto-reconnect on a page refresh WITHOUT showing the
// "Start sandbox" button. Mirrors the active-reconnect path of POST /session/start
// (the liveness probe at start/route.ts) but does NOT create an attempt, create or
// provision a session, or pre-warm the gateway — so a fresh page mount with no
// prior session does zero infra work and the explicit-start cost gate holds.
//
// Returns { session_id, status:'active', wss_url, expires_at } when a live session
// exists, or { status:'none' } otherwise. Both are 200.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { getAnalyticsAccess } from '@/lib/flags/analytics'
import { getSandbox } from '@/lib/sandbox'

export const dynamic = 'force-dynamic'
// Headroom over the single 2.5s awaitReady liveness probe. There is no provision
// wait here (unlike /state), so 8s is plenty.
export const maxDuration = 8

export async function GET(req: NextRequest) {
  // --- Auth ---
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // --- Parse query ---
  const challengeIdRaw = req.nextUrl.searchParams.get('challenge_id')
  if (!challengeIdRaw) {
    return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  // --- Entitlement gate (parity with start/skills; defense in depth) ---
  const access = await getAnalyticsAccess(admin, user.id)
  if (!access.hasAccess) {
    return NextResponse.json({ error: 'Analytics access required' }, { status: 403 })
  }

  // The incoming id may be a number-slug (cca-8001), a text slug, or the raw id.
  // Resolve to the canonical id so the attempt/session lookup keys consistently
  // with how start wrote those rows.
  const identity = await resolveChallengeIdentity(challengeIdRaw, admin)
  const challenge_id = identity?.id ?? challengeIdRaw

  // An explicit attempt_id (when the medium is anchored to one) takes precedence so
  // a refresh reconnects to THAT attempt's session, never a sibling in-progress
  // attempt for the same challenge (e.g. a second tab). Falls back to the most
  // recent in-progress attempt when absent (the common case — the medium owns its
  // lifecycle and usually passes no attempt_id).
  const attemptIdParam = req.nextUrl.searchParams.get('attempt_id') || null

  // --- Resolve the attempt (READ ONLY — never create one) ---
  let attemptId: string | null = null
  if (attemptIdParam) {
    const { data: attempt } = await admin
      .from('challenge_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', attemptIdParam)
      .maybeSingle()
    attemptId = (attempt?.id as string | undefined) ?? null
  } else {
    const { data: attempt } = await admin
      .from('challenge_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge_id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    attemptId = (attempt?.id as string | undefined) ?? null
  }
  if (!attemptId) return NextResponse.json({ status: 'none' })

  // --- Session row for that attempt ---
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, status, wss_url, expires_at, host_instance_id, final_artifact')
    .eq('attempt_id', attemptId)
    .maybeSingle()
  if (!session) return NextResponse.json({ status: 'none' })

  // --- Only an active, non-expired row with a host is a resume candidate. Every
  // other state (provisioning/expired/no host/no wss_url) short-circuits to 'none'
  // BEFORE the probe, so we never pay the 2.5s liveness cost on a cold mount. ---
  const status = session.status as string
  const expiresAt = session.expires_at as string | null
  const hostId = session.host_instance_id as string | null
  const wssUrl = session.wss_url as string | null
  const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false

  if (status !== 'active' || isExpired || !hostId || !wssUrl) {
    return NextResponse.json({ status: 'none' })
  }

  // --- Liveness probe. A session can be `active` in the DB while its container was
  // already reaped/deleted; handing back a dead wss_url makes the client
  // reconnect-loop forever. Verify the revision is actually Ready first. We do NOT
  // retire a stale row here (read-only); the user's next Start click does that via
  // the existing start-route path, and cc-reap is the backstop. ---
  let revisionLive = false
  try {
    revisionLive = await getSandbox().awaitReady(hostId, 2500)
  } catch {
    revisionLive = false
  }
  if (!revisionLive) {
    return NextResponse.json({ status: 'none' })
  }

  // --- Confirmed live → bump last_activity_at so the idle reaper backs off a tab
  // the user just resumed (mirrors state/route.ts). This is the ONLY mutation, and
  // only on a confirmed-live resume. ---
  await admin
    .from('claude_code_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', session.id)

  // --- Per-challenge sub_problems (the guided-arc OVERRIDES) so a resumed session
  // renders the same arc the original start did, not the default. The client can't
  // re-derive these — challenge.metadata isn't on the medium's prop — so we return
  // them here, read the same way start/route.ts does. ---
  // The per-session adaptive arc (final_artifact.adaptive) wins over metadata
  // so a refresh reconstructs the guidance-shaped arc (design §5/§7).
  const adaptive = (session.final_artifact as
    | { adaptive?: { guidance?: string; arc?: unknown[] } }
    | null)?.adaptive
  let subProblems: unknown[] = []
  let arcComplete = false
  if (adaptive?.arc?.length) {
    subProblems = adaptive.arc
    arcComplete = true
  } else {
    const { data: challenge } = await admin
      .from('challenges')
      .select('metadata')
      .eq('id', challenge_id)
      .maybeSingle()
    if (challenge?.metadata) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (challenge.metadata ?? {}) as Record<string, any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const claudeCodeMeta = (meta.claude_code ?? {}) as Record<string, any>
      subProblems = (claudeCodeMeta.sub_problems ?? meta.sub_problems ?? []) as unknown[]
    }
  }

  return NextResponse.json({
    session_id: session.id,
    status: 'active',
    wss_url: wssUrl,
    expires_at: expiresAt,
    sub_problems: subProblems,
    arc_complete: arcComplete,
    guidance: adaptive?.guidance ?? 'guided',
    progress: readAnalyticsProgress(session.final_artifact),
  })
}
