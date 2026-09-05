import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveSessionBudgetUsd,
  resolveSessionTtlSeconds,
  allowsDirectProviderKey,
} from '../../../src/lib/sandbox/cost-policy'
import {
  trafficWithSession,
  trafficWithoutSession,
  resolveBaseRevision,
  planSessionTrafficCreate,
  planSessionTrafficRemoval,
} from '../../../src/lib/sandbox/cloud-run-traffic'

test('session TTL rejects invalid values and cannot exceed the explicit ceiling', () => {
  assert.equal(resolveSessionTtlSeconds(undefined, undefined), 1_800)
  assert.equal(resolveSessionTtlSeconds('not-a-number', 900), 900)
  assert.equal(resolveSessionTtlSeconds(3_600, 1_800), 1_800)
  assert.equal(resolveSessionTtlSeconds(10, 1_800), 60)
})

test('session budget needs an explicit ceiling increase', () => {
  assert.equal(resolveSessionBudgetUsd(undefined, undefined), 0.5)
  assert.equal(resolveSessionBudgetUsd('100', '0.50'), 0.5)
  assert.equal(resolveSessionBudgetUsd('0.37', '0.50'), 0.37)
  assert.equal(resolveSessionBudgetUsd('invalid', 'invalid'), 0.5)
})

test('direct provider keys are explicit and never allowed in production', () => {
  assert.equal(allowsDirectProviderKey('development', undefined), false)
  assert.equal(allowsDirectProviderKey('development', 'true'), true)
  assert.equal(allowsDirectProviderKey(undefined, 'true'), false)
  assert.equal(allowsDirectProviderKey('production', 'true'), false)
})

test('adding a session preserves other tagged revisions and replaces the same tag', () => {
  const existing = [
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-a', tag: 'sa', percent: 0 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-old', tag: 'sb', percent: 0 },
  ]

  assert.deepEqual(trafficWithSession(existing, 'sb', 'cc-sandbox-new'), [
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-a', tag: 'sa', percent: 0 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-new', tag: 'sb', percent: 0 },
  ])
})

test('removing a session leaves every other live session tag intact', () => {
  const existing = [
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-a', tag: 'sa', percent: 0 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-b', tag: 'sb', percent: 0 },
  ]

  assert.deepEqual(trafficWithoutSession(existing, 'sa'), [
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-b', tag: 'sb', percent: 0 },
  ])
})

test('an explicit sterile base revision receives untagged service traffic', () => {
  const withSession = trafficWithSession([], 'sa', 'cc-sandbox-a', 'cc-sandbox-base')
  assert.deepEqual(withSession[0], {
    type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
    revision: 'cc-sandbox-base',
    percent: 100,
  })

  assert.deepEqual(trafficWithoutSession(withSession, 'sa', 'cc-sandbox-base'), [{
    type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
    revision: 'cc-sandbox-base',
    percent: 100,
  }])
})

test('base revision inference accepts only an untagged auto-named revision', () => {
  assert.equal(resolveBaseRevision('cc-sandbox', [], [{
    type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST',
    revision: 'cc-sandbox-00042-abc',
    percent: 100,
  }]), 'cc-sandbox-00042-abc')

  assert.equal(resolveBaseRevision('cc-sandbox', [], [{
    type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
    revision: 'cc-sandbox-sdeadbeef',
    percent: 100,
  }]), undefined)

  assert.equal(resolveBaseRevision('cc-sandbox', [], [], 'cc-sandbox-sdeadbeef'), undefined)
  assert.equal(resolveBaseRevision('cc-sandbox', [], [], 'cc-sandbox-base'), 'cc-sandbox-base')
  assert.equal(
    resolveBaseRevision(
      'cc-sandbox',
      [],
      [],
      'projects/hackproduct/locations/us-central1/services/cc-sandbox/revisions/cc-sandbox-base',
    ),
    'cc-sandbox-base',
  )
  assert.equal(
    resolveBaseRevision('cc-sandbox', [], [], 'cc-sandbox-00099-safe'),
    'cc-sandbox-00099-safe',
  )
})

test('create plan carries etag, pins the base, and preserves another live tag', () => {
  const plan = planSessionTrafficCreate('cc-sandbox', {
    etag: 'service-version-7',
    traffic: [
      { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
      { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-sa', tag: 'sa', percent: 0 },
    ],
    trafficStatuses: [{
      type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST',
      revision: 'cc-sandbox-00042-abc',
      percent: 100,
    }],
  }, 'sb', 'cc-sandbox-sb')

  assert.equal(plan.etag, 'service-version-7')
  assert.deepEqual(plan.traffic, [
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-00042-abc', percent: 100 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-sa', tag: 'sa', percent: 0 },
    { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION', revision: 'cc-sandbox-sb', tag: 'sb', percent: 0 },
  ])
})

test('traffic planning fails closed without concurrency or base state', () => {
  assert.throws(
    () => planSessionTrafficRemoval('cc-sandbox', { traffic: [] }, 'sa'),
    /no etag/,
  )
  assert.throws(
    () => planSessionTrafficRemoval('cc-sandbox', { etag: 'v1', traffic: [] }, 'sa'),
    /base revision is unresolved/,
  )
})
