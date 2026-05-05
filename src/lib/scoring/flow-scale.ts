// src/lib/scoring/flow-scale.ts
//
// Single source of truth for FLOW scoring on a 0–5 scale across both the
// challenge and live-interview pipelines.

export const FLOW_MAX_SCORE = 5

export const GRADE_THRESHOLDS = {
  outstanding: 4.0,
  strong: 3.0,
  developing: 2.0,
} as const

export type GradeLabel = 'Outstanding' | 'Strong' | 'Developing' | 'Needs Practice'

/**
 * Map a numeric score to a grade label. Both pipelines (challenge + interview)
 * call into this so the bands stay in sync.
 *
 * If `max` is omitted, the score is assumed to already be on the 0–FLOW_MAX_SCORE
 * scale. If `max` differs, the score is normalized first.
 */
export function scoreToGrade(score: number, max: number = FLOW_MAX_SCORE): GradeLabel {
  const normalized = max === FLOW_MAX_SCORE ? score : (score / max) * FLOW_MAX_SCORE
  if (normalized >= GRADE_THRESHOLDS.outstanding) return 'Outstanding'
  if (normalized >= GRADE_THRESHOLDS.strong) return 'Strong'
  if (normalized >= GRADE_THRESHOLDS.developing) return 'Developing'
  return 'Needs Practice'
}

/**
 * Per-question option tier caps on the 0–5 scale.
 * Old (3.0 max): plausible_wrong 0.5 / surface 1.75 / good_but_incomplete 2.75 / best 3.0
 * New (5.0 max): rank-distance preserving with cleaner numbers.
 *
 * Indexed by tier rank: 0 = plausible_wrong, 1 = surface, 2 = good_but_incomplete, 3 = best.
 */
export const TIER_CAPS_FIVE: Record<number, number> = {
  0: 0.5,
  1: 2.5,
  2: 4.25,
  3: 5.0,
}

/**
 * Per-step score → per-move XP delta for `applyMoveLevelXp`.
 * Old: per-step 0–3 × 10 = 0–30 XP per move per step.
 * New: per-step 0–5 × 6 = 0–30 XP per move per step. Same range; level
 * progression speed unchanged.
 */
export const MOVE_XP_MULTIPLIER = 6

/**
 * Defensive clamp + auto-detect for LLM responses that might still be on the
 * old 0–100 scale (e.g. due to a warm prompt cache after deploy).
 */
export function clampToFlowScale(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  if (n > FLOW_MAX_SCORE) {
    // Likely a stale 0–100 response — auto-rescale.
    console.warn(`[flow-scale] received score ${n} > ${FLOW_MAX_SCORE}; dividing by 20`)
    return Math.max(0, Math.min(FLOW_MAX_SCORE, n / 20))
  }
  return Math.max(0, Math.min(FLOW_MAX_SCORE, n))
}
