import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findIdlePracticeSessions, type ReapableSessionRow } from '@/lib/sandbox/practice-idle-reap'

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
// live data).
//
// The current classification (src/lib/sandbox/practice-idle-reap.ts) keys off
// claude_code_sessions.challenge_id instead, matched against cc_scenes.id.
// Every fixture below uses a UUID-shaped attempt_id (as a real
// challenge_attempts.id would be) and puts the classification signal only in
// challenge_id, matching what a real row shape allows.

type FakeCcsRow = ReapableSessionRow & { challenge_id: string | null; attempt_id?: string }

function buildFakeAdmin(ccsRows: FakeCcsRow[], sceneIds: string[], opts?: {
  ccsError?: string
  scenesError?: string
}) {
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
