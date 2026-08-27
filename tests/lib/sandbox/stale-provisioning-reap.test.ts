import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { reapStaleProvisioningSessions } from '@/lib/sandbox/stale-provisioning-reap'

interface FakeRow {
  id: string
  host_instance_id: string | null
  created_at: string
}

/**
 * Fake admin client covering exactly the two calls this module makes:
 *   .from('claude_code_sessions').select(...).eq('status','provisioning').lt('created_at', cutoff).limit(50)
 *   .from('claude_code_sessions').update(...).eq('id', id).eq('status','provisioning').select('id')
 * The select query ignores the actual cutoff value and returns whatever rows
 * the test configured as "candidates" — the module's own SQL `.lt()` is what
 * enforces the cutoff in production; this fake exists to test this module's
 * logic, not Postgres's comparison operators.
 */
function buildFakeAdmin(candidateRows: FakeRow[], opts?: { queryError?: string; updateError?: string }) {
  const updatedIds: string[] = []
  return {
    admin: {
      from(table: string) {
        if (table !== 'claude_code_sessions') throw new Error(`unexpected table ${table}`)
        return {
          select() {
            // The query-candidates select: .select(cols).eq('status','provisioning').lt('created_at', cutoff).limit(50)
            return {
              eq() {
                return {
                  lt() {
                    return {
                      async limit() {
                        if (opts?.queryError) {
                          return { data: null, error: { message: opts.queryError } }
                        }
                        return { data: candidateRows, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
          update() {
            return {
              eq(col: string, val: string) {
                if (col !== 'id') throw new Error('expected first .eq on id')
                const id = val
                return {
                  eq(col2: string, val2: string) {
                    if (col2 !== 'status' || val2 !== 'provisioning') {
                      throw new Error('expected CAS guard on status=provisioning')
                    }
                    return {
                      select() {
                        return (async () => {
                          if (opts?.updateError) {
                            return { data: null, error: { message: opts.updateError } }
                          }
                          updatedIds.push(id)
                          return { data: [{ id }], error: null }
                        })()
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    updatedIds,
  }
}

describe('reapStaleProvisioningSessions', () => {
  it('marks a null-host row older than the cutoff as failed', async () => {
    const now = Date.now()
    const oldRow: FakeRow = {
      id: 'row-old-nullhost',
      host_instance_id: null,
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([oldRow])
    const sandbox = {
      destroySession: async () => {
        throw new Error('destroySession should not be called for a null-host row')
      },
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(result.found, 1)
    assert.equal(result.marked, 1)
    assert.equal(result.error, null)
    assert.deepEqual(updatedIds, ['row-old-nullhost'])
  })

  it('does not mark a row newer than the cutoff (fake never returns it as a candidate)', async () => {
    // The real cutoff enforcement is the SQL .lt('created_at', cutoff) in the
    // module. Simulate "newer than cutoff" by the query simply not returning
    // it as a candidate, exactly like a real Postgres filter would.
    const now = Date.now()
    const { admin, updatedIds } = buildFakeAdmin([])
    const sandbox = {
      destroySession: async () => {
        throw new Error('destroySession should not be called')
      },
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(result.found, 0)
    assert.equal(result.marked, 0)
    assert.deepEqual(updatedIds, [])
  })

  it('does not mark a hostful row whose compute is still live, and does not destroy it if teardown fails', async () => {
    const now = Date.now()
    const liveRow: FakeRow = {
      id: 'row-live-host',
      host_instance_id: 'host-still-alive',
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([liveRow])
    let destroyCalled = false
    const sandbox = {
      destroySession: async (hostId: string) => {
        destroyCalled = true
        assert.equal(hostId, 'host-still-alive')
        throw new Error('simulated teardown failure')
      },
      listSessionHostIds: async () => ['host-still-alive'],
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(destroyCalled, true)
    // Teardown failed, so the row must NOT be marked terminal — it stays
    // provisioning and is retried on the next run rather than being
    // silently orphaned.
    assert.equal(result.marked, 0)
    assert.deepEqual(updatedIds, [])
  })

  it('destroys and marks a hostful row once its compute is confirmed gone', async () => {
    const now = Date.now()
    const goneRow: FakeRow = {
      id: 'row-host-gone',
      host_instance_id: 'host-already-gone',
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([goneRow])
    const sandbox = {
      destroySession: async () => {
        throw new Error('destroySession should not be called when the host is already gone')
      },
      listSessionHostIds: async () => [], // host is not in the live set
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(result.marked, 1)
    assert.deepEqual(updatedIds, ['row-host-gone'])
  })

  it('destroys still-live compute then marks the row when teardown succeeds', async () => {
    const now = Date.now()
    const liveRow: FakeRow = {
      id: 'row-live-host-2',
      host_instance_id: 'host-alive-2',
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([liveRow])
    let destroyedHost: string | null = null
    const sandbox = {
      destroySession: async (hostId: string) => {
        destroyedHost = hostId
      },
      listSessionHostIds: async () => ['host-alive-2'],
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(destroyedHost, 'host-alive-2')
    assert.equal(result.marked, 1)
    assert.deepEqual(updatedIds, ['row-live-host-2'])
  })

  it('skips hostful rows (fail-closed) when listSessionHostIds is unavailable, but still marks null-host rows', async () => {
    const now = Date.now()
    const nullHostRow: FakeRow = {
      id: 'row-null-host-b',
      host_instance_id: null,
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const hostfulRow: FakeRow = {
      id: 'row-hostful-noprovider',
      host_instance_id: 'host-x',
      created_at: new Date(now - 2 * 3600 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([nullHostRow, hostfulRow])
    const sandbox = {
      destroySession: async () => {
        throw new Error('destroySession should not be called without listSessionHostIds')
      },
      // no listSessionHostIds
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(result.found, 2)
    assert.equal(result.marked, 1)
    assert.deepEqual(updatedIds, ['row-null-host-b'])
  })

  it('destroys and marks a stale case-kind (casebook Challenge) provisioning row with live compute, even inside its 90-minute TTL', async () => {
    // This module has NO session-kind awareness (see the fake row shape
    // above — it's id/host_instance_id/created_at only, no kind column).
    // That is intentional and this test pins WHY it stays correct: a
    // casebook Challenge session has a 5400s (90-min) TTL, well past this
    // module's 3600s stale cutoff, so a live, healthy Challenge session
    // used to look exactly like a stranded row here and get destroyed out
    // from under a learner at the one-hour mark (the bug this task fixes).
    //
    // The actual fix lives on the OTHER side of this interaction: casebook
    // case/start and practice/start now flip claude_code_sessions.status to
    // `active` immediately on any successful provisionSession() call
    // (including the `pending`/still-booting case, since host+wss are
    // already persisted by then — see the route comments). So a HEALTHY
    // case session is never `provisioning` for more than the few seconds a
    // real provision call takes; it either goes active or the row was never
    // hostful in the first place (query/insert failure).
    //
    // Given that, a row that is STILL `status='provisioning'`, hostful, and
    // older than the cutoff is no longer "a live 90-minute case session
    // caught mid-flight" — it is genuinely stranded (the start route died
    // after persisting host/wss but before it could run the active flip).
    // Destroying its compute and marking it failed is therefore still the
    // correct outcome post-fix, same as any other hostful stale row. Pinning
    // this here (rather than adding a kind filter to the sweep) documents
    // the interaction explicitly: protection for live learners comes from
    // the route-side flip, not from this module special-casing 'case'/
    // 'casebook_case' sessions. If this test ever needs to flip to "must NOT
    // destroy," that is a signal the route-side flip regressed, not that
    // this sweep needs a kind filter.
    const now = Date.now()
    const staleCaseRow: FakeRow = {
      id: 'row-stale-case-session',
      host_instance_id: 'host-case-still-alive',
      // Older than the 3600s stale-provisioning cutoff, but well inside a
      // casebook Challenge's 5400s (90-min) TTL — the exact window where the
      // bug hit before the route-side fix.
      created_at: new Date(now - 61 * 60 * 1000).toISOString(),
    }
    const { admin, updatedIds } = buildFakeAdmin([staleCaseRow])
    let destroyedHost: string | null = null
    const sandbox = {
      destroySession: async (hostId: string) => {
        destroyedHost = hostId
      },
      listSessionHostIds: async () => ['host-case-still-alive'],
    }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(destroyedHost, 'host-case-still-alive')
    assert.equal(result.marked, 1)
    assert.deepEqual(updatedIds, ['row-stale-case-session'])
  })

  it('returns a query error without throwing (best-effort)', async () => {
    const now = Date.now()
    const { admin } = buildFakeAdmin([], { queryError: 'db down' })
    const sandbox = { destroySession: async () => {} }
    const result = await reapStaleProvisioningSessions(admin, sandbox, now, 3600)
    assert.equal(result.found, 0)
    assert.equal(result.marked, 0)
    assert.equal(result.error, 'db down')
  })
})
