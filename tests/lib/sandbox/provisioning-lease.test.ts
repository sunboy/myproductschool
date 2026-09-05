import assert from 'node:assert/strict'
import test from 'node:test'
import type { createAdminClient } from '../../../src/lib/supabase/admin'
import { activateProvisioning, canStopGatewaySql, claimExpiredProvisioning } from '../../../src/lib/sandbox/provisioning-lease'

const now = new Date('2026-09-05T12:00:00Z')

function fakeAdmin(rows: Array<{ id: string; status: string; created_at: string }>, error: { message: string } | null = null) {
  let patch: Record<string, unknown> = {}
  const predicates: Array<(row: Record<string, unknown>) => boolean> = []
  const chain = {
    update(value: Record<string, unknown>) { patch = value; return this },
    eq(key: string, value: unknown) { predicates.push(row => row[key] === value); return this },
    lt(key: string, value: string) { predicates.push(row => String(row[key]) < value); return this },
    async select() {
      if (error) return { data: null, error }
      const selected = rows.filter(row => predicates.every(matches => matches(row)))
      selected.forEach(row => Object.assign(row, patch))
      return { data: selected, error: null }
    },
  }
  return { from(table: string) { assert.equal(table, 'claude_code_sessions'); return chain } } as unknown as ReturnType<typeof createAdminClient>
}

test('claims only abandoned provisioning; active, recently starting and lease-boundary sessions survive', async () => {
  const rows = [
    { id: 'abandoned', status: 'provisioning', created_at: '2026-09-05T11:50:00Z' },
    { id: 'activated-race-winner', status: 'active', created_at: '2026-09-05T11:50:00Z' },
    { id: 'starting', status: 'provisioning', created_at: '2026-09-05T11:59:00Z' },
    { id: 'boundary', status: 'provisioning', created_at: '2026-09-05T11:55:00.000Z' },
  ]
  const claimed = await claimExpiredProvisioning(fakeAdmin(rows), now)
  assert.deepEqual(claimed.map(row => row.id), ['abandoned'])
  assert.equal(rows[0].status, 'failed')
  assert.equal(rows[1].status, 'active')
  assert.equal(rows[2].status, 'provisioning')
  assert.equal(rows[3].status, 'provisioning')
  assert.deepEqual(await claimExpiredProvisioning(fakeAdmin(rows), now), [])
})

test('database errors prevent cleanup rather than presenting an empty successful claim', async () => {
  await assert.rejects(claimExpiredProvisioning(fakeAdmin([], { message: 'database unavailable' }), now), /Could not claim expired provisioning/)
})


test('activation cannot revive a start claimed by cleanup', async () => {
  const rows = [{ id: 'abandoned', status: 'provisioning', created_at: '2026-09-05T11:50:00Z' }]
  await claimExpiredProvisioning(fakeAdmin(rows), now)
  assert.equal(await activateProvisioning(fakeAdmin(rows), 'abandoned'), false)
  assert.equal(rows[0].status, 'failed')
})

test('activation winner remains active when cleanup runs and duplicate activation loses', async () => {
  const rows = [{ id: 'ready', status: 'provisioning', created_at: '2026-09-05T11:50:00Z' }]
  assert.equal(await activateProvisioning(fakeAdmin(rows), 'ready'), true)
  assert.deepEqual(await claimExpiredProvisioning(fakeAdmin(rows), now), [])
  assert.equal(await activateProvisioning(fakeAdmin(rows), 'ready'), false)
  assert.equal(rows[0].status, 'active')
})


test('gateway shutdown requires two confirmed zero counts; errors and active work preserve service', () => {
  assert.equal(canStopGatewaySql(0, 0), true)
  for (const [active, provisioning] of [[null, null], [null, 0], [0, null], [1, 0], [0, 1]] as const) {
    assert.equal(canStopGatewaySql(active, provisioning), false)
  }
})
