import type { Competency, LearnerCompetency, RoleLens } from '@/lib/types'

export function identifyWeakness(competencies: LearnerCompetency[], roleLens: RoleLens) {
  const gaps = competencies.map(c => ({
    competency: c.competency as Competency,
    gap: (100 - c.score) * (roleLens.competency_multipliers[c.competency as Competency] ?? 1.0),
  })).sort((a, b) => b.gap - a.gap)
  return { weakest: gaps[0].competency, opportunities: gaps.slice(0, 3) }
}
