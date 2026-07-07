import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  evidenceConfidence,
  effectiveScore,
  archetypePriorLevel,
  deriveLevelFromCompetencies,
} from '@/lib/adaptive/confidence'
import { analystDimensionsToStepResults } from '@/lib/coding-grading/analyst-competency-map'

describe('evidenceConfidence', () => {
  it('is 0 with no evidence and strictly increases with attempts', () => {
    assert.equal(evidenceConfidence(0), 0)
    let prev = 0
    for (const n of [1, 2, 5, 10, 50]) {
      const c = evidenceConfidence(n)
      assert.ok(c > prev, `confidence(${n}) should exceed confidence of fewer attempts`)
      assert.ok(c < 1)
      prev = c
    }
  })

  it('treats negative attempts as zero', () => {
    assert.equal(evidenceConfidence(-3), 0)
  })
})

describe('effectiveScore', () => {
  it('returns the neutral 50 at cold start regardless of raw score', () => {
    assert.equal(effectiveScore(95, 0), 50)
    assert.equal(effectiveScore(5, 0), 50)
  })

  it('converges toward the raw score as evidence grows', () => {
    const thin = effectiveScore(90, 1)
    const rich = effectiveScore(90, 40)
    assert.ok(thin < rich)
    assert.ok(rich > 85)
    assert.ok(thin < 60)
  })
})

describe('archetypePriorLevel', () => {
  it('caps every archetype at Developing and defaults unknown to Beginner', () => {
    assert.equal(archetypePriorLevel('The Analyst'), 'Developing')
    assert.equal(archetypePriorLevel('The Operator'), 'Developing')
    assert.equal(archetypePriorLevel('The Emerging Thinker'), 'Beginner')
    assert.equal(archetypePriorLevel('Something Invented'), 'Beginner')
    assert.equal(archetypePriorLevel(null), 'Beginner')
  })
})

describe('deriveLevelFromCompetencies', () => {
  it('returns the archetype prior below the evidence floor', () => {
    const rows = [{ score: 95, total_attempts: 1 }, { score: 90, total_attempts: 1 }]
    assert.equal(deriveLevelFromCompetencies(rows, 'Developing'), 'Developing')
    assert.equal(deriveLevelFromCompetencies([], 'Developing'), 'Developing')
  })

  it('does not grant high levels on thin evidence even past the floor', () => {
    // Three attempts of score 90: confidence 3/8 shrinks 90 to 65; a single
    // hot streak lands Advanced at most, never Expert.
    const rows = [{ score: 90, total_attempts: 3 }]
    const level = deriveLevelFromCompetencies(rows, 'Beginner')
    assert.notEqual(level, 'Expert')
  })

  it('grants Expert only with high scores AND deep evidence', () => {
    const rows = [
      { score: 92, total_attempts: 30 },
      { score: 88, total_attempts: 25 },
    ]
    assert.equal(deriveLevelFromCompetencies(rows, 'Beginner'), 'Expert')
  })

  it('is monotone in evidence for an above-neutral score', () => {
    const at = (n: number) => deriveLevelFromCompetencies([{ score: 85, total_attempts: n }], 'Beginner')
    const order = ['Beginner', 'Developing', 'Advanced', 'Expert']
    assert.ok(order.indexOf(at(3)) <= order.indexOf(at(10)))
    assert.ok(order.indexOf(at(10)) <= order.indexOf(at(40)))
  })
})

describe('analystDimensionsToStepResults', () => {
  it('maps a fully graded rubric with weight 1', () => {
    const dims = {
      connection_setup: { score: 1 },
      problem_framing: { score: 0.5 },
      query_rigor: { score: 1 },
      segmentation: { score: 0.5 },
      communication: { score: 1 },
      evidence: { score: 0 },
      skill_construction: { score: 1 },
    }
    const results = analystDimensionsToStepResults(dims)
    assert.equal(results.length, 7)
    for (const r of results) {
      assert.equal(r.step_weight, 1)
      assert.equal(r.competencies_demonstrated.length, 1)
      assert.ok(r.score >= 0 && r.score <= 1)
    }
  })

  it('scales weight down for partial sessions with a 0.25 floor', () => {
    const one = analystDimensionsToStepResults({ query_rigor: { score: 1 } })
    assert.equal(one.length, 1)
    assert.equal(one[0].step_weight, 0.25)
    const two = analystDimensionsToStepResults({
      query_rigor: { score: 1 },
      segmentation: { score: 0.5 },
    })
    assert.equal(two[0].step_weight, 2 / 7)
  })

  it('ignores unknown dimensions and non-numeric scores', () => {
    const results = analystDimensionsToStepResults({
      made_up: { score: 1 },
      query_rigor: { score: 'high' },
    } as never)
    assert.equal(results.length, 0)
    assert.equal(analystDimensionsToStepResults(null).length, 0)
    assert.equal(analystDimensionsToStepResults(undefined).length, 0)
  })
})
