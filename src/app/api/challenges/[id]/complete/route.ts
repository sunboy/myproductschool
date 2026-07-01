import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'
import { aggregateChallenge } from '@/lib/v2/skills/score-aggregator'
import { updateCompetencies } from '@/lib/v2/skills/competency-updater'
import { analyzeTrend } from '@/lib/v2/skills/trend-analyzer'
import type { FlowStep, LearnerCompetency, RoleLens } from '@/lib/types'
import { calculateChallengeXp } from '@/lib/scoring/xp-calculator'
import { applyMoveLevelXp } from '@/lib/data/move-levels-update'
import { checkAndGrantAchievements } from '@/lib/achievements/check'
import { FLOW_MAX_SCORE, MOVE_XP_MULTIPLIER } from '@/lib/scoring/flow-scale'
import { buildCompletedAttemptResult } from '@/lib/scoring/completed-attempt-result'
import {
  computeChallengeCompetencyRollup,
  competenciesForSignalInput,
  type CompetencySignalInput,
} from '@/lib/scoring/competency-rollup'
import { createCommunitySubmissionCandidate, recordCommunityCompletion } from '@/lib/data/community'
import { withRoute } from '@/lib/api/withRoute'
import { captureServerImmediate } from '@/lib/posthog/server'
import { EVENT_CHALLENGE_COMPLETED } from '@/lib/posthog/events'

const RequestSchema = z.object({
  attempt_id: z.string().uuid(),
  from_plan: z.string().trim().min(1).max(200).nullable().optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export const POST = withRoute(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const isMock = IS_MOCK

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  if (isMock) {
    return NextResponse.json({
      total_score: 2.4,
      max_score: 3.0,
      grade_label: 'Strong',
      xp_awarded: 80,
      step_breakdown: [
        { step: 'frame', score: 2.4, max_score: 3.0 },
        { step: 'list', score: 2.1, max_score: 3.0 },
        { step: 'optimize', score: 2.7, max_score: 3.0 },
        { step: 'win', score: 2.4, max_score: 3.0 },
      ],
      competency_deltas: [
        { competency: 'strategic_thinking', before: 50, after: 56 },
        { competency: 'cognitive_empathy', before: 50, after: 53 },
      ],
    })
  }

  const { id: challengeId } = await params
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
  const { attempt_id, from_plan } = body

  const admin = createAdminClient()

  // Fetch the attempt to verify ownership and get role_id
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts')
    .select('id, role_id, user_id, status, total_score, max_score, grade_label, feedback_json, mental_models_breakdown, primary_competency, weakest_competency')
    .eq('id', attempt_id)
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
  }

  // Already completed AND graded: serve the stored result (idempotent re-open).
  // A completed-but-ungraded orphan (status flipped but feedback_json never written,
  // e.g. a crash between the claim and the grade write) falls THROUGH so the grade
  // recovery below backfills it. The atomic claim will return 0 rows for it, so no
  // XP/achievement is re-awarded; only the missing grade columns are recovered.
  if (attempt.status === 'completed' && attempt.feedback_json) {
    return NextResponse.json(buildCompletedAttemptResult(attempt))
  }

  // Fetch all step_attempts for this attempt, joined with question weights
  const { data: stepAttempts, error: stepAttemptsError } = await admin
    .from('step_attempts')
    .select('question_id, step, score, competencies_demonstrated, quality_label, grading_explanation, competency_signal, selected_option_id')
    .eq('attempt_id', attempt_id)

  if (stepAttemptsError) {
    return NextResponse.json({ error: 'Failed to fetch step attempts' }, { status: 500 })
  }

  const attemptRows = stepAttempts ?? []

  // Fetch question weights for all answered questions
  const questionIds = attemptRows.map((r: { question_id: string }) => r.question_id)
  const { data: questions, error: questionsError } = await admin
    .from('step_questions')
    .select('id, grading_weight_within_step, target_competencies')
    .in('id', questionIds)

  if (questionsError) {
    return NextResponse.json({ error: 'Failed to fetch question weights' }, { status: 500 })
  }

  const questionMetaMap = new Map<string, { weight: number; targetCompetencies: string[] }>(
    (questions ?? []).map((q: { id: string; grading_weight_within_step: number; target_competencies?: string[] | null }) => [
      q.id,
      {
        weight: q.grading_weight_within_step,
        targetCompetencies: q.target_competencies ?? [],
      },
    ])
  )

  // Group by step and compute per-step scores
  const stepMap = new Map<FlowStep, Array<{ score: number; weight: number }>>()
  for (const row of attemptRows) {
    const step = row.step as FlowStep
    const existing = stepMap.get(step) ?? []
    existing.push({
      score: row.score ?? 0,
      weight: questionMetaMap.get(row.question_id)?.weight ?? 1,
    })
    stepMap.set(step, existing)
  }

  const stepResults: Array<{ step: FlowStep; step_score: number }> = []
  for (const [step, scores] of stepMap.entries()) {
    const step_score = calculateStepScore(scores)
    stepResults.push({ step, step_score })
  }

  type AttemptRowForSignals = {
    question_id: string
    step: string
    score: number | null
    competencies_demonstrated?: string[] | null
    quality_label?: string | null
    grading_explanation?: string | null
    competency_signal?: CompetencySignalInput['competency_signal']
  }

  const competencySignalRows: CompetencySignalInput[] = attemptRows.map((row: AttemptRowForSignals) => {
    const questionMeta = questionMetaMap.get(row.question_id)
    return {
      step: row.step,
      score: row.score ?? 0,
      weight: questionMeta?.weight ?? 1,
      target_competencies: questionMeta?.targetCompetencies ?? [],
      competencies_demonstrated: row.competencies_demonstrated ?? [],
      grading_explanation: row.grading_explanation ?? null,
      quality_label: row.quality_label ?? null,
      competency_signal: row.competency_signal ?? null,
    }
  })

  const competencyRollup = computeChallengeCompetencyRollup(competencySignalRows)

  // Fetch role lens for this attempt
  const { data: roleLens, error: roleLensError } = await admin
    .from('role_lenses')
    .select('*')
    .eq('role_id', attempt.role_id)
    .single()

  if (roleLensError || !roleLens) {
    return NextResponse.json({ error: 'Role lens not found' }, { status: 500 })
  }

  // Aggregate challenge score
  const { total_score, max_score, grade_label } = aggregateChallenge(stepResults, roleLens as RoleLens)

  // Fetch current competencies for this user
  const { data: existingCompetencies } = await admin
    .from('learner_competencies')
    .select('*')
    .eq('user_id', userId)

  const currentCompetencies: LearnerCompetency[] = existingCompetencies ?? []

  // Build stepResults for competency update, using target competencies first so
  // weak answers still move the right mental-model dimension.
  const stepResultsForUpdate = competencySignalRows.map((row) => {
    // Get the step weight from roleLens
    const step = row.step as FlowStep
    const stepWeightKey = `${step}_weight` as keyof Pick<RoleLens, 'frame_weight' | 'list_weight' | 'optimize_weight' | 'win_weight'>
    return {
      score: row.score ?? 0,
      competencies_demonstrated: competenciesForSignalInput(row),
      step_weight: roleLens[stepWeightKey] ?? 1.0,
    }
  })

  // Update competencies via ELO-inspired update
  const { updated: updatedCompetencies, deltas: competency_deltas } = updateCompetencies(
    currentCompetencies,
    stepResultsForUpdate,
    roleLens as RoleLens,
    FLOW_MAX_SCORE,
  )

  // Trend-annotated competency rows to upsert, and per-move XP, are COMPUTED here
  // but WRITTEN only after the completion is atomically claimed below, so a
  // concurrent double-complete cannot apply competency/move-level gains twice.
  const competencyRowsToUpsert = updatedCompetencies.map((c) => {
    const scores = competencySignalRows
      .filter((row) => competenciesForSignalInput(row).includes(c.competency))
      .map((row) => row.score ?? 0)
    const { trend, slope } = analyzeTrend(scores)
    return { ...c, user_id: userId, trend, trend_slope: slope }
  })

  const moveScores: Record<string, number> = {}
  for (const s of stepResults) {
    moveScores[s.step] = Math.round(s.step_score * MOVE_XP_MULTIPLIER)
  }

  // Fetch challenge difficulty for XP calculation. The XP award itself is deferred
  // until after we atomically claim the completion below, so two concurrent
  // completes (which both pass the early status check) cannot double-award.
  const { data: challenge } = await admin
    .from('challenges')
    .select('difficulty')
    .eq('id', challengeId)
    .single()

  const step_breakdown = stepResults.map((s) => ({
    step: s.step,
    score: s.step_score,
    max_score: 1.0,
  }))

  // Update user_study_plans progress if coming from a plan
  if (from_plan) {
    const { data: plan } = await admin
      .from('study_plans')
      .select('id')
      .eq('slug', from_plan)
      .single()

    if (plan) {
      const { data: userPlan } = await admin
        .from('user_study_plans')
        .select('id, completed_challenges, plan_id')
        .eq('user_id', userId)
        .eq('plan_id', plan.id)
        .maybeSingle()

      const completedSet = new Set<string>(userPlan?.completed_challenges ?? [])
      completedSet.add(challengeId)
      const completed = Array.from(completedSet)

      // Compute progress_pct from total challenges in the plan's chapters
      const { data: chapters } = await admin
        .from('study_plan_chapters')
        .select('challenge_ids')
        .eq('plan_id', plan.id)
      const totalIds = (chapters ?? []).flatMap((ch: { challenge_ids: string[] }) => ch.challenge_ids ?? [])
      const progress_pct = totalIds.length > 0 ? Math.round((completed.length / totalIds.length) * 100) : 0

      if (userPlan) {
        await admin
          .from('user_study_plans')
          .update({ completed_challenges: completed, progress_pct })
          .eq('id', userPlan.id)
      } else {
        // No user_study_plans row yet (user enrolled but never explicitly activated)
        await admin
          .from('user_study_plans')
          .upsert({
            user_id: userId,
            plan_id: plan.id,
            started_at: new Date().toISOString(),
            is_active: true,
            completed_challenges: completed,
            progress_pct,
          }, { onConflict: 'user_id,plan_id' })
      }
    }
  }

  // Insert hatch_context row
  const challengeTitle = challengeId.replace(/-/g, ' ').replace(/^c\d+ /, '')

  // Transform deltas object to array format with before/after values
  const deltaEntries = Object.entries(competency_deltas).map(([competency, deltaValue]) => {
    const before = currentCompetencies.find(c => c.competency === competency)?.score ?? 50
    const after = updatedCompetencies.find(c => c.competency === competency)?.score ?? before
    return { competency, before, after, delta: deltaValue }
  })

  // Build step_signals from DB step_attempts (grading_explanation is the real coaching text)
  const STEPS_ORDERED: FlowStep[] = ['frame', 'list', 'optimize', 'win']
  type StepAttemptRow = { step: string; quality_label?: string; grading_explanation?: string; competency_signal?: { framework_hint?: string }; selected_option_id?: string | null }

  // Resolve option UUIDs → letter labels (A/B/C/D) in one batch
  const selectedOptionIds = attemptRows
    .map((r: StepAttemptRow) => r.selected_option_id)
    .filter((id): id is string => !!id)
  const optionLabelMap = new Map<string, string>()
  if (selectedOptionIds.length > 0) {
    const { data: optionRows } = await admin
      .from('flow_options')
      .select('id, option_label')
      .in('id', selectedOptionIds)
    for (const o of (optionRows ?? [])) {
      optionLabelMap.set(o.id, o.option_label)
    }
  }

  const stepSignalsFromDB = STEPS_ORDERED
    .filter(step => attemptRows.some((r: StepAttemptRow) => r.step === step))
    .map(step => {
      // Use the last attempt row for each step (multiple questions → use last one for step-level signal)
      const rows = attemptRows.filter((r: StepAttemptRow) => r.step === step)
      const lastRow = rows[rows.length - 1] as StepAttemptRow | undefined
      const rawOptionId = lastRow?.selected_option_id ?? null
      const optionLabel = rawOptionId ? (optionLabelMap.get(rawOptionId) ?? null) : null
      return {
        step,
        quality_label: lastRow?.quality_label ?? 'plausible_wrong',
        hatch_signal: lastRow?.grading_explanation ?? null,
        framework_hint: lastRow?.competency_signal?.framework_hint ?? null,
        selected_option_id: optionLabel,
      }
    })

  // Atomically claim this completion: the conditional flip (status != 'completed')
  // is the single gate that decides whether THIS request owns the award. Two
  // concurrent completes both pass the early status check (line 98) but only one
  // flips a row here; the loser awards nothing. An orphan (already completed) flips
  // zero rows, so XP/streak are not re-awarded. Streak runs before XP so the
  // multiplier reflects today's rep, then XP is incremented atomically (no
  // read-then-write race on xp_total). The grade/feedback columns are written
  // unconditionally below so an orphan still gets its result recovered.
  const { data: claimedRows } = await admin
    .from('challenge_attempts')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', attempt_id)
    .neq('status', 'completed')
    .select('id')
  const isFirstCompletion = (claimedRows?.length ?? 0) > 0

  let xp_earned = 0
  if (isFirstCompletion) {
    // Competency + move-level gains apply exactly once, on the winning completion.
    if (competencyRowsToUpsert.length > 0) {
      await admin.from('learner_competencies').upsert(competencyRowsToUpsert, { onConflict: 'user_id,competency' })
    }
    await applyMoveLevelXp(userId, moveScores, 'challenge')

    const { error: streakError } = await admin.rpc('update_user_streak', { p_user_id: userId })
    if (streakError) console.error('[streak] update_user_streak failed:', streakError.message)
    const { data: xpProfile } = await admin
      .from('profiles')
      .select('streak_days')
      .eq('id', userId)
      .single()
    xp_earned = calculateChallengeXp(total_score, max_score, challenge?.difficulty, xpProfile?.streak_days ?? 0)
    const { error: xpError } = await admin.rpc('increment_user_xp', { p_user_id: userId, p_amount: xp_earned })
    // On an XP-RPC failure, do not report a positive award we did not persist.
    if (xpError) { console.error('[xp] increment_user_xp failed:', xpError.message); xp_earned = 0 }

    // Achievements are a per-completion award (and themselves increment XP), so
    // they belong inside the winner-only gate. Fire-and-forget; the helper is now
    // idempotent (upsert ignore-duplicates + atomic XP), so even a stray double
    // call cannot double-grant.
    checkAndGrantAchievements(userId, admin).catch(err =>
      console.error('[challenge-complete] achievement check failed:', err)
    )
  }

  // Write the grade + feedback columns. The grade/breakdown fields are deterministic
  // for this attempt (derived from its step_attempts), so writing them unconditionally
  // is idempotent and recovers an orphan (completed but ungraded) attempt. xp_awarded
  // is the one divergent field — only the winner sets it, so a losing/orphan write can
  // never overwrite the real award with 0.
  const feedbackJson: Record<string, unknown> = {
    step_breakdown,
    step_signals: stepSignalsFromDB,
    competency_deltas: deltaEntries,
    mental_models_breakdown: competencyRollup.mentalModelsBreakdown,
    primary_competency: competencyRollup.primaryCompetency,
    weakest_competency: competencyRollup.weakestCompetency,
    competency_scores: competencyRollup.competencyScores,
    grade_label,
    total_score,
    max_score,
  }
  if (isFirstCompletion) feedbackJson.xp_awarded = xp_earned
  // The status flip + XP already happened atomically in the claim above, so this
  // grade/feedback write failing does NOT strand the row 'in_progress'. Still capture
  // the error and log it (non-fatal) so a silent metadata-write failure is visible.
  const { error: gradeWriteError } = await admin
    .from('challenge_attempts')
    .update({
      total_score,
      max_score,
      grade_label,
      mental_models_breakdown: competencyRollup.mentalModelsBreakdown,
      primary_competency: competencyRollup.primaryCompetency,
      weakest_competency: competencyRollup.weakestCompetency,
      ...(isFirstCompletion
        ? { feedback_json: feedbackJson }
        // Non-winner recovery: only set feedback_json if it is currently absent, so
        // we never clobber the winner's row (which carries the real xp_awarded).
        : {}),
    })
    .eq('id', attempt_id)

  if (gradeWriteError) {
    console.error('[challenge complete] graded + status flipped but failed to write grade/feedback columns', {
      attemptId: attempt_id,
      challengeId,
      error: gradeWriteError.message,
    })
  }

  // Non-winner orphan recovery: backfill feedback_json ONLY if it is still null,
  // with the IS NULL guard in the SQL predicate (not a JS read-then-write) so a
  // winner's feedback_json landing in the window cannot be clobbered. The backfill
  // omits xp_awarded since this request awarded nothing.
  if (!isFirstCompletion) {
    await admin
      .from('challenge_attempts')
      .update({ feedback_json: feedbackJson })
      .eq('id', attempt_id)
      .is('feedback_json', null)
  }

  // Community recording is a per-completion side-effect: gate it to the winner so a
  // concurrent double-complete cannot create two submission candidates / completions.
  if (isFirstCompletion) try {
    await createCommunitySubmissionCandidate({ userId, attemptId: attempt_id, challengeId })
    await recordCommunityCompletion({ userId, attemptId: attempt_id, challengeId, gradeLabel: grade_label })
  } catch (communityError) {
    console.warn('[community] failed to create completion candidate', communityError)
  }

  // Per-completion side-effects (a coaching-context row + the analytics event)
  // belong to the winner only, so a concurrent double-complete or an orphan retry
  // cannot insert a duplicate hatch_context row or emit a second
  // EVENT_CHALLENGE_COMPLETED (which on a loser would carry xp_awarded: 0).
  if (isFirstCompletion) {
    const topDelta = deltaEntries.length > 0
      ? [...deltaEntries].sort((a, b) => (b.after - b.before) - (a.after - a.before))[0]
      : null

    const contentStr = topDelta && topDelta.after > topDelta.before
      ? `Completed "${challengeTitle}": ${grade_label} (${total_score.toFixed(2)}/${max_score.toFixed(2)}). Top competency shown: ${competencyRollup.primaryCompetency}. Watch: ${competencyRollup.weakestCompetency}.`
      : `Completed "${challengeTitle}": ${grade_label} (${total_score.toFixed(2)}/${max_score.toFixed(2)}).`

    await admin.from('hatch_context').insert({
      user_id: userId,
      context_type: 'challenge_insight',
      content: contentStr,
      is_active: true,
      created_at: new Date().toISOString(),
    })

    await captureServerImmediate({
      distinctId: userId,
      event: EVENT_CHALLENGE_COMPLETED,
      properties: {
        challenge_id: challengeId,
        grade_label,
        total_score,
        max_score,
        xp_awarded: xp_earned,
        from_plan: from_plan ?? null,
      },
    })
  }

  return NextResponse.json({
    total_score,
    max_score,
    grade_label,
    xp_awarded: xp_earned,
    competency_deltas: deltaEntries,
    step_breakdown,
    step_signals: stepSignalsFromDB,
    mental_models_breakdown: competencyRollup.mentalModelsBreakdown,
    primary_competency: competencyRollup.primaryCompetency,
    weakest_competency: competencyRollup.weakestCompetency,
  })
}, { name: 'challenges.complete' })
