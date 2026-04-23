import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowOption, FlowStep, ResponseType } from '@/lib/types'
import { routeResponse, gradePureMCQ } from '@/lib/v2/skills/grading-router'
import { scoreOption } from '@/lib/v2/skills/option-scorer'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'
import { STEP_PRIMARY_COMPETENCIES } from '@/lib/luma/system-prompt'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'

// ── Request body ─────────────────────────────────────────────

interface SubmitRequestBody {
  attempt_id: string
  question_id: string
  response_type: ResponseType
  selected_option_id?: string
  user_text?: string
  time_spent_seconds?: number
}

// ── FLOW steps in order ──────────────────────────────────────

const FLOW_STEP_ORDER: FlowStep[] = ['frame', 'list', 'optimize', 'win']

function nextStep(current: FlowStep): FlowStep | 'done' {
  const idx = FLOW_STEP_ORDER.indexOf(current)
  if (idx === -1 || idx === FLOW_STEP_ORDER.length - 1) return 'done'
  return FLOW_STEP_ORDER[idx + 1]
}

// ── POST handler ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; step: string }> }
) {
  const { id: challenge_id, step: stepParam } = await params
  const step = stepParam as FlowStep

  const body: SubmitRequestBody = await req.json()
  const {
    attempt_id,
    question_id,
    response_type,
    selected_option_id,
    user_text,
    time_spent_seconds = 0,
  } = body

  if (!attempt_id || !question_id || !response_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

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

  // ── Grade based on response_type ─────────────────────────

  const path = routeResponse(response_type)

  let score: number
  let quality_label: string
  let competencies_demonstrated: string[]
  let grading_explanation: string
  let grading_confidence: number
  let competency_signal: { primary: string; signal: string; framework_hint: string } | null = null

  if (path === 'deterministic') {
    // pure_mcq — NO freeform-grader import or call
    if (!selected_option_id) {
      return NextResponse.json({ error: 'selected_option_id required for pure_mcq' }, { status: 400 })
    }
    const result = gradePureMCQ(selected_option_id, options)
    score = result.score
    quality_label = result.quality_label
    competencies_demonstrated = result.competencies_demonstrated
    grading_explanation = result.grading_explanation
    grading_confidence = result.confidence

    // Generate competency_signal from option metadata
    const selectedOption = options.find(o => o.id === selected_option_id)
    const hint = selectedOption?.framework_hint?.trim() ?? ''
    competency_signal = hint ? {
      primary: STEP_PRIMARY_COMPETENCIES[step]?.[0] ?? 'strategic_thinking',
      signal: hint,
      framework_hint: hint,
    } : null

  } else if (path === 'hybrid') {
    // mcq_plus_elaboration — base score + AI elaboration adjustment
    if (!selected_option_id) {
      return NextResponse.json({ error: 'selected_option_id required for mcq_plus_elaboration' }, { status: 400 })
    }
    const baseResult = scoreOption(selected_option_id, options)
    const baseOption = options.find(o => o.id === selected_option_id)!

    if (user_text?.trim()) {
      // Lazy import to keep pure_mcq path free of freeform-grader
      const { gradeElaboration } = await import('@/lib/v2/skills/ai/freeform-grader')
      const elaborationResult = await gradeElaboration(baseOption, user_text, options, scenario, step)
      score = elaborationResult.finalScore
      quality_label = baseResult.quality_label
      competencies_demonstrated = [
        ...baseResult.competencies_demonstrated,
        ...elaborationResult.additional_competencies,
      ]
      grading_explanation = elaborationResult.adjustment_reason
      grading_confidence = 0.85
    } else {
      // No elaboration text — use deterministic base score
      score = baseResult.score
      quality_label = baseResult.quality_label
      competencies_demonstrated = baseResult.competencies_demonstrated
      grading_explanation = baseResult.grading_explanation
      grading_confidence = 1.0
    }

    // Generate competency_signal from selected option metadata
    const baseHint = baseOption.framework_hint?.trim() ?? ''
    competency_signal = baseHint ? {
      primary: STEP_PRIMARY_COMPETENCIES[step]?.[0] ?? 'strategic_thinking',
      signal: baseHint,
      framework_hint: baseHint,
    } : null

  } else {
    // modified_option or freeform — full AI evaluation
    const textToGrade = response_type === 'modified_option' ? (user_text ?? '') : (user_text ?? '')
    if (!textToGrade.trim()) {
      return NextResponse.json({ error: 'user_text required for freeform/modified_option' }, { status: 400 })
    }
    const { gradeFreeform } = await import('@/lib/v2/skills/ai/freeform-grader')
    const aiResult = await gradeFreeform(textToGrade, options, scenario, step, targetCompetencies, user.id)
    score = aiResult.score
    quality_label = aiResult.quality_label
    competencies_demonstrated = aiResult.competencies_demonstrated
    grading_explanation = aiResult.explanation
    grading_confidence = aiResult.confidence
    competency_signal = aiResult.competency_signal ?? null
  }

  // ── Persist step_attempt ──────────────────────────────────

  const { error: insertError } = await adminClient
    .from('step_attempts')
    .insert({
      attempt_id,
      question_id,
      step,
      response_type,
      selected_option_id: selected_option_id ?? null,
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
    // UNIQUE(attempt_id, question_id) violation — user already answered this question
    if (insertError.code === '23505') {
      // Fetch the existing answer and return it as if it were a fresh submission
      const { data: existing } = await adminClient
        .from('step_attempts')
        .select('score, quality_label, competencies_demonstrated, grading_explanation')
        .eq('attempt_id', attempt_id)
        .eq('question_id', question_id)
        .single()

      if (existing) {
        // Check step completion (same logic as below)
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

        const revealedOptions = options.map(o => ({
          id: o.id,
          option_label: o.option_label,
          option_text: o.option_text,
          quality: o.quality,
          points: o.points,
          explanation: o.explanation,
          framework_hint: o.framework_hint ?? '',
        }))

        return NextResponse.json({
          score: existing.score,
          quality_label: existing.quality_label,
          grade_label: existing.quality_label,
          explanation: existing.grading_explanation,
          competencies_demonstrated: existing.competencies_demonstrated,
          competency_signal,
          step_complete: (answeredCount ?? 0) >= (totalQuestionsCount ?? 0) && (totalQuestionsCount ?? 0) > 0,
          revealed_options: revealedOptions,
        })
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

  const totalQuestions = totalQuestionsCount ?? 0

  // Count answered questions in this step
  const { count: answeredCount } = await adminClient
    .from('step_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attempt_id)
    .eq('step', step)

  const answered = answeredCount ?? 0
  const stepComplete = answered >= totalQuestions && totalQuestions > 0

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
        const signals = stepAttempts
          .map((a: { competency_signal?: { primary: string; signal: string } | null }) => a.competency_signal)
          .filter(Boolean) as { primary: string; signal: string }[]
        const primary = signals[0]?.primary ?? STEP_PRIMARY_COMPETENCIES[s]?.[0] ?? 'strategic_thinking'
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
        .update({
          current_step: 'done',
          status: 'completed',
          completed_at: new Date().toISOString(),
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

  const revealedOptions = options.map(o => ({
    id: o.id,
    option_label: o.option_label,
    option_text: o.option_text,
    quality: o.quality,
    points: o.points,
    explanation: o.explanation,
    framework_hint: o.framework_hint ?? '',
  }))

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
