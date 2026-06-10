import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ROAST_RUBRIC,
  normalizeRoastBreakdown,
  normalizeRoastSections,
} from '../../../src/lib/careerops/public/roast'

test('normalizeRoastBreakdown coerces onto the roast rubric', () => {
  const breakdown = normalizeRoastBreakdown([
    { dimension: 'evidence', score: 0.4, note: 'adjectives, no numbers' },
    { dimension: 'target_fit', score: -2, note: 'clamped up' },
  ])
  assert.equal(breakdown.length, ROAST_RUBRIC.length)
  assert.deepEqual(
    breakdown.map((d) => d.weight),
    ROAST_RUBRIC.map((d) => d.weight),
  )
  assert.equal(breakdown[0].score, 0.4)
  assert.equal(breakdown[3].score, 0, 'negative scores clamp to 0')
  assert.equal(breakdown[1].score, 0, 'missing dimensions score 0')
})

test('normalizeRoastSections caps at 6 and coerces severity', () => {
  const sections = normalizeRoastSections([
    { title: 'No numbers', severity: 'fatal', finding: 'f', fix: 'x' },
    { title: 'Weird severity', severity: 'catastrophic', finding: 'f', fix: 'x' },
    ...Array.from({ length: 8 }, (_, i) => ({ title: `s${i}`, severity: 'minor', finding: 'f', fix: 'x' })),
  ])
  assert.equal(sections.length, 6)
  assert.equal(sections[0].severity, 'fatal')
  assert.equal(sections[1].severity, 'major', 'unknown severity coerces to major')
})

test('normalizeRoastSections survives garbage', () => {
  assert.deepEqual(normalizeRoastSections(null), [])
  assert.deepEqual(normalizeRoastSections('x'), [])
  const sections = normalizeRoastSections([null, 'x', { title: 'ok', severity: 'minor', finding: 'f', fix: 'x' }])
  assert.equal(sections.length, 1)
})
