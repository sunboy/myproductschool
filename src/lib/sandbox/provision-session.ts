// Shared provisioning core for Claude Code Analytics sessions.
//
// Why this exists: Vercel Hobby caps a function at 60s and KILLS it at the
// ceiling (the function does not keep running after the client disconnects). A
// cold start is SQL-wake (up to ~40s) + key mint + revision PATCH + readiness
// (up to ~40s) — which cannot fit in one 60s invocation. So `session/start`
// stays thin (gates + row) and the heavy lifting runs here, driven by a
// separate `session/[id]/provision` route the client calls and then polls
// `session/[id]/state` for phase/status/wss_url.
//
// Each phase writes `status` on the row so the client can render real progress:
//   provisioning  → row created, work in flight
//   active        → revision Ready, wss_url set, usage recorded
//   failed        → a step errored (client shows retry)

import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import type { SessionEnv } from '@/lib/sandbox/types'
import { mintSnapshotToken } from '@/lib/sandbox/snapshot-token'
import { mintSessionVirtualKey, isGatewayConfigured, warmGateway } from '@/lib/sandbox/llm-gateway'
import { ensureSqlRunnable, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'
import { recordUsageEvent } from '@/lib/usage/check-limit'

// Readiness is the REVISION Ready condition (control-plane truth the container
// is up). On Vercel Hobby a function is KILLED at 60s, so we do NOT block the
// whole boot here — we PATCH the revision, persist its host/wss on the row, then
// wait only a short optimistic window. If the revision isn't Ready yet the row
// stays `provisioning` and the client's /state poll finishes the readiness check
// (a quick per-poll probe), so the boot completes across several short requests
// instead of one >60s call. Override via env.
const READINESS_OPTIMISTIC_MS = parseInt(process.env.CC_READINESS_OPTIMISTIC_MS ?? '12000', 10)
// SQL wake budget. cc-llm-db is stopped while idle (no native scale-to-zero), so
// the first session of an idle period pays this. Kept short so the whole
// provision route stays under 60s on Hobby.
const SQL_WAKE_MS = parseInt(process.env.CC_SQL_WAKE_MS ?? '40000', 10)

export interface ProvisionInput {
  sessionId: string
  userId: string
  challengeId: string
  /**
   * Absolute origin the container should POST its snapshots back to. MUST be the
   * deployment that provisioned the session — the snapshot bearer is HMAC-signed
   * with THIS deployment's SESSION_TOKEN_SECRET, so a preview container pointed at
   * prod (via a hardcoded NEXT_PUBLIC_APP_URL) 401s if the secret differs across
   * deployments. Derived from the provision request's own origin. Falls back to
   * NEXT_PUBLIC_APP_URL only when absent (e.g. a non-HTTP caller).
   */
  originUrl?: string
  bqProject: string
  bqDataset: string
  bqBillingProject: string
  claudeMd: string
  ttlSeconds: number
  /** Presigned URL to the user's prior ~/.claude state (MCP regs + skills). */
  userClaudeStateUrl?: string
  /** Presigned URL to a prior /workspace snapshot, for resume. */
  workspaceRestoreUrl?: string
}

export type ProvisionResult =
  | { ok: true; wssUrl: string; expiresAt: string; pending?: boolean }
  | { ok: false; status: number; error: string }

/**
 * Run the full provisioning pipeline for an existing `provisioning` row. Flips
 * the row to `active` (with wss_url) on success or `failed` on any step error.
 * Safe to call once per session row; idempotency/dedup lives in the start route.
 */
export async function provisionSession(input: ProvisionInput): Promise<ProvisionResult> {
  const admin = createAdminClient()
  const { sessionId, ttlSeconds } = input

  // Prefer the provisioning request's own origin so the container POSTs snapshots
  // back to THIS deployment (whose secret signed the token). Only fall back to the
  // configured app URL when no origin was threaded through.
  const baseUrl =
    input.originUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    'http://localhost:3000'
  const orchestratorSnapshotUrl = `${baseUrl}/api/claude-code/session/${sessionId}/snapshot`
  const userStateSnapshotUrl = `${baseUrl}/api/claude-code/session/${sessionId}/user-state`
  const snapshotToken = mintSnapshotToken(sessionId, process.env.SESSION_TOKEN_SECRET ?? '')

  // --- Wake Cloud SQL AND warm the gateway CONCURRENTLY (both feed the key mint).
  // Serially these are the two long poles on a cold start (~40s + ~40s > Hobby's
  // 60s). Overlapping them — plus the fire-and-forget warm-up `start` already
  // kicked off — keeps the cold path under one function's budget. ---
  if (isGatewayConfigured()) {
    const warm = warmGateway() // triggers gateway container boot in parallel
    if (isSqlAutostartConfigured()) {
      const sql = await ensureSqlRunnable(SQL_WAKE_MS)
      if (!sql.ready) {
        console.error('[cc/provision] cc-llm-db not RUNNABLE in time (state:', sql.state, ')')
        await markFailed(
          admin,
          sessionId,
          'sql_wake_timeout',
          `cc-llm-db not RUNNABLE in time (state: ${sql.state ?? 'unknown'})`,
        )
        return {
          ok: false,
          status: 503,
          error: 'Starting your environment took too long. Please try again.',
        }
      }
    }
    await warm // gateway warm-up returns fast (or times out at 8s) either way
  }

  // --- Mint a per-session virtual key with a hard spend cap ---
  let anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
  let anthropicBaseUrl: string | undefined
  try {
    const vkey = await mintSessionVirtualKey(sessionId, ttlSeconds)
    if (vkey) {
      anthropicKey = vkey.key
      anthropicBaseUrl = vkey.baseUrl
    }
  } catch (err) {
    console.error('[cc/provision] virtual key mint failed:', err)
    // FAIL CLOSED when the gateway is configured — never hand a session the
    // shared uncapped key. Only the no-gateway (local/dev) path may fall back.
    if (isGatewayConfigured()) {
      await markFailed(
        admin,
        sessionId,
        'gateway_mint_failed',
        err instanceof Error ? err.message : String(err),
      )
      return {
        ok: false,
        status: 503,
        error: 'Could not start a budgeted session. Please try again.',
      }
    }
  }

  // --- Build SessionEnv ---
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
    BQ_PROJECT: input.bqProject,
    BQ_DATASET: input.bqDataset,
    BQ_BILLING_PROJECT: input.bqBillingProject,
    CLAUDE_MD: input.claudeMd,
    ORCHESTRATOR_SNAPSHOT_URL: orchestratorSnapshotUrl,
    SNAPSHOT_AUTH_TOKEN: snapshotToken,
    USER_STATE_SNAPSHOT_URL: userStateSnapshotUrl,
    ...(input.userClaudeStateUrl ? { USER_CLAUDE_STATE_URL: input.userClaudeStateUrl } : {}),
    ...(input.workspaceRestoreUrl ? { WORKSPACE_RESTORE_URL: input.workspaceRestoreUrl } : {}),
  }

  // --- Provision sandbox (create tagged revision) ---
  const sandbox = getSandbox()
  let provision
  try {
    provision = await sandbox.createSession({ sessionId, env: sessionEnv, ttlSeconds })
  } catch (err) {
    console.error('[cc/provision] createSession failed:', err)
    // A partially-created revision still pins an instance — tear it down.
    const partialHostId = sandbox.deriveHostInstanceId?.(sessionId)
    if (partialHostId) {
      await sandbox
        .destroySession(partialHostId)
        .catch((e) => console.error('[cc/provision] partial teardown failed:', e))
    }
    await markFailed(
      admin,
      sessionId,
      'sandbox_create_failed',
      err instanceof Error ? err.message : String(err),
    )
    return { ok: false, status: 503, error: 'Sandbox provisioning failed. Please try again.' }
  }

  // --- Persist the host/wss immediately (the revision EXISTS post-PATCH; it may
  // still be booting). This lets the /state poll finish the readiness check even
  // if THIS request is killed at the Hobby 60s ceiling. Row stays `provisioning`
  // until a Ready probe flips it `active`. ---
  const expiresAt = provision.expiresAt
  await admin
    .from('claude_code_sessions')
    .update({
      host_instance_id: provision.hostInstanceId,
      host_app: provision.hostApp,
      host_provider: provision.provider,
      wss_url: provision.wssUrl,
      expires_at: expiresAt,
    })
    .eq('id', sessionId)

  // --- Optimistic short readiness wait. A warm path comes up inside this window;
  // a cold one does not, and that's fine — the client's /state poll takes over. ---
  const ready = await sandbox.awaitReady(provision.hostInstanceId, READINESS_OPTIMISTIC_MS)
  if (ready) {
    await markActiveAndMeter(admin, sessionId, input, provision.provider)
    return { ok: true, wssUrl: provision.wssUrl, expiresAt }
  }

  // Not Ready yet — the revision is still booting. Leave the row `provisioning`
  // (host/wss persisted) and let /state finish it. This is a SUCCESS for the
  // request: the client keeps showing progress and polling.
  return { ok: true, wssUrl: provision.wssUrl, expiresAt, pending: true }
}

/**
 * Quick per-poll readiness probe used by the /state route. Flips a `provisioning`
 * row (that already has a host_instance_id) to `active` the moment its revision
 * reports Ready. Returns the wss_url when it goes active, else null.
 */
export async function probeAndActivate(
  sessionId: string,
  hostInstanceId: string,
  userId: string,
  challengeId: string,
  provider: string,
  wssUrl: string,
): Promise<string | null> {
  const admin = createAdminClient()
  const sandbox = getSandbox()
  // Single short probe (a few seconds) — the /state route is called repeatedly.
  const ready = await sandbox.awaitReady(hostInstanceId, 3000)
  if (!ready) return null
  await markActiveAndMeter(admin, sessionId, { userId, challengeId } as ProvisionInput, provider)
  return wssUrl
}

async function markActiveAndMeter(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  input: Pick<ProvisionInput, 'userId' | 'challengeId'>,
  provider: string,
): Promise<void> {
  // Guard: only the first transition out of `provisioning` records usage, so a
  // race between the provision wait and a /state probe can't double-count.
  const { data: flipped } = await admin
    .from('claude_code_sessions')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('status', 'provisioning')
    .select('id')
  if (!flipped || flipped.length === 0) return

  await recordUsageEvent(input.userId, 'claude_code_sessions', 1, {
    challenge_id: input.challengeId,
    session_id: sessionId,
    provider,
  })
}

async function markFailed(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  failureCode: string,
  failureReason: string,
): Promise<void> {
  await admin
    .from('claude_code_sessions')
    .update({
      status: 'failed',
      ended_at: new Date().toISOString(),
      failure_code: failureCode,
      // Trim so a long upstream error can't bloat the row.
      failure_reason: failureReason.slice(0, 500),
    })
    .eq('id', sessionId)
}
