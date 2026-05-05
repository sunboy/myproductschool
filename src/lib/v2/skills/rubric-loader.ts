import fs from 'fs'
import path from 'path'
import type { FlowStep } from '@/lib/types'

interface RubricCriterion {
  id: string
  name: string
  description: string
  strong_signals: string[]
  partial_signals: string[]
  failure_signals: string[]
  hatch_coaching_weak: string
  hatch_coaching_failure: string
  structure?: string
  components?: string[]
  categories?: string[]
}

interface RubricJSON {
  step: string
  version: string
  description: string
  reasoning_move: string
  criteria: RubricCriterion[]
  scoring: {
    method: string
    weights: Record<string, number>
    thresholds: Record<string, number>
  }
  output_format: Record<string, unknown>
  anti_patterns_this_step_catches: string[]
  module_notes: Record<string, string>
}

// Cache rubrics in memory after first load
const rubricCache: Partial<Record<FlowStep, RubricJSON>> = {}

export function loadRubric(step: FlowStep): RubricJSON {
  if (rubricCache[step]) return rubricCache[step]!
  const filePath = path.join(process.cwd(), 'content', 'grading_rubrics', `${step}_rubric.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed: RubricJSON = JSON.parse(raw)
  rubricCache[step] = parsed
  return parsed
}

export function getCriteriaForStep(step: FlowStep): RubricCriterion[] {
  return loadRubric(step).criteria
}

export function getCoachingMessage(step: FlowStep, criterionId: string, level: 'weak' | 'failure'): string {
  const rubric = loadRubric(step)
  const criterion = rubric.criteria.find(c => c.id === criterionId)
  if (!criterion) return ''
  return level === 'weak' ? criterion.hatch_coaching_weak : criterion.hatch_coaching_failure
}

export function getReasoningMove(step: FlowStep): string {
  return loadRubric(step).reasoning_move
}

export function getScoringWeights(step: FlowStep): Record<string, number> {
  return loadRubric(step).scoring.weights
}

export function getAntiPatterns(step: FlowStep): string[] {
  return loadRubric(step).anti_patterns_this_step_catches
}

export type { RubricJSON, RubricCriterion }
