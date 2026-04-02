import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { USE_MOCK_DATA } from '@/lib/mock'
import type { FlowOption, FlowStep, ResponseType } from '@/lib/types'
import { routeResponse, gradePureMCQ } from '@/lib/v2/skills/grading-router'
import { scoreOption } from '@/lib/v2/skills/option-scorer'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'

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
  const isMock = USE_MOCK_DATA
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  const adminClient = createAdminClient()

  // Verify attempt ownership (skip in mock mode — attempt is synthetic)
  const mockAttempt = { id: attempt_id, user_id: userId, status: 'in_progress', current_step: 'frame', current_question_sequence: 1 }
  let attempt: typeof mockAttempt

  if (isMock) {
    attempt = mockAttempt
  } else {
    const { data: attemptData, error: attemptError } = await adminClient
      .from('challenge_attempts')
      .select('id, user_id, status, current_step, current_question_sequence')
      .eq('id', attempt_id)
      .eq('user_id', userId)
      .single()

    if (attemptError || !attemptData) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
    }
    if (attemptData.status !== 'in_progress') {
      return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 })
    }
    attempt = attemptData as typeof mockAttempt
  }

  // Load full rubric options for this question (all 4)
  const { data: optionsRaw, error: optionsError } = await adminClient
    .from('flow_options')
    .select('id, question_id, option_label, option_text, quality, points, competencies, explanation')
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

  } else {
    // modified_option or freeform — full AI evaluation
    const textToGrade = user_text ?? ''
    if (!textToGrade.trim()) {
      return NextResponse.json({ error: 'user_text required for freeform/modified_option' }, { status: 400 })
    }
    const { gradeFreeform } = await import('@/lib/v2/skills/ai/freeform-grader')
    const aiResult = await gradeFreeform(textToGrade, options, scenario, step, targetCompetencies, userId)
    score = aiResult.score
    quality_label = aiResult.quality_label
    competencies_demonstrated = aiResult.competencies_demonstrated
    grading_explanation = aiResult.explanation
    grading_confidence = aiResult.confidence
  }

  // ── Persist step_attempt ──────────────────────────────────

  if (!isMock) {
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
      })

    if (insertError) {
      console.error('[submit] Failed to insert step_attempt:', insertError)
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
    }
  }

  // ── Update current_question_sequence ─────────────────────

  if (!isMock) {
    await adminClient
      .from('challenge_attempts')
      .update({ current_question_sequence: (attempt.current_question_sequence ?? 0) + 1 })
      .eq('id', attempt_id)
  }

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

  let stepComplete: boolean
  if (isMock) {
    // In mock mode step_attempts aren't persisted — derive completion from the submitted
    // question's sequence number vs total questions in the step
    const { data: submittedQuestion } = await adminClient
      .from('step_questions')
      .select('sequence')
      .eq('id', question_id)
      .single()
    const questionSequence = submittedQuestion?.sequence ?? 1
    stepComplete = questionSequence >= totalQuestions && totalQuestions > 0
  } else {
    // Count answered questions in this step from DB
    const { count: answeredCount } = await adminClient
      .from('step_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('attempt_id', attempt_id)
      .eq('step', step)

    const answered = answeredCount ?? 0
    stepComplete = answered >= totalQuestions && totalQuestions > 0
  }

  let stepScore: number | undefined

  if (stepComplete && !isMock) {
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
    await adminClient
      .from('challenge_attempts')
      .update({
        current_step: next,
        ...(next === 'done' ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', attempt_id)
  }

  // ── Build revealed options ────────────────────────────────

  const revealedOptions = options.map(o => ({
    id: o.id,
    option_label: o.option_label,
    option_text: o.option_text,
    quality: o.quality,
    points: o.points,
    explanation: o.explanation,
  }))

  // ── Return response ───────────────────────────────────────

  return NextResponse.json({
    score,
    quality_label,
    grade_label: quality_label,
    explanation: grading_explanation,
    competencies_demonstrated,
    step_complete: stepComplete,
    ...(stepScore !== undefined ? { step_score: stepScore } : {}),
    revealed_options: revealedOptions,
  })
}
