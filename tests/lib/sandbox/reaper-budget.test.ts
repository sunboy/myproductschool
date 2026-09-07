import assert from 'node:assert/strict'
import test from 'node:test'
import { reaperRemainingMs } from '../../../src/lib/sandbox/reaper-budget'

test('slow active-session work consumes a shared budget instead of resetting the orphan timer', () => {
  const start = 1_000
  assert.equal(reaperRemainingMs(start, 'sessions', start + 20_000), 0)
  assert.equal(reaperRemainingMs(start, 'orphans', start + 20_000), 20_000)
  assert.equal(reaperRemainingMs(start, 'orphans', start + 41_000), 0)
  assert.equal(reaperRemainingMs(start, 'response', start + 40_000), 15_000)
  assert.equal(reaperRemainingMs(start, 'response', start + 60_000), 0)
})
