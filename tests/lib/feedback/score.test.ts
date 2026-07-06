import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeToTen, gradeBand, GRADE_LABELS, bandClasses, bandHatchState } from '@/lib/feedback/score'

describe('normalizeToTen', () => {
  it('converts every stored scale to /10', () => {
    assert.equal(normalizeToTen(4.2, 5), 8.4)
    assert.equal(normalizeToTen(73, 100), 7.3)
    assert.equal(normalizeToTen(0.65, 1), 6.5)
    assert.equal(normalizeToTen(7.5, 10), 7.5)
  })
  it('clamps out-of-range and non-finite input', () => {
    assert.equal(normalizeToTen(6, 5), 10)
    assert.equal(normalizeToTen(-3, 10), 0)
    assert.equal(normalizeToTen(NaN, 100), 0)
  })
  it('rounds to one decimal', () => {
    assert.equal(normalizeToTen(1, 3 as never), 3.3)
  })
})

describe('gradeBand', () => {
  it('maps the canonical lexicon boundaries', () => {
    assert.equal(gradeBand(9.1), 'sharp')
    assert.equal(gradeBand(8), 'sharp')
    assert.equal(gradeBand(7.9), 'solid')
    assert.equal(gradeBand(5.5), 'solid')
    assert.equal(gradeBand(5.4), 'surface')
    assert.equal(gradeBand(3), 'surface')
    assert.equal(gradeBand(2.9), 'needs_work')
  })
  it('every band has a label, classes, and a Hatch state', () => {
    for (const band of ['sharp', 'solid', 'surface', 'needs_work'] as const) {
      assert.ok(GRADE_LABELS[band])
      assert.ok(bandClasses(band).ring)
      assert.ok(bandHatchState(band))
    }
  })
})
