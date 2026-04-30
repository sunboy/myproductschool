import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/mock'
import type { Challenge, CodingPart, FlowStepRecord, ChallengeAttemptV2 } from '@/lib/types'

interface StepSummary {
  step: FlowStepRecord['step']
  step_order: number
  question_count: number
}

interface ChallengeDetailResponse {
  challenge: Challenge
  steps: StepSummary[]
  current_attempt: ChallengeAttemptV2 | null
  /** Populated for challenge_type='sql'|'algorithm' when a flow_steps row with step='coding' exists. Empty array otherwise. */
  codingParts: CodingPart[]
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
      is_featured: false,
      created_at: '2024-01-01T00:00:00Z',
      challenge_type: 'flow' as const,
      prompt_text: null,
      domain_id: null,
      move_tags: [],
      decision_id: null,
    }
    const mockSteps: StepSummary[] = [
      { step: 'frame',    step_order: 0, question_count: 2 },
      { step: 'list',     step_order: 1, question_count: 2 },
      { step: 'optimize', step_order: 2, question_count: 2 },
      { step: 'win',      step_order: 3, question_count: 1 },
    ]
    return NextResponse.json({ challenge: mockChallenge, steps: mockSteps, current_attempt: null, codingParts: [] })
  }

  // Fetch challenge — try by id first, then by slug as fallback
  let { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!challenge) {
    const { data: bySlug, error: slugError } = await supabase
      .from('challenges')
      .select('*')
      .eq('slug', id)
      .maybeSingle()
    challenge = bySlug
    challengeError = slugError
  }

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // Use the resolved challenge ID (not the raw param which may be a slug)
  const resolvedId = challenge.id

  // Fetch flow steps ordered by step_order
  const { data: flowSteps, error: stepsError } = await supabase
    .from('flow_steps')
    .select('id, step, step_order, step_nudge, grading_weight, challenge_id')
    .eq('challenge_id', resolvedId)
    .order('step_order', { ascending: true })

  if (stepsError) {
    return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
  }

  // Fetch question counts per step
  const stepIds = (flowSteps ?? []).map((s: FlowStepRecord) => s.id)
  const questionCountMap = new Map<string, number>()

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
    .eq('challenge_id', resolvedId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Coding parts (multi-part coding challenges) ───────────────────────────
  // For coding challenges: find the single flow_steps row with step='coding',
  // then load its step_questions ordered by sequence. For any pure_mcq question
  // also load its flow_options. If no flow_steps row exists → codingParts = []
  // (single-prompt path remains fully backwards compatible).
  let codingParts: CodingPart[] = []

  if ((challenge as Challenge).challenge_type === 'sql' || (challenge as Challenge).challenge_type === 'algorithm') {
    const { data: codingStep } = await supabase
      .from('flow_steps')
      .select('id')
      .eq('challenge_id', resolvedId)
      .eq('step', 'coding')
      .maybeSingle()

    if (codingStep) {
      const { data: questions } = await supabase
        .from('step_questions')
        .select(
          'id, sequence, question_text, response_type, grading_weight_within_step, coding_test_case_ids, coding_starter_code, coding_subtask_prompt'
        )
        .eq('flow_step_id', codingStep.id)
        .order('sequence', { ascending: true })

      if (questions && questions.length > 0) {
        // Fetch flow_options for all pure_mcq questions in a single query
        const mcqQuestionIds = questions
          .filter((q) => q.response_type === 'pure_mcq')
          .map((q) => q.id as string)

        const optionsByQuestion: Record<string, NonNullable<CodingPart['options']>> = {}

        if (mcqQuestionIds.length > 0) {
          const { data: allOptions } = await supabase
            .from('flow_options')
            .select('id, question_id, option_label, option_text, quality, points, explanation')
            .in('question_id', mcqQuestionIds)
            .order('option_label', { ascending: true })

          for (const opt of allOptions ?? []) {
            const qid = opt.question_id as string
            if (!optionsByQuestion[qid]) optionsByQuestion[qid] = []
            optionsByQuestion[qid].push({
              id: opt.id as string,
              option_label: opt.option_label as string,
              option_text: opt.option_text as string,
              quality: opt.quality as string,
              points: opt.points as number,
              explanation: opt.explanation as string,
            })
          }
        }

        codingParts = questions.map((q): CodingPart => {
          const responseType = q.response_type as 'coding_subtask' | 'pure_mcq'
          const partId = q.id as string
          const part: CodingPart = {
            id: partId,
            sequence: q.sequence as number,
            title: q.question_text as string,
            response_type: responseType,
            grading_weight_within_step: q.grading_weight_within_step as number,
            coding_test_case_ids: Array.isArray(q.coding_test_case_ids)
              ? (q.coding_test_case_ids as string[])
              : [],
            coding_starter_code:
              q.coding_starter_code != null
                ? (q.coding_starter_code as Record<string, string>)
                : null,
            coding_subtask_prompt: (q.coding_subtask_prompt as string | null) ?? null,
          }
          if (responseType === 'pure_mcq' && optionsByQuestion[partId]) {
            part.options = optionsByQuestion[partId]
          }
          return part
        })
      }
    }
  }

  const response: ChallengeDetailResponse = {
    challenge: challenge as Challenge,
    steps,
    current_attempt: (currentAttempt as ChallengeAttemptV2) ?? null,
    codingParts,
  }

  return NextResponse.json(response)
}
