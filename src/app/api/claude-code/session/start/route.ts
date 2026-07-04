// POST /api/claude-code/session/start
//
// Provisions (or reconnects to) a Claude Code Analytics sandbox session.
// Returns { session_id, wss_url, expires_at, sub_problems } on success.
//
// Auth: user cookie via createClient (RLS). Writes via createAdminClient
// (claude_code_sessions has service-role-only write policy).

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { getAnalyticsAccess } from '@/lib/flags/analytics'
import { checkUsageLimit } from '@/lib/usage/check-limit'
import { warmGateway, isGatewayConfigured } from '@/lib/sandbox/llm-gateway'
import { ensureSqlRunnable, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'
import { getSandbox } from '@/lib/sandbox'
import { randomUUID } from 'crypto'
import { loadGuidanceInputs, deriveGuidanceLevel, type GuidanceLevel } from '@/lib/adaptive/guidance'
import { mergeArc } from '@/components/v2/mediums/analyticsArc'
import type { AnalyticsSubProblem } from '@/components/v2/mediums/types'

export const dynamic = 'force-dynamic'
// This route is now thin (gates + create a provisioning row) and returns fast.
// The heavy lifting runs in `session/[id]/provision`, which the client calls next
// and then polls `session/[id]/state` for progress.
export const maxDuration = 15

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const BodySchema = z.object({
  // Challenge id may be a text slug, not a UUID — use min(1), never .uuid()
  challenge_id: z.string().min(1),
  attempt_id: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // --- Auth ---
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // --- Parse body ---
  let body: z.infer<typeof BodySchema>
  try {
    const raw = await req.json()
    body = BodySchema.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // The incoming id may be a number-slug (cca-8001), a text slug, or the raw id.
  // Resolve it to the canonical challenge id so attempts/sessions key consistently.
  const identity = await resolveChallengeIdentity(body.challenge_id, createAdminClient())
  const challenge_id = identity?.id ?? body.challenge_id

  // --- Load challenge (RLS: user can read any published challenge) ---
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, challenge_type, metadata, difficulty')
    .eq('id', challenge_id)
    .single()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }
  if (challenge.challenge_type !== 'claude_code_analytics') {
    return NextResponse.json(
      { error: 'Challenge is not a Claude Code Analytics challenge' },
      { status: 400 },
    )
  }

  // --- Read challenge metadata (only sub_problems are needed here; the env/
  // dataset fields are resolved by the provision route) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (challenge.metadata ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claudeCodeMeta = (meta.claude_code ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subProblems: unknown[] = (claudeCodeMeta.sub_problems ?? meta.sub_problems ?? []) as any[]

  // --- Load user plan for the usage gate ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  const userPlan = (profile?.plan as string) ?? 'free'

  const admin = createAdminClient()

  // --- Entitlement gate (the special analytics tier) ---
  // The feature ships dark behind NEXT_PUBLIC_CC_ANALYTICS_ENABLED. Access needs
  // either the per-user allowlist (beta) or an active analytics-tier subscription.
  // Holds even if a URL is hand-crafted while the feature is hidden.
  const access = await getAnalyticsAccess(admin, user.id)
  if (!access.hasAccess) {
    return NextResponse.json(
      {
        error: 'analytics_locked',
        feature: 'claude_code_analytics',
        upgrade_url: '/pricing?tier=analytics',
      },
      { status: 402 },
    )
  }

  // --- Usage gate (analytics session cap for the tier) ---
  // Free users get a small quota (set in plan_limits) then hit the unified
  // PaywallModal. `reason: 'paywall'` + the analytics upgrade target tell the
  // client to open that modal rather than show a generic error.
  const usageResult = await checkUsageLimit(user.id, 'claude_code_sessions', userPlan)
  if (!usageResult.allowed) {
    return NextResponse.json(
      {
        error: 'Usage limit reached',
        reason: 'paywall',
        upgrade_url: '/pricing?tier=analytics',
        feature: 'claude_code_sessions',
        used: usageResult.used,
        limit: usageResult.limit,
      },
      { status: 402 },
    )
  }

  // --- Find or create challenge_attempts row ---
  let attemptId: string = body.attempt_id ?? ''
  if (!attemptId) {
    // Look for an in-progress attempt for this user+challenge first.
    const { data: existing } = await admin
      .from('challenge_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challenge_id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      attemptId = existing.id as string
    } else {
      // Create new attempt
      const { data: newAttempt, error: attemptErr } = await admin
        .from('challenge_attempts')
        .insert({
          user_id: user.id,
          challenge_id,
          status: 'in_progress',
        })
        .select('id')
        .single()

      if (attemptErr || !newAttempt) {
        console.error('[cc/session/start] Failed to create attempt:', attemptErr)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }
      attemptId = newAttempt.id as string
    }
  }

  // --- Idempotency: check for an active/provisioning session on this attempt ---
  const { data: existingSession } = await admin
    .from('claude_code_sessions')
    .select('id, status, wss_url, expires_at, transcript_uri, host_instance_id, final_artifact')
    .eq('attempt_id', attemptId)
    .maybeSingle()

  // The adaptive arc persisted on a live session (final_artifact.adaptive) is
  // authoritative for reconnects — rebuilding from metadata would lose the
  // guidance-shaped or branched steps (design §5/§7, Codex finding 1).
  const persistedAdaptive = (existingSession?.final_artifact as
    | { adaptive?: { guidance?: GuidanceLevel; arc?: AnalyticsSubProblem[] } }
    | null)?.adaptive

  // Latest workspace autosave to restore on RESUME. When a prior session for this
  // attempt was reaped (status 'idle') or expired, its transcript_uri points at
  // the newest /workspace tarball — we rehydrate a fresh container from it so the
  // user does NOT start over. (active/provisioning reconnects below skip this.)
  let resumeSnapshotUri: string | null = null

  if (existingSession) {
    const sid = existingSession.id as string
    const status = existingSession.status as string
    const expiresAt = existingSession.expires_at as string | null

    const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false

    if (!isExpired && status === 'active') {
      // Reconnect ONLY if the underlying revision still exists. A session can be
      // `active` in the DB while its container was already reaped (idle TTL) or
      // deleted — handing back that dead wss_url makes the client reconnect-loop
      // forever ("Connecting to sandbox…"). Verify liveness first; if the revision
      // is gone, fall through to re-provision (carrying the workspace forward).
      const hostId = existingSession.host_instance_id as string | null
      let revisionLive = false
      if (hostId) {
        try {
          revisionLive = await getSandbox().awaitReady(hostId, 2500)
        } catch {
          revisionLive = false
        }
      }
      if (revisionLive) {
        return NextResponse.json({
          session_id: sid,
          status: 'active',
          wss_url: existingSession.wss_url,
          expires_at: expiresAt,
          sub_problems: persistedAdaptive?.arc?.length ? persistedAdaptive.arc : subProblems,
          arc_complete: Boolean(persistedAdaptive?.arc?.length),
          guidance: persistedAdaptive?.guidance ?? 'guided',
        })
      }
      // Stale active row (container reaped) — retire it and re-provision below.
      await admin
        .from('claude_code_sessions')
        .update({ status: 'terminated', ended_at: new Date().toISOString() })
        .eq('id', sid)
      resumeSnapshotUri = (existingSession.transcript_uri as string | null) ?? null
    } else if (!isExpired && status === 'provisioning') {
      // A provision is already in flight (or was interrupted). Hand the client
      // the same row so it polls/continues rather than starting a second one.
      return NextResponse.json({
        session_id: sid,
        status: 'provisioning',
        wss_url: null,
        expires_at: expiresAt,
        sub_problems: persistedAdaptive?.arc?.length ? persistedAdaptive.arc : subProblems,
        arc_complete: Boolean(persistedAdaptive?.arc?.length),
        guidance: persistedAdaptive?.guidance ?? 'guided',
      })
    } else {
      // Reaped/expired/terminated prior session: carry its workspace forward.
      resumeSnapshotUri = (existingSession.transcript_uri as string | null) ?? null
    }
  }

  // --- Insert provisioning row (upsert on attempt_id) ---
  // The heavy lifting (SQL wake, key mint, revision boot, readiness) runs in the
  // separate `session/[id]/provision` route — it cannot fit in this route's 60s
  // Hobby ceiling on a cold start. We persist `transcript_uri` so that route can
  // presign the resume snapshot. Return immediately with `status: 'provisioning'`
  // so the client shows real progress while it calls provision + polls state.
  const sessionId = randomUUID()

  // --- Compute the per-learner arc (adaptive B1) ---
  // Guidance comes from a deliberately lightweight loader (three narrow reads,
  // never getHatchContext's 12-query fanout — this route stays thin). Any
  // failure falls back to 'guided', which is exactly today's behavior.
  let guidance: GuidanceLevel = 'guided'
  try {
    guidance = deriveGuidanceLevel(await loadGuidanceInputs(admin, user.id))
  } catch (err) {
    console.error('[cc/session/start] guidance derivation failed, using guided:', err)
  }
  const arc = mergeArc(
    (challenge as { difficulty?: string | null }).difficulty,
    subProblems as Partial<AnalyticsSubProblem>[],
    guidance,
  )

  const { error: upsertErr } = await admin.from('claude_code_sessions').upsert(
    {
      id: sessionId,
      attempt_id: attemptId,
      user_id: user.id,
      challenge_id,
      status: 'provisioning',
      // Persist the guidance-shaped arc so reconnect paths (this route's early
      // returns, `current`, `state`) return the SAME arc after a refresh.
      // Spread the prior artifact first: this upsert REPLACES a reaped row for
      // the same attempt_id, and a previously graded artifact must survive.
      final_artifact: {
        ...((existingSession?.final_artifact as Record<string, unknown> | null) ?? {}),
        adaptive: { guidance, arc, source: 'start', decided_at: new Date().toISOString() },
      },
      // Carry the prior workspace forward so provision can presign + restore it.
      transcript_uri: resumeSnapshotUri,
      // CRITICAL: this upsert REPLACES a prior reaped/terminated row for the same
      // attempt_id (onConflict). The prior row carries a stale host_instance_id +
      // wss_url pointing at a revision that's gone. If we don't null them, the
      // provision route's idempotency guard (status==='provisioning' && host &&
      // wss_url) short-circuits and hands the client the DEAD revision/token →
      // "Connecting…" forever against a 404 host. Reset them so provision runs
      // fresh and derives a new revision + token from this new sessionId.
      host_instance_id: null,
      wss_url: null,
      ended_at: null,
    },
    { onConflict: 'attempt_id', ignoreDuplicates: false },
  )

  if (upsertErr) {
    console.error('[cc/session/start] Failed to upsert session:', upsertErr)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // --- Pre-warm the slow cold-start dependencies in PARALLEL, fire-and-forget,
  // so they boot while the client is rendering the workspace and before it calls
  // provision. On a cold path the gateway (minScale=0) + its Cloud SQL otherwise
  // boot SERIALLY inside provision (SQL wake ~40s THEN gateway cold mint ~40s),
  // blowing past Hobby's 60s. Kicking both off here overlaps them with the user's
  // read time so provision finds them warm. Both swallow their own errors. ---
  if (isGatewayConfigured()) {
    void warmGateway()
    if (isSqlAutostartConfigured()) {
      void ensureSqlRunnable(40_000).catch(() => {})
    }
  }

  return NextResponse.json({
    session_id: sessionId,
    status: 'provisioning',
    wss_url: null,
    expires_at: null,
    sub_problems: arc,
    arc_complete: true,
    guidance,
  })
}
