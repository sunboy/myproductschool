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
import { mintSessionVirtualKey } from '@/lib/sandbox/llm-gateway'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
// Provisioning can take up to 12s for the readiness poll + Cloud Run spin-up.
export const maxDuration = 30

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const BodySchema = z.object({
  // Challenge id may be a text slug, not a UUID — use min(1), never .uuid()
  challenge_id: z.string().min(1),
  attempt_id: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Readiness poll — GET /health → 204 on the wss host
// ---------------------------------------------------------------------------

const READINESS_INTERVAL_MS = 200
// A cold Cloud Run revision create + tag-route propagation + container boot can
// take ~15-25s, especially when a prior session's instance is being torn down.
// 12s was too tight and 503'd healthy cold starts. Keep this comfortably under
// the route's maxDuration (30s) so the poll, not the platform, owns the timeout.
const READINESS_DEADLINE_MS = 25_000

/**
 * Polls `http(s)://<host>/health` until it returns 204 (or until the deadline).
 * The WSS host may be `wss://` — convert to `https://` for the health probe.
 */
async function waitForHealth(wssHost: string, deadline: number): Promise<boolean> {
  const healthUrl = `https://${wssHost}/health`
  while (Date.now() < deadline) {
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' })
      if (res.status === 204) return true
    } catch {
      // not up yet — keep polling
    }
    await new Promise((r) => setTimeout(r, READINESS_INTERVAL_MS))
  }
  return false
}

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
    .select('id, status, wss_url, expires_at')
    .eq('attempt_id', attemptId)
    .maybeSingle()

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
    // Gateway mint failure should not hard-fail the session in dev; log and fall
    // back to the shared key. (In prod, consider failing closed instead.)
    console.error('[cc/session/start] virtual key mint failed, using shared key:', err)
  }

  // --- Build SessionEnv ---
  const sessionEnv: SessionEnv = {
    ANTHROPIC_API_KEY: anthropicKey,
    ...(anthropicBaseUrl ? { ANTHROPIC_BASE_URL: anthropicBaseUrl } : {}),
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
    await admin
      .from('claude_code_sessions')
      .update({ status: 'failed' })
      .eq('id', sessionId)
    return NextResponse.json(
      { error: 'Sandbox provisioning failed. Please try again.' },
      { status: 503 },
    )
  }

  // --- Readiness poll: GET /health → 204 ---
  const deadline = Date.now() + READINESS_DEADLINE_MS
  const ready = await waitForHealth(
    new URL(provision.wssUrl.replace(/^wss:\/\//, 'https://')).host,
    deadline,
  )

  if (!ready) {
    console.error('[cc/session/start] Sandbox did not become healthy within', READINESS_DEADLINE_MS, 'ms')
    // Mark failed; best-effort teardown
    await admin
      .from('claude_code_sessions')
      .update({ status: 'failed' })
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
