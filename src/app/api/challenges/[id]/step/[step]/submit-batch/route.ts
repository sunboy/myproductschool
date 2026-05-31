import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowOption, FlowStep, ResponseType } from '@/lib/types'
import { routeResponse } from '@/lib/v2/skills/grading-router'
import { gradeOneAnswer, AnswerNotReadyError, type GradedAnswer } from '@/lib/v2/skills/grade-step-answer'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'
import { STEP_PRIMARY_COMPETENCIES } from '@/lib/hatch/system-prompt'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded } from '@/lib/usage/assert-plan-limit'
import { buildEmptyStateResponse } from '@/lib/hatch/skill-context'

// ── Request body ─────────────────────────────────────────────
// All answers for one FLOW step, graded together. Nothing is persisted until
// every answer grades successfully (atomic), so an AI failure mid-step never
// leaves partial rows.

const AnswerSchema = z.object({
  question_id: z.string().uuid(),
  response_type: z.enum(['pure_mcq', 'mcq_plus_elaboration', 'modified_option', 'freeform', 'coding_subtask', 'multi_select_mcq']),
  selected_option_id: z.string().uuid().nullable().optional(),
  selected_option_ids: z.array(z.string().uuid()).optional(),
  user_text: z.string().max(50000).nullable().optional(),
  time_spent_seconds: z.number().int().min(0).max(24 * 60 * 60).optional().default(0),
  confidence: z.number().int().min(0).max(3).nullable().optional(),
})

const RequestSchema = z.object({
  attempt_id: z.string().uuid(),
  answers: z.array(AnswerSchema).min(1),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }))
}

function aiLimitResponse(error: unknown) {
  if (error instanceof PlanLimitExceeded) {
    return NextResponse.json({
      error: 'limit_reached', feature: error.feature, used: error.used, limit: error.limit, windowDays: error.windowDays,
    }, { status: 402 })
  }
  if (error instanceof AiBudgetExceededError) {
    return NextResponse.json({
      error: 'limit_reached', feature: 'hatch_ai_cents', used: error.used, limit: error.limit, windowDays: error.windowDays,
    }, { status: 402 })
  }
  return null
}

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

type CompetencySignal = { competency: string; signal: string; framework_hint?: string } | null

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
      return NextResponse.json({ error: 'Invalid request body', issues: validationIssues(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { attempt_id, answers } = body

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

  // ── Validate the batch against the step's authoritative questions ──
  const { data: flowStepRow } = await adminClient
    .from('flow_steps')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('step', step)
    .single()

  if (!flowStepRow) {
    return NextResponse.json({ error: 'Step not found for challenge' }, { status: 404 })
  }

  const { data: stepQuestionsRaw } = await adminClient
    .from('step_questions')
    .select('id, sequence, grading_weight_within_step, target_competencies')
    .eq('flow_step_id', flowStepRow.id)
    .order('sequence', { ascending: true })

  const stepQuestions = stepQuestionsRaw ?? []
  if (stepQuestions.length === 0) {
    return NextResponse.json({ error: 'Step has no questions' }, { status: 500 })
  }

  const stepQuestionIds = new Set(stepQuestions.map(q => q.id))
  const answerQuestionIds = new Set(answers.map(a => a.question_id))

  // Require exactly one answer per question in the step (no extras, no missing).
  if (
    answers.length !== stepQuestions.length ||
    answerQuestionIds.size !== answers.length ||
    ![...stepQuestionIds].every(id => answerQuestionIds.has(id))
  ) {
    return NextResponse.json({
      error: 'Batch must contain exactly one answer per step question',
      expected_question_ids: [...stepQuestionIds],
    }, { status: 400 })
  }

  const answerByQuestionId = new Map(answers.map(a => [a.question_id, a]))

  // ── Idempotency: full-existing retry returns stored results ──
  const { data: existingRows } = await adminClient
    .from('step_attempts')
    .select('question_id, score, quality_label, competencies_demonstrated, grading_explanation, competency_signal, selected_option_id')
    .eq('attempt_id', attempt_id)
    .eq('step', step)

  const existing = existingRows ?? []
  const existingByQid = new Map(existing.map(r => [r.question_id, r]))
  const allExisting = stepQuestions.every(q => existingByQid.has(q.id))
  const noneExisting = existing.length === 0

  if (!allExisting && !noneExisting) {
    // Partial state should not occur with atomic batch writes; treat as conflict.
    return NextResponse.json({ error: 'Step partially submitted; cannot re-grade' }, { status: 409 })
  }

  // Load all options for the step's questions in one query
  const { data: optionsRaw, error: optionsError } = await adminClient
    .from('flow_options')
    .select('id, question_id, option_label, option_text, quality, points, competencies, explanation, framework_hint')
    .in('question_id', [...stepQuestionIds])

  if (optionsError || !optionsRaw || optionsRaw.length === 0) {
    return NextResponse.json({ error: 'Failed to load rubric options' }, { status: 500 })
  }
  const optionsByQid = new Map<string, FlowOption[]>()
  for (const o of optionsRaw as FlowOption[]) {
    const arr = optionsByQid.get(o.question_id) ?? []
    arr.push(o)
    optionsByQid.set(o.question_id, arr)
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

  const weightByQid = new Map(stepQuestions.map(q => [q.id, q.grading_weight_within_step]))
  const targetCompsByQid = new Map(stepQuestions.map(q => [q.id, (q.target_competencies ?? []) as string[]]))

  // Build sequence-ordered question list once - drives both grading and the response.
  const orderedQuestions = [...stepQuestions].sort((a, b) => a.sequence - b.sequence)

  // ── Build the per-question result set ──
  type QResult = {
    question_id: string
    sequence: number
    score: number
    grade_label: string
    competency_signal: CompetencySignal
    revealed_options: ReturnType<typeof revealedOptionsPayload>
    graded?: GradedAnswer
    answer: z.infer<typeof AnswerSchema>
    options: FlowOption[]
  }

  // Fast path: full-existing retry - return stored results, recompute step score.
  if (allExisting) {
    const results: QResult[] = orderedQuestions.map(q => {
      const row = existingByQid.get(q.id)!
      const options = optionsByQid.get(q.id) ?? []
      return {
        question_id: q.id,
        sequence: q.sequence,
        score: row.score ?? 0,
        grade_label: row.quality_label ?? 'plausible_wrong',
        competency_signal: (row.competency_signal as CompetencySignal) ?? null,
        revealed_options: revealedOptionsPayload(options),
        answer: answerByQuestionId.get(q.id)!,
        options,
      }
    })
    const stepScore = calculateStepScore(results.map(r => ({ score: r.score, weight: weightByQid.get(r.question_id) ?? 1 })))
    return NextResponse.json({
      step_complete: true,
      step_score: stepScore,
      competency_signal: results.find(r => r.competency_signal)?.competency_signal ?? null,
      questions: results.map(r => ({
        question_id: r.question_id,
        sequence: r.sequence,
        score: r.score,
        grade_label: r.grade_label,
        competency_signal: r.competency_signal,
        revealed_options: r.revealed_options,
      })),
    })
  }

  // ── Grade ALL answers first (write nothing yet) ──
  const path0 = answers.map(a => routeResponse(a.response_type))
  const needsPlan = path0.some(p => p !== 'deterministic')
  const userPlan = needsPlan ? await getUserPlanForBudget(user.id) : null
  const aiBudget = userPlan ? { userId: user.id, userPlan, route: `challenge_step_${step}_batch` } : undefined

  const results: QResult[] = []
  for (const q of orderedQuestions) {
    const answer = answerByQuestionId.get(q.id)!
    const options = optionsByQid.get(q.id) ?? []
    if (options.length === 0) {
      return NextResponse.json({ error: `No options for question ${q.id}` }, { status: 500 })
    }
    try {
      const graded = await gradeOneAnswer({
        answer: {
          questionId: q.id,
          responseType: answer.response_type,
          selectedOptionId: answer.selected_option_id ?? null,
          selectedOptionIds: answer.selected_option_ids,
          userText: answer.user_text ?? null,
          targetCompetencies: targetCompsByQid.get(q.id) ?? [],
        },
        options, scenario, step,
        userId: user.id, userPlan, aiBudget,
      })
      results.push({
        question_id: q.id,
        sequence: q.sequence,
        score: graded.score,
        grade_label: graded.quality_label,
        competency_signal: graded.competency_signal,
        revealed_options: revealedOptionsPayload(options),
        graded, answer, options,
      })
    } catch (error) {
      if (error instanceof AnswerNotReadyError) {
        const emptyState = buildEmptyStateResponse({ surface: 'grading', discipline: 'product', challengeType: 'flow' })
        return NextResponse.json({
          status: 'not_ready', ready_to_grade: false, reason: error.reason,
          question_id: q.id, empty_state: emptyState, summary: emptyState.summary,
          next_actions: emptyState.next_actions, step_complete: false,
        }, { status: 422 })
      }
      const limit = aiLimitResponse(error)
      if (limit) return limit
      if (error instanceof Error && error.message.includes('required for')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  }

  // ── All graded - persist every row in one batch insert ──
  const rows = results.map(r => {
    const path = routeResponse(r.answer.response_type)
    return {
      attempt_id,
      question_id: r.question_id,
      step,
      response_type: r.answer.response_type,
      selected_option_id: path !== 'multi_deterministic' ? (r.answer.selected_option_id ?? null) : null,
      selected_option_ids: path === 'multi_deterministic' ? (r.answer.selected_option_ids ?? null) : null,
      user_text: r.answer.user_text ?? null,
      score: r.graded!.score,
      quality_label: r.graded!.quality_label,
      competencies_demonstrated: r.graded!.competencies_demonstrated,
      grading_explanation: r.graded!.grading_explanation,
      grading_confidence: r.graded!.grading_confidence,
      confidence: r.answer.confidence ?? null,
      time_spent_seconds: r.answer.time_spent_seconds ?? 0,
      competency_signal: r.graded!.competency_signal,
    }
  })

  const { error: insertError } = await adminClient.from('step_attempts').insert(rows)
  if (insertError) {
    // Concurrent submit landed first - return the stored rows instead of erroring.
    if (insertError.code === '23505') {
      const { data: nowExisting } = await adminClient
        .from('step_attempts')
        .select('question_id, score, quality_label, competency_signal')
        .eq('attempt_id', attempt_id)
        .eq('step', step)
      const nowByQid = new Map((nowExisting ?? []).map(r => [r.question_id, r]))
      const merged = orderedQuestions.map(q => {
        const row = nowByQid.get(q.id)
        const options = optionsByQid.get(q.id) ?? []
        return {
          question_id: q.id,
          sequence: q.sequence,
          score: row?.score ?? 0,
          grade_label: row?.quality_label ?? 'plausible_wrong',
          competency_signal: (row?.competency_signal as CompetencySignal) ?? null,
          revealed_options: revealedOptionsPayload(options),
        }
      })
      const stepScore = calculateStepScore(merged.map(r => ({ score: r.score, weight: weightByQid.get(r.question_id) ?? 1 })))
      return NextResponse.json({
        step_complete: true, step_score: stepScore,
        competency_signal: merged.find(r => r.competency_signal)?.competency_signal ?? null,
        questions: merged,
      })
    }
    console.error('[submit-batch] insert failed:', insertError.message, insertError.code, insertError.details)
    return NextResponse.json({ error: 'Failed to save step answers' }, { status: 500 })
  }

  // ── Weighted step score ──
  const stepScore = calculateStepScore(results.map(r => ({ score: r.score, weight: weightByQid.get(r.question_id) ?? 1 })))

  // ── Advance step. Leave /complete as the sole finalizer on WIN. ──
  const next = nextStep(step)
  const newSeq = (attempt.current_question_sequence ?? 0) + results.length

  if (next === 'done') {
    // Build mental_models_breakdown (read by /complete) but DO NOT set
    // status=completed here - /complete owns the score aggregation + XP.
    const { data: allAttempts } = await adminClient
      .from('step_attempts')
      .select('step, competency_signal')
      .eq('attempt_id', attempt_id)

    const breakdown = FLOW_STEP_ORDER.map(s => {
      const rowsForStep = (allAttempts ?? []).filter((a: { step: string }) => a.step === s)
      const signals = rowsForStep
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

    await adminClient
      .from('challenge_attempts')
      .update({ current_step: 'done', current_question_sequence: newSeq, mental_models_breakdown: breakdown })
      .eq('id', attempt_id)
  } else {
    await adminClient
      .from('challenge_attempts')
      .update({ current_step: next, current_question_sequence: newSeq })
      .eq('id', attempt_id)
  }

  // ── Response: sequence-ordered per-question results + step competency signal ──
  return NextResponse.json({
    step_complete: true,
    step_score: stepScore,
    competency_signal: results.find(r => r.competency_signal)?.competency_signal ?? null,
    questions: results.map(r => ({
      question_id: r.question_id,
      sequence: r.sequence,
      score: r.score,
      grade_label: r.grade_label,
      competency_signal: r.competency_signal,
      revealed_options: r.revealed_options,
    })),
  })
}
