---
name: hackproduct-learner-dna
description: "Learner DNA competency system for HackProduct — 6-axis scoring with role-weighted ELO updates, trend analysis, weakness identification, and adaptive recommendations. Use when building competency updater, DNA API, CompetencyRadar, trend analyzer, or any learner_competencies code. Triggers on: competency, learner DNA, radar chart, trend, weakness, recommendation, ELO, skill profile, progress."
---

# HackProduct Learner DNA System

## The 6 Competencies

| Competency | Measures | Primary FLOW step |
|---|---|---|
| `motivation_theory` | Why users/stakeholders behave as they do | Frame |
| `cognitive_empathy` | Multiple POVs, second-order effects | Frame, List |
| `taste` | Good-enough vs great | Optimize, Win |
| `strategic_thinking` | Tactics → business/competitive context | Optimize |
| `creative_execution` | Non-obvious solutions | List |
| `domain_expertise` | Technical/industry knowledge | List, Optimize |

## ELO-Inspired Update

```typescript
const ALL_COMPETENCIES: Competency[] = [
  'motivation_theory','cognitive_empathy','taste',
  'strategic_thinking','creative_execution','domain_expertise'
]

export function updateCompetencies(
  current: LearnerCompetency[],
  stepResults: Array<{ score: number; competencies_demonstrated: string[]; step_weight: number }>,
  roleLens: RoleLens
): { updated: LearnerCompetency[]; deltas: Record<string, number> } {
  const multipliers = roleLens.competency_multipliers
  const deltas: Record<string, number> = {}

  for (const comp of ALL_COMPETENCIES) {
    let rawDelta = 0
    for (const result of stepResults) {
      if (result.competencies_demonstrated.includes(comp)) {
        rawDelta += result.score * result.step_weight * (multipliers[comp] ?? 1.0)
      }
    }
    deltas[comp] = Math.round(rawDelta * 100) / 100
  }

  const updated = current.map(c => {
    const d = deltas[c.competency] ?? 0
    if (d === 0) return c
    const attempts = c.total_attempts + 1
    const k = Math.max(10, 30 - attempts)  // K decays with experience
    const performance = Math.min(1, d / 3)
    const expected = c.score / 100
    const newScore = c.score + k * (performance - expected)
    return {
      ...c,
      score: Math.round(Math.max(0, Math.min(100, newScore)) * 100) / 100,
      total_attempts: attempts,
      last_updated: new Date().toISOString(),
    }
  })
  return { updated, deltas }
}
```

## Trend Analysis

```typescript
export function analyzeTrend(recentScores: number[]): { trend: string; slope: number } {
  if (recentScores.length < 5) return { trend: 'insufficient_data', slope: 0 }
  const n = recentScores.length
  const xMean = (n - 1) / 2
  const yMean = recentScores.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (recentScores[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  return { trend: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'steady', slope: Math.round(slope * 1000) / 1000 }
}
```

## Weakness Identification

```typescript
export function identifyWeakness(competencies: LearnerCompetency[], roleLens: RoleLens) {
  const gaps = competencies.map(c => ({
    competency: c.competency as Competency,
    gap: (100 - c.score) * (roleLens.competency_multipliers[c.competency as Competency] ?? 1.0),
  })).sort((a, b) => b.gap - a.gap)
  return { weakest: gaps[0].competency, opportunities: gaps.slice(0, 3) }
}
```

## DNA API: `GET /api/v2/dna`

Returns: all 6 competencies with scores 0-100, trends, weakest_link, overall_level.
Overall level: 0-30 warmup, 31-55 standard, 56-75 advanced, 76+ staff_plus.

## Recommendation: `GET /api/v2/dna/recommend`

Find uncompleted challenge targeting weakest competency. If in a study plan, prefer next plan challenge.

## CompetencyRadar Component

Inline SVG, 6 axes at 60° intervals, score 0-100 → radius.
Fill: `fill-primary/20 stroke-primary`. Labels outside hexagon. Animate on mount.

## Files This Skill Produces

```
src/lib/v2/skills/competency-updater.ts
src/lib/v2/skills/trend-analyzer.ts
src/lib/v2/skills/weakness-identifier.ts
src/app/api/v2/dna/route.ts
src/app/api/v2/dna/recommend/route.ts
src/hooks/useLearnerDNA.ts
src/components/v2/CompetencyRadar.tsx
src/components/v2/CompetencyDelta.tsx
```
