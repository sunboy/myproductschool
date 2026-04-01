import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

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

  // Fetch the attempt to get role_id
  const { data: attempt, error: attemptError } = await adminClient
    .from('challenge_attempts_v2')
    .select('id, role_id, user_id')
    .eq('id', attempt_id)
    .eq('user_id', userId)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 })
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
