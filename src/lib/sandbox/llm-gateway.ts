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
 * the gateway is not configured (caller falls back to the shared key) — so the
 * gateway can be adopted without breaking environments that haven't deployed it.
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
  const budgetUsd = parseFloat(process.env.CC_SESSION_BUDGET_USD ?? '0.50')

  // Retry with backoff: the gateway is minScale=0 and its Cloud SQL may have just
  // been woken on demand (see cloud-sql-admin), so the FIRST key/generate can hit
  // a cold gateway whose Prisma connection to the fresh DB isn't ready yet (500 /
  // connection error). A couple of retries absorb that without failing the session.
  // A terminal error (4xx client error) is thrown directly and NOT retried; only
  // transient failures (5xx, network) fall through to the retry loop. (A plain
  // `throw` inside the try would be swallowed by the catch and retried 4×.)
  class TerminalKeyError extends Error {}

  let lastErr: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt))
    try {
      const res = await fetch(`${baseUrl}/key/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_alias: `cc-${sessionId}`,
          max_budget: budgetUsd,
          // Hard duration so a key can't be reused indefinitely; matches session TTL.
          duration: `${Math.max(60, ttlSeconds)}s`,
          models,
          metadata: { feature: 'claude_code_analytics', session_id: sessionId },
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        // 5xx / connection issues are transient (cold gateway/DB) → retry. 4xx is
        // a real client error (bad master key, bad model) → fail fast.
        if (res.status >= 500) {
          lastErr = new Error(`LiteLLM key/generate ${res.status}: ${detail.slice(0, 200)}`)
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

export interface KeySpend {
  spentUsd: number
  budgetUsd: number | null
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
    const res = await fetch(`${baseUrl}/key/list?return_full_object=true`, {
      headers: { Authorization: `Bearer ${master}` },
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

/** Best-effort revoke when a session ends (the duration TTL also expires it). */
export async function revokeSessionKey(virtualKey: string): Promise<void> {
  if (!isGatewayConfigured()) return
  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  try {
    await fetch(`${baseUrl}/key/delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${master}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [virtualKey] }),
    })
  } catch {
    // TTL will expire it regardless.
  }
}
