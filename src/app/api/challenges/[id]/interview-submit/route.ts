import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeInterviewSession } from '@/lib/v2/skills/interview-grading'
import type { ChallengeType } from '@/lib/types'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'

const RequestSchema = z.object({
  attemptId: z.string().uuid(),
  canvasFinalSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  contextPack: z.string().max(50000).nullable().optional(),
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { attemptId, canvasFinalSnapshot, contextPack } = body

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

  // Fetch challenge type
  const { data: challenge } = await supabase
    .from('challenges')
    .select('challenge_type')
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

  // Grading succeeded - NOW mark the attempt completed.
  await supabase
    .from('challenge_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
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

  return NextResponse.json({ grade })
}
