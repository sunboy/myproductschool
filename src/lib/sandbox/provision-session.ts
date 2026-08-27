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

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import type { SessionEnv } from '@/lib/sandbox/types'
import { mintSnapshotToken } from '@/lib/sandbox/snapshot-token'
import { mintSessionVirtualKey, isGatewayConfigured, warmGateway } from '@/lib/sandbox/llm-gateway'
import { ensureSqlRunnable, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'
import { recordUsageEvent } from '@/lib/usage/check-limit'
import { captureServerImmediate } from '@/lib/posthog/server'

/**
 * Step where provisioning died — surfaced to Sentry/PostHog so the next incident
 * is diagnosable in minutes (this feature had ZERO failure instrumentation, so the
 * gateway-400 root cause took a deep log dive to find). Also persisted on the row
 * (failure_code) so the client can decide whether to silently retry.
 */
type ProvisionFailureCode = 'sql_wake_timeout' | 'gateway_key_mint' | 'create_session' | 'readiness_timeout'

/**
 * Coarse provisioning phase the client renders as staged progress. Ordered; the
 * client renders it monotonically and provisionSession only ever advances it (SQL
 * wake and gateway warm run concurrently, so we stamp the furthest phase reached,
 * never a backward step).
 */
export type ProvisionPhase = 'waking_database' | 'starting_gateway' | 'booting_sandbox' | 'ready'

const PHASE_ORDER: Record<ProvisionPhase, number> = {
  waking_database: 0,
  starting_gateway: 1,
  booting_sandbox: 2,
  ready: 3,
}

/**
 * Advance the persisted provision_phase, monotonically. Reads the current phase
 * and only writes when `phase` is strictly further along, so a later concurrent
 * step can't regress the value the client is showing. Best-effort — a failed
 * phase write never blocks provisioning.
 */
async function advancePhase(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phase: ProvisionPhase,
): Promise<void> {
  try {
    const { data } = await admin
      .from('claude_code_sessions')
      .select('provision_phase')
      .eq('id', sessionId)
      .maybeSingle()
    const current = (data?.provision_phase as ProvisionPhase | null) ?? null
    if (current && PHASE_ORDER[current] >= PHASE_ORDER[phase]) return
    await admin
      .from('claude_code_sessions')
      .update({ provision_phase: phase })
      .eq('id', sessionId)
  } catch (err) {
    console.error('[cc/provision] phase write failed (best-effort):', err)
  }
}

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
  /** Presigned URL to the lab's starter tarball (e.g. the debugging repo). */
  challengeTarballUrl?: string
  /** Lab-supplied permission-allowlist additions. */
  extraAllowedTools?: string[]
  /** Presigned URL to a prior /workspace snapshot, for resume. */
  workspaceRestoreUrl?: string
  /**
   * Which product surface this session belongs to. Optional so every existing
   * caller keeps compiling unchanged.
   *
   *   'case'          (default) the EXISTING Claude Code Analytics lab session.
   *                   That route omits sessionKind, so `undefined` MUST keep
   *                   meaning this.
   *   'drill'         a Casebook Practice session (user-facing: Practice).
   *   'casebook_case' a Casebook Challenge session (user-facing: Challenge).
   *
   * NOTE the deliberate asymmetry: a Casebook capstone is NOT `'case'`. That
   * name already means the analytics lab, and the two have DIFFERENT allowances
   * (analytics lab -> `claude_code_sessions`; Casebook capstone ->
   * `cc_case_attempts_total`). Overloading one name would make them
   * indistinguishable at the metering allowlist below and would silently
   * recreate the trial-burning bug this file already had once.
   */
  sessionKind?: 'case' | 'drill' | 'casebook_case'
}

/** Practice ('drill') sessions get a hard 10-minute wall — plan §3.3. Enforced
 *  here regardless of what ttlSeconds the caller passed; 'case' sessions are
 *  unaffected (input.ttlSeconds passes through unchanged). */
const DRILL_TTL_SECONDS = 600 // 10 minutes

/**
 * Per-session spend cap by kind, in USD.
 *
 * Practice ('drill') stays at the product default (0.50 via CC_SESSION_BUDGET_USD):
 * a 10-minute exercise, and that tier is the intended behavior.
 *
 * A Challenge ('casebook_case') runs up to 90 minutes and 0.50 demonstrably dies
 * mid-session. Measured: a full expert arc cost 0.59, and a 0.50 cap produced 11
 * consecutive 429s and a terminal that wedged with no error text. 3.00 completed
 * the same arc with room to spare.
 *
 * Free-tier exposure stays bounded by the ALLOWANCE, not by this number:
 * cc_case_attempts_total is 1 lifetime on free, so 3.00 is a lifetime ceiling.
 * On pro the allowance is effectively unlimited, so the aggregate guard there is
 * the existing spend observability (record_cc_session_spend -> usage_events ->
 * spend alerts), not this per-session cap.
 *
 * A kind absent from this map falls back to the env default, so adding a kind
 * changes no budget until someone opts it in deliberately.
 */
const SESSION_BUDGET_USD: Partial<Record<NonNullable<ProvisionInput['sessionKind']>, number>> = {
  casebook_case: parseFloat(process.env.CC_CASE_SESSION_BUDGET_USD ?? '3.00'),
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
  const { sessionId } = input
  const sessionKind = input.sessionKind ?? 'case'
  // Drill (Practice) sessions get a hard 10-minute wall regardless of what the
  // caller passed — case sessions are completely unaffected (ttlSeconds passes
  // through unchanged when sessionKind is 'case' or omitted).
  const ttlSeconds = sessionKind === 'drill' ? DRILL_TTL_SECONDS : input.ttlSeconds

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
  // Phase: the DB wake is the first (and longest) cold pole. Stamp it up front so
  // the client's first /state poll already shows a real phase.
  await advancePhase(admin, sessionId, 'waking_database')

  if (isGatewayConfigured()) {
    const warm = warmGateway() // triggers gateway container boot in parallel
    if (isSqlAutostartConfigured()) {
      const sql = await ensureSqlRunnable(SQL_WAKE_MS)
      if (!sql.ready) {
        console.error('[cc/provision] cc-llm-db not RUNNABLE in time (state:', sql.state, ')')
        await markFailed(admin, sessionId, {
          code: 'sql_wake_timeout',
          userId: input.userId,
          challengeId: input.challengeId,
          error: new Error(`cc-llm-db not RUNNABLE in time (state: ${sql.state})`),
        })
        return {
          ok: false,
          status: 503,
          error: 'Starting your environment took too long. Please try again.',
        }
      }
    }
    await warm // gateway warm-up returns fast (or times out at 8s) either way
  }

  // Phase: DB is up; the gateway key mint is next (its warm-up ran concurrently).
  await advancePhase(admin, sessionId, 'starting_gateway')

  // --- Mint a per-session virtual key with a hard spend cap ---
  let anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
  let anthropicBaseUrl: string | undefined
  try {
    // undefined => mintSessionVirtualKey falls back to CC_SESSION_BUDGET_USD,
    // so 'case' and 'drill' behave exactly as before this map existed.
    const budgetUsd = SESSION_BUDGET_USD[sessionKind]
    const vkey = await mintSessionVirtualKey(sessionId, ttlSeconds, undefined, budgetUsd)
    if (vkey) {
      anthropicKey = vkey.key
      anthropicBaseUrl = vkey.baseUrl
    }
  } catch (err) {
    console.error('[cc/provision] virtual key mint failed:', err)
    // FAIL CLOSED when the gateway is configured — never hand a session the
    // shared uncapped key. Only the no-gateway (local/dev) path may fall back.
    if (isGatewayConfigured()) {
      // Pull the upstream gateway HTTP status out of the mint error message so
      // Sentry tags it — a surfaced 400 "key_alias already exists" is self-
      // diagnosing. Covers both mint error formats: terminal `... failed (400):`
      // and retry-exhausted `... key/generate 500:`.
      const msg = err instanceof Error ? err.message : ''
      const gatewayStatus = Number(
        msg.match(/\((\d{3})\)/)?.[1] ?? msg.match(/key\/generate (\d{3})[: ]/)?.[1],
      ) || undefined
      await markFailed(admin, sessionId, {
        code: 'gateway_key_mint',
        userId: input.userId,
        challengeId: input.challengeId,
        gatewayStatus,
        error: err,
      })
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
    // Kept in step with the gateway key's cap above. The gateway is the real
    // enforcement point (it returns the 429); this value is what the CLI shows
    // and self-limits against, so a mismatch would confuse the learner about how
    // much budget they actually have.
    ANTHROPIC_BUDGET_USD:
      SESSION_BUDGET_USD[sessionKind]?.toFixed(2) ?? process.env.ANTHROPIC_BUDGET_USD ?? '0.50',
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
    ...(input.challengeTarballUrl ? { CHALLENGE_TARBALL_URL: input.challengeTarballUrl } : {}),
    ...(input.extraAllowedTools?.length
      ? { CC_EXTRA_ALLOWED_TOOLS: JSON.stringify(input.extraAllowedTools) }
      : {}),
    ...(input.workspaceRestoreUrl ? { WORKSPACE_RESTORE_URL: input.workspaceRestoreUrl } : {}),
    ...(input.sessionKind ? { SESSION_KIND: input.sessionKind } : {}),
  }

  // Phase: key minted; now boot the sandbox revision (the last long pole).
  await advancePhase(admin, sessionId, 'booting_sandbox')

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
    await markFailed(admin, sessionId, {
      code: 'create_session',
      userId: input.userId,
      challengeId: input.challengeId,
      error: err,
    })
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
  // No `sessionKind` here: this activation path is reached from the /state
  // polling route, which has only the session row's ids. Resolve the kind from
  // the DB so a practice session activated by polling is NOT counted against
  // the analytics trial quota. A challenge_id matching a cc_scenes row is a
  // practice session (the same authoritative check the reaper uses; there is
  // no session_kind column). Fail-safe: on any lookup error we leave it
  // undefined, which counts the session — over-counting a trial unit is the
  // safe direction, under-counting would give away free analytics sessions.
  let resolvedKind: ProvisionInput['sessionKind']
  try {
    const { data: sceneRow } = await admin
      .from('cc_scenes')
      .select('id')
      .eq('id', challengeId)
      .maybeSingle()
    if (sceneRow) resolvedKind = 'drill'
  } catch {
    // leave undefined (counts as a normal analytics session)
  }
  await markActiveAndMeter(admin, sessionId, { userId, challengeId, sessionKind: resolvedKind }, provider)
  return wssUrl
}

// Practice ('drill') sessions do NOT consume a `claude_code_sessions` unit.
// That feature is the analytics-lab trial quota (free: 1 per 30 days), sized
// for the expensive long-form lab. Practice sessions are deliberately cheap
// (a $0.50 cap and a 10-minute hard wall) and are metered separately by
// `cc_drill_sessions_weekly` (free: 3 per 7 days) in the practice-start route.
//
// Counting a practice session against the analytics trial defeats BOTH
// designs at once: a free learner's first practice session would burn their
// only analytics-lab unit, and their second practice attempt would then be
// refused by the analytics quota rather than the practice allowance, making
// the seeded allowance of 3 unreachable on the free tier.
//
// Only the trial-unit COUNT is kind-conditional. Real LLM spend
// (`cc_claude_spend_cents`, recorded via record-spend.ts / spend-snapshot.ts)
// stays unconditional for every session kind, because the spend is real
// regardless of why the session ran.
// ALLOWLIST, not a negative check. An earlier version tested
// `sessionKind !== 'drill'`, which meant every NEW session kind silently
// inherited analytics-trial metering by default — the Casebook 'case' kind
// hit exactly that: it has its own `cc_case_attempts_total` allowance, but
// fell through here and also burned the analytics unit. On the free tier both
// limits happen to be 1, so the behavior looks correct on a first attempt and
// only diverges ~30 days later when the rolling analytics window refreshes
// and a "lifetime" case allowance quietly grants a second attempt.
//
// Listing the kinds that DO consume the analytics trial makes adding a kind a
// deliberate act: a new kind meters nothing here until someone adds it, which
// fails toward under-counting a trial unit rather than silently charging a
// learner's quota to the wrong feature.
const ANALYTICS_TRIAL_KINDS = new Set<NonNullable<ProvisionInput['sessionKind']>>(['case'])

/**
 * Whether a session of this kind should consume a `claude_code_sessions`
 * analytics-trial unit. Pure and exported so the allowlist decision itself
 * (the exact thing that goes wrong if a new kind is added without updating
 * this) can be unit-tested without any DB mocking.
 *
 * `undefined` maps to 'case' because the original analytics-lab route omits
 * sessionKind entirely — that omission IS the analytics lab and must keep
 * metering. Every other kind must be explicitly listed in
 * ANALYTICS_TRIAL_KINDS to consume a unit.
 */
export function consumesAnalyticsTrial(sessionKind: ProvisionInput['sessionKind']): boolean {
  return ANALYTICS_TRIAL_KINDS.has(sessionKind ?? 'case')
}

async function markActiveAndMeter(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  // `sessionKind` is needed so practice sessions can be excluded from the
  // analytics trial-unit count below (see the comment at the recordUsageEvent call).
  input: Pick<ProvisionInput, 'userId' | 'challengeId' | 'sessionKind'>,
  provider: string,
): Promise<void> {
  // Guard: only the first transition out of `provisioning` records usage, so a
  // race between the provision wait and a /state probe can't double-count.
  const { data: flipped } = await admin
    .from('claude_code_sessions')
    .update({ status: 'active', started_at: new Date().toISOString(), provision_phase: 'ready' })
    .eq('id', sessionId)
    .eq('status', 'provisioning')
    .select('id')
  if (!flipped || flipped.length === 0) return

  if (consumesAnalyticsTrial(input.sessionKind)) {
    await recordUsageEvent(input.userId, 'claude_code_sessions', 1, {
      challenge_id: input.challengeId,
      session_id: sessionId,
      provider,
    })
  }
}

async function markFailed(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  failure?: {
    code: ProvisionFailureCode
    userId?: string
    challengeId?: string
    /** The HTTP status from the upstream dependency (e.g. gateway 400), if known. */
    gatewayStatus?: number
    error?: unknown
  },
): Promise<void> {
  // CAS guard: only fail a row that is still `provisioning`. If a concurrent
  // provision attempt for the same session already flipped it to `active`, this
  // update matches nothing and we must NOT clobber the live session or emit a
  // bogus failure event. (Codex review: two provisions racing before host persist.)
  const { data: flipped } = await admin
    .from('claude_code_sessions')
    .update({
      status: 'failed',
      ended_at: new Date().toISOString(),
      // Persist the failure code so the client can decide whether to silently
      // retry (sql_wake_timeout / gateway_key_mint are cold-transient).
      ...(failure ? { failure_code: failure.code } : {}),
    })
    .eq('id', sessionId)
    .eq('status', 'provisioning')
    .select('id')

  if (!failure || !flipped || flipped.length === 0) return

  // Surface the failure to both observability planes. Before this, the start/
  // provision path captured NOTHING — the user saw a friendly string and the real
  // reason (e.g. gateway "400 key_alias already exists") was discarded.
  const err =
    failure.error instanceof Error
      ? failure.error
      : new Error(`cc provision failed: ${failure.code}`)
  try {
    Sentry.captureException(err, {
      tags: {
        feature: 'claude_code_analytics',
        cc_failure_code: failure.code,
        ...(failure.gatewayStatus ? { gateway_http_status: String(failure.gatewayStatus) } : {}),
      },
      extra: { sessionId, challengeId: failure.challengeId },
    })
  } catch {
    /* never let observability break teardown */
  }
  await captureServerImmediate({
    distinctId: failure.userId ?? 'server-anonymous',
    event: 'cc_session_provision_failed',
    properties: {
      session_id: sessionId,
      challenge_id: failure.challengeId,
      failure_code: failure.code,
      gateway_http_status: failure.gatewayStatus ?? null,
      message: err.message.slice(0, 300),
      ...(failure.userId ? {} : { $process_person_profile: false }),
    },
  }).catch(() => {})
}
