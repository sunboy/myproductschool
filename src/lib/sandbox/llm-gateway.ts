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

import { createHash, createHmac } from 'node:crypto'
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

const SESSION_KEY_DERIVATION = 'hmac-sha256-v1'
const SESSION_KEY_DOMAIN = 'myproductschool:cc-session-key:v1\0'
const EXPIRY_PRECISION_MS = 1000
const KEY_LOOKUP_TIMEOUT_MS = 4000

type GatewayMintKey = {
  key_alias?: unknown
  token?: unknown
  metadata?: unknown
  max_budget?: unknown
  models?: unknown
  blocked?: unknown
  expires?: unknown
}

type MintRecovery = 'owned' | 'absent' | 'unavailable' | 'mismatch'

class TerminalKeyError extends Error {}

function deriveSessionKey(master: string, sessionId: string): string {
  return `sk-${createHmac('sha256', master)
    .update(SESSION_KEY_DOMAIN)
    .update(sessionId)
    .digest('base64url')}`
}

function sessionKeyHash(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function sameModelSet(actual: unknown, expected: string[]): boolean {
  if (!Array.isArray(actual) || actual.some((model) => typeof model !== 'string')) return false
  const actualSet = new Set(actual as string[])
  const expectedSet = new Set(expected)
  return actualSet.size === expectedSet.size
    && [...expectedSet].every((model) => actualSet.has(model))
}

async function recoverOwnedSessionKey(input: {
  baseUrl: string
  master: string
  alias: string
  sessionId: string
  expectedTokenHash: string
  budgetUsd: number
  models: string[]
  ttlSeconds: number
  invocationExpiryUpperMs: number
  deadline: number
}): Promise<MintRecovery> {
  const remainingMs = input.deadline - Date.now()
  if (remainingMs <= 0) return 'unavailable'
  const query = new URLSearchParams({
    key_alias: input.alias,
    return_full_object: 'true',
    size: '100',
  })
  let key: GatewayMintKey | undefined
  try {
    const response = await fetch(`${input.baseUrl}/key/list?${query}`, {
      headers: { Authorization: `Bearer ${input.master}` },
      signal: AbortSignal.timeout(Math.min(KEY_LOOKUP_TIMEOUT_MS, remainingMs)),
      cache: 'no-store',
    })
    if (!response.ok) return 'unavailable'
    const body = (await response.json()) as { keys?: GatewayMintKey[] }
    key = body.keys?.find((candidate) => candidate.key_alias === input.alias)
  } catch {
    return 'unavailable'
  }
  if (!key) return 'absent'

  if (!key.metadata || typeof key.metadata !== 'object' || Array.isArray(key.metadata)) {
    return 'mismatch'
  }
  const metadata = key.metadata as Record<string, unknown>
  const metadataKeys = Object.keys(metadata).sort()
  const expectedMetadataKeys = [
    'expires_at',
    'feature',
    'key_derivation',
    'session_id',
    'ttl_seconds',
  ]
  if (
    metadataKeys.length !== expectedMetadataKeys.length
    || metadataKeys.some((name, index) => name !== expectedMetadataKeys[index])
    || metadata.feature !== 'claude_code_analytics'
    || metadata.session_id !== input.sessionId
    || metadata.key_derivation !== SESSION_KEY_DERIVATION
    || metadata.ttl_seconds !== input.ttlSeconds
    || typeof metadata.expires_at !== 'string'
  ) {
    return 'mismatch'
  }

  const now = Date.now()
  const storedExpiryMs = Date.parse(metadata.expires_at)
  const providerExpiryMs = typeof key.expires === 'string' ? Date.parse(key.expires) : Number.NaN
  if (
    key.token !== input.expectedTokenHash
    || key.max_budget !== input.budgetUsd
    || key.blocked !== false
    || !sameModelSet(key.models, input.models)
    || !Number.isFinite(storedExpiryMs)
    || storedExpiryMs <= now
    || storedExpiryMs > input.invocationExpiryUpperMs + EXPIRY_PRECISION_MS
    || !Number.isFinite(providerExpiryMs)
    || providerExpiryMs <= now
    || providerExpiryMs > storedExpiryMs + EXPIRY_PRECISION_MS
  ) {
    return 'mismatch'
  }
  return 'owned'
}

/**
 * Mint a virtual key scoped to one session with a hard budget. The raw key is
 * deterministically derived for this session, so a successful gateway insert
 * whose response is lost can be recovered without deleting or replacing an
 * alias. Recovery always proves ownership and the original cap/expiry first.
 */
export async function mintSessionVirtualKey(
  sessionId: string,
  ttlSeconds: number,
  /** Models this key may access. Keep narrowed lists stable across retries. */
  models: string[] = ['all-proxy-models'],
): Promise<VirtualKey | null> {
  if (!isGatewayConfigured()) return null
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) {
    throw new TerminalKeyError('Invalid analytics session id')
  }

  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  const budgetUsd = resolveSessionBudgetUsd(process.env.CC_SESSION_BUDGET_USD)
  const boundedTtlSeconds = resolveSessionTtlSeconds(ttlSeconds)
  const perAttemptTimeoutMs = Math.min(
    15_000,
    Math.max(1000, Number.parseInt(process.env.CC_MINT_ATTEMPT_TIMEOUT_MS ?? '9000', 10) || 9000),
  )
  // Leave well over half of the provision route's 180-second budget for Cloud
  // Run revision creation and readiness after key minting finishes.
  const totalTimeoutMs = Math.min(
    90_000,
    Math.max(10_000, Number.parseInt(process.env.CC_MINT_TOTAL_TIMEOUT_MS ?? '65000', 10) || 65_000),
  )
  const startedAt = Date.now()
  const deadline = startedAt + totalTimeoutMs
  const invocationExpiryUpperMs = startedAt + boundedTtlSeconds * 1000
  const declaredExpiry = new Date(invocationExpiryUpperMs).toISOString()
  const expiryGuardSeconds = Math.min(
    Math.ceil(totalTimeoutMs / 1000) + 2,
    Math.max(2, Math.floor(boundedTtlSeconds / 10)),
  )
  const alias = `cc-${sessionId}`
  const key = deriveSessionKey(master, sessionId)
  const expectedTokenHash = sessionKeyHash(key)
  const metadata = {
    feature: 'claude_code_analytics',
    session_id: sessionId,
    key_derivation: SESSION_KEY_DERIVATION,
    ttl_seconds: boundedTtlSeconds,
    expires_at: declaredExpiry,
  }
  const recoveryInput = {
    baseUrl,
    master,
    alias,
    sessionId,
    expectedTokenHash,
    budgetUsd,
    models,
    ttlSeconds: boundedTtlSeconds,
    invocationExpiryUpperMs,
    deadline,
  }

  // A later provision invocation for the same session should recover the first
  // invocation's still-valid key without sending another generate request.
  const existing = await recoverOwnedSessionKey(recoveryInput)
  if (existing === 'owned') return { key, baseUrl, budgetUsd }
  if (existing === 'mismatch') {
    throw new TerminalKeyError('Existing analytics session key failed ownership verification')
  }

  let lastError = new Error('LiteLLM key generation unavailable')
  for (let attempt = 0; attempt < 5 && Date.now() < deadline; attempt++) {
    if (attempt > 0) {
      const backoffMs = Math.min(1500 * attempt, Math.max(0, deadline - Date.now()))
      if (backoffMs > 0) await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
    const remainingMs = deadline - Date.now()
    const remainingLifetimeSeconds = Math.floor(
      (invocationExpiryUpperMs - Date.now()) / 1000,
    )
    const durationSeconds = remainingLifetimeSeconds - expiryGuardSeconds
    if (remainingMs <= 0 || durationSeconds < 1) break

    let responseStatus: number | null = null
    try {
      const response = await fetch(`${baseUrl}/key/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          key_alias: alias,
          max_budget: budgetUsd,
          duration: `${durationSeconds}s`,
          models,
          blocked: false,
          metadata,
        }),
        signal: AbortSignal.timeout(Math.min(perAttemptTimeoutMs, remainingMs)),
      })
      responseStatus = response.status
      if (response.ok) {
        const body = (await response.json()) as { key?: unknown }
        if (body.key !== key) {
          throw new TerminalKeyError('LiteLLM returned an unexpected analytics session key')
        }
      }
    } catch (error) {
      if (error instanceof TerminalKeyError) throw error
      // A timeout/network error is ambiguous: the insert may have committed.
      lastError = new Error('LiteLLM key generation request was ambiguous')
    }

    const recovered = await recoverOwnedSessionKey(recoveryInput)
    if (recovered === 'owned') return { key, baseUrl, budgetUsd }
    if (recovered === 'mismatch') {
      throw new TerminalKeyError('Existing analytics session key failed ownership verification')
    }

    if (responseStatus !== null) {
      lastError = new Error(`LiteLLM key/generate ${responseStatus}`)
      // 400/409 may be the unique-alias response after a lost success. Its
      // exact lookup can be briefly unavailable, so retry lookup/generate under
      // the same total deadline. Other client errors are deterministic.
      if (
        responseStatus >= 400
        && responseStatus < 500
        && responseStatus !== 400
        && responseStatus !== 409
      ) {
        throw new TerminalKeyError(`LiteLLM key/generate failed (${responseStatus})`)
      }
    }
  }
  throw lastError
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
