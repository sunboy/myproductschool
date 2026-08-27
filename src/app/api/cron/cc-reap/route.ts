// GET /api/cron/cc-reap
//
// Idle reaper for Claude Code Analytics sandboxes. Each active session pins one
// Cloud Run instance (1 vCPU, min=max=1) until its 30-min TTL — so an abandoned
// or idle session holds an instance the whole time, which is the real cap on
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
import { recordSessionSpend } from '@/lib/sandbox/record-spend'
import { runSpendSnapshot } from '@/lib/sandbox/spend-snapshot'
import { stopSqlInstance, isSqlAutostartConfigured } from '@/lib/sandbox/cloud-sql-admin'
import {
  findIdlePracticeSessions,
  findCaseSessionsToExcludeFromDefaultSweep,
  PRACTICE_IDLE_REAP_SECONDS,
  CASE_IDLE_REAP_SECONDS,
  type ReapableSessionRow,
} from '@/lib/sandbox/practice-idle-reap'
import {
  reapStaleProvisioningSessions,
  STALE_PROVISIONING_REAP_SECONDS,
} from '@/lib/sandbox/stale-provisioning-reap'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Reap an active session after this long with no activity. Generous so a user
// who steps away briefly keeps their warm instance (instant reconnect); past it
// the instance is freed and the user resumes from autosave. Override via env.
const IDLE_REAP_SECONDS = parseInt(process.env.CC_IDLE_REAP_SECONDS ?? '900', 10) // 15 min

// Casebook Loop Practice-session idle branch: see
// src/lib/sandbox/practice-idle-reap.ts for the full fail-safe contract and
// why a join (not a session_kind column, which does not exist) is used.
// Split into its own module so the join logic is unit-testable without
// importing this Next.js route file.

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - IDLE_REAP_SECONDS * 1000).toISOString()

  // Active sessions whose last activity is older than the idle cutoff. Also
  // catch any past their TTL that the lazy /state flip never ran for.
  const nowIso = new Date().toISOString()
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

  // --- SUBTRACTIVE: Casebook Loop Challenge (full case) idle-grace branch ---
  // Unlike the practice branch below (which only ever ADDS rows), this
  // branch REMOVES rows from the kill list the main query above just built —
  // giving Challenge (full case) sessions a 30-min idle grace instead of the
  // 15-min default, while the 90-min TTL wall (expires_at) still applies
  // regardless. See findCaseSessionsToExcludeFromDefaultSweep in
  // practice-idle-reap.ts for the full fail-safe contract, which is
  // INVERTED relative to the practice branch: any error or ambiguity here
  // means "exclude nothing" -> the row stays on the kill list and reaps on
  // the normal 15-minute schedule. Removing rows from the kill list is the
  // risky direction (the reaper is the only real session-lifetime
  // enforcement), so on ANY failure this branch must leave `stale` fully
  // intact, never narrowed.
  let caseExcludedCount = 0
  let caseGraceError: string | null = null
  let staleAfterCaseExclusion: ReapableSessionRow[] = stale ?? []
  try {
    const caseResult = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      Date.now(),
      IDLE_REAP_SECONDS,
      CASE_IDLE_REAP_SECONDS,
    )
    caseGraceError = caseResult.error
    if (caseResult.sessions.length) {
      const excludeIds = new Set(caseResult.sessions.map((s) => s.id))
      staleAfterCaseExclusion = (stale ?? []).filter((s) => !excludeIds.has(s.id as string))
      caseExcludedCount = (stale ?? []).length - staleAfterCaseExclusion.length
    }
  } catch (err) {
    // Never let this branch narrow the kill list on an unexpected throw —
    // fail toward the full, unmodified `stale` set (reap on schedule).
    caseGraceError = String(err)
    staleAfterCaseExclusion = stale ?? []
    console.error('[cc-reap] case-idle-grace branch threw (fail-safe: kill list unaffected):', err)
  }

  // --- Additive: Casebook Loop Practice-session idle branch ---
  // Built on `staleAfterCaseExclusion` (the main sweep's rows, minus any
  // Challenge sessions the case-grace branch above excluded) rather than raw
  // `stale`, so a case session in its 30-min grace window is never
  // re-added here by coincidence. For every non-case row this is identical
  // to the pre-existing `stale ?? []` — the case branch only ever removes
  // rows positively confirmed as in-grace case sessions, never anything
  // else. This block ADDS sessions found idle past the shorter 3-minute
  // practice cutoff (see findIdlePracticeSessions) on top of that set.
  // Dedupe by id so a session already caught by the main sweep isn't
  // processed twice. Any failure here (query error, empty result) leaves
  // `sessions` exactly as `staleAfterCaseExclusion` — this branch never
  // narrows or alters what came before it, only ever extends it.
  let practiceIdleFound = 0
  let practiceIdleError: string | null = null
  const extraPracticeSessions: ReapableSessionRow[] = []
  try {
    const practiceResult = await findIdlePracticeSessions(admin, Date.now(), PRACTICE_IDLE_REAP_SECONDS)
    practiceIdleError = practiceResult.error
    practiceIdleFound = practiceResult.sessions.length
    if (practiceResult.sessions.length) {
      const existingIds = new Set(staleAfterCaseExclusion.map((s) => s.id as string))
      for (const s of practiceResult.sessions) {
        if (!existingIds.has(s.id)) extraPracticeSessions.push(s)
      }
    }
  } catch (err) {
    // Never let the practice-idle branch break the main reap run.
    practiceIdleError = String(err)
    console.error('[cc-reap] practice-idle branch threw (fail-safe: main sweep unaffected):', err)
  }

  // Merge: the case-grace-filtered sweep rows, unchanged, plus any extra
  // practice rows this branch found. When extraPracticeSessions is empty
  // (the common case for non-practice traffic, and the only possible
  // outcome on any failure above) and caseExcludedCount is 0 (no case
  // sessions in grace this run), `sessions` is exactly `stale ?? []` —
  // identical to the pre-existing behavior.
  const sessions: ReapableSessionRow[] = [...staleAfterCaseExclusion, ...extraPracticeSessions]
  const sandbox = getSandbox()
  let reaped = 0
  const failures: string[] = []

  for (const s of sessions) {
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
        await sandbox.destroySession(hostId)
      }
      // `idle` = reaped-but-resumable (NOT `terminated`, the finalized end state).
      // The workspace snapshot lives on in cc-sessions for resume.
      await admin
        .from('claude_code_sessions')
        .update({ status: 'idle', ended_at: nowIso })
        .eq('id', s.id as string)
      reaped++
    } catch (err) {
      failures.push(`${s.id}: ${String(err)}`)
    }
  }

  if (failures.length) console.error('[cc-reap] partial failures:', failures)

  // --- Stale provisioning sweep ---
  // Retires claude_code_sessions rows stranded in status='provisioning' (the
  // start route died before it could mark the session `failed`). Runs BEFORE
  // the orphan sweep below on purpose: the orphan sweep's keep-list includes
  // `provisioning` status rows, so a stranded provisioning row with a live
  // host would otherwise be protected from teardown forever and never
  // retire. See stale-provisioning-reap.ts for the full fail-closed contract
  // around confirming no compute is attached before marking a row terminal.
  let staleProvisioningFound = 0
  let staleProvisioningMarked = 0
  let staleProvisioningError: string | null = null
  try {
    const staleResult = await reapStaleProvisioningSessions(
      admin,
      sandbox,
      Date.now(),
      STALE_PROVISIONING_REAP_SECONDS,
    )
    staleProvisioningFound = staleResult.found
    staleProvisioningMarked = staleResult.marked
    staleProvisioningError = staleResult.error
  } catch (err) {
    // Never let this sweep break the rest of the reaper run.
    staleProvisioningError = String(err)
    console.error('[cc-reap] stale-provisioning sweep threw (best-effort):', err)
  }

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
  const SWEEP_BUDGET_MS = 45_000
  const sweepStart = Date.now()
  if (typeof sandbox.listSessionHostIds === 'function') {
    try {
      const liveHostIds = await sandbox.listSessionHostIds()
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
            failures: failures.length,
            idle_cutoff_seconds: IDLE_REAP_SECONDS,
            stale_provisioning_cutoff_seconds: STALE_PROVISIONING_REAP_SECONDS,
            stale_provisioning_found: staleProvisioningFound,
            stale_provisioning_marked: staleProvisioningMarked,
            stale_provisioning_error: staleProvisioningError,
            orphans_scanned: orphansScanned,
            orphans_reaped: 0,
            orphans_skipped: 0,
            orphan_failures: orphanFailures.length,
            orphan_sweep_aborted: true,
          })
        }
        for (const hostId of liveHostIds) {
          if (keep.has(hostId)) continue
          if (Date.now() - sweepStart > SWEEP_BUDGET_MS) {
            orphansSkipped++ // out of budget — next sweep gets it
            continue
          }
          try {
            await sandbox.destroySession(hostId)
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
    const provisioningCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const activeRes = await admin
      .from('claude_code_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    activeCount = activeRes.count ?? 0
    const provisioningRes = await admin
      .from('claude_code_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'provisioning')
      .gte('created_at', provisioningCutoff)
    freshProvisioning = provisioningRes.count ?? 0
  } catch (err) {
    console.error('[cc-reap] liveness count failed (best-effort):', err)
  }

  // Fully idle = no session was reaped this run, none active, none mid-start.
  // (null counts = a failed read → treat as "not known idle" and run normally.)
  const fullyIdle =
    sessions.length === 0 && activeCount === 0 && freshProvisioning === 0

  // --- Spend snapshot (piggybacked on this cron) ---
  // Folded into cc-reap rather than its own cron to stay under the Vercel
  // cron-count limit. Both are 10-min CC sweeps. Tight budget so it can't blow
  // this route's 60s maxDuration on top of the reap + orphan work above.
  //
  // Skip entirely when fully idle: there is no spend to record, and the reaper
  // has stopped cc-llm-db so the gateway's /key/list hangs ~51s on a dead DB
  // connection — which is what blew the 60s budget → 504 → false health alert.
  // Whenever any session was live we still run it.
  let spend: Awaited<ReturnType<typeof runSpendSnapshot>> | { skipped: 'idle' } | null = null
  if (fullyIdle) {
    spend = { skipped: 'idle' }
  } else {
    try {
      spend = await runSpendSnapshot(admin, 12_000)
    } catch (err) {
      console.error('[cc-reap] spend snapshot failed (best-effort):', err)
    }
  }

  // --- Stop the gateway's Cloud SQL when idle ---
  // cc-llm-db is started on demand at session-start (cloud-sql-admin) and has no
  // native scale-to-zero, so it would bill 24/7 if left running. If NO session is
  // active/provisioning, stop it (activationPolicy=NEVER). Best-effort +
  // idempotent (stopSqlInstance no-ops if already stopped). A session starting
  // concurrently re-wakes it via session-start; a brief race (stop just as one
  // starts) is self-correcting on the next start.
  // Stop when NObody is provably live. A null count means the read failed; treat
  // that as "not known live" and still stop — failing toward stopped is the
  // cost-safe default for an idle reaper (matches the prior behavior, which read
  // a failed count as 0). stopSqlInstance is idempotent and no-ops if already
  // stopped, so a spurious stop during a race self-corrects on the next start.
  const noneLive = (activeCount ?? 0) === 0 && (freshProvisioning ?? 0) === 0
  let sqlStopped = false
  if (isSqlAutostartConfigured() && noneLive) {
    try {
      sqlStopped = await stopSqlInstance()
    } catch (err) {
      console.error('[cc-reap] sql stop check failed (best-effort):', err)
    }
  }

  return NextResponse.json({
    scanned: sessions.length,
    reaped,
    failures: failures.length,
    idle_cutoff_seconds: IDLE_REAP_SECONDS,
    case_idle_cutoff_seconds: CASE_IDLE_REAP_SECONDS,
    case_idle_excluded: caseExcludedCount,
    case_idle_grace_error: caseGraceError,
    practice_idle_cutoff_seconds: PRACTICE_IDLE_REAP_SECONDS,
    practice_idle_found: practiceIdleFound,
    practice_idle_error: practiceIdleError,
    stale_provisioning_cutoff_seconds: STALE_PROVISIONING_REAP_SECONDS,
    stale_provisioning_found: staleProvisioningFound,
    stale_provisioning_marked: staleProvisioningMarked,
    stale_provisioning_error: staleProvisioningError,
    orphans_scanned: orphansScanned,
    orphans_reaped: orphansReaped,
    orphans_skipped: orphansSkipped,
    orphan_failures: orphanFailures.length,
    spend,
    sql_stopped: sqlStopped,
  })
}
