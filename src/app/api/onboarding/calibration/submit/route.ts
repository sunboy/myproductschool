import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { FlowMove } from '@/lib/types'
import type { OptionQuality } from '@/lib/types'
import { QUESTIONS } from '@/lib/calibration/questions'
import { IS_MOCK } from '@/lib/mock'

interface CalibrationResponses {
  frame?: string
  list?: string
  optimize?: string
  win?: string
}

// Tier caps matching option-scorer.ts pattern but inlined for the calibration shape
const TIER_CAPS: Record<OptionQuality, number> = {
  best: 3.0,
  good_but_incomplete: 2.75,
  surface: 1.75,
  plausible_wrong: 0.5,
}

// Parse "Q1: A | Q2: C" → ['A', 'C']
function parseAnswers(str: string | undefined): string[] {
  if (!str) return []
  return str.match(/Q\d+: ([A-D])/g)?.map(m => m.slice(-1)) ?? []
}

// Score a single MCQ answer for a given question index
function scoreQuestion(questionIdx: number, selectedId: string): number {
  const question = QUESTIONS[questionIdx]
  if (!question) return 0
  const option = question.options.find(o => o.id === selectedId)
  if (!option) return 0
  return TIER_CAPS[option.quality]
}

// Average 2 question scores and normalise to 0–100
function scorePair(q1Score: number, q2Score: number): number {
  const avg = (q1Score + q2Score) / 2
  return Math.round((avg / 3.0) * 100)
}

function computePercentile(avg: number): number {
  if (avg >= 85) return 92
  if (avg >= 75) return 78
  if (avg >= 65) return 61
  if (avg >= 55) return 44
  if (avg >= 45) return 28
  return 15
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

export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({ attempt_id: 'mock-calibration-1' })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { responses, move, answers } = body as { responses?: CalibrationResponses; move?: string; answers?: Record<string, string> }

  // Support both full responses object and single-move submission
  const resolvedResponses: CalibrationResponses = responses ?? {}
  if (move && answers) {
    resolvedResponses[move as keyof CalibrationResponses] = Object.values(answers).join('\n\n')
  }

  if (!resolvedResponses.frame && !resolvedResponses.list && !resolvedResponses.optimize && !resolvedResponses.win) {
    return NextResponse.json({ error: 'At least one FLOW move response is required' }, { status: 400 })
  }

  // ── Parse selected option IDs from each move string ──────────────────────
  // Frame = questions 0,1 | List = 2,3 | Optimize = 4,5 | Win = 6,7
  const frameIds    = parseAnswers(resolvedResponses.frame)
  const listIds     = parseAnswers(resolvedResponses.list)
  const optimizeIds = parseAnswers(resolvedResponses.optimize)
  const winIds      = parseAnswers(resolvedResponses.win)

  // ── Score each move ───────────────────────────────────────────────────────
  const scores = {
    frame:    scorePair(scoreQuestion(0, frameIds[0]    ?? ''), scoreQuestion(1, frameIds[1]    ?? '')),
    list:     scorePair(scoreQuestion(2, listIds[0]     ?? ''), scoreQuestion(3, listIds[1]     ?? '')),
    optimize: scorePair(scoreQuestion(4, optimizeIds[0] ?? ''), scoreQuestion(5, optimizeIds[1] ?? '')),
    win:      scorePair(scoreQuestion(6, winIds[0]      ?? ''), scoreQuestion(7, winIds[1]      ?? '')),
  }

  const avg = (scores.frame + scores.list + scores.optimize + scores.win) / 4
  const percentile = computePercentile(avg)
  const archetypeResult = deriveArchetype(scores)

  const adminClient = createAdminClient()

  // ── a. Insert calibration attempt ─────────────────────────────────────────
  const { data: attempt } = await adminClient
    .from('calibration_attempts')
    .insert({
      user_id: user.id,
      responses_json: resolvedResponses,
      status: 'complete',
      scores_json: scores,
      percentile,
    })
    .select('id')
    .single()

  // ── b. Update profiles with archetype ────────────────────────────────────
  await adminClient
    .from('profiles')
    .update({ archetype: archetypeResult.name, archetype_description: archetypeResult.description })
    .eq('id', user.id)

  // ── c. Upsert move_levels with calibration-derived starting levels ────────
  const moves = ['frame', 'list', 'optimize', 'win'] as const
  await adminClient
    .from('move_levels')
    .upsert(
      moves.map(m => ({
        user_id: user.id,
        move: m as FlowMove,
        level: scoreToLevel(scores[m]),
        progress_pct: 0,
        xp: 0,
      })),
      { onConflict: 'user_id,move' }
    )

  // ── d. Seed learner_competencies at neutral 50 ───────────────────────────
  const ALL_COMPETENCIES = [
    'motivation_theory', 'cognitive_empathy', 'taste',
    'strategic_thinking', 'creative_execution', 'domain_expertise',
  ]
  await adminClient
    .from('learner_competencies')
    .upsert(
      ALL_COMPETENCIES.map(comp => ({
        user_id: user.id,
        competency: comp,
        score: 50,
        total_attempts: 0,
        trend: 'steady',
        trend_slope: 0,
        last_updated: new Date().toISOString(),
      })),
      { onConflict: 'user_id,competency' }
    )

  return NextResponse.json({
    attempt_id: attempt?.id ?? 'scored',
    scores,
    percentile,
    archetype: archetypeResult.name,
  })
}
