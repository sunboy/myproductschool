import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { USE_MOCK_DATA } from '@/lib/mock'
import type { FlowStep } from '@/lib/types'
import { resolveNudge } from '@/lib/v2/skills/nudge-resolver'

// mulberry32 PRNG — deterministic seed-based random number generator
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let z = seed
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic shuffle: same user+challenge+step always produces same option order
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  const rand = mulberry32(Math.abs(seed))
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Simple hash of a string to a 32-bit integer
function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0 // unsigned 32-bit
}

const VALID_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; step: string }> }
) {
  const isMock = USE_MOCK_DATA

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  const { id: challenge_id, step: stepParam } = await params

  if (!VALID_STEPS.includes(stepParam as FlowStep)) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  }
  const step = stepParam as FlowStep

  const { searchParams } = new URL(req.url)
  const attempt_id = searchParams.get('attempt_id')
  if (!attempt_id) {
    return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
  }

  // ── Mock mode short-circuit ───────────────────────────────────
  if (isMock) {
    const MOCK_STEPS: Record<string, { nudge: string; questions: Array<{ id: string; question_text: string; question_nudge: string | null; response_type: string; sequence: number; grading_weight_within_step: number; options: Array<{ id: string; option_label: string; option_text: string }>; already_answered: boolean }> }> = {
      frame: {
        nudge: 'Define the problem before proposing solutions. What does "8% follow rate" actually mean — is that low?',
        questions: [
          {
            id: 'mock-q-frame-1', question_text: 'What is the core problem you\'re being asked to solve?', question_nudge: 'Separate the symptom (low follow rate) from the actual problem.', response_type: 'pure_mcq', sequence: 1, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-frame-1-A', option_label: 'A', option_text: 'Users don\'t know podcasts exist on Spotify' },
              { id: 'mock-q-frame-1-B', option_label: 'B', option_text: 'Users discover podcasts but don\'t find them worth following' },
              { id: 'mock-q-frame-1-C', option_label: 'C', option_text: 'The follow rate benchmark of 8% might already be industry-standard — first check if this is actually low' },
              { id: 'mock-q-frame-1-D', option_label: 'D', option_text: 'The Podcasts tab UI makes it hard to follow content' },
            ],
          },
          {
            id: 'mock-q-frame-2', question_text: 'A stakeholder says "users just don\'t like podcasts." How do you respond?', question_nudge: 'How do you handle a narrative being presented as a finding?', response_type: 'pure_mcq', sequence: 2, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-frame-2-A', option_label: 'A', option_text: '"That\'s a hypothesis — what data supports it? Spotify\'s own podcast listening hours have grown YoY."' },
              { id: 'mock-q-frame-2-B', option_label: 'B', option_text: 'Agree to run a user survey to test the hypothesis' },
              { id: 'mock-q-frame-2-C', option_label: 'C', option_text: 'Check if competitors like Apple Podcasts or Pocket Casts have higher follow rates' },
              { id: 'mock-q-frame-2-D', option_label: 'D', option_text: 'Accept the framing and pivot to improving music discovery instead' },
            ],
          },
        ],
      },
      list: {
        nudge: 'Break the user population into non-overlapping segments before diagnosing. Who are the different types of users hitting this funnel?',
        questions: [
          {
            id: 'mock-q-list-1', question_text: 'Which user segments would you investigate first to understand the low follow rate?', question_nudge: 'Think about behaviour, not just demographics.', response_type: 'pure_mcq', sequence: 1, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-list-1-A', option_label: 'A', option_text: 'Users who opened the Podcasts tab vs. those who never have — understand who is even in the funnel' },
              { id: 'mock-q-list-1-B', option_label: 'B', option_text: 'New users vs. returning users — acquisition might be driving the low rate' },
              { id: 'mock-q-list-1-C', option_label: 'C', option_text: 'Users by country — podcast culture varies significantly by market' },
              { id: 'mock-q-list-1-D', option_label: 'D', option_text: 'Users who played a podcast episode vs. those who only browsed without playing' },
            ],
          },
          {
            id: 'mock-q-list-2', question_text: 'What is the first metric you pull to diagnose where users drop off in the podcast discovery funnel?', question_nudge: 'Pick the signal that tells you WHERE the problem is, not just that it exists.', response_type: 'pure_mcq', sequence: 2, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-list-2-A', option_label: 'A', option_text: 'Step-by-step funnel: Tab open → Episode played → Follow action seen → Follow clicked' },
              { id: 'mock-q-list-2-B', option_label: 'B', option_text: 'Average session length on the Podcasts tab' },
              { id: 'mock-q-list-2-C', option_label: 'C', option_text: 'NPS from users who opened the Podcasts tab in the last 30 days' },
              { id: 'mock-q-list-2-D', option_label: 'D', option_text: 'Monthly active podcast listeners as a % of total MAU' },
            ],
          },
        ],
      },
      optimize: {
        nudge: 'You\'ve identified the problem. Now sharpen from many options to the best bet given real constraints.',
        questions: [
          {
            id: 'mock-q-optimize-1', question_text: 'Data shows 60% of users who play a podcast episode never see the follow button. What do you do?', question_nudge: 'Scope your solution to the specific problem you\'ve diagnosed.', response_type: 'pure_mcq', sequence: 1, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-optimize-1-A', option_label: 'A', option_text: 'Ship a persistent follow CTA on the episode player — one change, high-impact placement' },
              { id: 'mock-q-optimize-1-B', option_label: 'B', option_text: 'Redesign the entire Podcasts tab to prioritise following' },
              { id: 'mock-q-optimize-1-C', option_label: 'C', option_text: 'Add a post-episode prompt: "Enjoyed this? Follow for more episodes"' },
              { id: 'mock-q-optimize-1-D', option_label: 'D', option_text: 'Launch a "Top Podcasts for You" personalised shelf on the home tab' },
            ],
          },
          {
            id: 'mock-q-optimize-2', question_text: 'You have engineering bandwidth for one change. Which bet do you prioritise?', question_nudge: 'Think about evidence, impact, and reversibility.', response_type: 'pure_mcq', sequence: 2, grading_weight_within_step: 0.5, already_answered: false,
            options: [
              { id: 'mock-q-optimize-2-A', option_label: 'A', option_text: 'Persistent follow CTA in the player — directly addresses the diagnosed gap, fast to ship, easy to measure' },
              { id: 'mock-q-optimize-2-B', option_label: 'B', option_text: 'Personalised podcast shelf on home — broader reach but doesn\'t fix the funnel drop-off' },
              { id: 'mock-q-optimize-2-C', option_label: 'C', option_text: 'Push notification after first episode: "Follow this podcast?"' },
              { id: 'mock-q-optimize-2-D', option_label: 'D', option_text: 'Email campaign to users who played but didn\'t follow' },
            ],
          },
        ],
      },
      win: {
        nudge: 'Land your recommendation clearly. State it first, then back it with evidence.',
        questions: [
          {
            id: 'mock-q-win-1', question_text: 'You\'re presenting your recommendation to the VP of Content. What\'s your opening line?', question_nudge: 'Lead with the answer, not the process.', response_type: 'pure_mcq', sequence: 1, grading_weight_within_step: 1.0, already_answered: false,
            options: [
              { id: 'mock-q-win-1-A', option_label: 'A', option_text: '"60% of listeners never see the follow button — one player UI change could 2x our follow rate."' },
              { id: 'mock-q-win-1-B', option_label: 'B', option_text: '"I looked at the data, ran some analysis, and here\'s what I found across three segments..."' },
              { id: 'mock-q-win-1-C', option_label: 'C', option_text: '"Apple Podcasts has a 15% follow rate — here\'s how we can close the gap."' },
              { id: 'mock-q-win-1-D', option_label: 'D', option_text: '"There are several things we could do to improve podcast discovery. Let me walk through the options."' },
            ],
          },
        ],
      },
    }
    const mockStep = MOCK_STEPS[step]
    if (!mockStep) return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
    return NextResponse.json({ step, nudge: mockStep.nudge, questions: mockStep.questions })
  }

  const adminClient = createAdminClient()

  // Fetch the flow_step for this challenge+step
  const { data: flowStep, error: flowStepError } = await adminClient
    .from('flow_steps')
    .select('id, step_nudge, step_order')
    .eq('challenge_id', challenge_id)
    .eq('step', step)
    .single()

  if (flowStepError || !flowStep) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  }

  const flow_step_id = flowStep.id as string

  // Fetch the attempt to get role_id (skip ownership check in mock mode)
  let attempt: { id: string; role_id: string; user_id: string }

  if (isMock) {
    attempt = { id: attempt_id, role_id: 'swe', user_id: userId }
  } else {
    const { data: attemptData, error: attemptError } = await adminClient
      .from('challenge_attempts')
      .select('id, role_id, user_id')
      .eq('id', attempt_id)
      .eq('user_id', userId)
      .single()

    if (attemptError || !attemptData) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
    }
    attempt = attemptData as { id: string; role_id: string; user_id: string }
  }

  // Fetch step questions ordered by sequence — include response_type
  const { data: questions, error: questionsError } = await adminClient
    .from('step_questions')
    .select('id, question_text, question_nudge, sequence, grading_weight_within_step, target_competencies, response_type')
    .eq('flow_step_id', flow_step_id)
    .order('sequence', { ascending: true })

  if (questionsError) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }

  const questionList = questions ?? []

  // Fetch flow_options for all questions, then strip sensitive fields
  const questionIds = questionList.map((q: { id: string }) => q.id)
  const { data: allOptions, error: optionsError } = await adminClient
    .from('flow_options')
    .select('id, question_id, option_label, option_text')
    .in('question_id', questionIds)

  if (optionsError) {
    return NextResponse.json({ error: 'Failed to load options' }, { status: 500 })
  }

  const optionsByQuestion = new Map<string, Array<{ id: string; question_id: string; option_label: string; option_text: string }>>()
  for (const opt of (allOptions ?? [])) {
    const list = optionsByQuestion.get(opt.question_id) ?? []
    list.push(opt)
    optionsByQuestion.set(opt.question_id, list)
  }

  // Fetch already-answered question_ids from step_attempts
  const { data: existingAnswers } = await adminClient
    .from('step_attempts')
    .select('question_id')
    .eq('attempt_id', attempt_id)

  const answeredQuestionIds = new Set((existingAnswers ?? []).map((a: { question_id: string }) => a.question_id))

  // Fetch role lens for nudge resolution
  const { data: roleLens } = await adminClient
    .from('role_lenses')
    .select('*')
    .eq('role_id', attempt.role_id)
    .single()

  // Build seed for deterministic shuffle: hash(userId + challengeId + step)
  const seedInput = userId + challenge_id + step
  const seed = hashString(seedInput)

  // Build the response — shuffle options per question using deterministic seed
  const questionsResponse = questionList.map((q: {
    id: string
    question_text: string
    question_nudge: string | null
    sequence: number
    grading_weight_within_step: number
    target_competencies: string[]
    response_type: string
  }) => {
    const rawOptions = optionsByQuestion.get(q.id) ?? []
    const shuffledOptions = seededShuffle(rawOptions, seed)
    return {
      id: q.id,
      question_text: q.question_text,
      question_nudge: q.question_nudge,
      response_type: q.response_type,
      sequence: q.sequence,
      grading_weight_within_step: q.grading_weight_within_step,
      options: shuffledOptions.map((opt) => ({
        id: opt.id,
        option_label: opt.option_label,
        option_text: opt.option_text,
      })),
      already_answered: answeredQuestionIds.has(q.id),
    }
  })

  // Resolve nudge: combine step nudge with role nudge
  const resolvedNudge = roleLens
    ? resolveNudge(flowStep.step_nudge as string | null, step, roleLens)
    : (flowStep.step_nudge ?? '')

  return NextResponse.json({
    step,
    nudge: resolvedNudge,
    questions: questionsResponse,
  })
}
