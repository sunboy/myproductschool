import assert from 'node:assert/strict'
import test from 'node:test'

import { cleanDisplayCopy } from '@/lib/copy/display'

test('cleans dash separators from display copy', () => {
  assert.equal(
    cleanDisplayCopy('Set pricing — protect checkout conversion'),
    'Set pricing, protect checkout conversion'
  )
  assert.equal(
    cleanDisplayCopy('Frame the launch -- then pick the metric'),
    'Frame the launch, then pick the metric'
  )
  assert.equal(
    cleanDisplayCopy('Diagnose churn &mdash; recommend one fix'),
    'Diagnose churn, recommend one fix'
  )
})

test('normalizes whitespace around punctuation', () => {
  assert.equal(cleanDisplayCopy('Keep the answer , tight'), 'Keep the answer, tight')
  assert.equal(cleanDisplayCopy('  Ship   the   habit loop  '), 'Ship the habit loop')
  assert.equal(cleanDisplayCopy(null), '')
})
