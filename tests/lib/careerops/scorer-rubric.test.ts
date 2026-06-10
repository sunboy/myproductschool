import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FIT_RUBRIC,
  gradeFromScore,
  normalizeBreakdown,
  scoreFromBreakdown,
} from '../../../src/lib/careerops/scorer'

test('normalizeBreakdown coerces onto the fixed rubric with fixed weights', () => {
  const breakdown = normalizeBreakdown([
    { dimension: 'skill_match', score: 0.9, note: 'stack lines up' },
    { dimension: 'level_match', score: 1.7, note: 'clamped' },
    { dimension: 'made_up_dimension', score: 1, note: 'dropped' },
  ])

  assert.equal(breakdown.length, FIT_RUBRIC.length)
  assert.deepEqual(
    breakdown.map((d) => d.weight),
    FIT_RUBRIC.map((d) => d.weight),
  )
  assert.equal(breakdown[0].score, 0.9)
  assert.equal(breakdown[1].score, 1, 'scores clamp to 0..1')
  // Missing dimensions score 0, invented dimensions are dropped.
  assert.equal(breakdown[2].score, 0)
  assert.equal(breakdown[3].score, 0)
})

test('normalizeBreakdown survives garbage input', () => {
  for (const garbage of [null, undefined, 'nope', 42, [{}, null, 'x']]) {
    const breakdown = normalizeBreakdown(garbage)
    assert.equal(breakdown.length, FIT_RUBRIC.length)
    assert.ok(breakdown.every((d) => d.score === 0))
  }
})

test('scoreFromBreakdown is fixed arithmetic over the rubric', () => {
  const perfect = normalizeBreakdown(FIT_RUBRIC.map((d) => ({ dimension: d.key, score: 1, note: '' })))
  assert.equal(scoreFromBreakdown(perfect), 100)

  const zero = normalizeBreakdown([])
  assert.equal(scoreFromBreakdown(zero), 0)

  const skillOnly = normalizeBreakdown([{ dimension: 'skill_match', score: 1, note: '' }])
  assert.equal(scoreFromBreakdown(skillOnly), 35, 'skill_match carries weight 0.35')
})

test('gradeFromScore thresholds', () => {
  assert.equal(gradeFromScore(85), 'A')
  assert.equal(gradeFromScore(84), 'B')
  assert.equal(gradeFromScore(70), 'B')
  assert.equal(gradeFromScore(55), 'C')
  assert.equal(gradeFromScore(40), 'D')
  assert.equal(gradeFromScore(39), 'F')
})
