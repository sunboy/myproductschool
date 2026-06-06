// lib/sandbox/record-spend.ts — server-side only.
//
// Records a Claude Code Analytics session's Claude spend into the per-user
// rolling-30d total (usage_events feature 'cc_claude_spend_cents'), reading the
// authoritative dollar amount from the LiteLLM gateway (/key/list by alias —
// verified to retain spend past key TTL). Safe to call from MULTIPLE teardown
// paths (finalize, reaper, backstop cron) for the same session without double
// counting: the claim + usage_event insert happen atomically in one Postgres RPC.
//
// No token-estimate fallback: the deployed sandbox container does not emit token
// telemetry (total_input/output_tokens stay null), so an estimate would be $0.
// The gateway is the only real source. If it returns null we simply skip — the
// backstop cron picks the spend up later while the key still lists.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSessionKeySpendCents } from './llm-gateway'

export interface RecordSpendResult {
  /** Latest observed spend for the session (cents), or null if unavailable. */
  observedCents: number | null
  /** Delta added to the per-user total on this call (cents). 0 if nothing new. */
  deltaCents: number
}

/**
 * Capture a session's current gateway spend and atomically roll any INCREASE
 * since the last capture into the user's 30-day cc_claude_spend_cents total.
 * Idempotent and concurrency-safe via the record_cc_session_spend RPC (claim +
 * insert in one transaction, FOR UPDATE on the session row).
 *
 * @param admin       service-role client (writes bypass RLS)
 * @param userId      session owner
 * @param sessionId   claude_code_sessions.id (== gateway key alias suffix)
 * @param observedCents  pre-fetched spend (cents) — pass this from the bulk
 *   /key/list snapshot to avoid a second per-session gateway call. Omit to fetch.
 */
export async function recordSessionSpend(
  admin: SupabaseClient,
  userId: string,
  sessionId: string,
  observedCents?: number | null,
): Promise<RecordSpendResult> {
  const observed =
    observedCents !== undefined ? observedCents : await getSessionKeySpendCents(sessionId)
  if (observed == null || observed <= 0) {
    return { observedCents: observed ?? null, deltaCents: 0 }
  }

  // Atomic claim + insert. Returns the delta actually recorded (0 if another
  // caller already claimed it). The session-row UPDATE and the usage_events
  // INSERT are one transaction, so we never advance the recorded watermark
  // without a matching event (which would permanently undercount).
  const { data, error } = await admin.rpc('record_cc_session_spend', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_observed_cents: observed,
  })

  if (error) {
    console.error('[record-spend] record_cc_session_spend RPC failed:', error.message)
    return { observedCents: observed, deltaCents: 0 }
  }

  const deltaCents = typeof data === 'number' ? data : 0
  return { observedCents: observed, deltaCents }
}
