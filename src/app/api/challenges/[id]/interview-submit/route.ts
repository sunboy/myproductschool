import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gradeInterviewSession } from '@/lib/v2/skills/interview-grading'
import type { ChallengeType } from '@/lib/types'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { withRoute } from '@/lib/api/withRoute'
import { calculateChallengeXp } from '@/lib/scoring/xp-calculator'
import { captureServerImmediate } from '@/lib/posthog/server'

const RequestSchema = z.object({
  attemptId: z.string().uuid(),
  canvasFinalSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  contextPack: z.string().max(50000).nullable().optional(),
  canvasPngUrl: z.string().url().nullable().optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

// Mirrors getGradeLabel() in coding-submit/route.ts (overall_score is 1-5).
function gradeLabelForScore(score: number): string {
  if (score >= 4.5) return 'best'
  if (score >= 3) return 'good'
  return 'surface'
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
  const { attemptId, canvasFinalSnapshot, contextPack, canvasPngUrl } = body

  // Verify ownership
  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('user_id, challenge_id, status')
    .eq('id', attemptId)
    .single()

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If the attempt was already marked completed but has NO grade row (orphan
  // from a prior failed grading), allow re-grading - don't lock the user out.
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
    // else fall through - re-grade this orphan attempt
  }

  // Fetch challenge type + difficulty (difficulty feeds the XP formula)
  const { data: challenge } = await supabase
    .from('challenges')
    .select('challenge_type, difficulty')
    .eq('id', id)
    .single()

  const challengeType = challenge?.challenge_type as ChallengeType
  if (!['system_design', 'data_modeling'].includes(challengeType)) {
    return NextResponse.json({ error: 'Not an interview challenge' }, { status: 400 })
  }

  // Store the final snapshot first so the grader has data to read, but DO NOT
  // flip status to 'completed' yet - if grading fails we want the user to be
  // able to retry without hitting the "Already submitted" 409.
  const snapshotWithContext = canvasFinalSnapshot || contextPack
    ? {
        ...(canvasFinalSnapshot ?? {}),
        ...(contextPack ? { context_pack: contextPack } : {}),
      }
    : null

  await supabase
    .from('challenge_attempts')
    .update({
      canvas_final_snapshot: snapshotWithContext,
      canvas_png_url: canvasPngUrl ?? null,
    })
    .eq('id', attemptId)

  // Grade
  const userPlan = await getUserPlanForBudget(user.id)
  let grade
  try {
    await assertPlanLimit(user.id, userPlan, 'ai_grading_runs')
    grade = await gradeInterviewSession(attemptId, challengeType, {
      userId: user.id,
      userPlan,
      route: 'interview_challenge_grade',
    })
  } catch (err) {
    const response = aiLimitResponse(err)
    if (response) return response
    console.error('Interview grading failed:', err)
    return NextResponse.json({ error: 'Grading failed', details: String(err) }, { status: 500 })
  }

  // Record daily streak first (RPC is service_role-only, so use the admin client)
  // so the XP streak multiplier reflects today's rep.
  const admin = createAdminClient()
  const { error: streakError } = await admin.rpc('update_user_streak', { p_user_id: user.id })
  if (streakError) console.error('[streak] update_user_streak failed:', streakError.message)

  // Award XP, same canonical formula as FLOW (total XP only — canvas challenges
  // have no FLOW move levels). Reaching here means a grade is being newly recorded
  // (a true re-submit 409s above on the existing interview_grades row), so XP is
  // granted exactly once per completion. Non-FLOW types do NOT touch move_levels.
  const { data: xpProfile } = await admin
    .from('profiles')
    .select('xp_total, streak_days')
    .eq('id', user.id)
    .single()
  const xp_awarded = calculateChallengeXp(grade.overall_score, 5, challenge?.difficulty, xpProfile?.streak_days ?? 0)
  if (xpProfile) {
    await admin
      .from('profiles')
      .update({ xp_total: (xpProfile.xp_total ?? 0) + xp_awarded })
      .eq('id', user.id)
  }

  // Grading succeeded - NOW mark the attempt completed. Persist score + label +
  // xp_awarded onto the attempt row (mirroring coding-submit) so the Submissions/
  // history tab and /api/attempts show a real score and reward, not a stale default.
  await supabase
    .from('challenge_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_score: grade.overall_score,
      max_score: 5,
      grade_label: gradeLabelForScore(grade.overall_score),
      feedback_json: { xp_awarded, total_score: grade.overall_score, max_score: 5 },
    })
    .eq('id', attemptId)

  // Persist grade
  await supabase.from('interview_grades').insert({
    attempt_id: attemptId,
    challenge_type: challengeType,
    overall_score: grade.overall_score,
    headline: grade.headline,
    rubric_scores: grade.dimensions,
    top_strength: grade.top_strength,
    top_improvement: grade.top_improvement,
    canvas_annotations: grade.canvas_annotations,
  })

  await captureServerImmediate({
    distinctId: user.id,
    event: 'interview_submitted',
    properties: {
      challenge_id: id,
      challenge_type: challengeType,
      overall_score: grade.overall_score,
    },
  })

  return NextResponse.json({ grade, xp_awarded })
}, { name: 'challenges.interview-submit' })
