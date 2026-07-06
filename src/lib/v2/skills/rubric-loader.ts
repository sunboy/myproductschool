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

/**
 * The FLOW rubric as a prompt block, built from the rubric JSON files so
 * graders that restate the rubric in prose (live debrief, canvas) share the
 * SAME source of truth as MCQ/freeform grading instead of hand-copied
 * weights that drift. Falls back to null if a rubric file is unreadable —
 * callers keep their inline text as the fallback.
 */
export function flowRubricPromptBlock(): string | null {
  try {
    const steps: FlowStep[] = ['frame', 'list', 'optimize', 'win']
    const lines = steps.map((step) => {
      const rubric = loadRubric(step)
      const criteria = rubric.criteria
        .map((c) => `${c.id} (${c.name}, ${rubric.scoring.weights[c.id] ?? '?'})`)
        .join(', ')
      return `${step.charAt(0).toUpperCase()}${step.slice(1)}: ${criteria}`
    })
    return lines.join('\n')
  } catch {
    return null
  }
}
