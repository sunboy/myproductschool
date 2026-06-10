// lib/sandbox/cloud-sql-admin.ts — server-side only.
//
// Start/stop the LiteLLM gateway's Cloud SQL instance (cc-llm-db) ON DEMAND so it
// doesn't bill 24/7 while Claude Code Analytics is idle. Cloud SQL has no native
// scale-to-zero, so the app orchestrates it: session-start ensures the instance is
// RUNNABLE before minting a gateway key; the reaper stops it when no session is
// active. Toggling `settings.activationPolicy` between ALWAYS (running) and NEVER
// (stopped) via the SQL Admin API.
//
// Auth reuses the orchestrator SA from CLOUD_RUN_SA_JSON (cloud-platform scope
// already covers sqlservice.admin); the SA was granted roles/cloudsql.admin.
//
// All functions are best-effort + env-gated: if CC_SQL_INSTANCE or the SA env is
// absent (e.g. local dev without the gateway), they no-op so nothing breaks.

import { GoogleAuth } from 'google-auth-library'

const SQL_API = 'https://sqladmin.googleapis.com/v1'
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

interface SqlConfig {
  project: string
  instance: string
  saJson: string
}

function loadConfig(): SqlConfig | null {
  const project = process.env.GCP_PROJECT
  const instance = process.env.CC_SQL_INSTANCE // e.g. 'cc-llm-db'
  const saJson = process.env.CLOUD_RUN_SA_JSON
  if (!project || !instance || !saJson) return null
  return { project, instance, saJson }
}

/** Is on-demand SQL start/stop configured (gateway + SA env present)? */
export function isSqlAutostartConfigured(): boolean {
  return loadConfig() !== null
}

let authClient: GoogleAuth | null = null
async function getToken(saJson: string): Promise<string> {
  if (!authClient) {
    authClient = new GoogleAuth({ credentials: JSON.parse(saJson), scopes: [SCOPE] })
  }
  const client = await authClient.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to mint SQL Admin access token')
  return token
}

/**
 * Cloud SQL instance state: 'RUNNABLE' (up), 'SUSPENDED'/'STOPPED' (down via
 * activationPolicy NEVER), 'PENDING_CREATE', 'MAINTENANCE', etc. Returns null on
 * error / unconfigured.
 */
export async function getSqlInstanceState(): Promise<string | null> {
  const cfg = loadConfig()
  if (!cfg) return null
  try {
    const token = await getToken(cfg.saJson)
    const res = await fetch(`${SQL_API}/projects/${cfg.project}/instances/${cfg.instance}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { state?: string }
    return data.state ?? null
  } catch {
    return null
  }
}

async function patchActivationPolicy(
  cfg: SqlConfig,
  policy: 'ALWAYS' | 'NEVER',
): Promise<boolean> {
  const token = await getToken(cfg.saJson)
  // updateMask scopes the PATCH to just the activation policy so we don't touch
  // other settings (and don't need broader validate permissions).
  const res = await fetch(
    `${SQL_API}/projects/${cfg.project}/instances/${cfg.instance}?updateMask=settings.activationPolicy`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { activationPolicy: policy } }),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[cloud-sql] activationPolicy=${policy} PATCH failed (${res.status}): ${detail.slice(0, 300)}`)
    return false
  }
  return true
}

export interface EnsureRunnableResult {
  /** true if the instance is RUNNABLE (already up, or started within the deadline). */
  ready: boolean
  /** true if we issued a start (was not already running). */
  started: boolean
  /** Final observed state. */
  state: string | null
}

/**
 * Ensure cc-llm-db is RUNNABLE before the gateway is used. If stopped, PATCHes
 * activationPolicy=ALWAYS and polls until RUNNABLE or the deadline.
 *
 * deadlineMs defaults to 40s so the whole wake fits inside the session/start
 * route's 60s maxDuration WITH headroom for the key mint + sandbox boot that
 * follow. A platform timeout that fires mid-wait would skip the 503 cleanup and
 * strand the row in `provisioning` (which the reaper counts as live and so won't
 * stop SQL) — a permanent cost leak. The PATCH-to-ALWAYS persists regardless, so
 * the DB keeps booting in the background; a slightly-too-slow first start returns
 * a clean 503 and the user's retry finds it RUNNABLE.
 *
 * Even when already RUNNABLE we (idempotently) re-assert ALWAYS: a reaper that
 * counted zero sessions a moment earlier may have a delayed NEVER patch in flight;
 * re-asserting ALWAYS here wins that race so the session never mints against a DB
 * that's about to stop. No-op (ready:true) when unconfigured.
 */
export async function ensureSqlRunnable(deadlineMs = 40_000): Promise<EnsureRunnableResult> {
  const cfg = loadConfig()
  if (!cfg) return { ready: true, started: false, state: null } // unconfigured → don't block

  let state = await getSqlInstanceState()

  // Always assert ALWAYS (idempotent) to override any racing reaper NEVER patch.
  const patched = await patchActivationPolicy(cfg, 'ALWAYS')
  if (state === 'RUNNABLE') return { ready: patched, started: false, state }
  if (!patched) return { ready: false, started: false, state }

  const deadline = Date.now() + deadlineMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    state = await getSqlInstanceState()
    if (state === 'RUNNABLE') return { ready: true, started: true, state }
  }
  return { ready: false, started: true, state }
}

// States that mean the instance is already down (or being deleted) — a NEVER
// patch is pointless / invalid. Any OTHER state (RUNNABLE, or a transitional
// STARTING/PENDING/MAINTENANCE) must still get NEVER asserted, or an instance
// stuck mid-start with zero sessions would bill forever.
const ALREADY_DOWN = new Set(['STOPPED', 'SUSPENDED', 'PENDING_DELETE'])

/**
 * Stop cc-llm-db (activationPolicy=NEVER) to halt billing when idle. Best-effort +
 * idempotent. Returns true if a stop PATCH was issued. Asserts NEVER for ANY state
 * that isn't already down (including transitional STARTING/PENDING) so a half-woken
 * instance can't be left running. If the state read fails (null), we still assert
 * NEVER — failing toward "stopped" is the cost-safe default for an idle reaper.
 */
export async function stopSqlInstance(): Promise<boolean> {
  const cfg = loadConfig()
  if (!cfg) return false
  const state = await getSqlInstanceState()
  if (state && ALREADY_DOWN.has(state)) return false
  return patchActivationPolicy(cfg, 'NEVER')
}
