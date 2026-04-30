import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeCodingAttempt } from '@/lib/coding-grading/grader'
import type { ChatMessage, SessionEvent } from '@/lib/coding-grading/grader'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepQuestionRow {
  id: string
  question_text: string
  response_type: string
  grading_weight_within_step: number
  coding_test_case_ids: string[] | null
  sequence: number
}

interface StepAttemptRow {
  id: string
  question_id: string
  response_type: string
  score: number | null
  coding_final_code: string | null
  coding_final_language: string | null
  coding_test_results: unknown
  selected_option_id: string | null
  // joined from step_questions
  step_questions: StepQuestionRow
}

interface PartBreakdown {
  id: string
  title: string
  response_type: string
  score: number
  weight: number
  weighted_score: number
}

// ---------------------------------------------------------------------------
// Event log parsing helper — mirrors coding-submit route pattern
// ---------------------------------------------------------------------------

function parseEventLog(raw: unknown): SessionEvent[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as SessionEvent[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as SessionEvent[]
    } catch {
      // Not a JSON array (e.g. canvas text summary) — return empty
    }
  }
  return []
}

// ---------------------------------------------------------------------------
// POST /api/challenges/[id]/finalize
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Parse body
  let body: { attemptId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { attemptId } = body
  if (!attemptId) {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 })
  }

  // ---------------------------------------------------------------------------
  // Idempotency: if a grade already exists for this attempt, return it as-is
  // ---------------------------------------------------------------------------

  const { data: existingGrade } = await supabase
    .from('interview_grades')
    .select('*')
    .eq('attempt_id', attemptId)
    .maybeSingle()

  if (existingGrade) {
    // Parse parts_breakdown from canvas_annotations (stored as { parts_breakdown: [...] })
    const stored = existingGrade.canvas_annotations as { parts_breakdown?: PartBreakdown[] } | null
    const parts = stored?.parts_breakdown ?? []
    return NextResponse.json({
      grade: existingGrade,
      weighted_total: existingGrade.overall_score ?? 0,
      parts,
    })
  }

  // ---------------------------------------------------------------------------
  // Verify attempt belongs to user AND attempt.challenge_id === id from URL
  // ---------------------------------------------------------------------------

  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, status, conversation_summary, started_at')
    .eq('id', attemptId)
    .single()

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (attempt.challenge_id !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ---------------------------------------------------------------------------
  // Fetch challenge row
  // ---------------------------------------------------------------------------

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, scenario_context, metadata, difficulty, challenge_type')
    .eq('id', id)
    .single()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // ---------------------------------------------------------------------------
  // Fetch all step_attempts for this attempt that belong to coding step_questions
  // Join to step_questions (need response_type, grading_weight_within_step,
  // question_text, coding_test_case_ids, sequence)
  // Filter to questions whose parent flow_step has step='coding'
  // Order by step_questions.sequence ASC
  // ---------------------------------------------------------------------------

  const { data: stepAttempts, error: attemptsError } = await supabase
    .from('step_attempts')
    .select(`
      id,
      question_id,
      response_type,
      score,
      coding_final_code,
      coding_final_language,
      coding_test_results,
      selected_option_id,
      step_questions!inner (
        id,
        question_text,
        response_type,
        grading_weight_within_step,
        coding_test_case_ids,
        sequence,
        flow_steps!inner (
          step
        )
      )
    `)
    .eq('attempt_id', attemptId)
    .eq('step_questions.flow_steps.step', 'coding')
    .order('step_questions(sequence)', { ascending: true })

  if (attemptsError) {
    console.error('Failed to fetch step_attempts:', attemptsError)
    return NextResponse.json(
      { error: 'Failed to fetch attempt data', details: attemptsError.message },
      { status: 500 }
    )
  }

  const rows = (stepAttempts ?? []) as unknown as StepAttemptRow[]

  // ---------------------------------------------------------------------------
  // Compute per-part scores and weighted total
  // ---------------------------------------------------------------------------

  const partsBreakdown: PartBreakdown[] = rows.map((row) => {
    const sq = row.step_questions
    const score = row.score ?? 0
    const weight = sq.grading_weight_within_step ?? 1.0
    const weightedScore = score * weight

    return {
      id: sq.id,
      title: sq.question_text,
      response_type: sq.response_type,
      score,
      weight,
      weighted_score: weightedScore,
    }
  })

  // weighted_total = sum(weighted_score) / sum(weight). Treat as 0..5 scale.
  const totalWeight = partsBreakdown.reduce((acc, p) => acc + p.weight, 0)
  const totalWeightedScore = partsBreakdown.reduce((acc, p) => acc + p.weighted_score, 0)
  const weightedTotal = totalWeight > 0 ? totalWeightedScore / totalWeight : 0

  // ---------------------------------------------------------------------------
  // Build grader input — pass parts[] so the skill can weight evidence
  // ---------------------------------------------------------------------------

  const metadata = (challenge.metadata ?? {}) as Record<string, unknown>
  const sessionEvents = parseEventLog(attempt.conversation_summary)

  // Build parts array for grader input
  const gradingParts = rows.map((row) => {
    const sq = row.step_questions
    return {
      id: sq.id,
      title: sq.question_text,
      response_type: sq.response_type as 'coding_subtask' | 'pure_mcq',
      code: row.coding_final_code ?? undefined,
      language: row.coding_final_language ?? undefined,
      test_results: row.coding_test_results ?? undefined,
      weight: sq.grading_weight_within_step ?? 1.0,
      score: row.score ?? 0,
      mcq_choice: row.selected_option_id ?? undefined,
    }
  })

  // Build a representative finalCode + correctness from the highest-weight coding part
  // (for the legacy grader fields that expect single-part inputs)
  const topCodingPart = rows
    .filter((r) => r.response_type === 'coding_subtask' && r.coding_final_code)
    .sort((a, b) => (b.step_questions.grading_weight_within_step ?? 0) - (a.step_questions.grading_weight_within_step ?? 0))[0]

  const representativeCode = topCodingPart?.coding_final_code ?? ''
  const representativeLanguage = topCodingPart?.coding_final_language ?? 'python'
  const representativeResults = (topCodingPart?.coding_test_results ?? []) as Array<{
    id: string
    status: string
    hidden: boolean
    errorMessage?: string
    label?: string
  }>

  // Build a RunResult shape for the legacy correctness field
  const passedCount = representativeResults.filter((r) => r.status === 'passed').length
  const correctnessForGrader = {
    runId: `finalize-${attemptId}`,
    testsPassed: passedCount,
    testsTotal: representativeResults.length,
    results: representativeResults.map((r) => ({
      id: r.id,
      label: r.label ?? r.id,
      status: r.status as 'passed' | 'failed' | 'error' | 'timeout' | 'no_solution',
      hidden: r.hidden ?? false,
      errorMessage: r.errorMessage,
    })),
  }

  const gradingInput = {
    challenge: {
      title: challenge.title ?? 'Unknown',
      difficulty: challenge.difficulty ?? 'intermediate',
      problem_statement: (metadata.problem_statement_markdown as string) ?? (challenge.scenario_context ?? ''),
      reference_solution: metadata.reference_solution as string | undefined,
      reference_approach: metadata.reference_approach as string | undefined,
      time_limit_seconds: metadata.time_limit_seconds as number | undefined,
    },
    finalCode: representativeCode,
    language: representativeLanguage,
    correctness: correctnessForGrader,
    chatHistory: [] as ChatMessage[],
    sessionEvents,
    sessionStartedAt: attempt.started_at as string | undefined,
    // Parts-aware field — T8 will extend the skill to use this
    parts: gradingParts,
  }

  // ---------------------------------------------------------------------------
  // Call grader for 5-dim rubric
  // ---------------------------------------------------------------------------

  let grade
  try {
    grade = await gradeCodingAttempt(gradingInput)
  } catch (err) {
    console.error('Coding grader failed in finalize:', err)
    return NextResponse.json({ error: 'Grading failed', details: String(err) }, { status: 500 })
  }

  // ---------------------------------------------------------------------------
  // Modulate weighted_total ±0.5 based on rubric average (clamp 0..5)
  // ---------------------------------------------------------------------------

  const dimScores = Object.values(grade.dimensions).map((d) => d.score as number)
  const rubricAvg = dimScores.length > 0 ? dimScores.reduce((a, b) => a + b, 0) / dimScores.length : 3
  // rubricAvg is on 1-5 scale; midpoint is 3. Modulate by (rubricAvg - 3) / 3 * 0.5
  const modulation = ((rubricAvg - 3) / 3) * 0.5
  const modulated = Math.min(5, Math.max(0, weightedTotal + modulation))
  const overallScore = Math.round(modulated * 10) / 10

  // ---------------------------------------------------------------------------
  // Persist: insert interview_grades, update challenge_attempts
  // Store parts_breakdown in canvas_annotations JSONB
  // (canvas_annotations is unused for coding; repurposed as a JSONB bag)
  // ---------------------------------------------------------------------------

  const { data: insertedGrade, error: insertError } = await supabase
    .from('interview_grades')
    .insert({
      attempt_id: attemptId,
      challenge_type: challenge.challenge_type,
      overall_score: overallScore,
      headline: grade.headline,
      rubric_scores: grade.dimensions,
      top_strength: grade.top_strength,
      top_improvement: grade.top_improvement,
      canvas_annotations: { parts_breakdown: partsBreakdown } as unknown as never[],
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to insert interview_grades:', insertError)
    return NextResponse.json(
      { error: 'Failed to save grade', details: insertError.message },
      { status: 500 }
    )
  }

  // Mark attempt completed
  await supabase
    .from('challenge_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return NextResponse.json({
    grade: insertedGrade,
    weighted_total: weightedTotal,
    parts: partsBreakdown.map((p) => ({
      id: p.id,
      title: p.title,
      score: p.score,
      weight: p.weight,
    })),
  })
}
