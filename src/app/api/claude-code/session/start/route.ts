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
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'
import { getSandbox } from '@/lib/sandbox'
import type { SessionEnv } from '@/lib/sandbox/types'
import { mintSnapshotToken } from '@/lib/sandbox/snapshot-token'
import { mintSessionVirtualKey, isGatewayConfigured } from '@/lib/sandbox/llm-gateway'
import { ensureSqlRunnable, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
// Provisioning = create a tagged revision + tag-route propagation + cold container
// boot, then poll /health. A cold deploy can exceed 25s, so give the whole route
// room (60s, the platform max) with the readiness poll set just under it.
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const BodySchema = z.object({
  // Challenge id may be a text slug, not a UUID — use min(1), never .uuid()
  challenge_id: z.string().min(1),
  attempt_id: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Readiness deadline
// ---------------------------------------------------------------------------

// Readiness is now the REVISION Ready condition (see sandbox.awaitReady), which
// flips in ~5s — NOT the tagged HTTP route (whose propagation lag caused 503s).
// Keep a generous ceiling under the route's maxDuration (60s); a healthy revision
// resolves well within it. Override via CC_READINESS_DEADLINE_MS.
const READINESS_DEADLINE_MS = parseInt(process.env.CC_READINESS_DEADLINE_MS ?? '45000', 10)

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
    .select('id, challenge_type, metadata')
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

  // --- Read challenge metadata ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (challenge.metadata ?? {}) as Record<string, any>
  // Dataset + sub-problems may live nested under metadata.claude_code OR at the
  // metadata root, depending on how the challenge was seeded. Read both shapes.
  const claudeCodeMeta = (meta.claude_code ?? {}) as Record<string, any>
  const bqProject =
    claudeCodeMeta.dataset_project ?? claudeCodeMeta.BQ_PROJECT ??
    meta.dataset_project ?? meta.BQ_PROJECT ??
    process.env.GCP_PROJECT ?? ''
  const bqDataset =
    claudeCodeMeta.dataset_id ?? claudeCodeMeta.BQ_DATASET ??
    meta.dataset_id ?? meta.BQ_DATASET ?? ''
  // Where query jobs bill. For a public dataset (bqProject=bigquery-public-data)
  // this stays our own project so our SA can run the job. Defaults to GCP_PROJECT.
  const bqBillingProject =
    claudeCodeMeta.dataset_billing_project ?? meta.dataset_billing_project ??
    process.env.GCP_PROJECT ?? 'hackproduct'
  const claudeMd = claudeCodeMeta.claude_md ?? meta.claude_md ?? ''
  const ttlSeconds = parseInt(process.env.CC_SESSION_TTL_SECONDS ?? '1800', 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subProblems: unknown[] = (claudeCodeMeta.sub_problems ?? meta.sub_problems ?? []) as any[]

  // --- Load user plan for usage gate + prior Claude Code state pointer ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, cc_claude_state_uri')
    .eq('id', user.id)
    .single()
  const userPlan = (profile?.plan as string) ?? 'free'
  const priorClaudeStateUri = (profile?.cc_claude_state_uri as string | null) ?? null

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
  const usageResult = await checkUsageLimit(user.id, 'claude_code_sessions', userPlan)
  if (!usageResult.allowed) {
    return NextResponse.json(
      {
        error: 'Usage limit reached',
        upgrade_url: '/pricing',
        used: usageResult.used,
        limit: usageResult.limit,
        feature: 'claude_code_sessions',
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
    .select('id, status, wss_url, expires_at, transcript_uri')
    .eq('attempt_id', attemptId)
    .maybeSingle()

  // Latest workspace autosave to restore on RESUME. When a prior session for this
  // attempt was reaped (status 'idle') or expired, its transcript_uri points at
  // the newest /workspace tarball — we rehydrate a fresh container from it so the
  // user does NOT start over. (active/provisioning reconnects below skip this.)
  let resumeSnapshotUri: string | null = null

  if (existingSession) {
    const sessionId = existingSession.id as string
    const status = existingSession.status as string
    const expiresAt = existingSession.expires_at as string | null

    const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false

    if (!isExpired && (status === 'active' || status === 'provisioning')) {
      // Reconnect — return the existing session
      return NextResponse.json({
        session_id: sessionId,
        wss_url: existingSession.wss_url,
        expires_at: expiresAt,
        sub_problems: subProblems,
      })
    }

    // Reaped/expired/terminated prior session: carry its workspace forward.
    resumeSnapshotUri = (existingSession.transcript_uri as string | null) ?? null
  }

  // --- Insert provisioning row (upsert on attempt_id) ---
  const sessionId = randomUUID()
  const snapshotToken = mintSnapshotToken(
    sessionId,
    process.env.SESSION_TOKEN_SECRET ?? '',
  )

  // Resolve the absolute orchestrator URL for the snapshot callback.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  const orchestratorSnapshotUrl = `${baseUrl}/api/claude-code/session/${sessionId}/snapshot`
  const userStateSnapshotUrl = `${baseUrl}/api/claude-code/session/${sessionId}/user-state`

  // Presign a download of the user's prior ~/.claude state (MCP regs + skills),
  // so the container rehydrates it and MCP setup becomes one-time. Best-effort:
  // a missing/expired object just means a first session.
  let userClaudeStateUrl: string | undefined
  if (priorClaudeStateUri) {
    const { data: signed } = await admin.storage
      .from('cc-user-state')
      .createSignedUrl(priorClaudeStateUri, ttlSeconds + 120)
    userClaudeStateUrl = signed?.signedUrl
  }

  // Resume: presign the prior session's latest workspace snapshot so the new
  // container rehydrates /workspace from it (entrypoint extracts with
  // --strip-components=1). Best-effort — a missing object just yields a fresh
  // workspace.
  let workspaceRestoreUrl: string | undefined
  if (resumeSnapshotUri) {
    const { data: signed } = await admin.storage
      .from('cc-sessions')
      .createSignedUrl(resumeSnapshotUri, ttlSeconds + 120)
    workspaceRestoreUrl = signed?.signedUrl
  }

  const { error: upsertErr } = await admin.from('claude_code_sessions').upsert(
    {
      id: sessionId,
      attempt_id: attemptId,
      user_id: user.id,
      challenge_id,
      status: 'provisioning',
    },
    { onConflict: 'attempt_id', ignoreDuplicates: false },
  )

  if (upsertErr) {
    console.error('[cc/session/start] Failed to upsert session:', upsertErr)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // --- Wake the gateway's Cloud SQL on demand. cc-llm-db is stopped while CC
  // Analytics is idle (it has no native scale-to-zero, so it would bill 24/7).
  // Start it and wait until RUNNABLE BEFORE minting a gateway key — the mint hits
  // LiteLLM, which can't issue virtual keys without its Postgres. The wake is
  // capped at 40s so it fits this route's 60s maxDuration WITH headroom for the
  // mint + sandbox boot below; if the DB is too slow, we 503 cleanly (the row is
  // marked `failed`, NOT left `provisioning`) and the user's retry — by which
  // time the DB has finished booting — sails through. No-op when unconfigured
  // (local/dev). The reaper stops it again when no session is active. ---
  if (isGatewayConfigured() && isSqlAutostartConfigured()) {
    const sql = await ensureSqlRunnable(40_000)
    if (!sql.ready) {
      console.error('[cc/session/start] cc-llm-db not RUNNABLE in time (state:', sql.state, ')')
      await admin
        .from('claude_code_sessions')
        .update({ status: 'failed', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
      return NextResponse.json(
        { error: 'Starting your environment took too long. Please try again.' },
        { status: 503 },
      )
    }
  }

  // --- Mint a per-session virtual key with a hard spend cap (if the gateway is
  // deployed). The container then talks to the LiteLLM gateway instead of holding
  // the real Anthropic key, and a runaway session is capped in dollars. Falls
  // back to the shared key when the gateway is not configured. ---
  let anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
  let anthropicBaseUrl: string | undefined
  try {
    const vkey = await mintSessionVirtualKey(sessionId, ttlSeconds)
    if (vkey) {
      anthropicKey = vkey.key
      anthropicBaseUrl = vkey.baseUrl
    }
  } catch (err) {
    console.error('[cc/session/start] virtual key mint failed:', err)
    // FAIL CLOSED when the gateway is configured. Falling back to the shared key
    // would hand the session the platform's real ANTHROPIC_API_KEY with NO
    // per-session $0.50 budget and NO cc-<sessionId> alias — so spend is both
    // uncapped AND invisible to spend tracking. Only the no-gateway (local/dev)
    // path may use the shared key. (Codex review.)
    if (isGatewayConfigured()) {
      await admin
        .from('claude_code_sessions')
        .update({ status: 'failed', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
      return NextResponse.json(
        { error: 'Could not start a budgeted session. Please try again.' },
        { status: 503 },
      )
    }
  }

  // --- Build SessionEnv ---
  // Pin the CLI's model to one the gateway serves natively (Sonnet). Without this
  // the CLI defaults to claude-opus-4-7, which the gateway has to remap to Sonnet
  // — and the CLI then sends Opus-only params (e.g. thinking effort 'xhigh') that
  // Sonnet rejects with a 400. Setting ANTHROPIC_MODEL makes the CLI request Sonnet
  // directly, so params match the model. (project_cc_gateway_model_mismatch)
  const ccModel = process.env.CC_DEFAULT_MODEL ?? 'claude-sonnet-4-6'
  const ccFastModel = process.env.CC_FAST_MODEL ?? 'claude-haiku-4-5'
  const sessionEnv: SessionEnv = {
    ANTHROPIC_API_KEY: anthropicKey,
    ...(anthropicBaseUrl ? { ANTHROPIC_BASE_URL: anthropicBaseUrl } : {}),
    ANTHROPIC_MODEL: ccModel,
    ANTHROPIC_SMALL_FAST_MODEL: ccFastModel,
    ANTHROPIC_BUDGET_USD: process.env.ANTHROPIC_BUDGET_USD ?? '0.50',
    SESSION_ID: sessionId,
    SESSION_TOKEN_SECRET: process.env.SESSION_TOKEN_SECRET ?? '',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.CC_BIGQUERY_SA_JSON ?? '',
    BQ_PROJECT: bqProject,
    BQ_DATASET: bqDataset,
    BQ_BILLING_PROJECT: bqBillingProject,
    CLAUDE_MD: claudeMd,
    ORCHESTRATOR_SNAPSHOT_URL: orchestratorSnapshotUrl,
    SNAPSHOT_AUTH_TOKEN: snapshotToken,
    USER_STATE_SNAPSHOT_URL: userStateSnapshotUrl,
    ...(userClaudeStateUrl ? { USER_CLAUDE_STATE_URL: userClaudeStateUrl } : {}),
    ...(workspaceRestoreUrl ? { WORKSPACE_RESTORE_URL: workspaceRestoreUrl } : {}),
  }

  // --- Provision sandbox ---
  const sandbox = getSandbox()
  let provision
  try {
    provision = await sandbox.createSession({
      sessionId,
      env: sessionEnv,
      ttlSeconds,
    })
  } catch (err) {
    console.error('[cc/session/start] createSession failed:', err)
    // createSession can throw AFTER the revision PATCH lands (e.g. the response
    // read fails), leaving a partially-created revision that pins an instance
    // (minScale=1, billing) with no row to ever reap it. The tag is a pure
    // function of sessionId, so reconstruct it and tear down best-effort.
    const partialHostId = sandbox.deriveHostInstanceId?.(sessionId)
    if (partialHostId) {
      await sandbox
        .destroySession(partialHostId)
        .catch((e) => console.error('[cc/session/start] partial teardown failed:', e))
    }
    await admin
      .from('claude_code_sessions')
      .update({ status: 'failed', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    return NextResponse.json(
      { error: 'Sandbox provisioning failed. Please try again.' },
      { status: 503 },
    )
  }

  // --- Readiness: wait for the REVISION to be Ready (control-plane truth that
  // the container is up, ~5s) rather than polling the tagged HTTP /health URL,
  // whose route propagation lags and intermittently 404s past the deadline even
  // for a healthy revision (the cause of the prior 503 storms). The browser's WS
  // connect has its own reconnect backoff to absorb any residual tag-route lag.
  const ready = await sandbox.awaitReady(provision.hostInstanceId, READINESS_DEADLINE_MS)

  if (!ready) {
    console.error('[cc/session/start] Sandbox revision not Ready within', READINESS_DEADLINE_MS, 'ms')
    // Mark failed; best-effort teardown
    await admin
      .from('claude_code_sessions')
      .update({ status: 'failed', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    sandbox.destroySession(provision.hostInstanceId).catch(() => {})
    return NextResponse.json(
      { error: 'Sandbox timed out starting. Please try again.' },
      { status: 503 },
    )
  }

  // --- Update session row with live connection details ---
  const expiresAt = provision.expiresAt
  await admin.from('claude_code_sessions').update({
    host_instance_id: provision.hostInstanceId,
    host_app: provision.hostApp,
    host_provider: provision.provider,
    wss_url: provision.wssUrl,
    expires_at: expiresAt,
    status: 'active',
    started_at: new Date().toISOString(),
  }).eq('id', sessionId)

  // --- Record usage event (analytics session counter) ---
  await recordUsageEvent(user.id, 'claude_code_sessions', 1, {
    challenge_id,
    session_id: sessionId,
    provider: provision.provider,
  })

  return NextResponse.json({
    session_id: sessionId,
    wss_url: provision.wssUrl,
    expires_at: expiresAt,
    sub_problems: subProblems,
  })
}
