import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  findIdlePracticeSessions,
  findIdleCaseSessions,
  findCaseSessionsToExcludeFromDefaultSweep,
  type ReapableSessionRow,
} from '@/lib/sandbox/practice-idle-reap'

// FK-REALIZABLE FIXTURES ONLY.
//
// claude_code_sessions.attempt_id is `uuid NOT NULL REFERENCES
// challenge_attempts(id) ON DELETE CASCADE` (see
// supabase/migrations/20260507120000_claude_code_analytics.sql). That means a
// real claude_code_sessions row's attempt_id can ONLY ever be a
// challenge_attempts.id — it can never legally be a cc_scene_attempts.id, no
// matter what a practice session "is". A prior version of this test suite
// injected fixtures like `attempt_id: 'scene-attempt-1'` to stand in for "this
// is a practice session's attempt" — that row could never exist in
// production, so passing tests built on it proved nothing about real
// behavior (the classification logic they exercised was dead code against
// live data). The same trap applies to cc_case_attempts.id for Challenge
// sessions — it can never legally appear in attempt_id either.
//
// The current classification (src/lib/sandbox/practice-idle-reap.ts) keys off
// claude_code_sessions.challenge_id instead, matched against cc_scenes.id
// (Practice) or cc_cases.id (Challenge). Every fixture below uses a
// UUID-shaped attempt_id (as a real challenge_attempts.id would be) and puts
// the classification signal only in challenge_id, matching what a real row
// shape allows.

type FakeCcsRow = ReapableSessionRow & { challenge_id: string | null; attempt_id?: string }

function buildFakeAdmin(
  ccsRows: FakeCcsRow[],
  sceneIds: string[],
  opts?: {
    ccsError?: string
    scenesError?: string
    caseIds?: string[]
    casesError?: string
  },
) {
  return {
    from(table: string) {
      if (table === 'claude_code_sessions') {
        return {
          select() {
            return {
              eq() {
                return {
                  lt() {
                    return {
                      async limit() {
                        if (opts?.ccsError) {
                          return { data: null, error: { message: opts.ccsError } }
                        }
                        return { data: ccsRows, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      }
      if (table === 'cc_scenes') {
        return {
          select() {
            return {
              async in() {
                if (opts?.scenesError) {
                  return { data: null, error: { message: opts.scenesError } }
                }
                return { data: sceneIds.map((id) => ({ id })), error: null }
              },
            }
          },
        }
      }
      if (table === 'cc_cases') {
        return {
          select() {
            return {
              async in() {
                if (opts?.casesError) {
                  return { data: null, error: { message: opts.casesError } }
                }
                return { data: (opts?.caseIds ?? []).map((id) => ({ id })), error: null }
              },
            }
          },
        }
      }
      throw new Error(`unexpected table in fake admin: ${table}`)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('findIdlePracticeSessions', () => {
  it('case 1: positive match — challenge_id resolves to a cc_scenes row -> reaped at 3 min', async () => {
    const row: FakeCcsRow = {
      id: 'sess-1',
      user_id: 'user-1',
      host_instance_id: 'host-1',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      // A real challenge_attempts.id (satisfies the FK) — irrelevant to
      // classification, which turns on challenge_id only.
      attempt_id: '11111111-1111-1111-1111-111111111111',
      challenge_id: 'tuesday-dip-s1', // the challenges shim row for this scene
    }
    const admin = buildFakeAdmin([row], ['tuesday-dip-s1'])
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 1)
    assert.equal(result.sessions[0].id, 'sess-1')
  })

  it('case 2: fall-through — challenge_id is a normal analytics challenge, NOT in cc_scenes', async () => {
    const row: FakeCcsRow = {
      id: 'sess-2',
      user_id: 'user-2',
      host_instance_id: 'host-2',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '22222222-2222-2222-2222-222222222222',
      challenge_id: 'cca-8001', // a real (non-scene) analytics challenge id
    }
    // cc_scenes lookup finds no match for this challenge_id.
    const admin = buildFakeAdmin([row], [])
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 0, 'a non-scene challenge_id must NEVER be classified as practice')
  })

  it('case 3: fall-through — cc_scenes lookup errors -> [], never guesses', async () => {
    const row: FakeCcsRow = {
      id: 'sess-3',
      user_id: 'user-3',
      host_instance_id: 'host-3',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '33333333-3333-3333-3333-333333333333',
      challenge_id: 'tuesday-dip-s1',
    }
    const admin = buildFakeAdmin([row], [], { scenesError: 'scenes lookup boom' })
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.sessions.length, 0)
    assert.equal(result.error, 'scenes lookup boom')
  })

  it('case 4: fall-through — session candidate query errors -> [], never guesses', async () => {
    const admin = buildFakeAdmin([], [], { ccsError: 'session query boom' })
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.sessions.length, 0)
    assert.equal(result.error, 'session query boom')
  })

  it('case 5: mixed batch — only practice sessions returned, real analytics sessions excluded', async () => {
    const rows: FakeCcsRow[] = [
      {
        id: 'sess-match',
        user_id: 'u1',
        host_instance_id: 'h1',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '44444444-4444-4444-4444-444444444444',
        challenge_id: 'tuesday-dip-s1',
      },
      {
        id: 'sess-analytics',
        user_id: 'u2',
        host_instance_id: 'h2',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '55555555-5555-5555-5555-555555555555',
        challenge_id: 'cca-8001',
      },
      {
        id: 'sess-null-challenge',
        user_id: 'u3',
        host_instance_id: 'h3',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '66666666-6666-6666-6666-666666666666',
        challenge_id: null,
      },
    ]
    const admin = buildFakeAdmin(rows, ['tuesday-dip-s1'])
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.sessions.length, 1)
    assert.equal(result.sessions[0].id, 'sess-match')
  })

  it('case 6: the OLD attempt_id-based assumption is gone — a coincidental attempt_id match does not classify as practice', async () => {
    // This row's attempt_id happens to equal the string a cc_scene_attempts
    // row might use for its id — but its challenge_id is NOT a scene. Under
    // the previous (broken) attempt_id-join design this ambiguity was never
    // actually tested against a realizable row; under the current
    // challenge_id design, attempt_id is not even read for classification,
    // so this must fall through regardless of what attempt_id looks like.
    const row: FakeCcsRow = {
      id: 'sess-coincidence',
      user_id: 'user-6',
      host_instance_id: 'host-6',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      // Deliberately shaped like a cc_scene_attempts id would look, to prove
      // the classifier does not key off attempt_id at all.
      attempt_id: '77777777-7777-7777-7777-777777777777',
      challenge_id: 'cca-9002', // NOT a cc_scenes row
    }
    const admin = buildFakeAdmin([row], [])
    const result = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(result.error, null)
    assert.equal(
      result.sessions.length,
      0,
      'attempt_id must never drive classification — only challenge_id against cc_scenes',
    )
  })
})

describe('findIdleCaseSessions', () => {
  it('case 1: positive match — challenge_id resolves to a cc_cases row -> classified as Challenge', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-1',
      user_id: 'user-10',
      host_instance_id: 'host-10',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      // A real challenge_attempts.id (satisfies the FK) — irrelevant to
      // classification, which turns on challenge_id only.
      attempt_id: '11111111-1111-1111-1111-111111111112',
      challenge_id: 'tuesday-dip', // the challenges shim row for this case
    }
    const admin = buildFakeAdmin([row], [], { caseIds: ['tuesday-dip'] })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 1)
    assert.equal(result.sessions[0].id, 'sess-case-1')
  })

  it('case 2: positive match — a Practice session (cc_scenes) still classifies correctly via findIdlePracticeSessions (no regression)', async () => {
    const row: FakeCcsRow = {
      id: 'sess-practice-regress',
      user_id: 'user-11',
      host_instance_id: 'host-11',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '22222222-2222-2222-2222-222222222223',
      challenge_id: 'tuesday-dip-s1',
    }
    const admin = buildFakeAdmin([row], ['tuesday-dip-s1'], { caseIds: ['tuesday-dip'] })
    const practiceResult = await findIdlePracticeSessions(admin, Date.now(), 180)
    assert.equal(practiceResult.error, null)
    assert.equal(practiceResult.sessions.length, 1)
    assert.equal(practiceResult.sessions[0].id, 'sess-practice-regress')

    // The same row must NOT be classified as a Challenge session — a scene
    // id must never match cc_cases.
    const caseResult = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(caseResult.error, null)
    assert.equal(caseResult.sessions.length, 0)
  })

  it('case 3: fall-through — a normal analytics challenge_id (in neither content table) -> default path', async () => {
    const row: FakeCcsRow = {
      id: 'sess-analytics-plain',
      user_id: 'user-12',
      host_instance_id: 'host-12',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '33333333-3333-3333-3333-333333333334',
      challenge_id: 'cca-8001', // real analytics challenge, not a case or scene
    }
    const admin = buildFakeAdmin([row], [], { caseIds: [] })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 0, 'a non-case challenge_id must NEVER classify as Challenge')
  })

  it('case 4: fall-through — cc_cases lookup errors -> [], never guesses', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-err',
      user_id: 'user-13',
      host_instance_id: 'host-13',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '44444444-4444-4444-4444-444444444445',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { casesError: 'cc_cases lookup boom' })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.sessions.length, 0)
    assert.equal(result.error, 'cc_cases lookup boom')
  })

  it('case 5: fall-through — session candidate query errors -> [], never guesses', async () => {
    const admin = buildFakeAdmin([], [], { ccsError: 'session query boom', caseIds: [] })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.sessions.length, 0)
    assert.equal(result.error, 'session query boom')
  })

  it('case 6: mixed batch — only Challenge sessions returned, Practice + plain-analytics sessions excluded', async () => {
    const rows: FakeCcsRow[] = [
      {
        id: 'sess-case-match',
        user_id: 'u1',
        host_instance_id: 'h1',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '55555555-5555-5555-5555-555555555556',
        challenge_id: 'tuesday-dip',
      },
      {
        id: 'sess-scene-not-case',
        user_id: 'u2',
        host_instance_id: 'h2',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '66666666-6666-6666-6666-666666666667',
        challenge_id: 'tuesday-dip-s1', // Practice scene, not a case
      },
      {
        id: 'sess-analytics-not-case',
        user_id: 'u3',
        host_instance_id: 'h3',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '77777777-7777-7777-7777-777777777778',
        challenge_id: 'cca-8001',
      },
      {
        id: 'sess-null-challenge',
        user_id: 'u4',
        host_instance_id: 'h4',
        last_activity_at: '2026-08-27T00:00:00.000Z',
        expires_at: null,
        attempt_id: '88888888-8888-8888-8888-888888888889',
        challenge_id: null,
      },
    ]
    const admin = buildFakeAdmin(rows, ['tuesday-dip-s1'], { caseIds: ['tuesday-dip'] })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.sessions.length, 1)
    assert.equal(result.sessions[0].id, 'sess-case-match')
  })

  it('case 7: adversarial — attempt_id coincidentally shaped like a cc_case_attempts id, but challenge_id is NOT a case -> NOT classified', async () => {
    // This attempt_id looks exactly like a real challenge_attempts.id (as
    // the FK requires), and is deliberately chosen to be the kind of UUID a
    // cc_case_attempts row might use for ITS id in a different table. Under
    // the classifier's actual logic attempt_id is never even read, so this
    // proves classification turns solely on challenge_id against cc_cases.
    const row: FakeCcsRow = {
      id: 'sess-case-coincidence',
      user_id: 'user-14',
      host_instance_id: 'host-14',
      last_activity_at: '2026-08-27T00:00:00.000Z',
      expires_at: null,
      attempt_id: '99999999-9999-9999-9999-999999999999',
      challenge_id: 'cca-9003', // NOT a cc_cases row
    }
    const admin = buildFakeAdmin([row], [], { caseIds: [] })
    const result = await findIdleCaseSessions(admin, Date.now(), 600)
    assert.equal(result.error, null)
    assert.equal(
      result.sessions.length,
      0,
      'attempt_id must never drive classification — only challenge_id against cc_cases',
    )
  })
})

describe('findCaseSessionsToExcludeFromDefaultSweep', () => {
  // Fixed reference instant so "20 min idle" / "35 min idle" fixtures are
  // deterministic rather than racing Date.now(). Every fixture below
  // computes last_activity_at / expires_at relative to this constant, not
  // hardcoded ISO strings — per the FK-realizable-fixtures convention above,
  // attempt_id is always UUID-shaped (a real challenge_attempts.id) and
  // classification signal lives only in challenge_id / timestamps.
  const NOW_MS = Date.parse('2026-08-27T12:00:00.000Z')
  const DEFAULT_IDLE_SECONDS = 900 // 15 min — the reap route's default cutoff
  const CASE_IDLE_SECONDS = 1800 // 30 min — the widened case grace
  const minsAgo = (mins: number) => new Date(NOW_MS - mins * 60 * 1000).toISOString()
  const minsFromNow = (mins: number) => new Date(NOW_MS + mins * 60 * 1000).toISOString()

  it('case 1: case session idle 20 min (past 15, under 30) is NOT reaped — excluded from the default sweep', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-20m',
      user_id: 'user-20',
      host_instance_id: 'host-20',
      last_activity_at: minsAgo(20),
      expires_at: minsFromNow(70), // well within the 90-min TTL wall
      attempt_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { caseIds: ['tuesday-dip'] })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 1, 'a case session at 20 min idle must be excluded (still in the 30-min grace)')
    assert.equal(result.sessions[0].id, 'sess-case-20m')
  })

  it('case 2: case session idle 35 min (past 30) IS reaped — not excluded, grace has elapsed', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-35m',
      user_id: 'user-35',
      host_instance_id: 'host-35',
      last_activity_at: minsAgo(35),
      expires_at: minsFromNow(55),
      attempt_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { caseIds: ['tuesday-dip'] })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, null)
    assert.equal(result.sessions.length, 0, 'a case session past the 30-min grace must NOT be excluded — it reaps normally')
  })

  it('case 3: case session past expires_at IS reaped regardless of idle time — the 90-min TTL wall wins', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-expired',
      user_id: 'user-exp',
      host_instance_id: 'host-exp',
      // Only 18 min idle (well within the 30-min grace) — but TTL already elapsed.
      last_activity_at: minsAgo(18),
      expires_at: minsAgo(1), // expired 1 minute ago
      attempt_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { caseIds: ['tuesday-dip'] })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, null)
    assert.equal(
      result.sessions.length,
      0,
      'an expired case session must NEVER be excluded, even well within the idle grace — TTL wall always wins',
    )
  })

  it('case 4: a normal analytics session idle 20 min IS still reaped at the 15-min default — the exclusion is narrow', async () => {
    const row: FakeCcsRow = {
      id: 'sess-analytics-20m',
      user_id: 'user-a20',
      host_instance_id: 'host-a20',
      last_activity_at: minsAgo(20),
      expires_at: minsFromNow(10),
      attempt_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      challenge_id: 'cca-8001', // a real analytics challenge, NOT a cc_cases row
    }
    // cc_cases has no matching row for this challenge_id — findIdleCaseSessions
    // (called internally) will not classify it as a Challenge session at all.
    const admin = buildFakeAdmin([row], [], { caseIds: [] })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, null)
    assert.equal(
      result.sessions.length,
      0,
      'a non-case session must never be excluded — it stays on the default 15-min kill list',
    )
  })

  it('case 5: a practice session still reaps at 3 minutes — no regression from the case-exclusion branch existing', async () => {
    const row: FakeCcsRow = {
      id: 'sess-practice-3m',
      user_id: 'user-p3',
      host_instance_id: 'host-p3',
      last_activity_at: minsAgo(4), // past the 3-min practice cutoff
      expires_at: minsFromNow(80),
      attempt_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      challenge_id: 'tuesday-dip-s1', // a practice scene, not a case
    }
    // The practice-idle sweep (findIdlePracticeSessions) is unaffected by
    // this new function — it does not call it. Prove the practice path still
    // finds the row at its own (much shorter) 3-min cutoff.
    const admin = buildFakeAdmin([row], ['tuesday-dip-s1'], { caseIds: [] })
    const practiceResult = await findIdlePracticeSessions(admin, NOW_MS, 180)
    assert.equal(practiceResult.error, null)
    assert.equal(practiceResult.sessions.length, 1)
    assert.equal(practiceResult.sessions[0].id, 'sess-practice-3m')

    // And the case-exclusion branch must never touch it either — a scene
    // challenge_id can never match cc_cases.
    const caseResult = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(caseResult.sessions.length, 0)
  })

  it('case 6 (MOST IMPORTANT — fail-safe direction): cc_cases lookup errors -> case session is still reaped on the normal 15-min schedule, NOT excluded', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-lookup-error',
      user_id: 'user-err',
      host_instance_id: 'host-err',
      last_activity_at: minsAgo(20), // would be in-grace if classification succeeded
      expires_at: minsFromNow(70),
      attempt_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { casesError: 'cc_cases lookup boom' })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, 'cc_cases lookup boom')
    assert.equal(
      result.sessions.length,
      0,
      'ambiguity (a failed classification lookup) must exclude NOTHING — the row falls through to the normal 15-min kill list. This is the fail-safe direction INVERTED from findIdlePracticeSessions: there, [] on error means "reap nothing extra"; here, [] on error means "exclude nothing", so the caller (cc-reap route) reaps this row on schedule instead of granting it a grace it was never confirmed to deserve.',
    )
  })

  it('case 7 (defensive): missing expires_at on an otherwise-matching, in-grace case session is NOT excluded', async () => {
    const row: FakeCcsRow = {
      id: 'sess-case-no-ttl',
      user_id: 'user-nottl',
      host_instance_id: 'host-nottl',
      last_activity_at: minsAgo(10),
      expires_at: null, // TTL not confirmed safe
      attempt_id: '11111111-2222-3333-4444-555555555555',
      challenge_id: 'tuesday-dip',
    }
    const admin = buildFakeAdmin([row], [], { caseIds: ['tuesday-dip'] })
    const result = await findCaseSessionsToExcludeFromDefaultSweep(
      admin,
      NOW_MS,
      DEFAULT_IDLE_SECONDS,
      CASE_IDLE_SECONDS,
    )
    assert.equal(result.error, null)
    assert.equal(
      result.sessions.length,
      0,
      'a missing expires_at cannot confirm the TTL wall has not been crossed — fail toward reap, never exclude',
    )
  })
})
