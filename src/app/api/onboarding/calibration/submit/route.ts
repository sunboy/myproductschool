import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { FlowMove } from '@/lib/types'
import type { OptionQuality } from '@/lib/types'
import { QUESTIONS } from '@/lib/calibration/questions'
import { ARCHETYPE_OBSERVATIONS } from '@/lib/calibration/archetypes'
import { IS_MOCK } from '@/lib/mock'

const TIER_CAPS: Record<OptionQuality, number> = {
  best: 3.0,
  good_but_incomplete: 2.75,
  surface: 1.75,
  plausible_wrong: 0.5,
}

// 4 questions: index 0=Frame, 1=List, 2=Optimize, 3=Win
const MOVE_QUESTION_INDEX: Record<string, number> = {
  frame: 0,
  list: 1,
  optimize: 2,
  win: 3,
}

function scoreMove(move: string, selectedId: string): number {
  const idx = MOVE_QUESTION_INDEX[move]
  if (idx === undefined) return 0
  const question = QUESTIONS[idx]
  if (!question) return 0
  const option = question.options.find(o => o.id === selectedId)
  if (!option) return 0
  const raw = TIER_CAPS[option.quality]
  return Math.round((raw / 3.0) * 100)
}

async function computeRealPercentile(adminClient: ReturnType<typeof createAdminClient>, userAvg: number): Promise<number> {
  const { data: attempts } = await adminClient
    .from('calibration_attempts')
    .select('scores_json')
    .eq('status', 'complete')

  if (!attempts || attempts.length === 0) return 50

  const avgs = attempts.map(a => {
    const s = a.scores_json as Record<string, number>
    return ((s.frame ?? 0) + (s.list ?? 0) + (s.optimize ?? 0) + (s.win ?? 0)) / 4
  })

  const belowOrEqual = avgs.filter(avg => avg <= userAvg).length
  const percentile = Math.round((belowOrEqual / avgs.length) * 100)
  return Math.max(1, Math.min(99, percentile))
}

const ARCHETYPES: Record<string, { name: string; description: string }> = {
  strategist:       { name: 'The Strategist',         description: 'You frame problems sharply and land recommendations with conviction. Your instinct is to define the question before answering it.' },
  systematic:       { name: 'The Systematic Builder', description: 'You construct solutions methodically with strong framing and a bias for structured execution. Narrative communication is your next edge.' },
  analyst:          { name: 'The Analyst',            description: 'You thrive in data and options — breaking problems into clean, testable segments. Converting that rigour into crisp recommendations is your growth area.' },
  communicator:     { name: 'The Communicator',       description: 'You land ideas clearly and handle rooms well. Building the structured diagnostic beneath your narrative will make your recommendations unassailable.' },
  problem_framer:   { name: 'The Problem Framer',     description: 'You ask the right questions before jumping to answers. Developing your ability to deliver those insights with executive presence is your next move.' },
  operator:         { name: 'The Operator',           description: 'You excel at scoping, prioritising, and shipping under constraints. Strengthening your problem framing will make your solutions harder to second-guess.' },
  well_rounded:     { name: 'The Well-Rounded',       description: 'You show solid instincts across all four FLOW moves. The path forward is deepening each one from competent to exceptional.' },
  emerging_thinker: { name: 'The Emerging Thinker',  description: 'You have the raw instincts — Luma will help you build the frameworks to sharpen them into consistent, high-impact product thinking.' },
}

function deriveArchetype(s: { frame: number; list: number; optimize: number; win: number }) {
  const high = (v: number) => v >= 70
  const weak = (v: number) => v < 50
  if (high(s.frame) && high(s.win))                         return ARCHETYPES.strategist
  if (high(s.frame) && high(s.optimize))                    return ARCHETYPES.systematic
  if (high(s.list)  && high(s.optimize))                    return ARCHETYPES.analyst
  if (high(s.win)   && (weak(s.list) || weak(s.optimize)))  return ARCHETYPES.communicator
  if (high(s.frame) && weak(s.win))                         return ARCHETYPES.problem_framer
  if (high(s.optimize) && weak(s.frame))                    return ARCHETYPES.operator
  if (s.frame >= 55 && s.list >= 55 && s.optimize >= 55 && s.win >= 55) return ARCHETYPES.well_rounded
  return ARCHETYPES.emerging_thinker
}

function scoreToLevel(score: number): number {
  if (score >= 75) return 3
  if (score >= 50) return 2
  return 1
}

function weakestMove(scores: Record<string, number>): FlowMove {
  return (Object.entries(scores).sort(([, a], [, b]) => a - b)[0][0]) as FlowMove
}

// answers: { frame: 'A', list: 'C', optimize: 'B', win: 'A' }
export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({
      attempt_id: 'mock-calibration-1',
      scores: { frame: 72, list: 65, optimize: 58, win: 81 },
      percentile: 78,
      archetype: 'The Strategist',
      archetype_description: 'You frame problems sharply and land recommendations with conviction.',
      starting_levels: { frame: 3, list: 2, optimize: 2, win: 3 },
      luma_observation: "You think in narratives and outcomes first. That's rare.",
      personalised_plan_slug: 'optimize-under-pressure',
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { answers } = body as { answers: Record<string, string> }

  if (!answers || !answers.frame) {
    return NextResponse.json({ error: 'answers object with frame/list/optimize/win is required' }, { status: 400 })
  }

  const scores = {
    frame:    scoreMove('frame',    answers.frame    ?? ''),
    list:     scoreMove('list',     answers.list     ?? ''),
    optimize: scoreMove('optimize', answers.optimize ?? ''),
    win:      scoreMove('win',      answers.win      ?? ''),
  }

  const avg = (scores.frame + scores.list + scores.optimize + scores.win) / 4
  const archetypeResult = deriveArchetype(scores)
  const observation = ARCHETYPE_OBSERVATIONS[archetypeResult.name] ?? ''
  const weak = weakestMove(scores)

  const adminClient = createAdminClient()

  // Insert attempt first so it's counted in percentile
  const [attemptRes, percentile] = await Promise.all([
    adminClient
      .from('calibration_attempts')
      .insert({
        user_id: user.id,
        responses_json: answers,
        status: 'complete',
        scores_json: scores,
        percentile: 50, // placeholder, updated below
      })
      .select('id')
      .single(),
    computeRealPercentile(adminClient, avg),
  ])

  // Find personalised plan for weakest move + update percentile in parallel with remaining writes
  const [personalisedPlanResult] = await Promise.all([
    adminClient
      .from('study_plans')
      .select('id, slug')
      .eq('move_tag', weak)
      .eq('is_published', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Update the attempt with real percentile
    attemptRes.data?.id
      ? adminClient.from('calibration_attempts').update({ percentile }).eq('id', attemptRes.data.id)
      : Promise.resolve(),

    adminClient
      .from('profiles')
      .update({ archetype: archetypeResult.name, archetype_description: archetypeResult.description })
      .eq('id', user.id),

    adminClient
      .from('move_levels')
      .upsert(
        (['frame', 'list', 'optimize', 'win'] as const).map(m => ({
          user_id: user.id,
          move: m as FlowMove,
          level: scoreToLevel(scores[m]),
          progress_pct: 0,
          xp: 0,
        })),
        { onConflict: 'user_id,move' }
      ),

    adminClient
      .from('learner_competencies')
      .upsert(
        ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise'].map(comp => ({
          user_id: user.id,
          competency: comp,
          score: 50,
          total_attempts: 0,
          trend: 'steady',
          trend_slope: 0,
          last_updated: new Date().toISOString(),
        })),
        { onConflict: 'user_id,competency' }
      ),

    observation
      ? adminClient.from('luma_context').insert({
          user_id: user.id,
          context_type: 'calibration',
          content: observation,
          is_active: true,
          created_at: new Date().toISOString(),
        })
      : Promise.resolve(),
  ])

  // Enroll user in their personalised plan
  const personalisedPlan = personalisedPlanResult.data
  if (personalisedPlan) {
    await adminClient
      .from('user_study_plan_enrollments')
      .upsert(
        { user_id: user.id, plan_id: personalisedPlan.id },
        { onConflict: 'user_id,plan_id' }
      )
  }

  return NextResponse.json({
    attempt_id: attemptRes.data?.id ?? 'scored',
    scores,
    percentile,
    archetype: archetypeResult.name,
    archetype_description: archetypeResult.description,
    starting_levels: {
      frame: scoreToLevel(scores.frame),
      list: scoreToLevel(scores.list),
      optimize: scoreToLevel(scores.optimize),
      win: scoreToLevel(scores.win),
    },
    luma_observation: observation,
    personalised_plan_slug: personalisedPlan?.slug ?? null,
  })
}
