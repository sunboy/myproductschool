import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildCompletedAttemptResult } from '@/lib/scoring/completed-attempt-result'

describe('completed attempt result', () => {
  it('replays stored completion feedback for duplicate finalization requests', () => {
    const result = buildCompletedAttemptResult({
      total_score: 3,
      max_score: 5,
      grade_label: 'Fallback',
      feedback_json: {
        total_score: 4.2,
        max_score: 5,
        grade_label: 'Sharp',
        xp_awarded: 92,
        competency_deltas: [{ competency: 'strategic_thinking', before: 50, after: 58 }],
        step_breakdown: [{ step: 'frame', score: 0.8, max_score: 1 }],
        step_signals: [{ step: 'frame', quality_label: 'best' }],
        mental_models_breakdown: [{ step: 'frame', competency: 'motivation_theory' }],
        primary_competency: 'strategic_thinking',
        weakest_competency: 'motivation_theory',
      },
    })

    assert.equal(result.total_score, 4.2)
    assert.equal(result.max_score, 5)
    assert.equal(result.grade_label, 'Sharp')
    assert.equal(result.xp_awarded, 92)
    assert.deepEqual(result.step_breakdown, [{ step: 'frame', score: 0.8, max_score: 1 }])
    assert.equal(result.primary_competency, 'strategic_thinking')
    assert.equal(result.weakest_competency, 'motivation_theory')
    assert.equal(result.alreadyCompleted, true)
  })

  it('falls back to attempt columns when old attempts lack feedback JSON', () => {
    const result = buildCompletedAttemptResult({
      total_score: '3.5',
      max_score: 5,
      grade_label: 'Solid',
      feedback_json: null,
      primary_competency: 'taste',
      weakest_competency: 'domain_expertise',
    })

    assert.equal(result.total_score, 3.5)
    assert.equal(result.max_score, 5)
    assert.equal(result.grade_label, 'Solid')
    assert.equal(result.xp_awarded, 0)
    assert.deepEqual(result.competency_deltas, [])
    assert.deepEqual(result.step_breakdown, [])
    assert.equal(result.primary_competency, 'taste')
    assert.equal(result.weakest_competency, 'domain_expertise')
  })
})
