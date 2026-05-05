import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GradingFeedback, RunResult, SupportedLanguage, TestResult } from '@/lib/coding/types'
import type { InterviewGrade } from '@/lib/types'

const TEST_STATUSES = new Set<TestResult['status']>(['passed', 'failed', 'error', 'timeout', 'no_solution'])

interface MetadataTestCase {
  id?: string
  label?: string
  hidden?: boolean
  args?: unknown
  expected?: unknown
  expected_rows?: unknown
  match_mode?: string
  compare_mode?: string
}

interface ChallengeMetadata {
  test_cases?: MetadataTestCase[]
}

function normalizeStatus(status: unknown): TestResult['status'] {
  const value = String(status ?? '')
  return TEST_STATUSES.has(value as TestResult['status']) ? value as TestResult['status'] : 'failed'
}

function isGenericTestLabel(label: string, index: number): boolean {
  const normalized = label.trim().toLowerCase()
  return normalized === `test ${index + 1}` ||
    normalized === `test case ${index + 1}` ||
    normalized === `case ${index + 1}` ||
    normalized === `tc${index + 1}`
}

function compactJson(value: unknown): string {
  try {
    const text = JSON.stringify(value)
    return text.length > 80 ? `${text.slice(0, 77)}...` : text
  } catch {
    return String(value)
  }
}

function getCaseLabel(row: Record<string, unknown>, meta: MetadataTestCase | undefined, index: number): string {
  const rowLabel = typeof row.label === 'string' ? row.label.trim() : ''
  const metaLabel = typeof meta?.label === 'string' ? meta.label.trim() : ''

  if (metaLabel && (!rowLabel || isGenericTestLabel(rowLabel, index))) return metaLabel
  if (rowLabel) return rowLabel

  if (Array.isArray(meta?.args)) return `Case ${index + 1}: input ${compactJson(meta.args)}`
  if (Array.isArray(meta?.expected_rows)) {
    const count = meta.expected_rows.length
    return `Case ${index + 1}: ${count} expected row${count === 1 ? '' : 's'}`
  }

  return `Case ${index + 1}`
}

function normalizeTestResults(raw: unknown, attemptId: string, metadata?: ChallengeMetadata): RunResult | null {
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
  const metadataCases = Array.isArray(metadata?.test_cases) ? metadata.test_cases : []
  const metadataById = new Map(metadataCases.map((testCase) => [String(testCase.id ?? ''), testCase]))

  return {
    runId: `history-${attemptId}`,
    testsPassed: Number.isFinite(testsPassed) ? testsPassed : 0,
    testsTotal: Number.isFinite(testsTotal) ? testsTotal : rows.length,
    results: rows.map((row, index) => {
      const id = String(row.id ?? `case-${index + 1}`)
      const meta = metadataById.get(id) ?? metadataCases[index]
      const hidden = Boolean(row.hidden ?? meta?.hidden)
      return {
        id,
        label: getCaseLabel(row, meta, index),
        status: normalizeStatus(row.status),
        hidden,
        input: hidden ? undefined : row.input ?? meta?.args,
        output: row.output,
        expected: hidden ? row.expected : row.expected ?? meta?.expected_rows ?? meta?.expected,
        actual: row.actual,
        matchMode: typeof row.matchMode === 'string'
          ? row.matchMode
          : typeof row.match_mode === 'string'
            ? row.match_mode
            : meta?.match_mode ?? meta?.compare_mode,
        errorMessage: typeof row.errorMessage === 'string' ? row.errorMessage : undefined,
        durationMs: typeof row.durationMs === 'number' ? row.durationMs : undefined,
      }
    }),
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
    .select('user_id, final_code, final_language, test_results, challenges(challenge_type, metadata)')
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
  const correctness = normalizeTestResults(attempt.test_results, attemptId, (challenge?.metadata ?? {}) as ChallengeMetadata)

  if (!grade && !correctness) return NextResponse.json({ error: 'No grade found' }, { status: 404 })

  return NextResponse.json({
    grade: toGradePayload(grade ?? null, challengeType),
    challengeType,
    code: typeof attempt.final_code === 'string' ? attempt.final_code : null,
    language: (attempt.final_language as SupportedLanguage | null) ?? null,
    correctness,
  })
}
