// lib/sandbox/practice-idle-reap.ts — server-side only.
//
// Casebook Loop — Practice session idle branch for the cc-reap cron
// (src/app/api/cron/cc-reap/route.ts), split into its own module so it can be
// unit-tested with a fake admin client without importing the Next.js route
// file (which drags in server-only-gated deps like the email client via
// spend-snapshot.ts, breaking under plain `node --test`).
//
// Practice sessions (Casebook Loop's short scene drills) should reap faster
// than analytics case sessions: plan §3.3 calls for a 3-minute idle cutoff
// instead of the reaper's default. claude_code_sessions has NO session_kind
// (or any kind/type/mode) column — confirmed against every migration that
// touches the table — so a session cannot be classified by a stored enum.
//
// PREVIOUS (BROKEN) DESIGN — do not resurrect: an earlier version of this
// module classified by joining claude_code_sessions.attempt_id against
// cc_scene_attempts.id. That join can NEVER match in production:
// claude_code_sessions.attempt_id is `uuid NOT NULL REFERENCES
// challenge_attempts(id) ON DELETE CASCADE` (see
// supabase/migrations/20260507120000_claude_code_analytics.sql). The FK
// forces every attempt_id to be a real challenge_attempts row; a
// cc_scene_attempts id can never legally appear there. Every real practice
// session would silently fall through to the default idle path — no crash,
// just a dead feature behind green tests.
//
// CURRENT DESIGN: classify by claude_code_sessions.challenge_id instead.
// Casebook Loop's settled architecture gives every practice scene an
// unpublished `challenges` shim row whose id equals the scene id (e.g.
// 'tuesday-dip-s1', challenge_type='claude_code_analytics') — this is how
// the other Claude Code Analytics labs already satisfy claude_code_sessions'
// NOT NULL challenge_id FK. cc_scenes is the SOLE content authority for a
// practice scene; the challenges shim row carries no content of its own — it
// exists only so claude_code_sessions' FKs are satisfiable. So a session's
// challenge_id positively identifies a practice session iff it matches a
// cc_scenes.id. We do NOT pattern-match on the id string (e.g.
// endsWith('-s1')) — that would break the moment a scene id doesn't follow
// the guessed convention. The authoritative check is a real lookup against
// cc_scenes.
//
// FAIL-SAFE CONTRACT — read before touching this branch:
//   challenge_id matches a cc_scenes row       -> practice session, 3-min cutoff
//   challenge_id matches a real analytics challenge -> not this branch
//   challenge_id is unmatched, or either lookup errors -> falls through to
//     the EXISTING default idle path in cc-reap/route.ts. NEVER treat
//     ambiguity as "reap fast."
// A broken lookup reaping a real analytics session at 3 minutes instead of
// the default cutoff is a production incident; a broken lookup failing to
// reap a practice session early is, at worst, a missed cost optimization.
// The asymmetry is deliberate.

import type { createAdminClient } from '@/lib/supabase/admin'

export const PRACTICE_IDLE_REAP_SECONDS = parseInt(
  process.env.CC_PRACTICE_IDLE_REAP_SECONDS ?? '180',
  10,
) // 3 min

export interface ReapableSessionRow {
  id: string
  user_id: string | null
  host_instance_id: string | null
  last_activity_at: string | null
  expires_at: string | null
}

/**
 * Additive, join-classified practice-session idle sweep. Returns the
 * `active` sessions that should reap at PRACTICE_IDLE_REAP_SECONDS instead of
 * the reaper's default idle cutoff, found by checking whether
 * claude_code_sessions.challenge_id matches a cc_scenes row (there is no
 * session_kind column; see the module doc comment for the FK reason
 * attempt_id could never be used for this).
 *
 * FAIL-SAFE: any error on either query returns [] (no extra reaping) rather
 * than throwing or guessing. The caller's existing default-cutoff sweep is
 * completely unaffected either way — this only ever ADDS sessions to reap,
 * on top of what the unchanged main query already found, never removes or
 * reclassifies any session the main query would have caught anyway.
 */
export async function findIdlePracticeSessions(
  admin: ReturnType<typeof createAdminClient>,
  nowMs: number,
  practiceIdleSeconds: number,
): Promise<{ sessions: ReapableSessionRow[]; error: string | null }> {
  const practiceCutoff = new Date(nowMs - practiceIdleSeconds * 1000).toISOString()

  // Step 1: active sessions idle past the SHORTER practice cutoff (a superset
  // of what the main sweep's longer cutoff would catch — filtered further
  // below by the positive challenge_id match against cc_scenes).
  const { data: candidates, error: candidatesErr } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, host_instance_id, last_activity_at, expires_at, challenge_id')
    .eq('status', 'active')
    .lt('last_activity_at', practiceCutoff)
    .limit(200)

  if (candidatesErr) {
    console.error(
      '[cc-reap] practice-idle candidate query failed (fail-safe: no extra reap):',
      candidatesErr.message,
    )
    return { sessions: [], error: candidatesErr.message }
  }
  const candidateRows = (candidates ?? []) as unknown as Array<
    ReapableSessionRow & { challenge_id: string | null }
  >
  const challengeIds = candidateRows
    .map((r) => r.challenge_id)
    .filter((id): id is string => Boolean(id))

  if (challengeIds.length === 0) return { sessions: [], error: null }

  // Step 2: which of those challenge_ids are POSITIVELY a cc_scenes row.
  // Only rows with a confirmed match are ever returned — a challenge_id that
  // matches nothing (a real analytics challenge, or any lookup miss) falls
  // through to the default idle path, per the fail-safe contract above.
  const { data: scenes, error: scenesErr } = await admin
    .from('cc_scenes')
    .select('id')
    .in('id', challengeIds)

  if (scenesErr) {
    console.error(
      '[cc-reap] practice-idle cc_scenes lookup failed (fail-safe: no extra reap):',
      scenesErr.message,
    )
    return { sessions: [], error: scenesErr.message }
  }
  const practiceChallengeIds = new Set((scenes ?? []).map((r) => r.id as string))
  if (practiceChallengeIds.size === 0) return { sessions: [], error: null }

  const matched = candidateRows
    .filter((r) => r.challenge_id && practiceChallengeIds.has(r.challenge_id))
    .map(({ id, user_id, host_instance_id, last_activity_at, expires_at }) => ({
      id,
      user_id,
      host_instance_id,
      last_activity_at,
      expires_at,
    }))

  return { sessions: matched, error: null }
}
