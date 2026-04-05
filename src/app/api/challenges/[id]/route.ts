import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/mock'
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

  const isMock = IS_MOCK

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  // ── Mock mode short-circuit ───────────────────────────────────
  if (isMock) {
    const mockChallenge: Challenge = {
      id,
      slug: id.replace(/^c\d+-/, ''),
      title: 'Improve Spotify\'s Podcast Discovery',
      scenario_role: 'Product Manager, Podcasts',
      scenario_context: 'Spotify has 5M+ podcast titles but only 8% of users who open the Podcasts tab ever save or follow a podcast. The team suspects a discovery problem but hasn\'t yet investigated root causes.',
      scenario_trigger: 'The VP of Content asks you to diagnose the low follow rate and propose a fix before next quarter\'s planning cycle.',
      scenario_question: 'How would you approach this problem?',
      engineer_standout: 'Frame the problem before proposing features — define what "discovery failure" means with data before jumping to solutions.',
      paradigm: 'traditional',
      industry: 'consumer-tech',
      sub_vertical: 'audio',
      difficulty: 'standard',
      estimated_minutes: 15,
      primary_competencies: ['diagnostic_accuracy', 'framing_precision'],
      secondary_competencies: ['metric_fluency'],
      frameworks: ['MECE', 'North Star Metric'],
      relevant_roles: ['swe', 'pm', 'data_scientist'],
      company_tags: ['spotify'],
      tags: ['discovery', 'engagement', 'metrics'],
      is_published: true,
      is_calibration: false,
      is_premium: false,
      created_at: '2024-01-01T00:00:00Z',
    }
    const mockSteps: StepSummary[] = [
      { step: 'frame',    step_order: 0, question_count: 2 },
      { step: 'list',     step_order: 1, question_count: 2 },
      { step: 'optimize', step_order: 2, question_count: 2 },
      { step: 'win',      step_order: 3, question_count: 1 },
    ]
    return NextResponse.json({ challenge: mockChallenge, steps: mockSteps, current_attempt: null })
  }

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
    .from('challenge_attempts')
    .select('*')
    .eq('user_id', userId)
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
