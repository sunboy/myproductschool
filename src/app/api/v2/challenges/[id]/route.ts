import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Challenge, FlowStepRecord, ChallengeAttemptV2 } from '@/lib/types'

interface StepSummary {
  step: FlowStepRecord['step']
  step_order: number
  question_count: number
}

interface ChallengeDetailResponse {
  challenge: Challenge
  steps: StepSummary[]
  current_attempt: ChallengeAttemptV2 | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Fetch flow steps ordered by step_order
  const { data: flowSteps, error: stepsError } = await supabase
    .from('flow_steps')
    .select('id, step, step_order, step_nudge, grading_weight, challenge_id')
    .eq('challenge_id', id)
    .order('step_order', { ascending: true })

  if (stepsError) {
    return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
  }

  // Fetch question counts per step
  const stepIds = (flowSteps ?? []).map((s: FlowStepRecord) => s.id)
  let questionCountMap = new Map<string, number>()

  if (stepIds.length > 0) {
    const { data: questionCounts } = await supabase
      .from('step_questions')
      .select('flow_step_id')
      .in('flow_step_id', stepIds)

    for (const row of (questionCounts ?? []) as Array<{ flow_step_id: string }>) {
      const prev = questionCountMap.get(row.flow_step_id) ?? 0
      questionCountMap.set(row.flow_step_id, prev + 1)
    }
  }

  const steps: StepSummary[] = (flowSteps ?? []).map((s: FlowStepRecord) => ({
    step: s.step,
    step_order: s.step_order,
    question_count: questionCountMap.get(s.id) ?? 0,
  }))

  // Fetch in-progress attempt for this user
  const { data: currentAttempt } = await supabase
    .from('challenge_attempts_v2')
    .select('*')
    .eq('user_id', user.id)
    .eq('challenge_id', id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const response: ChallengeDetailResponse = {
    challenge: challenge as Challenge,
    steps,
    current_attempt: (currentAttempt as ChallengeAttemptV2) ?? null,
  }

  return NextResponse.json(response)
}
