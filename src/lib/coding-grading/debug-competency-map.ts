// Maps debug_v1 rubric dimensions onto the six learner competencies so a
// finished Claude Code debugging session feeds the same evidence stream as
// FLOW challenges and analytics sessions. Same contract as
// analyst-competency-map.ts (scores 0 | 0.5 | 1, step_weight scaled by
// grading completeness, floored at 0.25).

import type { Competency } from '@/lib/types'

export const DEBUG_DIMENSION_COMPETENCY: Record<string, Competency> = {
  reproduction: 'domain_expertise',
  fault_localization: 'domain_expertise',
  root_cause: 'strategic_thinking',
  fix_quality: 'taste',
  regression_guard: 'strategic_thinking',
  communication: 'cognitive_empathy',
  skill_construction: 'creative_execution',
}

const TOTAL_DIMENSIONS = Object.keys(DEBUG_DIMENSION_COMPETENCY).length
const MIN_STEP_WEIGHT = 0.25

export function debugDimensionsToStepResults(
  dimensions: Record<string, { score?: unknown }> | null | undefined,
): Array<{ score: number; competencies_demonstrated: string[]; step_weight: number }> {
  if (!dimensions) return []
  const graded = Object.entries(dimensions).filter(
    ([key, entry]) => key in DEBUG_DIMENSION_COMPETENCY && typeof entry?.score === 'number',
  )
  if (!graded.length) return []
  const completeness = Math.max(MIN_STEP_WEIGHT, graded.length / TOTAL_DIMENSIONS)
  return graded.map(([key, entry]) => ({
    score: Math.max(0, Math.min(1, entry.score as number)),
    competencies_demonstrated: [DEBUG_DIMENSION_COMPETENCY[key]],
    step_weight: completeness,
  }))
}
