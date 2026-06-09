// Pure scoring + archetype derivation for the 4-question calibration set.
// Extracted from the onboarding calibration submit route so the public
// /go/failure-mode lead magnet can reuse the exact same logic without auth.
// Import-safe on both server and client (no server-only deps).

import type { OptionQuality } from '@/lib/types'
import { QUESTIONS } from '@/lib/calibration/questions'

export type CalibrationMoveKey = 'frame' | 'list' | 'optimize' | 'win'
export type MoveScores = Record<CalibrationMoveKey, number>

export const TIER_CAPS: Record<OptionQuality, number> = {
  best: 3.0,
  good_but_incomplete: 2.75,
  surface: 1.75,
  plausible_wrong: 0.5,
}

// 4 questions: index 0=Frame, 1=List, 2=Optimize, 3=Win
export const MOVE_QUESTION_INDEX: Record<CalibrationMoveKey, number> = {
  frame: 0,
  list: 1,
  optimize: 2,
  win: 3,
}

export function scoreMove(move: CalibrationMoveKey, selectedId: string): number {
  const idx = MOVE_QUESTION_INDEX[move]
  const question = QUESTIONS[idx]
  if (!question) return 0
  const option = question.options.find(o => o.id === selectedId)
  if (!option) return 0
  const raw = TIER_CAPS[option.quality]
  return Math.round((raw / 3.0) * 100)
}

export interface Archetype {
  key: string
  name: string
  description: string
}

export const ARCHETYPES: Record<string, Archetype> = {
  strategist:       { key: 'strategist',       name: 'The Strategist',         description: 'You frame problems sharply and land recommendations with conviction. Your instinct is to define the question before answering it.' },
  systematic:       { key: 'systematic',       name: 'The Systematic Builder', description: 'You construct solutions methodically with strong framing and a bias for structured execution. Narrative communication is your next edge.' },
  analyst:          { key: 'analyst',          name: 'The Analyst',            description: 'You thrive in data and options - breaking problems into clean, testable segments. Converting that rigour into crisp recommendations is your growth area.' },
  communicator:     { key: 'communicator',     name: 'The Communicator',       description: 'You land ideas clearly and handle rooms well. Building the structured diagnostic beneath your narrative will make your recommendations unassailable.' },
  problem_framer:   { key: 'problem_framer',   name: 'The Problem Framer',     description: 'You ask the right questions before jumping to answers. Developing your ability to deliver those insights with executive presence is your next move.' },
  operator:         { key: 'operator',         name: 'The Operator',           description: 'You excel at scoping, prioritising, and shipping under constraints. Strengthening your problem framing will make your solutions harder to second-guess.' },
  well_rounded:     { key: 'well_rounded',     name: 'The Well-Rounded',       description: 'You show solid instincts across all four FLOW moves. The path forward is deepening each one from competent to exceptional.' },
  emerging_thinker: { key: 'emerging_thinker', name: 'The Emerging Thinker',   description: 'You have the raw instincts - Hatch will help you build the frameworks to sharpen them into consistent, high-impact product thinking.' },
}

export function deriveArchetype(s: MoveScores): Archetype {
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

export function scoreToLevel(score: number): number {
  if (score >= 75) return 3
  if (score >= 50) return 2
  return 1
}

export function weakestMoveOf(scores: MoveScores): CalibrationMoveKey {
  return (Object.entries(scores).sort(([, a], [, b]) => a - b)[0][0]) as CalibrationMoveKey
}
