import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildCompetencySignal,
  computeChallengeCompetencyRollup,
  competenciesForSignalInput,
} from '@/lib/scoring/competency-rollup'

describe('competency rollup', () => {
  it('maps low Frame scores to motivation_theory as the weakest competency', () => {
    const rollup = computeChallengeCompetencyRollup([
      { step: 'frame', score: 0.5, grading_explanation: 'Missed the user friction.' },
      { step: 'list', score: 4.5, grading_explanation: 'Mapped stakeholder goals.' },
      { step: 'optimize', score: 4.25, grading_explanation: 'Named a criterion.' },
      { step: 'win', score: 4.5, grading_explanation: 'Made a clear recommendation.' },
    ])

    assert.equal(rollup.weakestCompetency, 'motivation_theory')
    assert.equal(rollup.mentalModelsBreakdown[0].step, 'frame')
    assert.equal(rollup.mentalModelsBreakdown[0].competency, 'motivation_theory')
  })

  it('uses target competencies before looser demonstrated competencies', () => {
    const competencies = competenciesForSignalInput({
      step: 'optimize',
      target_competencies: ['taste', 'strategic_thinking'],
      competencies_demonstrated: ['domain_expertise'],
    })

    assert.deepEqual(competencies, ['taste', 'strategic_thinking'])
  })

  it('normalizes legacy primary signal keys to the shared competency shape', () => {
    const signal = buildCompetencySignal({
      step: 'win',
      score: 3,
      competency_signal: {
        primary: 'domain_expertise',
        signal: 'Named a concrete launch metric.',
        framework_hint: 'Domain Expertise: pick a metric that can be observed.',
      },
    })

    assert.deepEqual(signal, {
      competency: 'domain_expertise',
      signal: 'Named a concrete launch metric.',
      framework_hint: 'Domain Expertise: pick a metric that can be observed.',
    })
  })
})
