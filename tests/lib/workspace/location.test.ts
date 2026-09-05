import assert from 'node:assert/strict'
import test from 'node:test'
import { workspaceLocation } from '../../../src/lib/workspace/location'

test('canonical challenge redirect preserves a historical attempt and filtered return destination', () => {
  const query = {
    attempt: 'older-attempt', resume: '1', cid: 'plan-item',
    from_plan: 'analytics-fundamentals', role: 'data',
    returnTo: '/challenges?discipline=analytics&difficulty=easy',
  }
  const destination = new URL(workspaceLocation('canonical-challenge', query), 'https://www.hackproduct.com')
  assert.equal(destination.pathname, '/workspace/challenges/canonical-challenge')
  for (const [key, value] of Object.entries(query)) assert.equal(destination.searchParams.get(key), value)
})

test('login return destination survives nested query encoding without changing the challenge', () => {
  const destination = workspaceLocation('sql-2001', { attempt: 'attempt-2', returnTo: '/history' })
  const login = new URL(`/login?returnTo=${encodeURIComponent(destination)}`, 'https://www.hackproduct.com')
  assert.equal(login.searchParams.get('returnTo'), destination)
})

test('duplicate query values survive canonical routing and undefined values are omitted', () => {
  assert.equal(workspaceLocation('sample', { tag: ['sql', 'joins'], role: undefined }), '/workspace/challenges/sample?tag=sql&tag=joins')
  assert.equal(workspaceLocation('sample', {}), '/workspace/challenges/sample')
})
