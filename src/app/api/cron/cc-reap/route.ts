// GET /api/cron/cc-reap
//
// Idle reaper for Claude Code Analytics sandboxes. Each active session pins one
// Cloud Run instance (1 vCPU, min=max=1) until revision deletion. The request
// timeout alone does not release pinned compute, which is the real cap on
// concurrent users. This sweep frees the INSTANCE of any `active` session whose
// last_activity_at is stale, WITHOUT losing work: the workspace autosaves every
// 30s, so the session is set to `idle` (resumable), not `terminated` (finalized).
// A returning user re-provisions a fresh container hydrated from the last
// autosave (see session/start WORKSPACE_RESTORE_URL).
//
// This is the backstop for the closed-tab case; the client idle modal handles
// the polite tab-open case. Auth: CRON_SECRET bearer.
//
// SCHEDULING: driven by SUPABASE pg_cron (job 'cc-reap-10min', every 10 min),
// NOT a vercel.json cron — the Vercel plan caps sub-daily cron frequency. pg_cron
// calls this endpoint via pg_net with the CRON_SECRET from Vault. See migration
// 20260606120000_cc_reap_pg_cron.sql. This also runs the spend snapshot (below).

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import { reaperRemainingMs } from '@/lib/sandbox/reaper-budget'
import { canStopGatewaySql, claimExpiredProvisioning, provisioningLeaseCutoff } from '@/lib/sandbox/provisioning-lease'
import { recordSessionSpend } from '@/lib/sandbox/record-spend'
import { blockSessionKey } from '@/lib/sandbox/llm-gateway'
import { runSpendSnapshot } from '@/lib/sandbox/spend-snapshot'
import { stopSqlInstance, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Reap an active session after this long with no activity. Generous so a user
// who steps away briefly keeps their warm instance (instant reconnect); past it
// the instance is freed and the user resumes from autosave. Override via env.
const IDLE_REAP_SECONDS = parseInt(process.env.CC_IDLE_REAP_SECONDS ?? '900', 10) // 15 min
const KEY_BLOCK_BATCH_LIMIT = 12

type KeyBlockSummary = {
  attempted: number
  blocked: number
  alreadyBlocked: number
  notFound: number
  failed: number
  deferred: number
}

async function blockEndedSessionKeys(sessionIds: string[], timeoutMs: number): Promise<KeyBlockSummary> {
  const unique = [...new Set(sessionIds)].slice(0, KEY_BLOCK_BATCH_LIMIT)
  const results = await Promise.all(unique.map((sessionId) => blockSessionKey(sessionId, timeoutMs)))
  const summary: KeyBlockSummary = {
    attempted: unique.length,
    blocked: 0,
    alreadyBlocked: 0,
    notFound: 0,
    failed: 0,
    deferred: Math.max(0, new Set(sessionIds).size - unique.length),
  }
  for (const result of results) {
    if (result.status === 'blocked') summary.blocked++
    else if (result.status === 'already_blocked') summary.alreadyBlocked++
    else if (result.status === 'not_found') summary.notFound++
    else if (result.status === 'failed') summary.failed++
  }
  return summary
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - IDLE_REAP_SECONDS * 1000).toISOString()

  // Active sessions whose last activity is older than the idle cutoff. Also
  // catch any past their TTL that the lazy /state flip never ran for.
  const now = new Date()
  const nowIso = now.toISOString()
  const { data: stale, error } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, host_instance_id, last_activity_at, expires_at')
    .eq('status', 'active')
    .or(`last_activity_at.lt.${cutoff},expires_at.lt.${nowIso}`)
    .limit(200)

  if (error) {
    console.error('[cc-reap] query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let expiredStarts: Awaited<ReturnType<typeof claimExpiredProvisioning>>
  try {
    // CAS before teardown: a readiness poll that already activated the session
    // wins and is excluded; a claim winner cannot subsequently be activated.
    expiredStarts = await claimExpiredProvisioning(admin, now)
  } catch (err) {
    console.error('[cc-reap] stale provisioning claim failed:', err)
    return NextResponse.json({ error: 'Could not reclaim stale provisioning' }, { status: 500 })
  }
  const sessions = [...(stale ?? []), ...expiredStarts]
  const sandbox = getSandbox()
  let reaped = 0
  let sessionsDeferred = 0
  const failures: string[] = []
  let keyBlocks: KeyBlockSummary = {
    attempted: 0,
    blocked: 0,
    alreadyBlocked: 0,
    notFound: 0,
    failed: 0,
    deferred: sessions.length,
  }

  // Block credentials first, while the gateway is already expected to be
  // awake for these ending sessions. The batch and wall clock are bounded so
  // teardown still has most of the sessions phase budget.
  const keyBlockBudget = Math.min(3000, reaperRemainingMs(startedAt, 'sessions'))
  if (sessions.length > 0 && keyBlockBudget >= 500) {
    keyBlocks = await blockEndedSessionKeys(
      sessions.map((session) => session.id as string),
      keyBlockBudget,
    )
    if (keyBlocks.failed > 0 || keyBlocks.notFound > 0) {
      console.error('[cc-reap] session key block incomplete', {
        failed: keyBlocks.failed,
        not_found: keyBlocks.notFound,
      })
    }
  }

  for (const s of sessions) {
    if (reaperRemainingMs(startedAt, 'sessions') < 1_000) {
      sessionsDeferred++
      continue
    }
    const hostId = s.host_instance_id as string | null
    try {
      // Capture Claude spend before releasing the instance — the gateway key may
      // expire soon after; /key/list retains it but recording now keeps the
      // per-user rolling total current. Best-effort + idempotent; the
      // cc-spend-snapshot cron is the backstop. (Reaped sessions are a primary
      // abandoned-tab case, so this is where most spend gets attributed.)
      const userId = s.user_id as string | null
      if (userId) {
        await recordSessionSpend(admin, userId, s.id as string).catch((err) =>
          console.error('[cc-reap] recordSessionSpend failed (best-effort):', err),
        )
      }
      if (hostId) {
        // Drops the tag from the service traffic + deletes the revision,
        // releasing the pinned instance. (See destroySession.)
        const remaining = reaperRemainingMs(startedAt, 'sessions')
        if (remaining < 1_000) { sessionsDeferred++; continue }
        await sandbox.destroySession(hostId, { signal: AbortSignal.timeout(remaining) })
      }
      // `idle` = reaped-but-resumable (NOT `terminated`, the finalized end state).
      // The workspace snapshot lives on in cc-sessions for resume.
      await admin
        .from('claude_code_sessions')
        .update({ status: 'idle', ended_at: nowIso })
        .eq('id', s.id as string)
        .eq('status', 'active') // failed provisioning stays failed; never overwrite a concurrent transition
      reaped++
    } catch (err) {
      failures.push(`${s.id}: ${String(err)}`)
    }
  }

  if (failures.length) console.error('[cc-reap] partial failures:', failures)

  // --- Orphan reconciliation sweep ---
  // The idle sweep above only sees `active` sessions. But a revision can be
  // orphaned (live compute, no active row) by any teardown a writer dropped:
  // a createSession that threw after the PATCH landed, a state-route expiry flip
  // whose destroySession failed, a finalize that died mid-flight. Once the row
  // leaves `active`, nothing else frees that instance — it bills until someone
  // notices. This sweep is the backstop: list every live per-session revision
  // and delete any whose session row is NOT active/provisioning (i.e. has no
  // business holding compute). Self-heals leaks regardless of root cause.
  let orphansReaped = 0
  let orphansScanned = 0
  let orphansSkipped = 0
  const orphanFailures: string[] = []
  // A stuck orphan (latest-created revision) costs a base bump + ~10-25s poll to
  // tear down. With maxDuration 60s, a backlog could blow the budget mid-loop, so
  // bound wall-clock per run; leftovers are caught on the next 10-min sweep.
  // Keep the final fifteen seconds for liveness, SQL shutdown and response.
  const orphanBudget = () => reaperRemainingMs(startedAt, 'orphans')
  if (typeof sandbox.listSessionHostIds === 'function' && orphanBudget() >= 1_000) {
    try {
      const liveHostIds = await sandbox.listSessionHostIds({ signal: AbortSignal.timeout(Math.min(8_000, orphanBudget())) })
      orphansScanned = liveHostIds.length
      if (liveHostIds.length) {
        // Which of these host ids belong to a session that's legitimately live?
        // CRITICAL — FAIL CLOSED: if this query errors (transient DB failure, URL
        // too long), `keep` would be empty and we'd destroy EVERY live revision,
        // including active user sessions. Never delete on an inconclusive read.
        // Batch the .in() so a large liveHostIds set can't blow the URL length.
        const keep = new Set<string>()
        let lookupFailed = false
        const BATCH = 100
        for (let i = 0; i < liveHostIds.length && !lookupFailed; i += BATCH) {
          const batch = liveHostIds.slice(i, i + BATCH)
          const { data: liveRows, error: lookupErr } = await admin
            .from('claude_code_sessions')
            .select('host_instance_id, status')
            .in('host_instance_id', batch)
            .in('status', ['active', 'provisioning'])
          if (lookupErr) {
            lookupFailed = true
            orphanFailures.push(`lookup: ${lookupErr.message}`)
            break
          }
          for (const r of liveRows ?? []) {
            const h = r.host_instance_id as string | null
            if (h) keep.add(h)
          }
        }
        if (lookupFailed) {
          // Abort the sweep entirely — better to leak an orphan for 10 more
          // minutes than to kill a live session on a bad read.
          console.error('[cc-reap] orphan lookup failed; skipping sweep (fail-closed)')
          return NextResponse.json({
            scanned: sessions.length,
            reaped,
            sessions_deferred: sessionsDeferred,
            failures: failures.length,
            idle_cutoff_seconds: IDLE_REAP_SECONDS,
            orphans_scanned: orphansScanned,
            orphans_reaped: 0,
            orphans_skipped: 0,
            orphan_failures: orphanFailures.length,
            orphan_sweep_aborted: true,
          })
        }
        for (const hostId of liveHostIds) {
          if (keep.has(hostId)) continue
          if (orphanBudget() < 1_000) {
            orphansSkipped++ // out of budget — next sweep gets it
            continue
          }
          try {
            await sandbox.destroySession(hostId, { signal: AbortSignal.timeout(orphanBudget()) })
            orphansReaped++
          } catch (err) {
            orphanFailures.push(`${hostId}: ${String(err)}`)
          }
        }
      }
    } catch (err) {
      orphanFailures.push(`sweep: ${String(err)}`)
    }
  }
  if (orphanFailures.length) console.error('[cc-reap] orphan sweep failures:', orphanFailures)

  // --- Liveness counts (drive both the spend-snapshot skip and the SQL stop) ---
  // "Live" = active, OR provisioning that's still plausibly mid-start. A row
  // stranded in `provisioning` (e.g. the start route was killed by a platform
  // timeout before it could 503 + mark `failed`) must NOT count as live, so only
  // provisioning rows newer than this cutoff qualify; anything older is a dead
  // start. Computed once here (null on query error) and reused below.
  let activeCount: number | null = null
  let freshProvisioning: number | null = null
  try {
    const provisioningCutoff = provisioningLeaseCutoff(now)
    const activeRes = await admin
      .from('claude_code_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    if (activeRes.error) throw new Error(activeRes.error.message)
    activeCount = activeRes.count
    const provisioningRes = await admin
      .from('claude_code_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'provisioning')
      .gte('created_at', provisioningCutoff)
    if (provisioningRes.error) throw new Error(provisioningRes.error.message)
    freshProvisioning = provisioningRes.count
  } catch (err) {
    console.error('[cc-reap] liveness count failed (best-effort):', err)
  }

  // Fully idle = no session was reaped this run, none active, none mid-start.
  // (null counts = a failed read → treat as "not known idle" and run normally.)
  const fullyIdle =
    sessions.length === 0 && activeCount === 0 && freshProvisioning === 0

  // Retry recently ended rows only while another session proves the gateway is
  // already in use. This catches a prior bounded block failure without waking
  // the scale-to-zero gateway/Cloud SQL during an otherwise idle cron run.
  let endedKeyBlockRetries: KeyBlockSummary | { skipped: 'idle' | 'time_budget' | 'query_failed' }
  const gatewayExpectedAwake = (activeCount ?? 0) > 0 || (freshProvisioning ?? 0) > 0
  if (!gatewayExpectedAwake) {
    endedKeyBlockRetries = { skipped: 'idle' }
  } else if (reaperRemainingMs(startedAt, 'response') < 5000) {
    endedKeyBlockRetries = { skipped: 'time_budget' }
  } else {
    const retryCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const { data: recentlyEnded, error: endedError } = await admin
      .from('claude_code_sessions')
      .select('id')
      .in('status', ['idle', 'terminated', 'failed'])
      .gte('ended_at', retryCutoff)
      .order('ended_at', { ascending: false })
      .limit(KEY_BLOCK_BATCH_LIMIT)
    if (endedError) {
      console.error('[cc-reap] ended session key retry query failed')
      endedKeyBlockRetries = { skipped: 'query_failed' }
    } else {
      endedKeyBlockRetries = await blockEndedSessionKeys(
        (recentlyEnded ?? []).map((session) => session.id as string),
        Math.min(2500, reaperRemainingMs(startedAt, 'response')),
      )
      if (endedKeyBlockRetries.failed > 0 || endedKeyBlockRetries.notFound > 0) {
        console.error('[cc-reap] ended session key retry incomplete', {
          failed: endedKeyBlockRetries.failed,
          not_found: endedKeyBlockRetries.notFound,
        })
      }
    }
  }

  // --- Stop the gateway's Cloud SQL when idle ---
  // cc-llm-db is started on demand at session-start (cloud-sql-admin) and has no
  // native scale-to-zero, so it would bill 24/7 if left running. If NO session is
  // active/provisioning, stop it (activationPolicy=NEVER). Best-effort +
  // idempotent (stopSqlInstance no-ops if already stopped). A session starting
  // concurrently re-wakes it via session-start; a brief race (stop just as one
  // starts) is self-correcting on the next start.
  // A failed or incomplete count is not proof of idleness. Never interrupt a
  // working analytics session because the database could not answer this read.
  const noneLive = canStopGatewaySql(activeCount, freshProvisioning)
  let sqlStopped = false
  if (isSqlAutostartConfigured() && noneLive) {
    try {
      sqlStopped = await stopSqlInstance()
    } catch (err) {
      console.error('[cc-reap] sql stop check failed (best-effort):', err)
    }
  }

  // --- Spend snapshot (piggybacked on this cron) ---
  // Folded into cc-reap rather than its own cron to stay under the Vercel
  // cron-count limit. Both are 10-min CC sweeps. Tight budget so it can't blow
  // this route's 60s maxDuration on top of the reap + orphan work above.
  //
  // Skip entirely when fully idle: there is no spend to record, and the reaper
  // has stopped cc-llm-db so the gateway's /key/list hangs ~51s on a dead DB
  // connection — which is what blew the 60s budget → 504 → false health alert.
  // Whenever any session was live we still run it.
  let spend: Awaited<ReturnType<typeof runSpendSnapshot>> | { skipped: 'idle' | 'time_budget' } | null = null
  if (fullyIdle || sqlStopped) {
    spend = { skipped: 'idle' }
  } else if (reaperRemainingMs(startedAt, 'response') < 12_000) {
    spend = { skipped: 'time_budget' }
  } else {
    try {
      spend = await runSpendSnapshot(admin, Math.min(12_000, reaperRemainingMs(startedAt, 'response')))
    } catch (err) {
      console.error('[cc-reap] spend snapshot failed (best-effort):', err)
    }
  }


  return NextResponse.json({
    scanned: sessions.length,
    reaped,
    sessions_deferred: sessionsDeferred,
    cleanup_budget_exhausted: reaperRemainingMs(startedAt, 'orphans') === 0,
    failures: failures.length,
    key_blocks: keyBlocks,
    ended_key_block_retries: endedKeyBlockRetries,
    idle_cutoff_seconds: IDLE_REAP_SECONDS,
    orphans_scanned: orphansScanned,
    orphans_reaped: orphansReaped,
    orphans_skipped: orphansSkipped,
    orphan_failures: orphanFailures.length,
    spend,
    sql_stopped: sqlStopped,
  })
}
