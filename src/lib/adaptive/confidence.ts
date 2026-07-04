// Evidence-weighted level derivation (adaptive workspaces, B0).
//
// Calibration output is a PRIOR, not a verdict. A competency score backed by
// two attempts should not move the learner's level the way the same score
// backed by twenty attempts does. Confidence grows with evidence and shrinks
// each score toward the neutral 50 until the evidence earns it out.
// Design: docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md §6.

export type OverallLevel = 'Beginner' | 'Developing' | 'Advanced' | 'Expert'

/** Evidence needed to reach 50% confidence in a competency score. */
const K_PRIOR = 5

/** Below this many total attempts across competencies, the archetype prior wins. */
const MIN_EVIDENCE_FOR_DERIVED_LEVEL = 3

export function evidenceConfidence(totalAttempts: number): number {
  const n = Math.max(0, totalAttempts)
  return n / (n + K_PRIOR)
}

/** Shrinks a 0-100 score toward the neutral 50 when evidence is thin. */
export function effectiveScore(score: number, totalAttempts: number): number {
  const conf = evidenceConfidence(totalAttempts)
  return conf * score + (1 - conf) * 50
}

/**
 * Maps a calibration archetype display name to a prior level. Cautious on
 * purpose: a quiz can suggest a starting register, never expertise. Unknown
 * or missing archetypes fall back to Beginner.
 */
export function archetypePriorLevel(archetype: string | null | undefined): OverallLevel {
  switch (archetype) {
    case 'The Strategist':
    case 'The Systematic Builder':
    case 'The Analyst':
    case 'The Communicator':
    case 'The Problem Framer':
    case 'The Operator':
    case 'The Well-Rounded':
      return 'Developing'
    case 'The Emerging Thinker':
    default:
      return 'Beginner'
  }
}

/**
 * Confidence-shrunk overall level. Thresholds match the historical
 * deriveOverallLevel in hatch-context.ts (>=80 Expert, >=60 Advanced,
 * >=40 Developing) applied to the mean of effective scores. With fewer than
 * MIN_EVIDENCE_FOR_DERIVED_LEVEL total attempts the archetype prior wins.
 */
export function deriveLevelFromCompetencies(
  rows: Array<{ score: number; total_attempts: number }>,
  archetypePrior: OverallLevel = 'Beginner',
): OverallLevel {
  if (!rows.length) return archetypePrior
  const totalEvidence = rows.reduce((sum, r) => sum + Math.max(0, r.total_attempts), 0)
  if (totalEvidence < MIN_EVIDENCE_FOR_DERIVED_LEVEL) return archetypePrior
  const avg = rows.reduce((sum, r) => sum + effectiveScore(r.score, r.total_attempts), 0) / rows.length
  if (avg >= 80) return 'Expert'
  if (avg >= 60) return 'Advanced'
  if (avg >= 40) return 'Developing'
  return 'Beginner'
}
