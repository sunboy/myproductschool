/**
 * Unit tests for day-one community helpers.
 *
 * Run with:
 *   npx tsx --test tests/unit/community.test.ts
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveLensTag, formatCommunityDisplayName } from '../../src/lib/community-shared'

test('deriveLensTag prefers metric-first when metrics are explicit', () => {
  assert.equal(
    deriveLensTag({ responseText: 'I would anchor on activation, retention, and conversion before choosing a fix.' }),
    'metric-first'
  )
})

test('deriveLensTag detects segment-first reasoning', () => {
  assert.equal(
    deriveLensTag({ responseText: 'Split new users, returning users, and power users before proposing roadmap changes.' }),
    'segment-first'
  )
})

test('deriveLensTag detects tradeoff-aware reasoning', () => {
  assert.equal(
    deriveLensTag({ responseText: 'The tradeoff is speed of rollback versus the learning value from the regression.' }),
    'tradeoff-aware'
  )
})

test('deriveLensTag marks high scoring answers as strong wins', () => {
  assert.equal(
    deriveLensTag({ responseText: 'Clean structured answer.', score: 2.7, maxScore: 3 }),
    'strong win'
  )
})

test('formatCommunityDisplayName honors per-submission display mode', () => {
  assert.equal(formatCommunityDisplayName('named', 'Sandeep'), 'Sandeep')
  assert.equal(formatCommunityDisplayName('anonymous', 'Sandeep'), 'Anonymous peer')
  assert.equal(formatCommunityDisplayName('named', null), 'Anonymous peer')
})
