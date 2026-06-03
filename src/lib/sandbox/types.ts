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
  ANTHROPIC_BUDGET_USD?: string
  SESSION_ID: string
  /** HMAC secret the in-container WSS bridge validates the connection token against. */
  SESSION_TOKEN_SECRET: string
  /** Read-only BigQuery service-account JSON for the in-container MCP server. */
  GOOGLE_APPLICATION_CREDENTIALS_JSON?: string
  BQ_PROJECT?: string
  BQ_DATASET?: string
  /** Presigned URL the container pulls the challenge starter tarball from. */
  CHALLENGE_TARBALL_URL?: string
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
  /** Tear a session sandbox down. Best-effort; must not throw on already-gone. */
  destroySession(hostInstanceId: string): Promise<void>
}
