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
): Promise<VirtualKey | null> {
  if (!isGatewayConfigured()) return null

  const baseUrl = process.env.LLM_GATEWAY_URL!.replace(/\/$/, '')
  const master = process.env.LLM_GATEWAY_MASTER_KEY!
  const budgetUsd = parseFloat(process.env.CC_SESSION_BUDGET_USD ?? '0.50')

  const res = await fetch(`${baseUrl}/key/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${master}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key_alias: `cc-${sessionId}`,
      max_budget: budgetUsd,
      // Hard duration so a key can't be reused indefinitely; matches session TTL.
      duration: `${Math.max(60, ttlSeconds)}s`,
      models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
      metadata: { feature: 'claude_code_analytics', session_id: sessionId },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`LiteLLM key/generate failed (${res.status}): ${detail.slice(0, 300)}`)
  }

  const data = (await res.json()) as { key?: string }
  if (!data.key) throw new Error('LiteLLM key/generate returned no key')

  return { key: data.key, baseUrl, budgetUsd }
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
