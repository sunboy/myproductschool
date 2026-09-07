// lib/sandbox/types.ts — server-side only.
//
// Portable host abstraction for Claude Code Analytics sessions. The orchestrator
// (Next.js API routes) talks to a HostProvider, never to a specific cloud. The
// active provider is chosen by the SANDBOX_PROVIDER env var, mirroring how
// lib/judge0/client.ts isolates its execution backend.
//
// Today: CloudRunProvider (GCP Cloud Run + gVisor). The interface is shaped so a
// future E2BProvider, GKEProvider, or FlyProvider is a drop-in, not a rewrite.

export type SandboxProviderName = 'cloud_run' | 'gke' | 'e2b' | 'fly'

export class SandboxUnconfiguredError extends Error {
  readonly isUnconfigured = true
  constructor(message = 'Sandbox host not configured. Please contact support.') {
    super(message)
  }
}

export class SandboxCapacityError extends Error {
  readonly isCapacity = true
  constructor(message = 'No sandbox capacity available right now.') {
    super(message)
  }
}

/**
 * Environment handed to the container at spawn time. Matches the contract the
 * recovered container reads (see infra/claude-code-sandbox/entrypoint.sh and
 * entrypoint-pty.js): the PTY/WSS bridge validates a token signed with
 * SESSION_TOKEN_SECRET, and the autosave loop POSTs the workspace tarball to
 * ORCHESTRATOR_SNAPSHOT_URL with SNAPSHOT_AUTH_TOKEN.
 */
export interface SessionEnv {
  ANTHROPIC_API_KEY: string
  /** When set, the `claude` CLI routes through the LiteLLM gateway (per-session
   *  virtual key + hard spend cap) instead of calling Anthropic directly. */
  ANTHROPIC_BASE_URL?: string
  /** Pin the CLI's main model so it requests a model the gateway serves natively
   *  (avoids the opus-4-7→Sonnet remap + Opus-only param 400s). */
  ANTHROPIC_MODEL?: string
  /** The CLI's small/fast model (background tasks). */
  ANTHROPIC_SMALL_FAST_MODEL?: string
  ANTHROPIC_BUDGET_USD?: string
  SESSION_ID: string
  /** HMAC secret the in-container WSS bridge validates the connection token against. */
  SESSION_TOKEN_SECRET: string
  /** Read-only BigQuery service-account JSON for the in-container MCP server. */
  GOOGLE_APPLICATION_CREDENTIALS_JSON?: string
  /** Data coordinates — where the tables live (e.g. bigquery-public-data). */
  BQ_PROJECT?: string
  BQ_DATASET?: string
  /** Project that query jobs run/bill in (our SA has jobUser here). Lets a
   *  challenge point BQ_PROJECT at a public-data project while we pay. */
  BQ_BILLING_PROJECT?: string
  /** Presigned URL the container pulls the challenge starter tarball from.
   *  Authored flat (relative to /workspace); extracted with `-C /workspace`. */
  CHALLENGE_TARBALL_URL?: string
  /** JSON array of extra Claude permission-allowlist entries the entrypoint
   *  merges into settings.json (and removes from the deny list). Lab-supplied,
   *  e.g. the debugging lab allows Bash(npm:*). */
  CC_EXTRA_ALLOWED_TOOLS?: string
  /** Presigned URL of a prior session's workspace AUTOSAVE snapshot, used to
   *  rehydrate /workspace on resume so a returning user doesn't start over. The
   *  autosave tarball is rooted at `workspace/`, so the entrypoint extracts it
   *  with `--strip-components=1` (distinct from CHALLENGE_TARBALL_URL). */
  WORKSPACE_RESTORE_URL?: string
  /** CLAUDE.md content seeded into /workspace. */
  CLAUDE_MD?: string
  /** Orchestrator endpoint the 30s autosave loop POSTs the workspace tarball to. */
  ORCHESTRATOR_SNAPSHOT_URL?: string
  /** Bearer token the autosave POST authenticates with. */
  SNAPSHOT_AUTH_TOKEN?: string
  /** Presigned download of the user's prior ~/.claude state (MCP regs + skills). */
  USER_CLAUDE_STATE_URL?: string
  /** Endpoint the autosave loop POSTs the per-user ~/.claude snapshot to. */
  USER_STATE_SNAPSHOT_URL?: string
}

export interface CreateSessionInput {
  sessionId: string
  env: SessionEnv
  ttlSeconds: number
}

export interface CreateSessionResult {
  /** Provider-specific instance/service id (-> claude_code_sessions.host_instance_id). */
  hostInstanceId: string
  /** Provider grouping (e.g. Cloud Run service name) (-> host_app). */
  hostApp: string
  provider: SandboxProviderName
  /** wss endpoint the browser connects to (-> wss_url). */
  wssUrl: string
  expiresAt: string
}

/**
 * A host provider owns the lifecycle of a session sandbox. For Cloud Run a
 * "session" is one service revision/instance with concurrency=1; for a packed
 * provider (GKE) it is one container on a shared node. The orchestrator does not
 * care which.
 */
export interface HostProvider {
  readonly name: SandboxProviderName
  /** Provision a sandbox for a session and return the connection info. */
  createSession(input: CreateSessionInput): Promise<CreateSessionResult>
  /**
   * Wait until the session's compute is actually serving, returning true if it
   * became ready before the deadline. For Cloud Run this polls the revision's
   * Ready condition (fast, ~5s) rather than the tagged HTTP route (whose
   * propagation lags and caused readiness 503s). hostInstanceId is the value
   * returned as CreateSessionResult.hostInstanceId.
   */
  awaitReady(hostInstanceId: string, deadlineMs: number): Promise<boolean>
  /** Tear a session sandbox down. Best-effort; must not throw on already-gone. */
  destroySession(hostInstanceId: string, options?: { signal?: AbortSignal }): Promise<void>
  /**
   * Derive the hostInstanceId a session WOULD get, without provisioning. Lets the
   * orchestrator tear down a partially-created sandbox in createSession's error
   * path (where no CreateSessionResult exists yet) without knowing provider
   * internals. For Cloud Run this is the deterministic per-session revision tag.
   * Optional: providers without a deterministic id may omit it.
   */
  deriveHostInstanceId?(sessionId: string): string
  /**
   * List the hostInstanceIds of all CURRENTLY-LIVE per-session sandboxes the
   * provider is holding (Cloud Run: every per-session tagged revision that still
   * exists). The reaper diffs this against the session table to find ORPHANS —
   * live compute with no active session row — and tears them down. This is the
   * backstop that self-heals any teardown a writer dropped. Optional: providers
   * that can't enumerate live sessions may omit it (the reaper then skips the
   * orphan sweep). Returns [] on error, never throws.
   */
  listSessionHostIds?(options?: { signal?: AbortSignal }): Promise<string[]>
}
