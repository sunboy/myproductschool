import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gradeCodingAttempt, shouldUseDeterministicCodingGrade } from '@/lib/coding-grading/grader'
import type { RunResult } from '@/lib/coding/types'
import type { SessionEvent } from '@/lib/coding-grading/grader'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { buildEmptyStateResponse } from '@/lib/hatch/skill-context'
import { calculateChallengeXp } from '@/lib/scoring/xp-calculator'
import { withRoute } from '@/lib/api/withRoute'

const TestResultSchema = z.object({
  id: z.string().min(1).max(200),
  label: z.string().min(1).max(500),
  status: z.enum(['passed', 'failed', 'error', 'timeout', 'no_solution']),
  hidden: z.boolean(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
  matchMode: z.string().max(80).optional(),
  errorMessage: z.string().max(4000).optional(),
  durationMs: z.number().finite().nonnegative().optional(),
})

const RunResultSchema = z.object({
  runId: z.string().min(1).max(200),
  testsPassed: z.number().int().min(0),
  testsTotal: z.number().int().min(0),
  results: z.array(TestResultSchema).max(1000),
}).superRefine((payload, ctx) => {
  if (payload.testsPassed > payload.testsTotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['testsPassed'],
      message: 'testsPassed cannot exceed testsTotal',
    })
  }
})

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'hatch']),
  content: z.string().max(20000),
  timestamp: z.number().finite().nonnegative().optional(),
})

const RequestSchema = z.object({
  attemptId: z.string().uuid(),
  finalCode: z.string().max(200000),
  language: z.string().trim().min(1).max(40),
  correctnessPayload: RunResultSchema,
  chatHistory: z.array(ChatMessageSchema).max(200).optional(),
  partId: z.string().uuid().optional(),
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

// ---------------------------------------------------------------------------
// step_questions row shape (subset used for partId path)
// ---------------------------------------------------------------------------

interface StepQuestionRow {
  id: string
  coding_test_case_ids: string[]
  grading_weight_within_step: number
}

// ---------------------------------------------------------------------------
// Event log parsing helpers - mirrors /api/code/run route pattern
// ---------------------------------------------------------------------------

function parseEventLog(raw: unknown): SessionEvent[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as SessionEvent[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as SessionEvent[]
    } catch {
      // Not a JSON array (e.g. canvas text summary) - return empty
    }
  }
  return []
}

// ---------------------------------------------------------------------------
// Challenge metadata shape (subset we need)
// ---------------------------------------------------------------------------

interface ChallengeMetadata {
  problem_statement_markdown?: string
  reference_solution?: string
  reference_approach?: string
  time_limit_seconds?: number
}

function getGradeLabel(score: number): string {
  if (score >= 4.5) return 'best'
  if (score >= 3) return 'good'
  return 'surface'
}

function codingNotReadyResponse({
  reason,
  language,
  challengeType,
}: {
  reason: 'missing_code' | 'missing_test_signal'
  language: string
  challengeType: 'sql' | 'algorithm'
}) {
  const emptyState = buildEmptyStateResponse({
    surface: 'grading',
    discipline: language === 'sql' || challengeType === 'sql' ? 'data' : 'software',
    challengeType,
  })
  const summary = reason === 'missing_test_signal'
    ? (language === 'sql' || challengeType === 'sql'
      ? 'I need a runnable query result before I can give useful feedback.'
      : 'I need a runnable test result before I can give useful feedback.')
    : emptyState.summary
  const nextActions = reason === 'missing_test_signal'
    ? ['Run the visible tests once so feedback can point to a real failure or passing path.']
    : emptyState.next_actions

  return NextResponse.json({
    status: 'not_ready',
    ready_to_grade: false,
    reason,
    empty_state: {
      ...emptyState,
      summary,
      next_actions: nextActions,
    },
    summary,
    next_actions: nextActions,
  }, { status: 422 })
}

function serializeTestResults(correctnessPayload: RunResult) {
  return {
    tests_passed: correctnessPayload.testsPassed,
    tests_total: correctnessPayload.testsTotal,
    results: correctnessPayload.results.map((result) => {
      const base = {
        id: result.id,
        label: result.label,
        status: result.status,
        hidden: result.hidden,
        input: result.hidden ? undefined : result.input,
        matchMode: result.matchMode,
        durationMs: result.durationMs,
      }
      if (result.hidden) return base
      return {
        ...base,
        output: result.output,
        expected: result.expected,
        actual: result.actual,
        errorMessage: result.errorMessage,
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = withRoute(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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
    attemptId,
    finalCode,
    language,
    correctnessPayload,
    chatHistory,
    partId,
  } = body

  // Verify ownership - user must own this attempt
  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('user_id, challenge_id, status, conversation_summary, started_at')
    .eq('id', attemptId)
    .single()

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If attempt already completed and a grade exists, prevent double-grading
  if (attempt.status === 'completed') {
    const { data: existingGrade } = await supabase
      .from('interview_grades')
      .select('attempt_id')
      .eq('attempt_id', attemptId)
      .limit(1)
      .maybeSingle()
    if (existingGrade) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    }
    // Fall through - re-grade an orphan attempt
  }

  // Verify this is a coding challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, difficulty, challenge_type, metadata')
    .eq('id', id)
    .single()

  if (!challenge || (challenge.challenge_type !== 'sql' && challenge.challenge_type !== 'algorithm')) {
    return NextResponse.json({ error: 'Not a coding challenge' }, { status: 400 })
  }

  // ---------------------------------------------------------------------------
  // partId path - per-subquestion submit (no rubric grader, deterministic only)
  // ---------------------------------------------------------------------------

  if (partId) {
    // Look up the step_questions row, verifying it belongs to this challenge
    const { data: part } = await supabase
      .from('step_questions')
      .select('id, coding_test_case_ids, grading_weight_within_step, flow_steps!inner(challenge_id)')
      .eq('id', partId)
      .eq('flow_steps.challenge_id', id)
      .single()

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const partRow = part as unknown as StepQuestionRow & {
      flow_steps: { challenge_id: string }
    }

    const allowedIds = new Set<string>(
      Array.isArray(partRow.coding_test_case_ids) ? partRow.coding_test_case_ids : []
    )

    // Validate all incoming test result ids are scoped to this part
    const invalidIds = correctnessPayload.results
      .map((r) => r.id)
      .filter((rid) => !allowedIds.has(rid))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Test result ids not in part scope', invalidIds },
        { status: 400 }
      )
    }

    // Deterministic scoring: testsPassed / testsTotal * 5
    const testsTotal = correctnessPayload.testsTotal
    const testsPassed = correctnessPayload.testsPassed
    const score = testsTotal > 0 ? (testsPassed / testsTotal) * 5 : 0
    const weightedScore = score * (partRow.grading_weight_within_step ?? 1.0)

    // Upsert into step_attempts - idempotent via (attempt_id, question_id) unique key
    const { error: upsertError } = await supabase
      .from('step_attempts')
      .upsert(
        {
          attempt_id: attemptId,
          question_id: partId,
          step: 'coding',
          response_type: 'coding_subtask',
          selected_option_id: null,
          coding_final_code: finalCode,
          coding_final_language: language,
          coding_test_results: correctnessPayload.results,
          score,
          weighted_score: weightedScore,
        },
        { onConflict: 'attempt_id,question_id' }
      )

    if (upsertError) {
      console.error('step_attempts upsert failed:', upsertError)
      return NextResponse.json(
        { error: 'Failed to persist part attempt', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ partId, score, weighted_score: weightedScore, testsPassed, testsTotal })
  }

  const challengeType = challenge.challenge_type as 'sql' | 'algorithm'
  if (!finalCode.trim()) {
    return codingNotReadyResponse({ reason: 'missing_code', language, challengeType })
  }
  if (correctnessPayload.testsTotal === 0) {
    return codingNotReadyResponse({ reason: 'missing_test_signal', language, challengeType })
  }

  // Pull session events (paste events, run events) from conversation_summary
  const sessionEvents = parseEventLog(attempt.conversation_summary)
  const userPlan = await getUserPlanForBudget(user.id)

  // Persist final code + test results to challenge_attempts before grading
  // (so attempt is recoverable even if grading fails)
  await supabase
    .from('challenge_attempts')
    .update({
      final_code: finalCode,
      final_language: language,
      test_results: {
        ...serializeTestResults(correctnessPayload),
      },
    })
    .eq('id', attemptId)

  // Build grading input
  const metadata = (challenge.metadata ?? {}) as ChallengeMetadata

  const gradingInput = {
    challenge: {
      title: challenge.title ?? 'Unknown',
      difficulty: challenge.difficulty ?? 'intermediate',
      problem_statement: metadata.problem_statement_markdown ?? '',
      reference_solution: metadata.reference_solution,
      reference_approach: metadata.reference_approach,
      time_limit_seconds: metadata.time_limit_seconds,
    },
    finalCode,
    language,
    correctness: correctnessPayload,
    chatHistory: chatHistory ?? [],
    sessionEvents,
    sessionStartedAt: attempt.started_at as string | undefined,
    budget: { userId: user.id, userPlan, route: 'coding_submit_grade' },
  }

  // Grade the attempt
  let grade
  try {
    if (!shouldUseDeterministicCodingGrade(gradingInput)) {
      await assertPlanLimit(user.id, userPlan, 'ai_grading_runs')
    }
    grade = await gradeCodingAttempt(gradingInput)
  } catch (err) {
    const response = aiLimitResponse(err)
    if (response) return response
    console.error('Coding grading failed:', err)
    return NextResponse.json({ error: 'Grading failed', details: String(err) }, { status: 500 })
  }

  const admin = createAdminClient()

  // Atomically claim this completion. The conditional flip (status != 'completed')
  // is the single gate that decides whether THIS request owns the completion:
  // - two concurrent submits race here and only one flips a row; the loser awards
  //   nothing (no double-award).
  // - an orphan attempt (already 'completed' but missing a grade row) flips zero
  //   rows here, so XP is NOT re-awarded on re-grade, while the grade row below
  //   still gets written to recover the orphan.
  const { data: claimedRows } = await supabase
    .from('challenge_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_score: grade.overall_score,
      max_score: 5,
      grade_label: getGradeLabel(grade.overall_score),
    })
    .eq('id', attemptId)
    .neq('status', 'completed')
    .select('id')
  const isFirstCompletion = (claimedRows?.length ?? 0) > 0

  // Only the request that won the completion records the streak + XP, exactly once.
  let final_xp_awarded = 0
  if (isFirstCompletion) {
    // Record daily streak first (RPC is service_role-only) so the multiplier
    // reflects today's rep, then recompute XP with the post-streak day count and
    // increment atomically (no read-then-write race on xp_total).
    const { error: streakError } = await admin.rpc('update_user_streak', { p_user_id: user.id })
    if (streakError) console.error('[streak] update_user_streak failed:', streakError.message)
    const { data: xpProfile } = await admin
      .from('profiles')
      .select('streak_days')
      .eq('id', user.id)
      .single()
    final_xp_awarded = calculateChallengeXp(grade.overall_score, 5, challenge.difficulty, xpProfile?.streak_days ?? 0)
    const { error: xpError } = await admin.rpc('increment_user_xp', { p_user_id: user.id, p_amount: final_xp_awarded })
    if (xpError) console.error('[xp] increment_user_xp failed:', xpError.message)
    // Persist the real reward onto the attempt so the Submissions tab and
    // /api/attempts show it, not +0.
    await supabase
      .from('challenge_attempts')
      .update({ feedback_json: { xp_awarded: final_xp_awarded, total_score: grade.overall_score, max_score: 5 } })
      .eq('id', attemptId)
  }

  // Persist grade to interview_grades
  await supabase.from('interview_grades').insert({
    attempt_id: attemptId,
    challenge_type: challenge.challenge_type,
    overall_score: grade.overall_score,
    headline: grade.headline,
    rubric_scores: grade.dimensions,
    top_strength: grade.top_strength,
    top_improvement: grade.top_improvement,
    canvas_annotations: [
      ...(grade.what_a_5_would_look_like ? [{
        target_label: '5.0 bar',
        text: grade.what_a_5_would_look_like,
        severity: 'info',
      }] : []),
      ...(grade.score_breakdown ? [
        {
          target_label: 'Correctness',
          text: grade.score_breakdown.correctness.summary,
          severity: 'info',
          score_breakdown: grade.score_breakdown,
        },
        {
          target_label: 'Process',
          text: grade.score_breakdown.process.summary,
          severity: 'info',
        },
      ] : []),
    ],
  })

  return NextResponse.json({ grade, xp_awarded: final_xp_awarded })
}, { name: 'challenges.coding-submit' })
