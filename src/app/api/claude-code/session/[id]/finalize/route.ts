// POST /api/claude-code/session/[id]/finalize
//
// Called when the user clicks Submit, or by the reaper when a session expires.
// Tears down the sandbox, runs the analyst_v1 grader (stub when not yet wired),
// writes grades to challenge_attempts so they appear in Submissions history,
// and marks the session terminated.

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import { recordSessionSpend } from '@/lib/sandbox/record-spend'
import { gradeAnalystSession } from '@/lib/coding-grading/analytics-grader'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { analystDimensionsToStepResults } from '@/lib/coding-grading/analyst-competency-map'
import { debugDimensionsToStepResults } from '@/lib/coding-grading/debug-competency-map'
import { DEBUG_RUBRIC_SPEC } from '@/lib/coding-grading/debug-rubric'
import { labIdForChallengeType } from '@/lib/labs/types'
import { updateCompetencies } from '@/lib/v2/skills/competency-updater'
import type { LearnerCompetency, RoleLens } from '@/lib/types'

export const dynamic = 'force-dynamic'
// Grading invokes an AI model — budget headroom.
export const maxDuration = 60

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  // --- Auth: user cookie (or service-role reaper) ---
  // The reaper path uses an internal service-role call (no cookie). Detect it
  // via the X-Service-Role-Reaper header signed with the same secret. For now
  // we only support the user path; the reaper can be added later.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // --- Load session and verify ownership ---
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, challenge_id, attempt_id, host_instance_id, status, transcript_uri, final_artifact')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'terminated') {
    // Already finalized — return the stored grade from the attempt.
    const { data: attempt } = await admin
      .from('challenge_attempts')
      .select('total_score, grade_label')
      .eq('id', session.attempt_id as string)
      .single()

    return NextResponse.json({
      session_id: sessionId,
      total_score: attempt?.total_score ?? 0,
      grade_label: attempt?.grade_label ?? 'ungraded',
      already_finalized: true,
    })
  }

  // --- Best-effort sandbox teardown ---
  if (session.host_instance_id) {
    const sandbox = getSandbox()
    sandbox.destroySession(session.host_instance_id as string).catch((err) => {
      console.error('[cc/finalize] destroySession failed (best-effort):', err)
    })
  }

  // --- Record Claude spend BEFORE grading ---
  // Grading can early-return 402 (AI budget) below, so capture spend first or an
  // over-budget user's session spend would never be recorded. Best-effort + the
  // backstop cron also catches it. (idempotent via recordSessionSpend's claim.)
  await recordSessionSpend(admin, session.user_id as string, sessionId).catch((err) => {
    console.error('[cc/finalize] recordSessionSpend failed (best-effort):', err)
  })

  // --- Run the lab grader (analyst_v1 / debug_v1 by lab) ---
  const { data: challenge } = await admin
    .from('challenges')
    .select('title, prompt_text, challenge_type')
    .eq('id', session.challenge_id as string)
    .maybeSingle()
  const labId = labIdForChallengeType(challenge?.challenge_type as string | undefined)
  const rubricSpec = labId === 'debugging' ? DEBUG_RUBRIC_SPEC : undefined

  const userPlan = await getUserPlanForBudget(user.id).catch(() => 'free')

  let gradeResult
  try {
    gradeResult = await gradeAnalystSession({
      rubric: rubricSpec,
      sessionId,
      transcriptUri: session.transcript_uri as string | null,
      challengeTitle: challenge?.title ?? 'Analytics challenge',
      challengePrompt: challenge?.prompt_text ?? '',
      budget: { userId: user.id, userPlan, route: 'claude_code_analytics_grade' },
    })
  } catch (err) {
    // Budget/plan caps surface as 402 (per project_ai_budget_blocks_grading);
    // the session stays active so the user can retry once under budget.
    const isCap = (err as { isLimitError?: boolean })?.isLimitError
      || /budget|limit/i.test((err as Error)?.message ?? '')
    if (isCap) {
      return NextResponse.json(
        { error: 'AI budget reached. Try again next cycle.', reason: 'ai_cap_hit' },
        { status: 402 },
      )
    }
    throw err
  }

  // --- Write grade to session row ---
  // Merge order matters: the grader's artifact is the base, the session's
  // adaptive log survives it (design §5, Codex finding 3).
  const priorAdaptive = (session.final_artifact as { adaptive?: unknown } | null)?.adaptive
  await admin.from('claude_code_sessions').update({
    status: 'terminated',
    ended_at: new Date().toISOString(),
    final_artifact: priorAdaptive
      ? { ...(gradeResult.final_artifact as Record<string, unknown>), adaptive: priorAdaptive }
      : gradeResult.final_artifact,
  }).eq('id', sessionId)

  // --- Complete challenge_attempts with grade so it shows in Submissions history ---
  // total_score + grade_label are the two fields the Submissions page reads
  // (per project memory: project_submissions_history_gap). Also mint a share_id
  // so the report can be shared via the existing public share route.
  //
  // The grader works on a 0-100 scale, but challenge_attempts.max_score is
  // DECIMAL(4,2) (cap 99.99) and the whole product renders attempt scores on the
  // FLOW 0-5 scale (migration 078). Writing max_score: 100 overflowed the column
  // and silently rolled back the entire UPDATE, leaving the attempt in_progress
  // with null score. Rescale to 0-5 here; the full 0-100 per-dimension detail is
  // preserved in final_artifact for the report page.
  const FLOW_MAX = 5
  const scaledScore = Math.round((gradeResult.total_score / 100) * FLOW_MAX * 10) / 10
  const shareId = randomUUID()
  const attemptUpdate: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    total_score: scaledScore,
    grade_label: gradeResult.grade_label,
    max_score: FLOW_MAX,
    share_id: shareId,
  }
  let shareUrl: string | null = null
  const { error: attemptErr } = await admin
    .from('challenge_attempts')
    .update(attemptUpdate)
    .eq('id', session.attempt_id as string)
  if (attemptErr) {
    // Some DBs may not have the share_id column yet — retry without it so the
    // grade still lands (the share link is a nice-to-have, the grade is not).
    delete attemptUpdate.share_id
    const { error: retryErr } = await admin
      .from('challenge_attempts')
      .update(attemptUpdate)
      .eq('id', session.attempt_id as string)
    if (retryErr) {
      // Don't swallow — a failed grade write means the attempt stays in_progress
      // and never reaches Submissions. Surface it instead of returning a grade
      // the user can't see persisted.
      console.error('[cc/finalize] attempt grade write failed:', retryErr)
    }
  } else {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    shareUrl = `${baseUrl}/workspace/challenges/${session.challenge_id}/share/${shareId}`
  }

  // --- Feed the session into learner competencies (adaptive B0) ---
  // analyst_v1 dimension scores (0/0.5/1) are evidence for the same competency
  // stream FLOW challenges feed, so the learner's level reflects CC work too.
  // Never fail finalize over this — the grade write above is the contract.
  try {
    const dims = (gradeResult.final_artifact as { dimensions?: Record<string, { score?: unknown }> } | null)?.dimensions
    const stepResults = labId === 'debugging'
      ? debugDimensionsToStepResults(dims)
      : analystDimensionsToStepResults(dims)
    if (stepResults.length) {
      const { data: currentRows } = await admin
        .from('learner_competencies')
        .select('competency, score, total_attempts, last_updated')
        .eq('user_id', user.id)
      const neutralLens = { competency_multipliers: {} } as RoleLens
      const { updated } = updateCompetencies(
        (currentRows ?? []) as LearnerCompetency[],
        stepResults,
        neutralLens,
        1,
      )
      // Only write rows the update actually moved — untouched competencies
      // (delta 0) come back unchanged and seeded-at-50 rows with no evidence
      // should not be materialized by a CC session that never exercised them.
      const beforeByKey = new Map(
        ((currentRows ?? []) as LearnerCompetency[]).map((r) => [r.competency, r]),
      )
      const touched = updated.filter((c) => {
        const before = beforeByKey.get(c.competency)
        return before
          ? before.score !== c.score || before.total_attempts !== c.total_attempts
          : c.total_attempts > 0
      })
      if (touched.length) {
        await admin.from('learner_competencies').upsert(
          touched.map((c) => ({
            user_id: user.id,
            competency: c.competency,
            score: c.score,
            total_attempts: c.total_attempts,
            last_updated: c.last_updated,
          })),
          { onConflict: 'user_id,competency' },
        )
      }
    }
  } catch (err) {
    console.error('[cc/finalize] competency update failed (best-effort):', err)
  }

  // --- Fire-and-forget: embed the session transcript ---
  // Do NOT await — per project memory (project_embed_blocks_submit).
  void (async () => {
    try {
      const embedUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/hatch/embed`
      await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'claude_code_session',
          session_id: sessionId,
          attempt_id: session.attempt_id,
          transcript_uri: session.transcript_uri,
        }),
      })
    } catch {
      // Embedding failure must not affect the finalize response.
    }
  })()

  return NextResponse.json({
    session_id: sessionId,
    total_score: gradeResult.total_score,
    grade_label: gradeResult.grade_label,
    final_artifact: gradeResult.final_artifact,
    share_url: shareUrl,
  })
}
