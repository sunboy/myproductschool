import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateStepScore } from '@/lib/v2/skills/step-score-calculator'
import { aggregateChallenge } from '@/lib/v2/skills/score-aggregator'
import { updateCompetencies } from '@/lib/v2/skills/competency-updater'
import { analyzeTrend } from '@/lib/v2/skills/trend-analyzer'
import type { FlowStep, LearnerCompetency, RoleLens } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: challengeId } = await params
  const body = await req.json()
  const { attempt_id } = body as { attempt_id: string }

  if (!attempt_id) {
    return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch the attempt to verify ownership and get role_id
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts_v2')
    .select('id, role_id, user_id, status')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
  }

  // Fetch all step_attempts for this attempt, joined with question weights
  const { data: stepAttempts, error: stepAttemptsError } = await admin
    .from('step_attempts')
    .select('question_id, step, score, competencies_demonstrated')
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

  const questionWeightMap = new Map<string, number>(
    (questions ?? []).map((q: { id: string; grading_weight_within_step: number }) => [q.id, q.grading_weight_within_step])
  )

  // Group by step and compute per-step scores
  const stepMap = new Map<FlowStep, Array<{ score: number; weight: number }>>()
  for (const row of attemptRows) {
    const step = row.step as FlowStep
    const existing = stepMap.get(step) ?? []
    existing.push({
      score: row.score ?? 0,
      weight: questionWeightMap.get(row.question_id) ?? 1,
    })
    stepMap.set(step, existing)
  }

  const stepResults: Array<{ step: FlowStep; step_score: number }> = []
  for (const [step, scores] of stepMap.entries()) {
    const step_score = calculateStepScore(scores)
    stepResults.push({ step, step_score })
  }

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
    .eq('user_id', user.id)

  const currentCompetencies: LearnerCompetency[] = existingCompetencies ?? []

  // Build stepResults for competency update (include competencies_demonstrated and step_weight)
  const stepResultsForUpdate = attemptRows.map((row: {
    question_id: string
    step: string
    score: number | null
    competencies_demonstrated: string[]
  }) => {
    // Get the step weight from roleLens
    const step = row.step as FlowStep
    const stepWeightKey = `${step}_weight` as keyof Pick<RoleLens, 'frame_weight' | 'list_weight' | 'optimize_weight' | 'win_weight'>
    return {
      score: row.score ?? 0,
      competencies_demonstrated: row.competencies_demonstrated ?? [],
      step_weight: roleLens[stepWeightKey] ?? 1.0,
    }
  })

  // Update competencies via ELO-inspired update
  const { updated: updatedCompetencies, deltas: competency_deltas } = updateCompetencies(
    currentCompetencies,
    stepResultsForUpdate,
    roleLens as RoleLens,
  )

  // Upsert updated competencies to learner_competencies table, with trend data
  if (updatedCompetencies.length > 0) {
    await admin.from('learner_competencies').upsert(
      updatedCompetencies.map((c) => {
        const scores = attemptRows
          .filter((r: { competencies_demonstrated: string[] }) =>
            r.competencies_demonstrated?.includes(c.competency)
          )
          .map((r: { score: number | null }) => r.score ?? 0)
        const { trend, slope } = analyzeTrend(scores)
        return { ...c, user_id: user.id, trend, trend_slope: slope }
      }),
      { onConflict: 'user_id,competency' }
    )
  }

  // Award XP: total_score * 100 rounded to int
  const xp_earned = Math.round(total_score * 100)

  // Update profiles.xp_total
  const { data: currentProfile } = await admin
    .from('profiles')
    .select('xp_total')
    .eq('id', user.id)
    .single()

  if (currentProfile) {
    await admin
      .from('profiles')
      .update({ xp_total: (currentProfile.xp_total ?? 0) + xp_earned })
      .eq('id', user.id)
  }

  // Fire-and-forget streak RPC — do NOT await
  admin.rpc('update_user_streak', { p_user_id: user.id }).then(() => {}, () => {})

  // Update challenge_attempts_v2
  await admin
    .from('challenge_attempts_v2')
    .update({
      status: 'completed',
      total_score,
      max_score,
      grade_label,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attempt_id)

  // Insert luma_context_v2 row
  await admin.from('luma_context_v2').insert({
    user_id: user.id,
    context_type: 'challenge_insight',
    content: `Completed ${challengeId} with score ${total_score.toFixed(2)}/${max_score.toFixed(2)} (${grade_label})`,
    is_active: true,
    created_at: new Date().toISOString(),
  })

  const step_breakdown = stepResults.map((s) => ({
    step: s.step,
    score: s.step_score,
    max_score: 1.0,
  }))

  return NextResponse.json({ total_score, max_score, grade_label, xp_awarded: xp_earned, xp_earned, competency_deltas, step_breakdown })
}
