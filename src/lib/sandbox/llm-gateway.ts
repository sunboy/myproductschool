// lib/sandbox/llm-gateway.ts — server-side only.
//
// Mints a per-session virtual API key from the self-hosted LiteLLM gateway, with
// a hard spend cap. The sandbox container talks to the gateway with this key
// (ANTHROPIC_BASE_URL=<gateway>) and never sees the real Anthropic key — which
// lives only in the gateway. When the key's budget is exhausted, the gateway
// blocks further requests, so a runaway/abusive session is capped in dollars.
//
// Anthropic only supports spend caps per workspace (not per key), so this gateway
// is what gives us a true per-session ceiling. See project_cc_session_keys memory.
//
// Env:
//   LLM_GATEWAY_URL        base URL of the deployed LiteLLM service
//   LLM_GATEWAY_MASTER_KEY admin key authorizing /key/generate
//   CC_SESSION_BUDGET_USD  hard cap per session (default 0.50)

import { resolveSessionBudgetUsd, resolveSessionTtlSeconds } from './cost-policy'

export interface VirtualKey {
  /** The virtual key the container uses as its Anthropic API key. */
  key: string
  /** Base URL the container points ANTHROPIC_BASE_URL at. */
  baseUrl: string
  budgetUsd: number
}

export function isGatewayConfigured(): boolean {
  return Boolean(process.env.LLM_GATEWAY_URL && process.env.LLM_GATEWAY_MASTER_KEY)
}

/**
 * Mint a virtual key scoped to one session with a hard budget. Returns null if
 * the gateway is not configured. Production provisioning treats that as a hard
 * failure; only an explicitly opted-in local environment may use a direct key.
 */
export async function mintSessionVirtualKey(
  sessionId: string,
  ttlSeconds: number,
  /**
   * Models this key may access. Default `['all-proxy-models']` = whatever the
   * gateway currently serves — so the key never 403s when the CLI requests a
   * model name (e.g. claude-opus-4-7) that the gateway remaps. Pass a narrowed
   * list (e.g. ['claude-haiku-4-5']) to force a degraded tier for the future
   * monthly-cap downgrade. (project_cc_gateway_model_mismatch: a stale per-key
   * allowlist re-introduced the 403 even after the gateway model_list was fixed.)
   */
  models: string[] = ['all-proxy-models'],
): Promise<VirtualKey | null> {
  if (!isGatewayConfigured()) return null

  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  const budgetUsd = resolveSessionBudgetUsd(process.env.CC_SESSION_BUDGET_USD)
  const boundedTtlSeconds = resolveSessionTtlSeconds(ttlSeconds)

  // Retry with backoff: the gateway is minScale=0 and its Cloud SQL may have just
  // been woken on demand (see cloud-sql-admin), so the FIRST key/generate can hit
  // a cold gateway whose Prisma connection to the fresh DB isn't ready yet (500 /
  // connection error). A couple of retries absorb that without failing the session.
  // A terminal error (4xx client error) is thrown directly and NOT retried; only
  // transient failures (5xx, network) fall through to the retry loop. (A plain
  // `throw` inside the try would be swallowed by the catch and retried 4×.)
  class TerminalKeyError extends Error {}

  let lastErr: unknown
  // Each attempt has its OWN timeout: a cold gateway accepts the TCP connection
  // but never responds while LiteLLM boots, so a fetch with no timeout HANGS for
  // the full ~40s cold-boot and eats the route's 60s budget. A 9s per-attempt
  // timeout + retries means we re-probe a booting gateway every ~9s and connect
  // the moment it's up, instead of one long hang. 5 attempts × (9s + backoff)
  // covers a ~40-50s cold boot.
  const ATTEMPT_TIMEOUT_MS = parseInt(process.env.CC_MINT_ATTEMPT_TIMEOUT_MS ?? '9000', 10)
  const keyAlias = `cc-${sessionId}`
  // One-shot guard so a duplicate-alias recovery can't loop: provisionSession can
  // run more than once per sessionId (the provision route is killed at Vercel's 60s
  // ceiling AFTER /key/generate persisted the key in LiteLLM but BEFORE the host is
  // saved, then the client retries). The retry re-mints the SAME alias, which newer
  // LiteLLM rejects with 400 from _enforce_unique_key_alias. We delete the orphaned
  // alias once and regenerate — the stale key has ~$0 spend (it was never handed to
  // a live container), and the alias MUST stay `cc-<sessionId>` because spend
  // tracking parses it via alias.slice(3). (Without this, the 400 was fatal and the
  // session stuck in `provisioning` → "Sandbox took too long".)
  let recoveredDup = false
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt))
    try {
      const res = await fetch(`${baseUrl}/key/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_alias: keyAlias,
          max_budget: budgetUsd,
          // Hard duration so a key can't be reused indefinitely; matches session TTL.
          duration: `${boundedTtlSeconds}s`,
          models,
          metadata: { feature: 'claude_code_analytics', session_id: sessionId },
        }),
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        // 5xx / connection issues are transient (cold gateway/DB) → retry. 4xx is
        // a real client error (bad master key, bad model) → fail fast.
        if (res.status >= 500) {
          lastErr = new Error(`LiteLLM key/generate ${res.status}: ${detail.slice(0, 200)}`)
          continue
        }
        // Duplicate-alias 400: a prior (killed) provision already created this
        // session's key. Delete it ONCE, then regenerate against the freed alias.
        if (
          res.status === 400 &&
          !recoveredDup &&
          /alias/i.test(detail) &&
          /(exist|already|unique)/i.test(detail)
        ) {
          recoveredDup = true
          await fetch(`${baseUrl}/key/delete`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key_aliases: [keyAlias] }),
            signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          }).catch(() => {}) // best-effort; the regenerate is the source of truth
          continue
        }
        throw new TerminalKeyError(`LiteLLM key/generate failed (${res.status}): ${detail.slice(0, 300)}`)
      }
      const data = (await res.json()) as { key?: string }
      if (!data.key) throw new TerminalKeyError('LiteLLM key/generate returned no key')
      return { key: data.key, baseUrl, budgetUsd }
    } catch (err) {
      // Don't retry a client-side / contract error — surface it immediately.
      if (err instanceof TerminalKeyError) throw err
      lastErr = err
      // Network-level throw (gateway still cold) — retry unless it's the last try.
    }
  }
  throw lastErr ?? new Error('LiteLLM key/generate failed after retries')
}

/**
 * Fire-and-forget warm-up ping. The gateway is minScale=0; the first real request
 * (key mint) otherwise eats the full cold-boot. Calling this when a session STARTS
 * — before the user has finished reading the workspace and the provision step runs
 * — lets the container boot in parallel, so the later mint hits a warm gateway.
 * Never throws; a failure here is harmless (the mint's own retries are the
 * backstop). Returns immediately; do not await for correctness.
 */
export async function warmGateway(): Promise<void> {
  if (!isGatewayConfigured()) return
  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  try {
    // /health/readiness boots the container + checks its DB connection — the exact
    // dependency the mint needs. Short timeout: we only need to TRIGGER the boot.
    await fetch(`${baseUrl}/health/readiness`, {
      headers: { Authorization: `Bearer ${master}` },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    // Cold gateway won't answer in 8s — that's fine, the ping still triggered the
    // boot. Swallow everything.
  }
}

export interface KeySpend {
  spentUsd: number
  budgetUsd: number | null
}

/** Query only this session's alias; never expose gateway credentials to the client. */
export async function getSessionKeySpend(sessionId: string): Promise<KeySpend | null> {
  if (!isGatewayConfigured()) return null
  const alias = `cc-${sessionId}`
  const query = new URLSearchParams({ key_alias: alias, return_full_object: 'true', size: '100' })
  try {
    const res = await fetch(`${process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')}/key/list?${query}`, {
      headers: { Authorization: `Bearer ${process.env.LLM_GATEWAY_MASTER_KEY!}` },
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as { keys?: Array<{ key_alias?: string; spend?: number; max_budget?: number | null }> }
    // Gateway filtering is a substring match. Require the exact alias before using spend.
    const key = data.keys?.find(candidate => candidate.key_alias === alias)
    if (!key || typeof key.spend !== 'number' || !Number.isFinite(key.spend) || key.spend < 0) return null
    return {
      spentUsd: key.spend,
      budgetUsd: typeof key.max_budget === 'number' && Number.isFinite(key.max_budget) && key.max_budget > 0
        ? key.max_budget : null,
    }
  } catch {
    return null
  }
}

/**
 * Read current spend + budget for a session's virtual key. Powers the live usage
 * meter. Returns null if the gateway is unconfigured or the lookup fails (the UI
 * then falls back to a token-based estimate from the session row).
 */
export async function getKeySpend(virtualKey: string): Promise<KeySpend | null> {
  if (!isGatewayConfigured()) return null
  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  try {
    const res = await fetch(`${baseUrl}/key/info?key=${encodeURIComponent(virtualKey)}`, {
      headers: { Authorization: `Bearer ${master}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { info?: { spend?: number; max_budget?: number | null } }
    return {
      spentUsd: data.info?.spend ?? 0,
      budgetUsd: data.info?.max_budget ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Read spend (cents) for a session's virtual key by its ALIAS (cc-<sessionId>),
 * from /key/list. Unlike /key/info?key=<rawkey>, this works at teardown without
 * holding the raw key, and — verified live — /key/list retains a key's spend even
 * after its TTL expires, so it's a reliable source long after the session ends.
 * Returns null if unconfigured / not found / lookup fails.
 */
export async function getSessionKeySpendCents(sessionId: string): Promise<number | null> {
  const all = await getAllSessionKeySpendCents()
  if (!all) return null
  return all.get(sessionId) ?? null
}

/**
 * Bulk: one /key/list call → Map<sessionId, spentCents> for every cc-<sessionId>
 * key the gateway knows about (alive or expired). Used by the backstop spend cron.
 * Returns null if unconfigured or the call fails (caller treats as "no update").
 */
export async function getAllSessionKeySpendCents(): Promise<Map<string, number> | null> {
  if (!isGatewayConfigured()) return null
  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  try {
    // Bound the call: when the system is idle the reaper has already stopped
    // cc-llm-db, so the gateway hangs ~51s trying to open a DB connection before
    // 500ing. Without a timeout that stall propagates into cc-reap's 60s budget
    // → 504 → pg_net timeout → false health alert. 8s is well past a warm
    // response and well under the reaper's remaining budget; a timeout aborts to
    // the catch below, which the caller already treats as "no update".
    const res = await fetch(`${baseUrl}/key/list?return_full_object=true`, {
      headers: { Authorization: `Bearer ${master}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { keys?: Array<{ key_alias?: string; spend?: number }> }
    const out = new Map<string, number>()
    for (const k of data.keys ?? []) {
      const alias = k.key_alias ?? ''
      if (!alias.startsWith('cc-')) continue
      const sessionId = alias.slice(3)
      const cents = Math.round((k.spend ?? 0) * 100)
      out.set(sessionId, cents)
    }
    return out
  } catch {
    return null
  }
}

type GatewaySessionKey = {
  key_alias?: unknown
  token?: unknown
  metadata?: unknown
  spend?: unknown
  blocked?: unknown
}

export type BlockSessionKeyResult =
  | { status: 'blocked' | 'already_blocked'; spentCents: number | null }
  | { status: 'not_found' | 'unconfigured' }
  | {
      status: 'failed'
      reason:
        | 'invalid_session_id'
        | 'list_unavailable'
        | 'metadata_mismatch'
        | 'token_missing'
        | 'block_unavailable'
        | 'block_unverified'
    }

function sessionKeyMetadataMatches(key: GatewaySessionKey, sessionId: string): boolean {
  if (!key.metadata || typeof key.metadata !== 'object' || Array.isArray(key.metadata)) return false
  const metadata = key.metadata as Record<string, unknown>
  return metadata.feature === 'claude_code_analytics' && metadata.session_id === sessionId
}

function sessionKeySpendCents(key: GatewaySessionKey): number | null {
  return typeof key.spend === 'number' && Number.isFinite(key.spend) && key.spend >= 0
    ? Math.round(key.spend * 100)
    : null
}

function boundedSignal(deadline: number): AbortSignal {
  return AbortSignal.timeout(Math.max(1, deadline - Date.now()))
}

/**
 * Immediately revoke one ended session's credential without deleting its
 * gateway record. LiteLLM's block endpoint accepts the hashed `token` returned
 * by `/key/list`; retaining the row keeps authoritative spend available to the
 * idempotent accounting backstop. The alias and mint metadata must both match
 * before a token is sent to `/key/block`, so a substring list result can never
 * affect a neighboring session.
 *
 * Failures are returned as allow-listed reasons. Callers can retry safely; a
 * successful block is idempotent and the mint-time duration remains a fallback.
 */
export async function blockSessionKey(
  sessionId: string,
  timeoutMs = 8000,
): Promise<BlockSessionKeyResult> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) {
    return { status: 'failed', reason: 'invalid_session_id' }
  }
  if (!isGatewayConfigured()) return { status: 'unconfigured' }

  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  const alias = `cc-${sessionId}`
  const deadline = Date.now() + Math.max(1, timeoutMs)
  const query = new URLSearchParams({ key_alias: alias, return_full_object: 'true', size: '100' })

  let key: GatewaySessionKey | undefined
  try {
    const response = await fetch(`${baseUrl}/key/list?${query}`, {
      headers: { Authorization: `Bearer ${master}` },
      signal: boundedSignal(deadline),
      cache: 'no-store',
    })
    if (!response.ok) return { status: 'failed', reason: 'list_unavailable' }
    const body = (await response.json()) as { keys?: GatewaySessionKey[] }
    key = body.keys?.find((candidate) => candidate.key_alias === alias)
  } catch {
    return { status: 'failed', reason: 'list_unavailable' }
  }

  if (!key) return { status: 'not_found' }
  if (!sessionKeyMetadataMatches(key, sessionId)) {
    return { status: 'failed', reason: 'metadata_mismatch' }
  }
  const spentCents = sessionKeySpendCents(key)
  if (key.blocked === true) return { status: 'already_blocked', spentCents }
  if (typeof key.token !== 'string' || key.token.length === 0) {
    return { status: 'failed', reason: 'token_missing' }
  }

  try {
    const response = await fetch(`${baseUrl}/key/block`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.token }),
      signal: boundedSignal(deadline),
    })
    if (!response.ok) return { status: 'failed', reason: 'block_unavailable' }
    const blocked = (await response.json()) as GatewaySessionKey | null
    if (!blocked || blocked.blocked !== true) {
      return { status: 'failed', reason: 'block_unverified' }
    }
    return { status: 'blocked', spentCents: sessionKeySpendCents(blocked) ?? spentCents }
  } catch {
    return { status: 'failed', reason: 'block_unavailable' }
  }
}
