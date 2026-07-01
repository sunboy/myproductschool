import type { OptionQuality } from '@/lib/types'
import { QUESTIONS } from '@/lib/calibration/questions'
import { ARCHETYPE_OBSERVATIONS } from '@/lib/calibration/archetypes'

/**
 * Pure archetype-derivation logic shared by the calibration submit route and
 * the public archetype quiz (`/quiz/archetype`). Extracted from
 * `src/app/api/onboarding/calibration/submit/route.ts` so both callers score
 * answers and pick a persona identically, with zero behavior drift.
 */

export type CalibrationMove = 'frame' | 'list' | 'optimize' | 'win'

export interface CalibrationScores {
  frame: number
  list: number
  optimize: number
  win: number
}

export interface ArchetypeResult {
  name: string
  description: string
}

export const TIER_CAPS: Record<OptionQuality, number> = {
  best: 3.0,
  good_but_incomplete: 2.75,
  surface: 1.75,
  plausible_wrong: 0.5,
}

// 4 questions: index 0=Frame, 1=List, 2=Optimize, 3=Win
const MOVE_QUESTION_INDEX: Record<CalibrationMove, number> = {
  frame: 0,
  list: 1,
  optimize: 2,
  win: 3,
}

/** Scores a single move's selected option (A-D) to a 0-100 value. */
export function scoreMove(move: CalibrationMove, selectedId: string): number {
  const idx = MOVE_QUESTION_INDEX[move]
  const question = QUESTIONS[idx]
  if (!question) return 0
  const option = question.options.find(o => o.id === selectedId)
  if (!option) return 0
  const raw = TIER_CAPS[option.quality]
  return Math.round((raw / 3.0) * 100)
}

export const ARCHETYPES: Record<string, ArchetypeResult> = {
  strategist:       { name: 'The Strategist',         description: 'You frame problems sharply and land recommendations with conviction. Your instinct is to define the question before answering it.' },
  systematic:       { name: 'The Systematic Builder', description: 'You construct solutions methodically with strong framing and a bias for structured execution. Narrative communication is your next edge.' },
  analyst:          { name: 'The Analyst',            description: 'You thrive in data and options - breaking problems into clean, testable segments. Converting that rigour into crisp recommendations is your growth area.' },
  communicator:     { name: 'The Communicator',       description: 'You land ideas clearly and handle rooms well. Building the structured diagnostic beneath your narrative will make your recommendations unassailable.' },
  problem_framer:   { name: 'The Problem Framer',     description: 'You ask the right questions before jumping to answers. Developing your ability to deliver those insights with executive presence is your next move.' },
  operator:         { name: 'The Operator',           description: 'You excel at scoping, prioritising, and shipping under constraints. Strengthening your problem framing will make your solutions harder to second-guess.' },
  well_rounded:     { name: 'The Well-Rounded',       description: 'You show solid instincts across all four FLOW moves. The path forward is deepening each one from competent to exceptional.' },
  emerging_thinker: { name: 'The Emerging Thinker',  description: 'You have the raw instincts - Hatch will help you build the frameworks to sharpen them into consistent, high-impact product thinking.' },
}

/** Derives the archetype {name, description} for a set of 0-100 move scores. */
export function deriveArchetype(s: CalibrationScores): ArchetypeResult {
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

/** Returns the ARCHETYPES slug (e.g. 'strategist') for a set of move scores. */
export function archetypeSlugFor(s: CalibrationScores): string {
  const result = deriveArchetype(s)
  const entry = Object.entries(ARCHETYPES).find(([, v]) => v.name === result.name)
  return entry ? entry[0] : 'emerging_thinker'
}

/** Looks up an ArchetypeResult by its slug key in ARCHETYPES. Returns null if unknown. */
export function archetypeBySlug(slug: string): ArchetypeResult | null {
  return ARCHETYPES[slug] ?? null
}

/** Looks up the blind-spot observation line for an archetype's display name. */
export function observationFor(archetypeName: string): string {
  return ARCHETYPE_OBSERVATIONS[archetypeName] ?? ''
}
