import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gradeCodingAttempt, gradeFromCorrectnessFallback, shouldUseDeterministicCodingGrade, retainObservedCodingDimensions } from '../../../src/lib/coding-grading/grader'
import type { GradingFeedback } from '../../../src/lib/coding/types'
import { retainObservedCanvasDimensions } from '../../../src/lib/v2/skills/interview-grading/observed-dimensions'
import type { InterviewGrade } from '../../../src/lib/types'
import type { GradingInput } from '../../../src/lib/coding-grading/grader'

function baseInput(overrides: Partial<GradingInput> = {}): GradingInput {
  return {
    challenge: {
      title: 'Two Sum',
      difficulty: 'easy',
      problem_statement: 'Return indices for two values that add to the target.',
    },
    finalCode: '',
    language: 'python',
    correctness: {
      runId: 'test-run',
      testsPassed: 0,
      testsTotal: 1,
      results: [{
        id: 'visible-1',
        label: 'Basic pair',
        status: 'no_solution',
        hidden: false,
      }],
    },
    chatHistory: [],
    sessionEvents: [],
    ...overrides,
  }
}

describe('coding grader deterministic guardrails', () => {
  it('does not need AI when no code was submitted', async () => {
    const input = baseInput()
    assert.equal(shouldUseDeterministicCodingGrade(input), true)

    const grade = await gradeCodingAttempt(input)
    assert.equal(grade.overall_score, 1)
    assert.match(grade.summary ?? '', /working code/)
    assert.equal(grade.next_actions?.length, 1)
    assert.equal(grade.score_breakdown?.correctness.tests_total, 1)
    assert.match(grade.score_breakdown?.process.summary ?? '', /Process signal is thin/)
  })

  it('asks for a runnable signal when code exists but tests did not run', async () => {
    const input = baseInput({
      finalCode: 'def two_sum(nums, target):\n    return []',
      correctness: {
        runId: 'test-run',
        testsPassed: 0,
        testsTotal: 0,
        results: [],
      },
    })
    assert.equal(shouldUseDeterministicCodingGrade(input), true)

    const grade = await gradeCodingAttempt(input)
    assert.match(grade.summary ?? '', /runnable test result/)
    assert.match(grade.next_actions?.[0] ?? '', /Run the visible tests/)
    assert.equal(grade.score_breakdown?.correctness.score, 0)
  })
})


describe('unavailable detailed coding review', () => {
  it('keeps objective correctness without inventing process or skill scores', () => {
    const grade = gradeFromCorrectnessFallback(baseInput({
      finalCode: 'return [0, 1]',
      correctness: { runId: 'verified-run', testsPassed: 1, testsTotal: 1, results: [{ id: 'visible-1', label: 'Basic pair', status: 'passed', hidden: false }] },
    }))
    assert.equal(grade.degraded, true)
    assert.deepEqual(grade.dimensions, {})
    assert.equal(grade.score_breakdown?.correctness.tests_passed, 1)
    assert.equal(grade.score_breakdown?.process.score, null)
    assert.match(grade.score_breakdown?.process.summary ?? '', /not been assessed/)
  })
})

describe('independent coding work', () => {
  it('does not lower the score for chat or testing activity that was not observed', () => {
    const dimension = (score: number) => ({ score, verdict: 'Observed', evidence: 'Evidence', hole_to_poke: 'Question', how_to_improve: 'Next step' })
    const feedback: GradingFeedback = {
      overall_score: 2, headline: 'Correct solution', top_strength: 'Correct', top_improvement: 'Explain the invariant', what_a_5_would_look_like: 'Clear invariant',
      dimensions: { problem_approach: dimension(4), code_quality: dimension(4), ai_collaboration: dimension(1), interview_communication: dimension(1), verification_discipline: dimension(1) },
    }
    const result = retainObservedCodingDimensions(feedback, baseInput({ finalCode: 'return [0, 1]' }))
    assert.equal(result.overall_score, 4)
    assert.deepEqual(Object.keys(result.dimensions), ['problem_approach', 'code_quality'])
    const observed = retainObservedCodingDimensions(feedback, baseInput({
      chatHistory: [{ role: 'user', content: 'I would first test a repeated value.' }],
      sessionEvents: [{ type: 'code_run', timestamp: '2026-09-05T00:00:00Z', language: 'python', testsPassed: 1, testsTotal: 1, runId: 'run' }],
    }))
    assert.equal(Object.keys(observed.dimensions).length, 5)
    assert.equal(observed.overall_score, 2.2)
  })
})

describe('independent canvas work', () => {
  it('removes an invented collaboration penalty while preserving observed collaboration', () => {
    const dimension = (score: number) => ({ score, verdict: 'Observed', evidence: 'Evidence', hole_to_poke: 'Question', how_to_improve: 'Next step' })
    const grade: InterviewGrade = {
      overall_score: 3.6, headline: 'Sound model', top_strength: 'Relationships', top_improvement: 'Add constraints', canvas_annotations: [],
      dimensions: { entity_coverage: dimension(4), relationship_modeling: dimension(4), schema_quality: dimension(4), indexing_and_query_awareness: dimension(4), hatch_collaboration: dimension(1) },
    }
    const independent = retainObservedCanvasDimensions(grade, 'data_modeling', null)
    assert.equal(independent.overall_score, 4)
    assert.equal(independent.dimensions.hatch_collaboration, undefined)
    assert.equal(retainObservedCanvasDimensions(grade, 'data_modeling', 'Hatch: Ask me anything.').overall_score, 4)
    assert.equal(retainObservedCanvasDimensions(grade, 'data_modeling', 'User: Can you inspect the join?\nHatch: Yes.').dimensions.hatch_collaboration?.score, 1)
  })
})
