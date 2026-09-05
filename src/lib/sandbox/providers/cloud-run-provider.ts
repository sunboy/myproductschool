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
import { resolveSessionTtlSeconds } from '../cost-policy'
import {
  planSessionTrafficCreate,
  planSessionTrafficRemoval,
} from '../cloud-run-traffic'

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
  /** Sterile revision that receives untagged service traffic. */
  baseRevision?: string
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
  const baseRevision = process.env.CLOUD_RUN_BASE_REVISION || undefined
  return { project, region, serviceName, wssHost, saJson, runtimeServiceAccount, image, baseRevision }
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

export interface CloudRunProviderDependencies {
  fetchFn: typeof fetch
  accessToken: () => Promise<string>
}

export class CloudRunProvider implements HostProvider {
  readonly name = 'cloud_run' as const

  constructor(private readonly dependencies: Partial<CloudRunProviderDependencies> = {}) {}

  private request(input: string | URL, init?: RequestInit): Promise<Response> {
    return (this.dependencies.fetchFn ?? globalThis.fetch)(input, init)
  }

  private accessToken(cfg: CloudRunConfig): Promise<string> {
    return this.dependencies.accessToken?.() ?? getToken(cfg)
  }

  // The per-session revision tag is a pure function of the session id, so the
  // orchestrator can reconstruct it for cleanup even when createSession threw
  // before returning a result (a partially-created revision still pins an
  // instance and must be deleted). Mirrors the module-level revisionTag().
  deriveHostInstanceId(sessionId: string): string {
    return revisionTag(sessionId)
  }

  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    const cfg = loadConfig()
    const token = await this.accessToken(cfg)
    const ttlSeconds = resolveSessionTtlSeconds(input.ttlSeconds)
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

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
    // append this session's tag with 0% traffic. An explicit sterile base
    // revision keeps 100% of untagged traffic; a user revision never becomes the
    // service's default target.
    const getRes = await this.request(`${RUN_API}/${servicePath}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!getRes.ok) {
      const detail = await getRes.text().catch(() => '')
      throw new Error(`Cloud Run service read failed (${getRes.status}): ${detail.slice(0, 300)}`)
    }
    const svc = await getRes.json()
    let createTraffic
    try {
      createTraffic = planSessionTrafficCreate(
        cfg.serviceName,
        svc,
        tag,
        revisionName,
        cfg.baseRevision,
      )
    } catch (err) {
      throw new SandboxUnconfiguredError(
        `${err instanceof Error ? err.message : String(err)}; set CLOUD_RUN_BASE_REVISION if needed.`,
      )
    }

    const body = {
      etag: createTraffic.etag,
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
        timeout: `${ttlSeconds}s`,
        containers: [
          {
            image: cfg.image,
            ports: [{ containerPort: 7681 }],
            // 1 vCPU is throttled at idle by default, which makes the per-session
            // cold boot slow + highly variable (16s–>50s observed → readiness
            // 503s). startupCpuBoost gives extra CPU during boot (fast, reliable
            // start), and cpuIdle:false keeps the vCPU unthrottled for the whole
            // session so the PTY bridge + `claude` stay responsive (mirrors the
            // gateway's cpu-throttling=false).
            //
            // Memory MUST be set explicitly here, not inherited from the service
            // template. The default 512Mi OOM-kills the instance the moment
            // `claude` does real work (Claude Code TUI + node-pty + the BigQuery
            // MCP subprocess + an in-flight query peaked at 512/512 MiB → SIGTERM
            // → the WHOLE instance is replaced → the browser lands on a fresh PTY
            // / bare shell, where xterm mouse reports echo as "11M"/"120" garbage).
            // The PTY-persistence fix survives a transient WS drop but cannot
            // survive an OOM that kills the process holding the PTY — so the real
            // fix for "reconnecting → bare shell" is enough headroom. 2Gi gives
            // Claude + the MCP query comfortable room on 1 vCPU.
            resources: {
              limits: { cpu: '1', memory: '2Gi' },
              startupCpuBoost: true,
              cpuIdle: false,
            },
            // HOST_ID lets the in-container PTY bridge cross-check the token's
            // host segment (generalizes the old FLY_MACHINE_ID check).
            env: [
              ...Object.entries(input.env).map(([name, value]) => ({ name, value })),
              { name: 'HOST_ID', value: tag },
            ],
          },
        ],
      },
      traffic: createTraffic.traffic,
    }

    const res = await this.request(`${RUN_API}/${servicePath}`, {
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

  // Poll the REVISION's Ready condition (control-plane truth that the container
  // is up + healthy), NOT the tagged HTTP URL. The tagged `<tag>---host` route
  // propagates on a slower path and 404s for a variable time after the revision
  // is already Ready (~5s) — polling it caused the readiness 503s. The browser's
  // WS connect (with its own reconnect backoff) absorbs any residual route lag.
  async awaitReady(hostInstanceId: string, deadlineMs: number): Promise<boolean> {
    let cfg: CloudRunConfig
    try {
      cfg = loadConfig()
    } catch {
      return false
    }
    const token = await this.accessToken(cfg)
    const revName = `${cfg.serviceName}-${hostInstanceId}`
    const revPath = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}/revisions/${revName}`
    const deadline = Date.now() + deadlineMs

    while (Date.now() < deadline) {
      try {
        const res = await this.request(`${RUN_API}/${revPath}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const rev = await res.json()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const conds: any[] = Array.isArray(rev?.conditions) ? rev.conditions : []
          const ready = conds.find((c) => c?.type === 'Ready')
          if (ready?.state === 'CONDITION_SUCCEEDED' || ready?.status === 'True') return true
          // A terminal failure → stop early.
          if (ready?.state === 'CONDITION_FAILED') return false
        }
      } catch {
        // transient — keep polling
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    return false
  }

  async destroySession(hostInstanceId: string): Promise<void> {
    // hostInstanceId is the revision tag. Teardown is two steps and ORDER MATTERS:
    //   1. Remove this tag from the service's traffic array (read-modify-write
    //      PATCH, keeping every OTHER live session's tag).
    //   2. Delete the revision.
    // A tagged revision CANNOT be deleted while the tag still references it, so
    // skipping step 1 silently leaks the tag — and because each tagged revision
    // pins minInstanceCount=1, leaked tags accumulate into a bloated traffic
    // config (slow PATCH reconciles → readiness timeouts) AND held warm instances
    // (real cost). This must succeed, not be fire-and-forget-and-hope.
    let cfg: CloudRunConfig
    try {
      cfg = loadConfig()
    } catch {
      return // unconfigured: nothing to destroy
    }

    const token = await this.accessToken(cfg)
    const servicePath = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}`
    const revName = `${cfg.serviceName}-${hostInstanceId}`

    // Step 1: drop this session's tag from traffic. The service etag makes a
    // concurrent session update fail instead of silently losing another tag.
    let trafficDetached = false
    try {
      const getRes = await this.request(`${RUN_API}/${servicePath}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (getRes.ok) {
        const svc = await getRes.json()
        const removal = planSessionTrafficRemoval(
          cfg.serviceName,
          svc,
          hostInstanceId,
          cfg.baseRevision,
        )
        // updateMask=traffic scopes the PATCH to the traffic field only, so Cloud
        // Run doesn't re-validate the template's serviceAccount (which would need
        // iam.serviceAccounts.actAs and 403 for the orchestrator SA).
        const patchRes = await this.request(`${RUN_API}/${servicePath}?updateMask=traffic`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            traffic: removal.traffic,
            etag: removal.etag,
          }),
        })
        trafficDetached = patchRes.ok
        if (!patchRes.ok) {
          const detail = await patchRes.text().catch(() => '')
          console.error(
            `[cloud-run] traffic detach failed (${patchRes.status}): ${detail.slice(0, 300)}`,
          )
        }
      }
    } catch (err) {
      console.error('[cloud-run] traffic detach threw:', err)
    }
    if (!trafficDetached) {
      // Continue only after a conclusive, conflict-free tag removal. The reaper
      // will retry with a fresh service etag on its next sweep.
      throw new Error(`Failed to detach session traffic tag ${hostInstanceId}`)
    }

    // Step 2: delete the now-untagged revision (releases its pinned instance).
    const revPath = `${servicePath}/revisions/${revName}`
    let deleted = false
    try {
      const delRes = await this.request(`${RUN_API}/${revPath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      // 404 = already gone (fine). 2xx = deleted. Anything else we must NOT
      // swallow blindly: the prior code ignored the response and a silent
      // failure here leaked a pinned minScale=1 instance indefinitely.
      if (delRes.ok || delRes.status === 404) {
        deleted = true
      } else {
        const detail = await delRes.text().catch(() => '')
        // The one expected, recoverable failure: a per-session revision becomes
        // the service's `latestCreatedRevision`, and Cloud Run refuses to delete
        // the latest-created revision ("FAILED_PRECONDITION: The latest created
        // Revision ... cannot be directly deleted"). Its instance is still pinned
        // (minScale=1) and billing. Recover by bumping the base service to make a
        // NEW latest-created revision, which un-blocks the delete.
        if (delRes.status === 400 && /latest created Revision/i.test(detail)) {
          await this.bumpLatestRevision(cfg, token, hostInstanceId)
          const retry = await this.request(`${RUN_API}/${revPath}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          deleted = retry.ok || retry.status === 404
          if (!deleted) {
            console.error(
              `[cloud-run] revision delete still failed after base bump (${retry.status}): ${revName}`,
            )
          }
        } else {
          console.error(`[cloud-run] revision delete failed (${delRes.status}): ${detail.slice(0, 300)}`)
        }
      }
    } catch (err) {
      console.error('[cloud-run] revision delete threw:', err)
    }
    if (!deleted) {
      // Surface so the reaper counts it as a failure (not a phantom success) and
      // retries on the next sweep, rather than reporting orphans_reaped for an
      // instance that is in fact still billing.
      throw new Error(`Failed to delete session revision ${revName}`)
    }
  }

  // Bump the base service to mint a fresh latest-created revision, so a stuck
  // per-session revision (which had become latestCreatedRevision and was thus
  // undeletable) can be deleted. The bump revision is minScale=0 (no instance,
  // no cost) and becomes deletable itself once a later session/bump supersedes
  // it. Scoped via updateMask=template so we don't touch traffic. Idempotent
  // label toggle keeps the change minimal.
  private async bumpLatestRevision(cfg: CloudRunConfig, token: string, stuckHostId: string): Promise<void> {
    const servicePath = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}`
    try {
      const getRes = await this.request(`${RUN_API}/${servicePath}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!getRes.ok) return
      const svc = await getRes.json()
      const etag = typeof svc?.etag === 'string' ? svc.etag.trim() : ''
      if (!etag) {
        console.error('[cloud-run] base bump skipped: service response has no etag')
        return
      }
      // Build a STERILE base template from scratch rather than cloning svc.template
      // — after a createSession PATCH the service template still carries that
      // session's env (incl. ANTHROPIC_API_KEY, HOST_ID, BigQuery creds), pinned
      // scaling, and per-session timeout. Cloning it would bake a user session's
      // secrets into a base bump revision. Instead emit only what a no-op base
      // revision needs: the image, minScale=0 (no instance → no cost), and a
      // toggled marker label to force a new (latest) revision. No `revision` field
      // so Cloud Run auto-names it (cc-sandbox-NNNNN-xxx, the base pattern) instead
      // of 409ing on the pinned per-session name.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing: any = svc.template ?? {}
      const bumpFlag = existing?.labels?.['cc-reap-bump'] === '1' ? '0' : '1'
      const template = {
        labels: { 'cc-reap-bump': bumpFlag },
        scaling: { minInstanceCount: 0 },
        serviceAccount: cfg.runtimeServiceAccount,
        containers: [{ image: cfg.image, ports: [{ containerPort: 7681 }] }],
      }
      const patchRes = await this.request(`${RUN_API}/${servicePath}?updateMask=template`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, etag }),
      })
      if (!patchRes.ok) {
        console.error(`[cloud-run] base bump PATCH failed (${patchRes.status}):`, (await patchRes.text()).slice(0, 300))
        return
      }
      // The new revision is created asynchronously; the retry DELETE only
      // succeeds once latestCreatedRevision has moved OFF the stuck revision.
      // Poll briefly until it changes (or give up after a short budget — the
      // reaper will retry the whole teardown on its next sweep).
      const stuckName = `${servicePath}/revisions/${cfg.serviceName}-${stuckHostId}`
      const deadline = Date.now() + 25_000
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000))
        const chk = await this.request(`${RUN_API}/${servicePath}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!chk.ok) continue
        const cur = await chk.json()
        const latest: string = cur?.latestCreatedRevision ?? ''
        if (latest && latest !== stuckName) break
      }
    } catch (err) {
      console.error('[cloud-run] base bump failed:', err)
    }
  }

  // Enumerate live PER-SESSION revisions so the reaper can find orphans (a live
  // revision whose session row is no longer active). Per-session revisions are
  // named `${serviceName}-${tag}` where tag = revisionTag(sessionId) = `s` + up
  // to 20 [a-z0-9]. Base-service revisions are named `${serviceName}-NNNNN-xxx`
  // (a 5-digit generation + suffix), which we exclude. We return the TAG
  // (hostInstanceId) for each, matching what destroySession expects.
  async listSessionHostIds(): Promise<string[]> {
    let cfg: CloudRunConfig
    try {
      cfg = loadConfig()
    } catch {
      return []
    }
    let token: string
    try {
      token = await this.accessToken(cfg)
    } catch {
      return []
    }
    const parent = `projects/${cfg.project}/locations/${cfg.region}/services/${cfg.serviceName}`
    const prefix = `${cfg.serviceName}-`
    // Base-service auto revisions: `${serviceName}-<5+ digits>-<suffix>`.
    const baseRevision = /^\d{5,}-/
    const hostIds: string[] = []
    let pageToken: string | undefined
    try {
      do {
        const url = new URL(`${RUN_API}/${parent}/revisions`)
        url.searchParams.set('pageSize', '500')
        if (pageToken) url.searchParams.set('pageToken', pageToken)
        const res = await this.request(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) break
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const revs: any[] = Array.isArray(data?.revisions) ? data.revisions : []
        for (const rev of revs) {
          const full: string = rev?.name ?? ''
          const short = full.split('/').pop() ?? ''
          if (!short.startsWith(prefix)) continue
          const tail = short.slice(prefix.length)
          if (baseRevision.test(tail)) continue // base-service auto revision
          if (!tail.startsWith('s')) continue // not a per-session tag
          hostIds.push(tail)
        }
        pageToken = data?.nextPageToken || undefined
      } while (pageToken)
    } catch {
      return hostIds
    }
    return hostIds
  }
}
