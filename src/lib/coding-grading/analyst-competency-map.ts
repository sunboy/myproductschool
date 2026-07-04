// Maps analyst_v1 rubric dimensions onto the six learner competencies so a
// finished Claude Code Analytics session feeds the same evidence stream as
// FLOW challenges. Dimension scores are 0 | 0.5 | 1 (see analyst-rubric.ts),
// which matches updateCompetencies' expected 0..1 `actual` when maxScore=1.
// Design: docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md §6.3.

import type { Competency } from '@/lib/types'

export const ANALYST_DIMENSION_COMPETENCY: Record<string, Competency> = {
  connection_setup: 'domain_expertise',
  problem_framing: 'domain_expertise',
  query_rigor: 'strategic_thinking',
  segmentation: 'strategic_thinking',
  communication: 'cognitive_empathy',
  evidence: 'cognitive_empathy',
  skill_construction: 'creative_execution',
}

const TOTAL_DIMENSIONS = Object.keys(ANALYST_DIMENSION_COMPETENCY).length
const MIN_STEP_WEIGHT = 0.25

/**
 * Converts a final_artifact `dimensions` map into the stepResults shape
 * updateCompetencies consumes. step_weight scales with how much of the rubric
 * was actually graded (a bailed session counts less), floored at 0.25.
 */
export function analystDimensionsToStepResults(
  dimensions: Record<string, { score?: unknown }> | null | undefined,
): Array<{ score: number; competencies_demonstrated: string[]; step_weight: number }> {
  if (!dimensions) return []
  const graded = Object.entries(dimensions).filter(
    ([key, entry]) => key in ANALYST_DIMENSION_COMPETENCY && typeof entry?.score === 'number',
  )
  if (!graded.length) return []
  const completeness = Math.max(MIN_STEP_WEIGHT, graded.length / TOTAL_DIMENSIONS)
  return graded.map(([key, entry]) => ({
    score: Math.max(0, Math.min(1, entry.score as number)),
    competencies_demonstrated: [ANALYST_DIMENSION_COMPETENCY[key]],
    step_weight: completeness,
  }))
}
