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

export interface SqlInstanceInfo {
  /**
   * Reported `state`: 'RUNNABLE', 'SUSPENDED', 'PENDING_CREATE', 'MAINTENANCE',
   * etc. GOTCHA: a Cloud SQL instance that has been STOPPED via
   * activationPolicy=NEVER still reports state 'RUNNABLE' (RUNNABLE means "the
   * instance CAN run", not "is currently running"). Whether it is actually
   * running lives in `activationPolicy`, not `state`. Do not infer stopped-ness
   * from `state`.
   */
  state: string | null
  /** 'ALWAYS' (running), 'NEVER' (stopped), 'ON_DEMAND', or null if unknown. */
  activationPolicy: string | null
}

/**
 * Read the Cloud SQL instance's `state` and `settings.activationPolicy`. Returns
 * {state:null, activationPolicy:null} on error / unconfigured. See SqlInstanceInfo
 * for why `activationPolicy` (not `state`) is the source of truth for running-ness.
 */
export async function getSqlInstanceInfo(): Promise<SqlInstanceInfo> {
  const cfg = loadConfig()
  if (!cfg) return { state: null, activationPolicy: null }
  try {
    const token = await getToken(cfg.saJson)
    const res = await fetch(`${SQL_API}/projects/${cfg.project}/instances/${cfg.instance}`, {
      signal: AbortSignal.timeout(5_000),
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { state: null, activationPolicy: null }
    const data = (await res.json()) as { state?: string; settings?: { activationPolicy?: string } }
    return { state: data.state ?? null, activationPolicy: data.settings?.activationPolicy ?? null }
  } catch {
    return { state: null, activationPolicy: null }
  }
}

/**
 * Cloud SQL instance `state` only. Returns null on error / unconfigured. NOTE:
 * `state` does NOT reflect stopped-ness (a NEVER-stopped instance still reads
 * RUNNABLE) — use getSqlInstanceInfo().activationPolicy for that.
 */
export async function getSqlInstanceState(): Promise<string | null> {
  return (await getSqlInstanceInfo()).state
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
      signal: AbortSignal.timeout(5_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { activationPolicy: policy } }),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    // Benign case: GCP rejects a NEVER patch when the instance is ALREADY stopped
    // ("Instance properties other than activation policy are not allowed to be
    // updated when the instance is stopped..."). The desired end state (stopped)
    // already holds, so treat it as success and log at info — NOT error — so a
    // genuine stop failure still surfaces at error level instead of being drowned
    // in this once-every-10-min noise. (This should now be rare since
    // stopSqlInstance gates on activationPolicy, but keep it as belt-and-braces.)
    if (
      policy === 'NEVER' &&
      res.status === 400 &&
      /not allowed to be updated when the instance is stopped/i.test(detail)
    ) {
      console.info('[cloud-sql] NEVER patch skipped — instance already stopped')
      return true
    }
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

  // Already up → READY regardless of the re-assert PATCH. The PATCH to ALWAYS is a
  // best-effort guard against a racing reaper NEVER patch, but it can 409
  // ("another operation already in progress") when a concurrent provision or an
  // admin op is mid-flight. A 409 there is BENIGN — the instance is RUNNABLE and
  // fully usable, so we must NOT fail-close the session on it. (Bug: `ready:
  // patched` returned ready=false on a 409 even though SQL was up, surfacing as
  // "cc-llm-db not RUNNABLE in time (state: RUNNABLE)" → spurious 503.)
  const patched = await patchActivationPolicy(cfg, 'ALWAYS')
  if (state === 'RUNNABLE') return { ready: true, started: false, state }
  if (!patched) return { ready: false, started: false, state }

  const deadline = Date.now() + deadlineMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    state = await getSqlInstanceState()
    if (state === 'RUNNABLE') return { ready: true, started: true, state }
  }
  return { ready: false, started: true, state }
}

/**
 * Stop cc-llm-db (activationPolicy=NEVER) to halt billing when idle. Best-effort +
 * idempotent. Returns true if the instance is (or was already) stopped.
 *
 * Gates on `activationPolicy`, NOT `state`: a NEVER-stopped instance still reports
 * state 'RUNNABLE', so the old state-based guard ({STOPPED,SUSPENDED,...}) never
 * matched and this re-issued a NEVER patch on every idle run — which GCP rejects
 * with a 400 ("...not allowed to be updated when the instance is stopped...").
 * That produced ~one 400 every 10 minutes (386 in a week) with no functional
 * effect (the DB was already stopped). Reading activationPolicy first lets us skip
 * the pointless patch entirely.
 *
 * If the read fails (activationPolicy null), we still assert NEVER — failing toward
 * "stopped" is the cost-safe default for an idle reaper, and patchActivationPolicy
 * now treats the "already stopped" 400 as benign so the fallback can't spam errors.
 */
export async function stopSqlInstance(): Promise<boolean> {
  const cfg = loadConfig()
  if (!cfg) return false
  const { activationPolicy } = await getSqlInstanceInfo()
  // Already stopped → nothing to do (and a patch would 400).
  if (activationPolicy === 'NEVER') return true
  return patchActivationPolicy(cfg, 'NEVER')
}
