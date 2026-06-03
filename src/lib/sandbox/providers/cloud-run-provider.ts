// lib/sandbox/providers/cloud-run-provider.ts — server-side only.
//
// Runs the hackproduct-cc-sandbox container on GCP Cloud Run (gVisor isolation,
// scale-to-zero). Each session targets a Cloud Run service configured for
// concurrency=1 so one browser session maps to one container instance.
//
// Auth: a service-account JSON in CLOUD_RUN_SA_JSON mints an access token via
// google-auth-library (dev uses the gcloud MCP; prod uses the SA, per the plan).
// We call the Cloud Run Admin API (run.googleapis.com/v2) over REST rather than
// pulling in the full @google-cloud/run SDK — one dependency, smaller surface.
//
// Requires: `npm i google-auth-library`.

import { GoogleAuth } from 'google-auth-library'
import {
  type HostProvider,
  type CreateSessionInput,
  type CreateSessionResult,
  SandboxUnconfiguredError,
} from '../types'
import { buildWssUrl } from '../session-token'

const RUN_API = 'https://run.googleapis.com/v2'
const TOKEN_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

interface CloudRunConfig {
  project: string
  region: string
  /** The pre-deployed service that runs the sandbox image. */
  serviceName: string
  /** Public WSS hostname fronting the service (e.g. sandbox.hackproduct.dev). */
  wssHost: string
  saJson: string
  /** Runtime SA the per-session revision runs as (read-only BigQuery identity). */
  runtimeServiceAccount: string
  /** Container image for the sandbox (PATCH must supply it explicitly). */
  image: string
}

function loadConfig(): CloudRunConfig {
  const project = process.env.GCP_PROJECT
  const region = process.env.CLOUD_RUN_REGION
  const serviceName = process.env.CLOUD_RUN_SERVICE
  const wssHost = process.env.SANDBOX_WSS_HOST
  const saJson = process.env.CLOUD_RUN_SA_JSON
  if (!project || !region || !serviceName || !wssHost || !saJson) {
    throw new SandboxUnconfiguredError(
      'Cloud Run provider missing env (GCP_PROJECT, CLOUD_RUN_REGION, CLOUD_RUN_SERVICE, SANDBOX_WSS_HOST, CLOUD_RUN_SA_JSON).',
    )
  }
  const runtimeServiceAccount =
    process.env.CLOUD_RUN_RUNTIME_SA ?? `cc-bq-readonly@${project}.iam.gserviceaccount.com`
  // The v2 PATCH replaces the template, so the container image must be supplied
  // explicitly (it is not inherited). Defaults to the standard AR path.
  const image =
    process.env.CLOUD_RUN_IMAGE ??
    `${region}-docker.pkg.dev/${project}/cc/sandbox:mvp`
  return { project, region, serviceName, wssHost, saJson, runtimeServiceAccount, image }
}

let authClient: GoogleAuth | null = null
function getAuth(saJson: string): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      credentials: JSON.parse(saJson),
      scopes: [TOKEN_SCOPE],
    })
  }
  return authClient
}

// Cloud Run revision tags: lowercase alphanumeric + hyphens, must start with a
// letter, max 63 chars. Derive a stable, unique tag from the session id.
function revisionTag(sessionId: string): string {
  const cleaned = sessionId.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `s${cleaned.slice(0, 20)}`
}

async function getToken(cfg: CloudRunConfig): Promise<string> {
  const client = await getAuth(cfg.saJson).getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new SandboxUnconfiguredError('Failed to mint Cloud Run access token.')
  return token
}

export class CloudRunProvider implements HostProvider {
  readonly name = 'cloud_run' as const

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const cfg = loadConfig()
    const token = await getToken(cfg)
    const expiresAt = new Date(Date.now() + input.ttlSeconds * 1000).toISOString()

    // Per-session isolation via TAGGED revisions (the supported Cloud Run pattern
    // for addressing a specific revision independent of traffic split). Each
    // session gets its own revision + a tag that yields a stable dedicated URL
    // (https://<tag>---<service-base>). We assign the tag with 0% production
    // traffic so the shared service's traffic routing is never disturbed and
    // concurrent sessions don't clobber each other. The browser connects to the
    // tagged URL, so it always lands on this session's own revision/container.
    const tag = revisionTag(input.sessionId)
    const revisionName = `${cfg.serviceName}-${tag}`
    const servicePath = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}`

    // Read-modify-write the traffic array. A single shared service's traffic list
    // must accumulate one tagged target per concurrent session; a wholesale
    // replace would drop other live sessions' tags (404-ing their URLs). So we
    // fetch the current service, keep all existing REVISION-tagged targets, and
    // append this session's tag with 0% traffic. LATEST keeps 100% of prod.
    const getRes = await fetch(`${RUN_API}/${servicePath}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existingTraffic: any[] = []
    if (getRes.ok) {
      const svc = await getRes.json()
      existingTraffic = Array.isArray(svc.traffic) ? svc.traffic : []
    }
    const keptTagged = existingTraffic.filter(
      (t) => t?.type === 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION' && t?.tag && t.tag !== tag,
    )
    const traffic = [
      { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
      ...keptTagged,
      { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: revisionName, tag, percent: 0 },
    ]

    const body = {
      template: {
        revision: revisionName,
        serviceAccount: cfg.runtimeServiceAccount,
        // This revision carries 0% production traffic, so Cloud Run will NOT
        // hold an instance for it via traffic routing. A WebSocket session must
        // keep one warm instance for its whole lifetime, otherwise the instance
        // scales to zero between the readiness poll and the browser's WS connect
        // and the upgrade fails with "no available instance" (HTTP 500). Pin
        // minInstanceCount=1 so the session's instance stays up; the instance is
        // released when finalize deletes the revision (or the TTL expires).
        scaling: { minInstanceCount: 1, maxInstanceCount: 1 },
        // One session is one user, but a single WS lifecycle overlaps several
        // requests: the orchestrator's /health readiness probe, the browser's
        // WS, and any reconnect attempt. With concurrency=1 those starve each
        // other on the lone instance ("no available instance" on the tagged
        // route), so the first browser connect fails and triggers a reconnect
        // storm. Allow a few concurrent requests so the probe + WS + a reconnect
        // coexist on the same instance. The PTY bridge still scopes one shell
        // per connection, so this does not multiplex sessions.
        maxInstanceRequestConcurrency: 6,
        timeout: `${input.ttlSeconds}s`,
        containers: [
          {
            image: cfg.image,
            ports: [{ containerPort: 7681 }],
            // HOST_ID lets the in-container PTY bridge cross-check the token's
            // host segment (generalizes the old FLY_MACHINE_ID check).
            env: [
              ...Object.entries(input.env).map(([name, value]) => ({ name, value })),
              { name: 'HOST_ID', value: tag },
            ],
          },
        ],
      },
      traffic,
    }

    const res = await fetch(`${RUN_API}/${servicePath}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Cloud Run createSession failed (${res.status}): ${detail.slice(0, 500)}`)
    }

    // Tagged URL: <tag>---<service-base-host>. cfg.wssHost is the bare service host
    // (e.g. cc-sandbox-xxxxx.us-central1.run.app); the tagged host prefixes it.
    const taggedHost = `${tag}---${cfg.wssHost}`
    const wssUrl = buildWssUrl(taggedHost, input.sessionId, tag, input.env.SESSION_TOKEN_SECRET)

    return {
      hostInstanceId: tag,
      hostApp: cfg.serviceName,
      provider: 'cloud_run',
      wssUrl,
      expiresAt,
    }
  }

  async destroySession(hostInstanceId: string): Promise<void> {
    // hostInstanceId is the revision tag. A tagged revision can't be deleted
    // while the tag still references it, so this is best-effort: deleting the
    // revision also drops its tag from the traffic config (per Cloud Run docs).
    // The revision scales to zero on idle/timeout regardless, so leaking one is
    // not a cost concern — teardown just tidies up.
    let cfg: CloudRunConfig
    try {
      cfg = loadConfig()
    } catch {
      return // unconfigured: nothing to destroy
    }
    try {
      const token = await getToken(cfg)
      const revName = `${cfg.serviceName}-${hostInstanceId}`
      const revPath = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}/revisions/${revName}`
      await fetch(`${RUN_API}/${revPath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // already gone / scaled to zero — fine.
    }
  }
}
