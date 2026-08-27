// lib/sandbox/stale-provisioning-reap.ts — server-side only.
//
// Retires claude_code_sessions rows stranded in status='provisioning'. A row
// can strand there when the start route dies before it can mark the session
// `failed` (platform timeout, killed process, an infra wake failure
// mid-flight). Nothing else ever transitions such a row: it sits in
// `provisioning` forever, which then keeps it invisible to the reaper's
// normal `active`-only sweeps. Split into its own module, same reasoning as
// practice-idle-reap.ts, so it is unit-testable with a fake admin client
// without importing the Next.js route file.
//
// TWO DIFFERENT CUTOFFS, DO NOT CONFLATE:
//   - The reap route's LIVENESS cutoff (5 min, route.ts) decides whether a
//     provisioning row counts as "live" for the spend-snapshot skip and the
//     Cloud SQL stop decision. That logic is unrelated to this module and
//     must not change.
//   - STALE_PROVISIONING_REAP_SECONDS (this module) decides when a
//     provisioning row is retired (marked terminal). It must be generous well
//     beyond any plausible legitimate provisioning time — a cold start with a
//     SQL wake takes roughly 60s — so a legitimate in-flight provision is
//     never mistaken for stranded. Set far above the 5-min liveness cutoff on
//     purpose: those two concerns happen to share a status value but answer
//     different questions.
//
// THE CRITICAL DISTINCTION THIS MODULE EXISTS TO GET RIGHT:
//   host_instance_id IS NULL     -> died before any sandbox was created
//                                    (e.g. at waking_database or
//                                    starting_gateway). No compute exists.
//                                    Safe to mark terminal directly.
//   host_instance_id IS NOT NULL -> a sandbox may exist or may have existed.
//                                    Marking the row terminal without
//                                    confirming the compute is gone would
//                                    ORPHAN a live, billing sandbox with no
//                                    row pointing at it.
//
// WHY "LEAVE HOSTFUL ROWS FOR THE EXISTING ORPHAN SWEEP" DOES NOT WORK: the
// orphan sweep in route.ts builds a `keep` set from rows whose status is
// `active` OR `provisioning` (route.ts, the orphan lookup query) — a stuck
// provisioning row's host id is IN that keep set, so the orphan sweep will
// never touch it. If this module also declined to touch hostful rows, the
// leak would never retire: nothing else ever fires. So this module performs
// its own confirm-then-mark for hostful rows, reusing the SAME
// listSessionHostIds() the orphan sweep already calls, rather than inventing
// a parallel liveness check.
//
// FAIL-CLOSED, BEST-EFFORT: any error here must not break the rest of the
// cron run. A row is marked terminal only when we are positively confident no
// compute is attached (host is null, or host is confirmed not in the live
// set, or we successfully destroyed it ourselves first). Any ambiguity (a
// failed host-liveness read, a destroy that throws) leaves the row exactly as
// `provisioning` — it is picked up again on the next run.

import type { createAdminClient } from '@/lib/supabase/admin'
import type { HostProvider } from '@/lib/sandbox/types'

// Generous cutoff for retiring a stranded provisioning row. A legitimate cold
// start (SQL wake + gateway mint + sandbox boot) completes in roughly 60s;
// this is 60x that, so nothing plausibly still mid-start is ever caught here.
// Deliberately NOT the same constant as the reap route's 5-min liveness
// cutoff — that decides "does this count as live compute right now", this
// decides "has this row been dead long enough to retire", and conflating them
// would either retire rows too aggressively or never retire truly dead ones.
export const STALE_PROVISIONING_REAP_SECONDS = parseInt(
  process.env.CC_STALE_PROVISIONING_REAP_SECONDS ?? '3600',
  10,
) // 60 min

export interface StaleProvisioningRow {
  id: string
  host_instance_id: string | null
  created_at: string
}

export interface StaleProvisioningResult {
  found: number
  marked: number
  error: string | null
}

/**
 * Finds provisioning rows older than staleProvisioningSeconds and marks the
 * ones we can confirm have no attached compute as `failed`. Returns counts
 * for the caller's JSON response.
 *
 * Marking uses the same CAS pattern as provision-session.ts's failSession:
 * `.eq('status', 'provisioning')` on the update, so a row that concurrently
 * flipped to `active` mid-sweep is left untouched rather than clobbered. That
 * race is only theoretically possible here (a 60-min-old "provisioning" row
 * completing its provision at this exact moment), but the guard costs
 * nothing and matches the established pattern.
 */
export async function reapStaleProvisioningSessions(
  admin: ReturnType<typeof createAdminClient>,
  sandbox: Pick<HostProvider, 'destroySession'> & {
    listSessionHostIds?: HostProvider['listSessionHostIds']
  },
  nowMs: number,
  staleProvisioningSeconds: number,
): Promise<StaleProvisioningResult> {
  const cutoff = new Date(nowMs - staleProvisioningSeconds * 1000).toISOString()

  const { data, error } = await admin
    .from('claude_code_sessions')
    .select('id, host_instance_id, created_at')
    .eq('status', 'provisioning')
    .lt('created_at', cutoff)
    .limit(50)

  if (error) {
    console.error('[cc-reap] stale-provisioning query failed (best-effort):', error.message)
    return { found: 0, marked: 0, error: error.message }
  }

  const rows = (data ?? []) as StaleProvisioningRow[]
  if (rows.length === 0) return { found: 0, marked: 0, error: null }

  const nullHostRows = rows.filter((r) => !r.host_instance_id)
  const hostfulRows = rows.filter((r) => r.host_instance_id)

  // For hostful rows, confirm liveness via the SAME source of truth the
  // orphan sweep uses, rather than inventing a parallel check. If that
  // listing is unavailable or errors, we cannot confirm anything about
  // hostful rows this run — skip them (fail closed) rather than guess.
  // Null-host rows are unaffected either way; they never had compute.
  let liveHostIds: Set<string> | null = null
  if (hostfulRows.length > 0 && typeof sandbox.listSessionHostIds === 'function') {
    try {
      liveHostIds = new Set(await sandbox.listSessionHostIds())
    } catch (err) {
      console.error('[cc-reap] stale-provisioning host listing failed (fail-closed, skipping hostful rows):', err)
      liveHostIds = null
    }
  }

  let marked = 0
  const markFailed = async (id: string) => {
    const { data: flipped, error: updateErr } = await admin
      .from('claude_code_sessions')
      .update({ status: 'failed', ended_at: new Date(nowMs).toISOString() })
      .eq('id', id)
      .eq('status', 'provisioning')
      .select('id')
    if (updateErr) {
      console.error(`[cc-reap] stale-provisioning mark failed for ${id} (best-effort):`, updateErr.message)
      return
    }
    if (flipped && flipped.length > 0) marked++
  }

  // Null-host rows: no compute was ever attached. Safe to mark directly.
  for (const row of nullHostRows) {
    try {
      await markFailed(row.id)
    } catch (err) {
      console.error(`[cc-reap] stale-provisioning null-host mark threw for ${row.id} (best-effort):`, err)
    }
  }

  // Hostful rows: only act when liveness is confirmed one way or the other.
  if (liveHostIds) {
    for (const row of hostfulRows) {
      const hostId = row.host_instance_id as string
      try {
        if (liveHostIds.has(hostId)) {
          // Compute still exists. Tear it down ourselves before marking the
          // row terminal — leaving this to the existing orphan sweep would
          // never happen: that sweep's keep-list includes `provisioning`
          // status rows, so it treats this host as legitimately claimed and
          // will never destroy it while the row says provisioning. If the
          // destroy fails, do NOT mark the row — it stays provisioning and
          // is retried on the next run rather than being silently orphaned.
          await sandbox.destroySession(hostId)
        }
        // Either the host was already gone, or we just destroyed it.
        await markFailed(row.id)
      } catch (err) {
        console.error(`[cc-reap] stale-provisioning hostful teardown failed for ${row.id} (best-effort, retried next run):`, err)
      }
    }
  }

  return { found: rows.length, marked, error: null }
}
