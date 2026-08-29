import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadAttemptTranscript } from '@/lib/casebook/attempt-transcript'
import { computeMoveDiff, type ExpertMove } from '@/lib/casebook/move-diff'
import { gradeCaseAttempt, type CaseObjective, type VerdictSpec } from '@/lib/casebook/case-grader'
import { buildNarrativeMd } from '@/lib/casebook/report-narrative'
import { buildChartSpecs } from '@/lib/casebook/chart-specs'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'

export const dynamic = 'force-dynamic'
// Grading invokes an AI model (case-grader.ts) — same budget headroom as
// the analytics finalize route (src/app/api/claude-code/session/[id]/finalize/route.ts).
export const maxDuration = 60

// cc_case_attempts.id IS a real uuid (gen_random_uuid() default, per
// supabase/migrations/20260826100100_casebook_user_state.sql) — unlike
// cc_cases.id / cc_scenes.id, which are TEXT SLUGS. z.string().uuid() is
// correct here; do not "fix" this to a slug pattern.
const AttemptIdSchema = z.string().uuid()

interface CaseAttemptRow {
  id: string
  user_id: string
  case_id: string
  status: string
  started_at: string
}

interface CaseRow {
  id: string
  title: string
  brief_md: string
  objectives: CaseObjective[]
  verdict_spec: VerdictSpec
}

interface ExpertSessionRow {
  moves: ExpertMove[]
}

// POST /api/casebook/case/[attemptId]/file
//
// Files a finished Challenge (full case) attempt, then grades it in the same
// request. Two CAS-guarded transitions, matching the finalize route's
// precedent:
//   1. in_progress -> filed (sets filed_at). Reads the attempt's merged
//      transcript so the move-diff/grade have evidence.
//   2. filed -> graded (sets graded_at, verdict, diff, grade, report).
//
// If the AI grading call fails on a budget/plan cap, the attempt is left at
// `filed` with `filed_at` already set — that IS the durable retry point. A
// retry POST to this same route re-attempts grading from `filed` without
// re-reading the transcript a second time in a separate step (this route
// does both steps together; there is no separate grade-only endpoint in this
// phase's scope).
//
// report.chart_specs is generated HERE too, at filing time, from the same
// merged transcript — deterministically, from real parsed query results
// only (see src/lib/casebook/chart-specs.ts's SOURCE-OF-TRUTH rule). This is
// filing-time-only by design: no in-session surface reads chart_specs mid-
// session, and nothing writes cc_case_attempts.evidence mid-session either,
// so a mid-session generator would be invisible machinery working off a
// worse source (the client's lossy rolling tail vs. the full workspace
// tarball read here).
export const POST = withRoute(async (
  _req,
  { params }: { params: Promise<{ attemptId: string }> },
) => {
  const { attemptId: rawAttemptId } = await params
  const parsedId = AttemptIdSchema.safeParse(rawAttemptId)
  if (!parsedId.success) {
    return apiError(400, 'invalid_attempt_id', 'Invalid attempt id')
  }
  const attemptId = parsedId.data

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const admin = createAdminClient()

  const attemptResult = await admin
    .from('cc_case_attempts')
    .select('id, user_id, case_id, status, started_at')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptResult.error) {
    return apiError(500, 'attempt_query_failed', attemptResult.error.message)
  }
  const attempt = attemptResult.data as CaseAttemptRow | null
  if (!attempt) {
    return apiError(404, 'not_found', 'Attempt not found')
  }
  if (attempt.user_id !== user.id) {
    return apiError(404, 'not_found', 'Attempt not found')
  }

  // --- Step 1: file (in_progress -> filed), unless already past it ---
  if (attempt.status === 'in_progress') {
    const fileResult = await admin
      .from('cc_case_attempts')
      .update({ status: 'filed', filed_at: new Date().toISOString() })
      .eq('id', attemptId)
      .eq('status', 'in_progress') // CAS guard: a concurrent file call can't double-transition
      .select('id')
      .maybeSingle()

    if (fileResult.error) {
      return apiError(500, 'file_failed', fileResult.error.message)
    }
    if (!fileResult.data) {
      // Lost the race to another concurrent call; re-read below picks up
      // whatever status won.
    }
    attempt.status = 'filed'
  } else if (attempt.status !== 'filed') {
    // Already graded, or in a terminal non-gradable state (paused/failed/abandoned).
    return apiError(409, 'invalid_status', `Attempt is ${attempt.status}, cannot file`)
  }

  // --- Load case content (objectives, verdict spec, expert moves) ---
  const caseResult = await admin
    .from('cc_cases')
    .select('id, title, brief_md, objectives, verdict_spec')
    .eq('id', attempt.case_id)
    .maybeSingle()

  if (caseResult.error || !caseResult.data) {
    return apiError(500, 'case_load_failed', 'Module content not found')
  }
  const caseRow = caseResult.data as unknown as CaseRow

  const expertResult = await admin
    .from('cc_expert_sessions')
    .select('moves')
    .eq('case_id', attempt.case_id)
    .maybeSingle()

  if (expertResult.error || !expertResult.data) {
    return apiError(500, 'expert_session_load_failed', 'Expert reference session not found')
  }
  const expertMoves = (expertResult.data as unknown as ExpertSessionRow).moves

  // --- Load + merge the transcript(s) for this attempt ---
  const transcriptResult = await loadAttemptTranscript(user.id, attempt.case_id, attempt.started_at)

  // --- Step 2: grade (filed -> graded) ---
  const userPlan = await getUserPlanForBudget(user.id).catch(() => 'free')

  let gradeResult
  try {
    gradeResult = await gradeCaseAttempt({
      caseTitle: caseRow.title,
      caseBriefMd: caseRow.brief_md,
      objectives: caseRow.objectives,
      verdictSpec: caseRow.verdict_spec,
      expertMoves,
      learnerTurns: transcriptResult.turns,
      budget: { userId: user.id, userPlan, route: 'casebook_case_grade' },
    })
  } catch (err) {
    const isCap = (err as { isLimitError?: boolean })?.isLimitError
      || /budget|limit/i.test((err as Error)?.message ?? '')
    if (isCap) {
      // Attempt stays at `filed` (already committed above) — the durable
      // retry point. Never leave it in_progress or lose the filed_at.
      return apiError(402, 'ai_cap_hit', 'AI budget reached. Try again shortly.')
    }
    throw err
  }

  const diff = computeMoveDiff(gradeResult.matchedExpertMoveIds, expertMoves)

  const narrativeMd = buildNarrativeMd({
    caseTitle: caseRow.title,
    diff,
    verdict: gradeResult.verdict,
    grade: gradeResult.grade,
  })

  // Deterministic, from real parsed query results only — see chart-specs.ts.
  const chartSpecs = buildChartSpecs(transcriptResult.queries)

  const gradedAt = new Date().toISOString()
  const gradeUpdateResult = await admin
    .from('cc_case_attempts')
    .update({
      status: 'graded',
      graded_at: gradedAt,
      verdict: gradeResult.verdict,
      diff,
      grade: gradeResult.grade,
      report: { narrative_md: narrativeMd, chart_specs: chartSpecs },
    })
    .eq('id', attemptId)
    .eq('status', 'filed') // CAS guard: a double-click can't double-grade
    .select('id')
    .maybeSingle()

  if (gradeUpdateResult.error) {
    return apiError(500, 'grade_write_failed', gradeUpdateResult.error.message)
  }

  if (!gradeUpdateResult.data) {
    // Lost the race — another concurrent call already graded this attempt.
    // Re-read the row so the caller still gets a consistent graded response
    // rather than a stale in-memory result from this call's own grading pass.
    const existing = await admin
      .from('cc_case_attempts')
      .select('status, verdict, diff, grade, report, graded_at')
      .eq('id', attemptId)
      .maybeSingle()

    if (existing.data) {
      return NextResponse.json({
        attempt: { id: attemptId, status: existing.data.status, graded_at: existing.data.graded_at },
        verdict: existing.data.verdict,
        diff: existing.data.diff,
        grade: existing.data.grade,
        report: existing.data.report,
        transcript_files_merged: transcriptResult.fileCount,
      })
    }
  }

  return NextResponse.json({
    attempt: { id: attemptId, status: 'graded', graded_at: gradedAt },
    verdict: gradeResult.verdict,
    diff,
    grade: gradeResult.grade,
    report: { narrative_md: narrativeMd, chart_specs: chartSpecs },
    // Diagnostic count of distinct .jsonl transcript files merged for this
    // grading pass — surfaces reconnect-spanning grading without exposing
    // internal session ids.
    transcript_files_merged: transcriptResult.fileCount,
  })
}, { name: 'casebook.case.file' })
