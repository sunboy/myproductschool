import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  HATCH_ACTION_RESPONSE_CONTRACT,
  buildEmptyStateResponse,
  detectSubmissionQuality,
  inferSkillDiscipline,
} from '../../../src/lib/hatch/skill-context'

describe('skill context helpers', () => {
  it('infers discipline from challenge type before role', () => {
    assert.equal(inferSkillDiscipline('system_design', 'data_scientist'), 'software')
    assert.equal(inferSkillDiscipline('data_modeling', 'swe'), 'data')
    assert.equal(inferSkillDiscipline('sql', 'pm'), 'data')
    assert.equal(inferSkillDiscipline('algorithm', 'pm'), 'software')
    assert.equal(inferSkillDiscipline('quick_take', 'swe'), 'product')
  })

  it('falls back to role discipline when challenge type is not provided', () => {
    assert.equal(inferSkillDiscipline(null, 'data_eng'), 'data')
    assert.equal(inferSkillDiscipline(null, 'designer'), 'design')
    assert.equal(inferSkillDiscipline(null, 'em'), 'leadership')
    assert.equal(inferSkillDiscipline(null, 'swe'), 'software')
    assert.equal(inferSkillDiscipline(null, null), 'product')
  })

  it('classifies empty and thin submissions deterministically', () => {
    assert.equal(detectSubmissionQuality(''), 'empty')
    assert.equal(detectSubmissionQuality('metric maybe'), 'too_thin')
    assert.equal(
      detectSubmissionQuality('I would segment new users by activation path, then compare dropoff after the first retained session.'),
      'substantive'
    )
  })

  it('builds plain-language empty states by discipline', () => {
    const coding = buildEmptyStateResponse({
      surface: 'grading',
      discipline: 'software',
      challengeType: 'algorithm',
    })
    assert.match(coding.summary, /working code/)
    assert.match(coding.next_actions[0], /smallest test case/)

    const data = buildEmptyStateResponse({
      surface: 'grading',
      discipline: 'data',
      challengeType: 'data_modeling',
    })
    assert.match(data.summary, /core entities/)
    assert.match(data.next_actions[0], /grain/)

    const systemDesign = buildEmptyStateResponse({
      surface: 'grading',
      discipline: 'software',
      challengeType: 'system_design',
    })
    assert.match(systemDesign.summary, /first diagram/)
    assert.match(systemDesign.next_actions[0], /components/)
    assert.doesNotMatch(systemDesign.next_actions[0], /test case/)

    const analytics = buildEmptyStateResponse({
      surface: 'grading',
      discipline: 'analytics',
      challengeType: 'claude_code_analytics',
    })
    assert.match(analytics.summary, /analysis plan/)
    assert.match(analytics.next_actions[0], /comparison/)
  })

  it('keeps the shared response contract action-oriented', () => {
    assert.match(HATCH_ACTION_RESPONSE_CONTRACT, /1-3 concrete next actions/)
    assert.match(HATCH_ACTION_RESPONSE_CONTRACT, /practice link/)
    assert.doesNotMatch(HATCH_ACTION_RESPONSE_CONTRACT, /opus/i)
  })
})
