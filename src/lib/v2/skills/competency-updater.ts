import type { Competency, LearnerCompetency, RoleLens } from '@/lib/types'

const ALL_COMPETENCIES: Competency[] = [
  'motivation_theory', 'cognitive_empathy', 'taste',
  'strategic_thinking', 'creative_execution', 'domain_expertise',
]

export function updateCompetencies(
  current: LearnerCompetency[],
  stepResults: Array<{ score: number; competencies_demonstrated: string[]; step_weight: number }>,
  roleLens: RoleLens,
  maxScore: number = 3
): { updated: LearnerCompetency[]; deltas: Record<string, number> } {
  const multipliers = roleLens.competency_multipliers
  const deltas: Record<string, number> = {}

  for (const comp of ALL_COMPETENCIES) {
    let rawDelta = 0
    for (const result of stepResults) {
      if (result.competencies_demonstrated.includes(comp)) {
        rawDelta += result.score * result.step_weight
      }
    }
    deltas[comp] = Math.round(rawDelta * 100) / 100
  }

  const updated = current.map(c => {
    const d = deltas[c.competency] ?? 0
    if (d === 0) return c
    const roleMultiplier = multipliers[c.competency] ?? 1.0
    const k = 20 * roleMultiplier
    const actual = d / maxScore
    const expected = c.score / 100
    const newScore = c.score + k * (actual - expected)
    return {
      ...c,
      score: Math.round(Math.max(0, Math.min(100, newScore)) * 100) / 100,
      total_attempts: c.total_attempts + 1,
      last_updated: new Date().toISOString(),
    }
  })
  return { updated, deltas }
}
