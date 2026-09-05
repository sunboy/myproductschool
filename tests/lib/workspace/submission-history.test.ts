import assert from 'node:assert/strict'
import test from 'node:test'
import { canStartWorkspaceAttempt, loadWorkspaceHistory } from '../../../src/lib/workspace/submission-history'

test('history deep link loads an older attempt beyond the normal page in the same challenge', async () => {
  const urls: string[] = []
  const rows = await loadWorkspaceHistory('challenge-1', 'old-attempt', async (url) => {
    urls.push(String(url))
    return Response.json(urls.length === 1 ? [{ id: 'recent' }] : [{ id: 'old-attempt' }])
  })
  assert.deepEqual(rows, [{ id: 'recent' }, { id: 'old-attempt' }])
  assert.equal(urls.length, 2)
  const query = new URL(urls[1], 'https://app.test').searchParams
  assert.equal(query.get('attempt_id'), 'old-attempt')
  assert.equal(query.get('challenge_id'), 'challenge-1')
})

test('existing linked attempt does not cause another request', async () => {
  let calls = 0
  await loadWorkspaceHistory('challenge-1', 'recent', async () => {
    calls++
    return Response.json([{ id: 'recent' }])
  })
  assert.equal(calls, 1)
})

test('failed historical lookup preserves recent submissions', async () => {
  let calls = 0
  const rows = await loadWorkspaceHistory('challenge-1', 'old', async () => {
    if (calls++) throw new Error('offline')
    return Response.json([{ id: 'recent' }])
  })
  assert.deepEqual(rows, [{ id: 'recent' }])
})

test('unauthorized history read is not treated as an empty successful history', async () => {
  assert.equal(await loadWorkspaceHistory('challenge-1', undefined, async () => new Response(null, { status: 401 })), null)
})


test('missing or failed historical lookups cannot authorize a quota-consuming attempt', async () => {
  for (const targetResult of ['missing', 'forbidden', 'offline']) {
    let calls = 0
    const rows = await loadWorkspaceHistory('challenge-1', 'old', async () => {
      if (!calls++) return Response.json([{ id: 'recent' }])
      if (targetResult === 'offline') throw new Error('offline')
      return targetResult === 'forbidden' ? new Response(null, { status: 403 }) : Response.json([])
    })
    assert.deepEqual(rows, [{ id: 'recent' }])
    assert.equal(canStartWorkspaceAttempt('old', false), false)
  }
})

test('only explicit practice intent releases a historical visit into attempt creation', () => {
  assert.equal(canStartWorkspaceAttempt('old', false), false)
  assert.equal(canStartWorkspaceAttempt('old', true), true)
  assert.equal(canStartWorkspaceAttempt(undefined, false), true)
})
