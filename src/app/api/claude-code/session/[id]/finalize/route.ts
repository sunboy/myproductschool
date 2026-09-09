// POST /api/claude-code/session/[id]/finalize
//
// Called when the user clicks Submit, or by the reaper when a session expires.
// Tears down the sandbox, runs the analyst_v1 grader (stub when not yet wired),
// writes grades to challenge_attempts so they appear in Submissions history,
// and marks the session terminated.

import { randomUUID } from 'crypto'
import { pauseForFinalization, persistAnalyticsGrade, savedAnalyticsGrade, waitForFreshSnapshot, waitForFreshUserState } from '@/lib/sandbox/finalize-grade'
import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import { recordSessionSpend } from '@/lib/sandbox/record-spend'
import { blockSessionKey } from '@/lib/sandbox/llm-gateway'
import { gradeAnalystSession } from '@/lib/coding-grading/analytics-grader'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { analystDimensionsToStepResults } from '@/lib/coding-grading/analyst-competency-map'
import { debugDimensionsToStepResults } from '@/lib/coding-grading/debug-competency-map'
import { DEBUG_RUBRIC_SPEC } from '@/lib/coding-grading/debug-rubric'
import { labIdForChallengeType } from '@/lib/labs/types'
import { updateCompetencies } from '@/lib/v2/skills/competency-updater'
import type { LearnerCompetency, RoleLens } from '@/lib/types'
import { readAnalyticsProgress } from '@/lib/sandbox/analytics-progress'
import { inspectWorkspace, listUserSkills } from '@/lib/coding-grading/workspace-inspector'
import { snapshotCaptureFromUri } from '@/lib/sandbox/snapshot-provenance'

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
  const { data: session, error: sessionError } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, challenge_id, attempt_id, host_instance_id, status, transcript_uri, final_artifact')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) return NextResponse.json({ error: 'Session could not be loaded. Please try again.' }, { status: 503 })

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status === 'terminated') {
    // Already finalized — return the stored grade from the attempt.
    const { data: attempt, error: attemptReadError } = await admin
      .from('challenge_attempts')
      .select('status, total_score, max_score, grade_label')
      .eq('id', session.attempt_id as string)
      .single()

    if (attemptReadError) return NextResponse.json({ error: 'Saved feedback could not be loaded. Please try again.' }, { status: 503 })

    if (attempt?.status === 'completed' && typeof attempt.total_score === 'number' && attempt.max_score > 0) {
      return NextResponse.json({
        session_id: sessionId,
        total_score: Math.round((attempt.total_score / attempt.max_score) * 100),
        grade_label: attempt.grade_label,
        final_artifact: session.final_artifact,
        already_finalized: true,
      })
    }
    // Recover legacy partial finalizations instead of returning an ungraded success.
  }

  const adaptive = (session.final_artifact as {
    adaptive?: { updated_at?: string; arc?: Array<{ id?: string; kind?: string }> }
  } | null)?.adaptive
  const progress = readAnalyticsProgress(session.final_artifact)
  let transcriptUri = session.transcript_uri as string | null
  const reportStepIds = new Set(
    (adaptive?.arc ?? [])
      .filter((step) => step.kind === 'report')
      .map((step) => step.id)
      .filter((id): id is string => Boolean(id)),
  )
  const skillStepIds = new Set(
    (adaptive?.arc ?? [])
      .filter((step) => step.kind === 'skill')
      .map((step) => step.id)
      .filter((id): id is string => Boolean(id)),
  )
  const reportWasSubmitted = progress?.findings.some(
    (finding) => reportStepIds.has(finding.id) && finding.verdict !== 'retry',
  )
  const skillWasSubmitted = progress?.findings.some(
    (finding) => skillStepIds.has(finding.id) && finding.verdict !== 'retry',
  )
  const fileEvidenceWasSubmitted = reportWasSubmitted || skillWasSubmitted

  // File signals reach the browser immediately, while the authoritative
  // workspace tarball uploads every 30 seconds. Do not tear down and grade an
  // older snapshot. A timeout leaves the live session intact for a safe retry.
  if (fileEvidenceWasSubmitted && adaptive?.updated_at) {
    try {
      const fresh = await waitForFreshSnapshot(admin, sessionId, adaptive.updated_at)
      if (!fresh?.transcriptUri) {
        const hasCaptureProvenance = Boolean(
          snapshotCaptureFromUri(session.transcript_uri as string | null, 'workspace'),
        )
        return NextResponse.json(
          hasCaptureProvenance
            ? { error: 'Your latest report is still saving. Retry submission in a few seconds.', reason: 'snapshot_pending' }
            : {
              error: 'This session cannot verify when its workspace was captured. Wait for another autosave; if this persists, restart the session before submitting.',
              reason: 'snapshot_provenance_unavailable',
            },
          { status: 409 },
        )
      }
      transcriptUri = fresh.transcriptUri
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 503 })
    }
  }

  // Terminal output is only a fast UI signal. Confirm a submitted report is
  // present in the same uploaded workspace the grader will inspect.
  if (reportWasSubmitted) {
    const evidence = await inspectWorkspace(transcriptUri)
    const hasReport = evidence.artifacts.some((artifact) => /report[\w./-]*\.md$/i.test(artifact.filename))
    if (!hasReport) {
      return NextResponse.json(
        { error: 'The report checkpoint was saved, but report.md is not in the workspace snapshot yet. Retry submission after it saves.', reason: 'report_missing' },
        { status: 409 },
      )
    }
  }

  const { data: claudeProfile } = await admin
    .from('profiles')
    .select('cc_claude_state_uri')
    .eq('id', user.id)
    .maybeSingle()
  const profileClaudeStateUri = (claudeProfile?.cc_claude_state_uri as string | null | undefined) ?? null
  let claudeStateUri = profileClaudeStateUri
  if (skillWasSubmitted && adaptive?.updated_at) {
    try {
      const freshState = await waitForFreshUserState(admin, user.id, sessionId, adaptive.updated_at)
      if (!freshState) {
        const hasCaptureProvenance = Boolean(
          snapshotCaptureFromUri(profileClaudeStateUri, 'user-state'),
        )
        return NextResponse.json(
          hasCaptureProvenance
            ? { error: 'Your reusable skill is still saving. Retry submission in a few seconds.', reason: 'skill_pending' }
            : {
              error: 'This session cannot verify when its reusable skill was captured. Wait for another autosave; if this persists, restart the session before submitting.',
              reason: 'skill_provenance_unavailable',
            },
          { status: 409 },
        )
      }
      claudeStateUri = freshState.uri
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 503 })
    }
  }
  const persistedSkills = await listUserSkills(claudeStateUri)
  const normalizeSkillName = (value: string) => value
    .replace(/^.*\.claude\/skills\//, '')
    .replace(/^\/+/, '')
  const expectedSkillNames = new Set((progress?.skillsWritten ?? []).map(normalizeSkillName))
  const currentSkillPersisted = expectedSkillNames.size > 0
    ? persistedSkills.some((skill) => expectedSkillNames.has(normalizeSkillName(skill.filename)))
    : persistedSkills.length > 0
  if (skillWasSubmitted && !currentSkillPersisted) {
    return NextResponse.json(
      { error: 'Your reusable skill is still saving. Retry submission in a few seconds.', reason: 'skill_missing' },
      { status: 409 },
    )
  }

  try {
    await pauseForFinalization(admin, sessionId)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 })
  }

  // Revoke the session credential before any slower teardown or grading work.
  // Blocking retains the gateway record so spend reconciliation can still read
  // the authoritative total. The reaper retries bounded failures.
  const keyBlock = await blockSessionKey(sessionId, 4000)
  if (keyBlock.status === 'failed' || keyBlock.status === 'not_found') {
    const reason = keyBlock.status === 'failed' ? keyBlock.reason : keyBlock.status
    console.error(`[cc/finalize] session key block failed (${reason})`)
  }

  // --- Best-effort sandbox teardown ---
  if (session.host_instance_id) {
    const sandbox = getSandbox()
    const teardown = sandbox.destroySession(session.host_instance_id as string).catch((err) => {
      console.error('[cc/finalize] destroySession failed (best-effort):', err)
    })
    // Begin cleanup alongside grading, and retain it after early responses.
    // The orphan reaper remains the backstop for failures or platform timeouts.
    after(() => teardown)
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
    .select('title, prompt_text, scenario_context, scenario_trigger, scenario_question, challenge_type')
    .eq('id', session.challenge_id as string)
    .maybeSingle()
  const labId = labIdForChallengeType(challenge?.challenge_type as string | undefined)
  const rubricSpec = labId === 'debugging' ? DEBUG_RUBRIC_SPEC : undefined

  const userPlan = await getUserPlanForBudget(user.id).catch(() => 'free')

  let gradeResult = savedAnalyticsGrade(sessionId, session.final_artifact)
  try {
    gradeResult ??= await gradeAnalystSession({
      rubric: rubricSpec,
      sessionId,
      transcriptUri,
      challengeTitle: challenge?.title ?? 'Analytics challenge',
      challengePrompt: [
        challenge?.scenario_context,
        challenge?.scenario_trigger,
        challenge?.scenario_question,
        challenge?.prompt_text,
      ].filter(Boolean).join('\n\n'),
      markedFindings: progress?.findings,
      persistedSkills,
      budget: { userId: user.id, userPlan, route: 'claude_code_analytics_grade' },
    })
  } catch (err) {
    // Budget/plan caps surface as 402 (per project_ai_budget_blocks_grading);
    // the idle session retains its snapshot for resume or another submission.
    const isCap = (err as { isLimitError?: boolean })?.isLimitError
      || /budget|limit/i.test((err as Error)?.message ?? '')
    if (isCap) {
      return NextResponse.json(
        { error: 'AI budget reached. Try again next cycle.', reason: 'ai_cap_hit' },
        { status: 402 },
      )
    }
    console.error('[cc/finalize] grading failed:', err)
    return NextResponse.json({ error: 'Feedback could not be generated. Please retry submission.' }, { status: 503 })
  }

  let shareUrl: string | null = null
  try {
    const saved = await persistAnalyticsGrade(admin, {
      id: sessionId, attempt_id: session.attempt_id as string, final_artifact: session.final_artifact,
    }, gradeResult, randomUUID())
    if (saved.shareId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      shareUrl = `${baseUrl}/workspace/challenges/${session.challenge_id}/share/${saved.shareId}`
    }
  } catch (error) {
    console.error('[cc/finalize] persistence failed:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 503 })
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
          transcript_uri: transcriptUri,
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
