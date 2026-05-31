import type { FlowOption, FlowStep, ResponseType } from '@/lib/types'
import { routeResponse, gradePureMCQ, gradeMultiSelectMCQ } from './grading-router'
import { scoreOption } from './option-scorer'
import { STEP_PRIMARY_COMPETENCIES } from '@/lib/hatch/system-prompt'
import { assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { detectSubmissionQuality } from '@/lib/hatch/skill-context'

export type StepAnswerInput = {
  questionId: string
  responseType: ResponseType
  selectedOptionId?: string | null
  selectedOptionIds?: string[]
  userText?: string | null
  targetCompetencies?: string[]
}

export type GradedAnswer = {
  score: number
  quality_label: string
  competencies_demonstrated: string[]
  grading_explanation: string
  grading_confidence: number
  competency_signal: { competency: string; signal: string; framework_hint?: string } | null
}

/**
 * Raised when a freeform/modified-option submission is empty or too thin to grade.
 * The caller decides how to surface this (the per-question route returns a 422
 * not_ready payload; the batch route rejects the whole step).
 */
export class AnswerNotReadyError extends Error {
  reason: 'empty' | 'too_thin'
  constructor(reason: 'empty' | 'too_thin') {
    super(`Answer not ready to grade: ${reason}`)
    this.name = 'AnswerNotReadyError'
    this.reason = reason
  }
}

type Scenario = { scenario_context: string; scenario_trigger: string }
type AiBudget = { userId: string; userPlan: string; route: string } | undefined

/**
 * Grades a single step answer. Extracted verbatim from the per-question submit
 * route so the per-question endpoint and the step batch endpoint share one
 * grading path. Throws on validation failure; the caller maps that to a response.
 *
 * Network/budget errors from the AI paths (PlanLimitExceeded / AiBudgetExceededError)
 * propagate to the caller so it can return the right 402 before persisting anything.
 */
export async function gradeOneAnswer(params: {
  answer: StepAnswerInput
  options: FlowOption[]
  scenario: Scenario
  step: FlowStep
  userId: string
  userPlan: string | null
  aiBudget: AiBudget
}): Promise<GradedAnswer> {
  const { answer, options, scenario, step, userId, userPlan, aiBudget } = params
  const { responseType, selectedOptionId, selectedOptionIds, userText, targetCompetencies = [] } = answer

  const path = routeResponse(responseType)

  let score: number
  let quality_label: string
  let competencies_demonstrated: string[]
  let grading_explanation: string
  let grading_confidence: number
  let competency_signal: { competency: string; signal: string; framework_hint?: string } | null = null

  if (path === 'deterministic') {
    if (!selectedOptionId) {
      throw new Error('selected_option_id required for pure_mcq')
    }
    const result = gradePureMCQ(selectedOptionId, options)
    score = result.score
    quality_label = result.quality_label
    competencies_demonstrated = result.competencies_demonstrated
    grading_explanation = result.grading_explanation
    grading_confidence = result.confidence

    const selectedOption = options.find(o => o.id === selectedOptionId)
    const hint = selectedOption?.framework_hint?.trim() ?? ''
    competency_signal = hint ? {
      competency: STEP_PRIMARY_COMPETENCIES[step]?.[0] ?? 'strategic_thinking',
      signal: hint,
      framework_hint: hint,
    } : null

  } else if (path === 'multi_deterministic') {
    if (!selectedOptionIds || selectedOptionIds.length === 0) {
      throw new Error('selected_option_ids required for multi_select_mcq')
    }
    const result = gradeMultiSelectMCQ(selectedOptionIds, options)
    score = result.score
    quality_label = result.quality_label
    competencies_demonstrated = result.competencies_demonstrated
    grading_explanation = result.grading_explanation
    grading_confidence = result.confidence

  } else if (path === 'hybrid') {
    if (!selectedOptionId) {
      throw new Error('selected_option_id required for mcq_plus_elaboration')
    }
    const baseResult = scoreOption(selectedOptionId, options)
    const baseOption = options.find(o => o.id === selectedOptionId)!

    if (userText?.trim()) {
      const { gradeElaboration } = await import('@/lib/v2/skills/ai/freeform-grader')
      await assertPlanLimit(userId, userPlan, 'ai_grading_runs')
      const elaborationResult = await gradeElaboration(baseOption, userText, options, scenario, step, aiBudget)
      score = elaborationResult.finalScore
      quality_label = baseResult.quality_label
      competencies_demonstrated = [
        ...baseResult.competencies_demonstrated,
        ...elaborationResult.additional_competencies,
      ]
      grading_explanation = elaborationResult.adjustment_reason
      grading_confidence = 0.85
    } else {
      score = baseResult.score
      quality_label = baseResult.quality_label
      competencies_demonstrated = baseResult.competencies_demonstrated
      grading_explanation = baseResult.grading_explanation
      grading_confidence = 1.0
    }

    const baseHint = baseOption.framework_hint?.trim() ?? ''
    competency_signal = baseHint ? {
      competency: STEP_PRIMARY_COMPETENCIES[step]?.[0] ?? 'strategic_thinking',
      signal: baseHint,
      framework_hint: baseHint,
    } : null

  } else {
    // modified_option or freeform - full AI evaluation
    const textToGrade = userText ?? ''
    const submissionQuality = detectSubmissionQuality(textToGrade)
    if (submissionQuality !== 'substantive') {
      throw new AnswerNotReadyError(submissionQuality)
    }
    const { gradeFreeform } = await import('@/lib/v2/skills/ai/freeform-grader')
    await assertPlanLimit(userId, userPlan, 'ai_grading_runs')
    const aiResult = await gradeFreeform(textToGrade, options, scenario, step, targetCompetencies, userId, aiBudget)
    score = aiResult.score
    quality_label = aiResult.quality_label
    competencies_demonstrated = aiResult.competencies_demonstrated
    grading_explanation = aiResult.explanation
    grading_confidence = aiResult.confidence
    competency_signal = aiResult.competency_signal ?? null
  }

  return { score, quality_label, competencies_demonstrated, grading_explanation, grading_confidence, competency_signal }
}
