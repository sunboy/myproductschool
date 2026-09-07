import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveDisplayCeilingUsd,
  resolveKeyMaxBudgetUsd,
} from '../../../src/lib/sandbox/cost-policy'

test('key max_budget reserves the default worst-case-turn headroom off the ceiling', () => {
  assert.equal(resolveKeyMaxBudgetUsd(0.49), 0.34)
  assert.equal(resolveKeyMaxBudgetUsd(0.5), 0.35)
  assert.equal(resolveKeyMaxBudgetUsd(1), 0.85)
})

test('key max_budget floors at MIN_SESSION_BUDGET_USD when the ceiling is at/under the headroom', () => {
  assert.equal(resolveKeyMaxBudgetUsd(0.1), 0.01)
  assert.equal(resolveKeyMaxBudgetUsd(0.05), 0.01)
  assert.equal(resolveKeyMaxBudgetUsd(0.01), 0.01)
})

test('key max_budget never exceeds the ceiling (non-positive overrides fall back to the default headroom)', () => {
  // positiveNumber() rejects <= 0 and falls back to DEFAULT_WORST_CASE_TURN_USD (0.10)
  assert.equal(resolveKeyMaxBudgetUsd(0.49, { worstCaseTurnUsd: 0 }), 0.34)
  assert.equal(resolveKeyMaxBudgetUsd(0.49, { worstCaseTurnUsd: -5 }), 0.34)
  // a headroom that would push below the ceiling never exceeds it
  assert.equal(resolveKeyMaxBudgetUsd(0.05, { worstCaseTurnUsd: 0.01 }), 0.04)
})

test('key max_budget respects an explicit worst-case-turn override', () => {
  assert.equal(resolveKeyMaxBudgetUsd(0.49, { worstCaseTurnUsd: 0.2 }), 0.29)
  assert.equal(resolveKeyMaxBudgetUsd(2, { worstCaseTurnUsd: 0.5 }), 1.5)
})

test('key max_budget respects CC_WORST_CASE_TURN_USD env when no explicit option is given', () => {
  const previous = process.env.CC_WORST_CASE_TURN_USD
  process.env.CC_WORST_CASE_TURN_USD = '0.25'
  try {
    assert.equal(resolveKeyMaxBudgetUsd(0.49), 0.24)
  } finally {
    if (previous === undefined) delete process.env.CC_WORST_CASE_TURN_USD
    else process.env.CC_WORST_CASE_TURN_USD = previous
  }
})

test('key max_budget ignores env when an explicit options object is supplied (mirrors resolveSessionBudgetUsd pattern)', () => {
  const previous = process.env.CC_WORST_CASE_TURN_USD
  process.env.CC_WORST_CASE_TURN_USD = '0.25'
  try {
    assert.equal(resolveKeyMaxBudgetUsd(0.49, { worstCaseTurnUsd: undefined }), 0.34)
  } finally {
    if (previous === undefined) delete process.env.CC_WORST_CASE_TURN_USD
    else process.env.CC_WORST_CASE_TURN_USD = previous
  }
})

test('display ceiling is always the raw ceiling, never the reduced mint value', () => {
  assert.equal(resolveDisplayCeilingUsd(0.49), 0.49)
  assert.equal(resolveDisplayCeilingUsd(0.01), 0.01)
})
