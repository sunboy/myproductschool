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

// Casebook Loop — Challenge (full case) session PAUSE idle threshold, plan
// §3.3: "Case sessions: 90-min wall, 10-min idle -> auto-pause, not kill (see
// 3.4)." This is a DIFFERENT threshold from CASE_IDLE_REAP_SECONDS below —
// do not conflate the two:
//   CASE_IDLE_PAUSE_SECONDS (this constant, 10 min) — the future §3.4
//     auto-pause action. NOTHING CONSUMES IT YET. Pause/resume is explicitly
//     scoped "(new capability)" in the plan and none of its prerequisites
//     exist (no pause endpoint, no writer of cc_case_attempts.resume_context,
//     no case-start route). This constant exists only so a future phase has
//     a named value to build against.
//   CASE_IDLE_REAP_SECONDS (below, 30 min) — the reap route's idle-KILL
//     threshold for Challenge sessions, widened from the 15-min default so a
//     90-minute capstone survives a learner reading/thinking. This IS wired
//     into the reap route today (see findCaseSessionsToExcludeFromDefaultSweep).
// A future phase building real pause/resume should consume
// CASE_IDLE_PAUSE_SECONDS from its own call site — do not repurpose either
// constant for the other's job.
export const CASE_IDLE_PAUSE_SECONDS = parseInt(
  process.env.CC_CASE_IDLE_PAUSE_SECONDS ?? '600',
  10,
) // 10 min — future §3.4 auto-pause, unconsumed as of this module

// Casebook Loop — Challenge (full case) session idle-KILL grace, founder-
// approved widening of the reap route's default 15-min cutoff to 30 min for
// case sessions specifically (a 90-min capstone should survive a learner
// reading/thinking, not just an analytics side-quest). The 90-minute TTL
// wall (`expires_at`) still applies regardless — see
// findCaseSessionsToExcludeFromDefaultSweep. This is NOT pause/resume: past
// 30 min idle (or past expires_at, whichever comes first) a case session is
// still destroyed exactly like today, just later.
export const CASE_IDLE_REAP_SECONDS = parseInt(
  process.env.CC_CASE_IDLE_REAP_SECONDS ?? '1800',
  10,
) // 30 min

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

// ---------------------------------------------------------------------------
// Challenge (full case) session classification
// ---------------------------------------------------------------------------
//
// Same fail-safe join pattern as findIdlePracticeSessions above, generalized
// to Challenge sessions (Casebook Loop's full-case capstone, internal id
// `case`). claude_code_sessions still has no session_kind column, so
// classification again goes through claude_code_sessions.challenge_id — this
// time matched against cc_cases (the content-authority table for a full
// case; see supabase/migrations/20260826100000_casebook_content.sql), not
// cc_scenes. Exactly like the practice scene shim, a Challenge session's
// challenge_id is expected to resolve to a `challenges` shim row whose id
// equals the case id, so claude_code_sessions' NOT NULL challenge_id FK is
// satisfiable — cc_cases remains the sole content authority.
//
// The same trap that killed the old attempt_id-based practice design applies
// here without modification: claude_code_sessions.attempt_id is `uuid NOT
// NULL REFERENCES challenge_attempts(id)`, so a cc_case_attempts.id can NEVER
// legally appear there either. This function does not read attempt_id at
// all — classification is challenge_id-only, same as findIdlePracticeSessions.
//
// FAIL-SAFE CONTRACT (identical shape to findIdlePracticeSessions):
//   challenge_id matches a cc_cases row   -> Challenge session
//   challenge_id matches anything else, or either lookup errors -> []
//     (never a guess; the caller decides what "unclassified" means)
//
// USAGE NOTE — this function classifies only; it does not decide idle
// timing or reap/exclude anything by itself. It IS now called from the reap
// route (via findCaseSessionsToExcludeFromDefaultSweep below), to widen the
// idle-KILL grace for Challenge sessions to 30 min instead of the 15-min
// default. It is NOT wired into real pause/resume — that remains unbuilt
// (§3.4, "new capability": no pause endpoint, no writer of
// cc_case_attempts.resume_context, no case-start route). Do not confuse
// "excluded from THIS sweep because it's within its 30-min grace" with
// "paused" — an excluded session is still fully `active` and will be
// destroyed on a later sweep once it crosses 30 min idle or expires_at,
// exactly like any other session, just on a longer clock.
export async function findIdleCaseSessions(
  admin: ReturnType<typeof createAdminClient>,
  nowMs: number,
  caseIdleSeconds: number,
): Promise<{ sessions: ReapableSessionRow[]; error: string | null }> {
  const caseCutoff = new Date(nowMs - caseIdleSeconds * 1000).toISOString()

  // Step 1: active sessions idle past the case cutoff (candidates only —
  // filtered further below by the positive challenge_id match against
  // cc_cases).
  const { data: candidates, error: candidatesErr } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, host_instance_id, last_activity_at, expires_at, challenge_id')
    .eq('status', 'active')
    .lt('last_activity_at', caseCutoff)
    .limit(200)

  if (candidatesErr) {
    console.error(
      '[cc-reap] case-idle candidate query failed (fail-safe: no extra classification):',
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

  // Step 2: which of those challenge_ids are POSITIVELY a cc_cases row. Only
  // rows with a confirmed match are ever returned — a challenge_id that
  // matches nothing (a practice scene, a real analytics challenge, or any
  // lookup miss) falls through, per the fail-safe contract above.
  const { data: cases, error: casesErr } = await admin
    .from('cc_cases')
    .select('id')
    .in('id', challengeIds)

  if (casesErr) {
    console.error(
      '[cc-reap] case-idle cc_cases lookup failed (fail-safe: no extra classification):',
      casesErr.message,
    )
    return { sessions: [], error: casesErr.message }
  }
  const caseChallengeIds = new Set((cases ?? []).map((r) => r.id as string))
  if (caseChallengeIds.size === 0) return { sessions: [], error: null }

  const matched = candidateRows
    .filter((r) => r.challenge_id && caseChallengeIds.has(r.challenge_id))
    .map(({ id, user_id, host_instance_id, last_activity_at, expires_at }) => ({
      id,
      user_id,
      host_instance_id,
      last_activity_at,
      expires_at,
    }))

  return { sessions: matched, error: null }
}

// ---------------------------------------------------------------------------
// Challenge (full case) session idle-KILL grace — the SUBTRACTIVE branch
// ---------------------------------------------------------------------------
//
// Unlike findIdlePracticeSessions (which only ever ADDS rows to the reap
// route's kill list), this function tells the caller which rows to REMOVE
// from a kill list it did not build. Removing rows from the kill list is
// the riskier direction: the reap route's idle sweep is the ONLY real
// session-lifetime enforcement in this system (verified live in Phase 3 —
// claude_code_sessions.status never flips provisioning -> active on its
// own, and expires_at is NOT enforced inside the container). Excluding a
// row that should have been reaped pins a real Cloud Run instance
// indefinitely and costs real money. So the exclusion here is deliberately
// narrow and FAIL-SAFE-INVERTED relative to findIdlePracticeSessions:
//
//   findIdlePracticeSessions: ambiguity -> return [] -> caller reaps NOTHING extra
//   findCaseSessionsToExcludeFromDefaultSweep: ambiguity -> return [] -> caller
//     EXCLUDES NOTHING -> every ambiguous row stays on the kill list and
//     reaps on the normal 15-minute schedule.
//
// Both functions return [] on error — the SAME return value produces the
// OPPOSITE real-world consequence, because of how each caller uses the
// result (add vs. subtract). This is intentional and is the whole point of
// the inversion: fail toward reaping, never toward excluding.
//
// A row is excluded from the default sweep's kill list ONLY when ALL of:
//   1. Its challenge_id positively matches a cc_cases row (via
//      findIdleCaseSessions, run at the SAME cutoff the main sweep used —
//      i.e. this only ever considers rows the main sweep would have killed
//      anyway; it can never pull in a row the main sweep wouldn't have
//      touched).
//   2. It has NOT been idle past caseIdleSeconds (the 30-min grace) — a
//      missing or unparseable last_activity_at is treated as "not confirmed
//      within grace" -> NOT excluded (fail toward reap).
//   3. It has a confirmed, parseable expires_at that is STILL in the
//      future. The 90-minute TTL wall always wins: a case session past its
//      expires_at is reaped regardless of idle time. A missing or
//      unparseable expires_at is treated as "TTL not confirmed safe" ->
//      NOT excluded (fail toward reap) — an active session should always
//      have an expires_at in practice, so this branch is a defensive
//      fail-safe, not an expected path.
export async function findCaseSessionsToExcludeFromDefaultSweep(
  admin: ReturnType<typeof createAdminClient>,
  nowMs: number,
  defaultIdleSeconds: number,
  caseIdleSeconds: number,
): Promise<{ sessions: ReapableSessionRow[]; error: string | null }> {
  // Classify at the SAME cutoff the main sweep uses. This yields exactly the
  // case sessions the main sweep's query would have caught — the universe
  // this function is allowed to subtract from, never a superset of it.
  const { sessions: candidates, error } = await findIdleCaseSessions(
    admin,
    nowMs,
    defaultIdleSeconds,
  )

  // Fail-safe (INVERTED vs findIdlePracticeSessions): any classification
  // error here means "exclude nothing" -> every candidate row falls through
  // to the normal 15-minute kill list, which is the safe direction when the
  // reaper is the only enforcement that exists.
  if (error) {
    return { sessions: [], error }
  }

  const graceCutoffMs = nowMs - caseIdleSeconds * 1000

  const excluded = candidates.filter((row) => {
    // Rule 2 — still within the wider grace window. A missing/unparseable
    // last_activity_at cannot confirm "within grace" -> do not exclude.
    if (!row.last_activity_at) return false
    const lastActivityMs = Date.parse(row.last_activity_at)
    if (Number.isNaN(lastActivityMs)) return false
    const withinGrace = lastActivityMs > graceCutoffMs
    if (!withinGrace) return false

    // Rule 3 — TTL wall always wins. A missing/unparseable expires_at cannot
    // confirm "not yet expired" -> do not exclude (fail toward reap).
    if (!row.expires_at) return false
    const expiresAtMs = Date.parse(row.expires_at)
    if (Number.isNaN(expiresAtMs)) return false
    const notYetExpired = expiresAtMs > nowMs
    if (!notYetExpired) return false

    return true
  })

  return { sessions: excluded, error: null }
}
