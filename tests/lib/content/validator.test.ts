import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateChallengeJson } from '../../../src/lib/content/validator'
import type { ChallengeJson, FlowStep } from '../../../src/lib/types'

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

type ChallengeJsonOverrides = Omit<Partial<ChallengeJson>, 'metadata' | 'scenario'> & {
  metadata?: Partial<ChallengeJson['metadata']>
  scenario?: Partial<ChallengeJson['scenario']>
}

function buildChallengeJson(overrides: ChallengeJsonOverrides = {}): ChallengeJson {
  const base: ChallengeJson = {
    scenario: {
      role: 'Product team',
      context: 'A checkout flow has rising seller drop-off after the pricing step.',
      trigger: 'The weekly dashboard shows fewer sellers finishing setup.',
      question: 'Which root cause should the team test first?',
      explanation: 'The strongest answer connects seller motivation, pricing clarity, and setup completion.',
      engineer_standout: 'Strong engineers connect the product symptom to a measurable system behavior.',
      specific_detail: 'seller pricing setup completion',
    },
    flow_steps: FLOW_STEPS.map((step, index) => ({
      step,
      theme: 'T1',
      theme_name: 'Reasoning',
      step_nudge: 'What evidence would change the decision?',
      grading_weight: 0.25,
      questions: [
        {
          question_text: `What is the strongest ${step} move?`,
          question_nudge: 'Which answer best connects the facts?',
          sequence: index + 1,
          grading_weight_within_step: 1,
          target_competencies: ['motivation_theory'],
          options: [
            {
              label: 'A',
              quality: 'best',
              text: 'Test whether pricing clarity blocks seller setup completion.',
              explanation: 'It links the symptom to a specific measurable cause.',
              competencies: ['motivation_theory'],
            },
            {
              label: 'B',
              quality: 'good_but_incomplete',
              text: 'Ask sellers where setup feels confusing before changing screens.',
              explanation: 'It gathers useful evidence but does not name the main hypothesis.',
              competencies: ['cognitive_empathy'],
            },
            {
              label: 'C',
              quality: 'surface',
              text: 'Redesign the pricing step so it looks more polished.',
              explanation: 'It jumps to UI work before proving the problem.',
              competencies: ['taste'],
            },
            {
              label: 'D',
              quality: 'plausible_wrong',
              text: 'Ignore pricing because setup completion is only an onboarding issue.',
              explanation: 'It dismisses a likely cause without evidence.',
              competencies: ['strategic_thinking'],
            },
          ],
        },
      ],
    })),
    metadata: {
      paradigm: 'traditional',
      industry: 'marketplace',
      sub_vertical: 'seller tools',
      difficulty: 'standard',
      estimated_minutes: 20,
      primary_competencies: ['motivation_theory'],
      secondary_competencies: ['cognitive_empathy'],
      frameworks: ['FLOW'],
      relevant_roles: ['SWE'],
      company_tags: ['marketplace'],
      tags: ['checkout'],
    },
  }

  return {
    ...base,
    ...overrides,
    scenario: { ...base.scenario, ...overrides.scenario },
    metadata: { ...base.metadata, ...overrides.metadata },
    flow_steps: overrides.flow_steps ?? base.flow_steps,
  }
}

test('validateChallengeJson accepts a voice-clean fixture', () => {
  const result = validateChallengeJson(buildChallengeJson())

  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
  assert.equal(result.warnings.some((warning) => /launch voice|role framing/.test(warning.message)), false)
})

test('validateChallengeJson rejects em dashes in user-facing copy', () => {
  const result = validateChallengeJson(
    buildChallengeJson({
      scenario: { question: 'Which root cause matters most — and why?' },
    })
  )

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.path === 'scenario.question' && /em dash/.test(error.message)))
})

test('validateChallengeJson warns on banned launch slop', () => {
  const result = validateChallengeJson(
    buildChallengeJson({
      scenario: { explanation: 'Use a robust framing before choosing the next move.' },
    })
  )

  assert.equal(result.valid, true)
  assert.ok(result.warnings.some((warning) => warning.path === 'scenario.explanation' && /robust/.test(warning.message)))
})
