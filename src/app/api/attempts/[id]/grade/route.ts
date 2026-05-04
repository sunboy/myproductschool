import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GradingFeedback, RunResult, SupportedLanguage, TestResult } from '@/lib/coding/types'
import type { InterviewGrade } from '@/lib/types'

const TEST_STATUSES = new Set<TestResult['status']>(['passed', 'failed', 'error', 'timeout', 'no_solution'])

function normalizeStatus(status: unknown): TestResult['status'] {
  const value = String(status ?? '')
  return TEST_STATUSES.has(value as TestResult['status']) ? value as TestResult['status'] : 'failed'
}

function normalizeTestResults(raw: unknown, attemptId: string): RunResult | null {
  if (!raw || typeof raw !== 'object') return null

  const payload = raw as {
    tests_passed?: unknown
    tests_total?: unknown
    results?: Array<Record<string, unknown>>
  }
  const rows = Array.isArray(payload.results) ? payload.results : []
  if (rows.length === 0) return null

  const testsPassed = Number(payload.tests_passed ?? rows.filter((row) => row.status === 'passed').length)
  const testsTotal = Number(payload.tests_total ?? rows.length)

  return {
    runId: `history-${attemptId}`,
    testsPassed: Number.isFinite(testsPassed) ? testsPassed : 0,
    testsTotal: Number.isFinite(testsTotal) ? testsTotal : rows.length,
    results: rows.map((row, index) => ({
      id: String(row.id ?? `case-${index + 1}`),
      label: String(row.label ?? `Test ${index + 1}`),
      status: normalizeStatus(row.status),
      hidden: Boolean(row.hidden),
      output: row.output,
      expected: row.expected,
      actual: row.actual,
      errorMessage: typeof row.errorMessage === 'string' ? row.errorMessage : undefined,
      durationMs: typeof row.durationMs === 'number' ? row.durationMs : undefined,
    })),
  }
}

function extractFiveBar(raw: unknown): string {
  if (!Array.isArray(raw)) return ''
  const annotation = raw.find((item) => (
    item &&
    typeof item === 'object' &&
    (item as { target_label?: unknown }).target_label === '5.0 bar'
  )) as { text?: unknown } | undefined
  return typeof annotation?.text === 'string' ? annotation.text : ''
}

function toGradePayload(
  grade: {
    overall_score: unknown
    headline: string | null
    rubric_scores: unknown
    top_strength: string | null
    top_improvement: string | null
    canvas_annotations: unknown
  } | null,
  challengeType?: string | null,
): InterviewGrade | GradingFeedback | null {
  if (!grade) return null

  const base = {
    overall_score: Number(grade.overall_score ?? 0),
    headline: grade.headline ?? '',
    dimensions: (grade.rubric_scores ?? {}) as InterviewGrade['dimensions'],
    top_strength: grade.top_strength ?? '',
    top_improvement: grade.top_improvement ?? '',
  }

  if (challengeType === 'sql' || challengeType === 'algorithm') {
    return {
      ...base,
      dimensions: base.dimensions as GradingFeedback['dimensions'],
      what_a_5_would_look_like: extractFiveBar(grade.canvas_annotations),
    }
  }

  return {
    ...base,
    canvas_annotations: Array.isArray(grade.canvas_annotations) ? grade.canvas_annotations as InterviewGrade['canvas_annotations'] : [],
  }
}

/**
 * Returns the persisted feedback for a completed attempt.
 * Canvas challenges receive an InterviewGrade; SQL/coding challenges receive
 * correctness rows plus the coding grading payload.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: attemptId } = await params

  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('user_id, final_language, test_results, challenges(challenge_type)')
    .eq('id', attemptId)
    .single()
  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: grade } = await supabase
    .from('interview_grades')
    .select('challenge_type, overall_score, headline, rubric_scores, top_strength, top_improvement, canvas_annotations')
    .eq('attempt_id', attemptId)
    .order('graded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const challenge = Array.isArray(attempt.challenges) ? attempt.challenges[0] : attempt.challenges
  const challengeType = grade?.challenge_type ?? challenge?.challenge_type ?? null
  const correctness = normalizeTestResults(attempt.test_results, attemptId)

  if (!grade && !correctness) return NextResponse.json({ error: 'No grade found' }, { status: 404 })

  return NextResponse.json({
    grade: toGradePayload(grade ?? null, challengeType),
    challengeType,
    language: (attempt.final_language as SupportedLanguage | null) ?? null,
    correctness,
  })
}
