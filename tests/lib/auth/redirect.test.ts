import test from 'node:test'
import assert from 'node:assert/strict'
import { authRedirectFromParams, safeAuthRedirect } from '../../../src/lib/auth/redirect'

test('retains challenge resume and checkout intent across sign-in aliases', () => {
  const path = '/workspace/challenges/checkout-funnel-drop?resume=1&attempt=abc#answer'
  for (const key of ['returnTo', 'redirectTo', 'next']) {
    assert.equal(authRedirectFromParams({ [key]: path }), path)
  }
  assert.equal(authRedirectFromParams({ returnTo: '/pricing?plan=annual&checkout=1' }), '/pricing?plan=annual&checkout=1')
})

test('rejects external navigation, malformed inputs and authentication loops', () => {
  for (const value of [undefined, ['//evil.example'], 'https://evil.example', '//evil.example', '/\\evil.example', '/\tevil.example', '/login', '/signup/?next=/dashboard', '/auth/callback', '/../login']) {
    assert.equal(safeAuthRedirect(value), undefined, String(value))
  }
})

test('uses a valid legacy destination if the preferred parameter is invalid', () => {
  assert.equal(authRedirectFromParams({ returnTo: '//evil.example', redirectTo: '/explore' }), '/explore')
  assert.equal(authRedirectFromParams({ returnTo: '/progress', next: '/dashboard' }), '/progress')
})
