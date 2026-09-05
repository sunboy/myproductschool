import type { InterviewGrade } from '@/lib/types'

/** Chat is optional. A missing conversation cannot establish a weak skill. */
export function retainObservedCanvasDimensions(grade: InterviewGrade, challengeType: string, conversation: unknown): InterviewGrade {
  if (typeof conversation === 'string' && /(?:^|\n)User:\s*\S/.test(conversation)) return grade
  const dimensions = { ...grade.dimensions }
  delete dimensions.hatch_collaboration
  const weights: Record<string, number> = challengeType === 'system_design'
    ? { completeness: 25, scalability_signals: 20, design_evolution: 20, narration_quality: 20 }
    : { entity_coverage: 25, relationship_modeling: 20, schema_quality: 20, indexing_and_query_awareness: 20 }
  let totalWeight = 0
  let weightedScore = 0
  for (const [key, weight] of Object.entries(weights)) {
    const score = dimensions[key]?.score
    if (typeof score !== 'number' || !Number.isFinite(score)) continue
    weightedScore += score * weight
    totalWeight += weight
  }
  return { ...grade, dimensions, overall_score: totalWeight ? Math.round(weightedScore / totalWeight * 10) / 10 : grade.overall_score }
}
