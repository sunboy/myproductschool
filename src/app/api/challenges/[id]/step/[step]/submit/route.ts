import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import type { FlowOption, FlowStep, ResponseType } from '@/lib/types'
import { routeResponse } from '@/lib/v2/skills/grading-router'
import { gradeOneAnswer, AnswerNotReadyError } from '@/lib/v2/skills/grade-step-answer'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'
import { STEP_PRIMARY_COMPETENCIES } from '@/lib/hatch/system-prompt'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded } from '@/lib/usage/assert-plan-limit'
import { buildEmptyStateResponse } from '@/lib/hatch/skill-context'

// ── Request body ─────────────────────────────────────────────

const RequestSchema = z.object({
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  response_type: z.enum(['pure_mcq', 'mcq_plus_elaboration', 'modified_option', 'freeform', 'coding_subtask', 'multi_select_mcq']),
  // Option IDs may be slugs, not UUIDs (some seeded challenges). Accept any non-empty string.
  selected_option_id: z.string().min(1).nullable().optional(),
  selected_option_ids: z.array(z.string().min(1)).optional(),
  user_text: z.string().max(50000).nullable().optional(),
  time_spent_seconds: z.number().int().min(0).max(24 * 60 * 60).optional().default(0),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function aiLimitResponse(error: unknown) {
  if (error instanceof PlanLimitExceeded) {
    return NextResponse.json({
      error: 'limit_reached',
      feature: error.feature,
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    }, { status: 402 })
  }

  if (error instanceof AiBudgetExceededError) {
    return NextResponse.json({
      error: 'limit_reached',
      feature: 'hatch_ai_cents',
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    }, { status: 402 })
  }

  return null
}

function notReadyFreeformResponse(reason: 'empty' | 'too_thin', options: FlowOption[]) {
  const emptyState = buildEmptyStateResponse({
    surface: 'grading',
    discipline: 'product',
    challengeType: 'flow',
  })

  return NextResponse.json({
    status: 'not_ready',
    ready_to_grade: false,
    reason,
    empty_state: emptyState,
    summary: emptyState.summary,
    next_actions: emptyState.next_actions,
    step_complete: false,
    revealed_options: revealedOptionsPayload(options),
  }, { status: 422 })
}

// ── FLOW steps in order ──────────────────────────────────────

const FLOW_STEP_ORDER: FlowStep[] = ['frame', 'list', 'optimize', 'win']

function nextStep(current: FlowStep): FlowStep | 'done' {
  const idx = FLOW_STEP_ORDER.indexOf(current)
  if (idx === -1 || idx === FLOW_STEP_ORDER.length - 1) return 'done'
  return FLOW_STEP_ORDER[idx + 1]
}

function revealedOptionsPayload(options: FlowOption[]) {
  return options.map(o => ({
    id: o.id,
    option_label: o.option_label,
    option_text: o.option_text,
    quality: o.quality,
    points: o.points,
    explanation: o.explanation,
    framework_hint: o.framework_hint ?? '',
  }))
}

async function stepProgress(
  adminClient: ReturnType<typeof createAdminClient>,
  challenge_id: string,
  attempt_id: string,
  step: FlowStep
) {
  const { data: flowStepRow } = await adminClient
    .from('flow_steps')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('step', step)
    .single()

  const { count: totalQuestionsCount } = await adminClient
    .from('step_questions')
    .select('id', { count: 'exact', head: true })
    .eq('flow_step_id', flowStepRow?.id ?? '')

  const { count: answeredCount } = await adminClient
    .from('step_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attempt_id)
    .eq('step', step)

  const totalQuestions = totalQuestionsCount ?? 0
  const answered = answeredCount ?? 0

  return {
    totalQuestions,
    answered,
    stepComplete: answered >= totalQuestions && totalQuestions > 0,
  }
}

async function existingStepAttemptResponse(
  adminClient: ReturnType<typeof createAdminClient>,
  challenge_id: string,
  attempt_id: string,
  step: FlowStep,
  options: FlowOption[],
  existing: {
    score: number | null
    quality_label: string | null
    competencies_demonstrated: string[] | null
    grading_explanation: string | null
    competency_signal?: unknown
  }
) {
  const progress = await stepProgress(adminClient, challenge_id, attempt_id, step)

  return NextResponse.json({
    score: existing.score,
    quality_label: existing.quality_label,
    grade_label: existing.quality_label,
    explanation: existing.grading_explanation,
    competencies_demonstrated: existing.competencies_demonstrated,
    competency_signal: existing.competency_signal ?? null,
    step_complete: progress.stepComplete,
    revealed_options: revealedOptionsPayload(options),
  })
}

// ── POST handler ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; step: string }> }
) {
  const { id: challenge_id, step: stepParam } = await params
  const step = stepParam as FlowStep

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const {
    attempt_id,
    question_id,
    response_type,
    selected_option_id,
    selected_option_ids,
    user_text,
    time_spent_seconds = 0,
  } = body

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Verify attempt ownership
  const { data: attempt, error: attemptError } = await adminClient
    .from('challenge_attempts')
    .select('id, user_id, status, current_step, current_question_sequence')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
  }

  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 })
  }

  // Load full rubric options for this question (all 4)
  const { data: optionsRaw, error: optionsError } = await adminClient
    .from('flow_options')
    .select('id, question_id, option_label, option_text, quality, points, competencies, explanation, framework_hint')
    .eq('question_id', question_id)

  if (optionsError || !optionsRaw || optionsRaw.length === 0) {
    return NextResponse.json({ error: 'Failed to load rubric options' }, { status: 500 })
  }

  const options = optionsRaw as FlowOption[]

  const { data: existingAnswer, error: existingAnswerError } = await adminClient
    .from('step_attempts')
    .select('score, quality_label, competencies_demonstrated, grading_explanation, competency_signal')
    .eq('attempt_id', attempt_id)
    .eq('question_id', question_id)
    .maybeSingle()

  if (existingAnswerError) {
    console.error('[submit] Failed to check existing step_attempt:', existingAnswerError.message)
    return NextResponse.json({ error: 'Failed to load existing attempt' }, { status: 500 })
  }

  if (existingAnswer) {
    return existingStepAttemptResponse(
      adminClient,
      challenge_id,
      attempt_id,
      step,
      options,
      existingAnswer
    )
  }

  // Load scenario for AI grading paths
  const { data: challengeRow } = await adminClient
    .from('challenges')
    .select('scenario_context, scenario_trigger')
    .eq('id', challenge_id)
    .single()

  const scenario = {
    scenario_context: challengeRow?.scenario_context ?? '',
    scenario_trigger: challengeRow?.scenario_trigger ?? '',
  }

  // Load target competencies from the question
  const { data: questionRow } = await adminClient
    .from('step_questions')
    .select('target_competencies')
    .eq('id', question_id)
    .single()

  const targetCompetencies: string[] = questionRow?.target_competencies ?? []

  // ── Grade based on response_type (shared helper) ─────────

  const path = routeResponse(response_type)
  const userPlan = path === 'deterministic' ? null : await getUserPlanForBudget(user.id)
  const aiBudget = userPlan
    ? { userId: user.id, userPlan, route: `challenge_step_${step}` }
    : undefined

  let score: number
  let quality_label: string
  let competencies_demonstrated: string[]
  let grading_explanation: string
  let grading_confidence: number
  let competency_signal: { competency: string; signal: string; framework_hint?: string } | null = null

  try {
    const graded = await gradeOneAnswer({
      answer: {
        questionId: question_id,
        responseType: response_type,
        selectedOptionId: selected_option_id ?? null,
        selectedOptionIds: selected_option_ids,
        userText: user_text ?? null,
        targetCompetencies,
      },
      options,
      scenario,
      step,
      userId: user.id,
      userPlan,
      aiBudget,
    })
    score = graded.score
    quality_label = graded.quality_label
    competencies_demonstrated = graded.competencies_demonstrated
    grading_explanation = graded.grading_explanation
    grading_confidence = graded.grading_confidence
    competency_signal = graded.competency_signal
  } catch (error) {
    if (error instanceof AnswerNotReadyError) {
      return notReadyFreeformResponse(error.reason, options)
    }
    const limit = aiLimitResponse(error)
    if (limit) return limit
    if (error instanceof Error && error.message.includes('required for')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  // ── Persist step_attempt ──────────────────────────────────

  const { error: insertError } = await adminClient
    .from('step_attempts')
    .insert({
      attempt_id,
      question_id,
      step,
      response_type,
      selected_option_id: path !== 'multi_deterministic' ? (selected_option_id ?? null) : null,
      selected_option_ids: path === 'multi_deterministic' ? (selected_option_ids ?? null) : null,
      user_text: user_text ?? null,
      score,
      quality_label,
      competencies_demonstrated,
      grading_explanation,
      grading_confidence,
      time_spent_seconds,
      competency_signal,
    })

  if (insertError) {
    // UNIQUE(attempt_id, question_id) violation - user already answered this question
    if (insertError.code === '23505') {
      // Fetch the existing answer and return it as if it were a fresh submission
      const { data: existing } = await adminClient
        .from('step_attempts')
        .select('score, quality_label, competencies_demonstrated, grading_explanation, competency_signal')
        .eq('attempt_id', attempt_id)
        .eq('question_id', question_id)
        .single()

      if (existing) {
        return existingStepAttemptResponse(adminClient, challenge_id, attempt_id, step, options, existing)
      }
    }

    console.error('[submit] Failed to insert step_attempt:', insertError.message, insertError.code, insertError.details)
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  // ── Update current_question_sequence ─────────────────────

  await adminClient
    .from('challenge_attempts')
    .update({ current_question_sequence: (attempt.current_question_sequence ?? 0) + 1 })
    .eq('id', attempt_id)

  // ── Check step completion ─────────────────────────────────

  // Count total questions in this step
  const progress = await stepProgress(adminClient, challenge_id, attempt_id, step)
  const stepComplete = progress.stepComplete

  let stepScore: number | undefined

  if (stepComplete) {
    // Fetch all step_attempts for this step to compute weighted score
    const { data: stepAttempts } = await adminClient
      .from('step_attempts')
      .select('score, question_id')
      .eq('attempt_id', attempt_id)
      .eq('step', step)

    // Fetch weights for each question
    const questionIds = (stepAttempts ?? []).map((a: { question_id: string }) => a.question_id)
    const { data: questionWeights } = await adminClient
      .from('step_questions')
      .select('id, grading_weight_within_step')
      .in('id', questionIds)

    const weightMap = new Map(
      (questionWeights ?? []).map((q: { id: string; grading_weight_within_step: number }) => [
        q.id,
        q.grading_weight_within_step,
      ])
    )

    const questionScores = (stepAttempts ?? []).map((a: { score: number; question_id: string }) => ({
      score: a.score ?? 0,
      weight: weightMap.get(a.question_id) ?? 1,
    }))

    stepScore = calculateStepScore(questionScores)

    // Advance to next step
    const next = nextStep(step)

    if (next === 'done') {
      // Build mental_models_breakdown from all step_attempts
      const { data: allAttempts } = await adminClient
        .from('step_attempts')
        .select('step, competency_signal')
        .eq('attempt_id', attempt_id)

      const breakdown = FLOW_STEP_ORDER.map(s => {
        const stepAttempts = (allAttempts ?? []).filter((a: { step: string }) => a.step === s)
        // Transitional fallback: post-migration rows store `competency`; pre-migration rows store `primary`.
        const signals = stepAttempts
          .map((a: { competency_signal?: { competency?: string; primary?: string; signal: string } | null }) => a.competency_signal)
          .filter(Boolean) as { competency?: string; primary?: string; signal: string }[]
        const primary = signals[0]?.competency ?? signals[0]?.primary ?? STEP_PRIMARY_COMPETENCIES[s]?.[0] ?? 'strategic_thinking'
        let reasoningMove = ''
        try { reasoningMove = getReasoningMove(s as FlowStep) } catch { /* rubric unavailable */ }
        return {
          step: s,
          competency: primary,
          reasoning_move: reasoningMove,
          demonstrated: signals.map(sig => sig.signal).join('; ') || 'No signal recorded',
          missed: '',
        }
      })

      // Advance to 'done' but leave status in_progress — /complete is the sole
      // finalizer (it computes total_score + XP and early-returns if already
      // completed). Marking completed here would short-circuit that and zero the
      // final result. Matches the batch submit-batch route's contract.
      await adminClient
        .from('challenge_attempts')
        .update({
          current_step: 'done',
          mental_models_breakdown: breakdown,
        })
        .eq('id', attempt_id)
    } else {
      await adminClient
        .from('challenge_attempts')
        .update({ current_step: next })
        .eq('id', attempt_id)
    }
  }

  // ── Build revealed options ────────────────────────────────

  const revealedOptions = revealedOptionsPayload(options)

  // ── Return response ───────────────────────────────────────

  return NextResponse.json({
    score,
    quality_label,
    grade_label: quality_label,
    explanation: grading_explanation,
    competencies_demonstrated,
    competency_signal,
    step_complete: stepComplete,
    ...(stepScore !== undefined ? { step_score: stepScore } : {}),
    revealed_options: revealedOptions,
  })
}
