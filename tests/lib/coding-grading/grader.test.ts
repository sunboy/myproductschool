import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gradeCodingAttempt, gradeFromCorrectnessFallback, shouldUseDeterministicCodingGrade } from '../../../src/lib/coding-grading/grader'
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
