import type { FlowStep, ResponseType, AutopsyDecision, AutopsyChallenge, ShowcaseAttempt } from '@/lib/types'

// ── Shared types (mirror useFlowStep internals) ───────────────────────────────

export interface StepOption {
  id: string
  option_label: string
  option_text: string
}

export interface StepQuestionData {
  id: string
  question_text: string
  question_nudge: string | null
  sequence: number
  grading_weight_within_step: number
  response_type: ResponseType
  options: StepOption[]
}

export interface AdapterStepData {
  step: FlowStep
  nudge: string | null
  questions: StepQuestionData[]
}

export interface AdapterRevealedOption {
  id: string
  points: number
  explanation: string
}

export interface AdapterSubmitResult {
  score: number
  grade_label: string
  step_complete: boolean
  revealed_options: AdapterRevealedOption[]
}

export interface AdapterCompletionData {
  total_score: number
  max_score: number
  grade_label: string
  xp_awarded: number
  step_breakdown: Array<{ step: FlowStep; score: number; max_score: number }>
  competency_deltas: Array<{ competency: string; before: number; after: number }>
}

export interface SyntheticChallenge {
  title: string
  scenario_role: string | null
  scenario_context: string
  scenario_trigger: string
  scenario_question: string
  industry: string | null
  difficulty: string
}

export interface ChallengeAdapter {
  getChallenge(): SyntheticChallenge
  loadStep(step: FlowStep): Promise<AdapterStepData>
  submitAnswer(params: {
    step: FlowStep
    questionId: string
    selectedOptionId: string | null
    userText: string | null
  }): Promise<AdapterSubmitResult>
  fetchCoaching(params: {
    step: FlowStep
    optionId: string | null
    userText: string | null
  }): Promise<{ role_context: string; career_signal: string } | null>
  complete(): Promise<AdapterCompletionData | null>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_NUDGES: Record<FlowStep, string> = {
  frame: "Start with what actually happened — not why. Describe the decision as if explaining it to a teammate who doesn't use the product.",
  list: "Who benefits from this decision? Who loses? Think beyond the obvious user — consider competitors, adjacent teams, the business model.",
  optimize: "Surface-level reasoning is usually wrong. Ask: what would they have had to believe to make this choice?",
  win: "Pick the explanation that generalizes — the one that would help you make a better decision in a different product context.",
}

export const QUALITY_TO_POINTS: Record<string, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}

export const GRADE_LABELS: Record<number, string> = {
  3: 'Sharp',
  2: 'Solid',
  1: 'Surface',
  0: 'Missed',
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAutopsyAdapter(
  decision: AutopsyDecision,
  challenge: AutopsyChallenge,
  productSlug: string,
  decisionIndex: number,
  onComplete: (attempt: ShowcaseAttempt) => void,
): ChallengeAdapter {
  // Options shape reused across all steps
  const sharedOptions: StepOption[] = challenge.options.map((opt) => ({
    id: opt.id,
    option_label: opt.id.toUpperCase(),
    option_text: opt.text,
  }))

  // Per-step question text
  const stepQuestionText: Record<FlowStep, string> = {
    frame: 'In your own words, describe the decision above in one sentence — as if explaining it to a teammate who has never used this product.',
    list: challenge.context,
    optimize: decision.real_reasoning,
    win: decision.challenge_question,
  }

  function makeStepData(step: FlowStep): AdapterStepData {
    return {
      step,
      nudge: STEP_NUDGES[step],
      questions: [
        {
          id: `${decision.id}_${step}`,
          question_text: stepQuestionText[step],
          question_nudge: null,
          sequence: 1,
          grading_weight_within_step: 1,
          response_type: 'mcq_plus_elaboration',
          options: sharedOptions,
        },
      ],
    }
  }

  return {
    getChallenge(): SyntheticChallenge {
      return {
        title: decision.title,
        scenario_role: decision.area,
        scenario_context: decision.what_they_did,
        scenario_trigger: challenge.context,
        scenario_question: decision.challenge_question,
        industry: null,
        difficulty: decision.difficulty,
      }
    },

    async loadStep(step: FlowStep): Promise<AdapterStepData> {
      return makeStepData(step)
    },

    async submitAnswer(params: {
      step: FlowStep
      questionId: string
      selectedOptionId: string | null
      userText: string | null
    }): Promise<AdapterSubmitResult> {
      // Steps 0-2: no-op — advance immediately, no grading
      if (params.step !== 'win') {
        return { score: 0, grade_label: '', step_complete: true, revealed_options: [] }
      }

      // Step 3 (win): real grading
      const res = await fetch(`/api/showcase/${productSlug}/${decisionIndex}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_option_label: params.selectedOptionId,
          elaboration: params.userText ?? '',
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      const data = await res.json()

      // Build revealed options from the local challenge data (don't rely on API shape)
      const revealedOptions: AdapterRevealedOption[] = challenge.options.map((opt) => ({
        id: opt.id,
        points: QUALITY_TO_POINTS[opt.quality] ?? 0,
        explanation: opt.explanation,
      }))

      const selectedOption = challenge.options.find((o) => o.id === params.selectedOptionId)
      const points = selectedOption ? (QUALITY_TO_POINTS[selectedOption.quality] ?? 0) : data.points
      const gradeLabel = GRADE_LABELS[points] ?? data.grade_label

      // Notify parent
      onComplete({
        points: data.points,
        grade_label: data.grade_label,
        decision_index: decisionIndex,
        selected_option_label: params.selectedOptionId ?? '',
      })

      return {
        score: data.points,
        grade_label: gradeLabel,
        step_complete: true,
        revealed_options: revealedOptions,
      }
    },

    async fetchCoaching(params: {
      step: FlowStep
      optionId: string | null
      userText: string | null
    }): Promise<{ role_context: string; career_signal: string } | null> {
      // Only provide coaching after the win step
      if (params.step !== 'win') return null
      return { role_context: challenge.insight, career_signal: '' }
    },

    async complete(): Promise<AdapterCompletionData | null> {
      // Parent handles completion (auto-advance to next challenge)
      return null
    },
  }
}
