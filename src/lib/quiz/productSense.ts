import type { CalibrationMove } from '@/lib/calibration/deriveArchetype'
import { QUESTIONS } from '@/lib/calibration/questions'

/**
 * Content + pure scoring for the public "Can you pass a product-sense round?"
 * taste test at `/quiz/product-sense`. No auth, no DB. The two MCQ taste-checks
 * reuse the real calibration questions (Frame + Optimize) so the copy and
 * quality tiers match what published challenges look like. The freeform prompt
 * exercises the Win move.
 *
 * This module is intentionally client-safe: it holds the scenario, the MCQ ids,
 * a deterministic freeform heuristic (used as the cost-guard fallback), and the
 * result-shaping logic. The API route layers the AI grade on top when enabled.
 */

export const PRODUCT_SENSE_MCQ_MOVES: CalibrationMove[] = ['frame', 'optimize']

/** The two MCQ taste-checks, pulled from the calibration bank by move. */
export const PRODUCT_SENSE_MCQS = PRODUCT_SENSE_MCQ_MOVES.map((move) => {
  const q = QUESTIONS.find((entry) => entry.move === move)
  if (!q) throw new Error(`Missing calibration question for move: ${move}`)
  return q
})

/** The freeform prompt exercises the Win move on a self-contained scenario. */
export const PRODUCT_SENSE_FREEFORM = {
  move: 'win' as CalibrationMove,
  scenario:
    'A payments team wants to raise the default transfer limit from $2,000 to $10,000 to win larger merchants. Fraud is worried about chargeback exposure. Support is worried about angry customers hitting the new ceiling mid-transfer during the rollout. The change is a one-line config flip and could ship tomorrow.',
  q: 'Write the recommendation you would send to the room. Say what you would ship, how you would know it worked, and what would tell you to roll it back.',
  placeholder:
    'We ship the higher limit to a 5% cohort of vetted merchants first. We know it worked if chargeback rate stays under X while transfer volume grows. We roll back if...',
} as const

// ── MCQ scoring ──────────────────────────────────────────────
// Each answered MCQ maps to a 0-3 taste score via the option's quality tier.
// This mirrors TIER_CAPS in deriveArchetype but stays on the raw 0-3 scale so
// the freeform (also 0-3) can sum cleanly into an out-of-9 taste score.

const QUALITY_POINTS = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
} as const

export type McqAnswers = Partial<Record<CalibrationMove, 'A' | 'B' | 'C' | 'D'>>

/** Scores one MCQ answer (0-3) by looking up the selected option's quality. */
export function scoreMcq(move: CalibrationMove, selectedId: string | undefined): number {
  if (!selectedId) return 0
  const q = QUESTIONS.find((entry) => entry.move === move)
  const option = q?.options.find((o) => o.id === selectedId)
  if (!option) return 0
  return QUALITY_POINTS[option.quality]
}

// ── Deterministic freeform heuristic (cost-guard fallback) ───
// A real product-sense Win answer names three things: what ships, how success
// is measured, and the reversal condition. The heuristic rewards evidence of
// each move rather than length alone, so a short-but-sharp answer beats a long
// vague one. Range 0-3, matching the MCQ scale.

const SHIP_SIGNALS = [
  'ship', 'roll out', 'rollout', 'launch', 'cohort', 'pilot', 'a/b', 'ab test',
  'percent', '%', 'subset', 'vetted', 'gradual', 'phased', 'canary', 'gate', 'flag',
]
const MEASURE_SIGNALS = [
  'measure', 'metric', 'know it worked', 'success', 'guardrail', 'threshold',
  'chargeback', 'fraud rate', 'conversion', 'volume', 'rate stays', 'monitor',
  'track', 'baseline', 'target', 'kpi',
]
const REVERSE_SIGNALS = [
  'roll back', 'rollback', 'revert', 'reverse', 'kill switch', 'pull', 'abort',
  'fails if', 'fail if', 'stop if', 'undo', 'back out', 'exceeds', 'breaches', 'spikes',
]

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

export interface FreeformHeuristic {
  score: number // 0-3
  hasShip: boolean
  hasMeasure: boolean
  hasReverse: boolean
}

/** Deterministic 0-3 grade of a Win freeform answer. No AI, no network. */
export function scoreFreeformHeuristic(text: string): FreeformHeuristic {
  const normalized = text.toLowerCase()
  const words = normalized.split(/\s+/).filter(Boolean).length

  // Too short to say anything real.
  if (words < 8) {
    return { score: 0, hasShip: false, hasMeasure: false, hasReverse: false }
  }

  const hasShip = hasAny(normalized, SHIP_SIGNALS)
  const hasMeasure = hasAny(normalized, MEASURE_SIGNALS)
  const hasReverse = hasAny(normalized, REVERSE_SIGNALS)

  const moves = [hasShip, hasMeasure, hasReverse].filter(Boolean).length
  // 3 moves = 3, 2 moves = 2, 1 move = 1, 0 moves but substantive = still 0.5-ish → floor 1 if long enough.
  let score = moves
  if (moves === 0 && words >= 25) score = 1
  return { score: Math.min(3, score), hasShip, hasMeasure, hasReverse }
}

// ── Result shaping ───────────────────────────────────────────

export const PRODUCT_SENSE_MAX = 9 // 3 (frame) + 3 (optimize) + 3 (freeform)

export type Verdict = 'sharp' | 'solid' | 'developing'

export interface ProductSenseResult {
  total: number // 0-9
  verdict: Verdict
  headline: string
  strongMove: CalibrationMove
  weakMove: CalibrationMove
  moveScores: Record<CalibrationMove, number> // frame/optimize/win only, 0-3
}

const VERDICT_HEADLINE: Record<Verdict, string> = {
  sharp: 'You would pass the room',
  solid: 'You are close, one move short',
  developing: 'The instinct is there, the structure is not',
}

const MOVE_LABEL: Record<CalibrationMove, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

export function moveLabel(move: CalibrationMove): string {
  return MOVE_LABEL[move]
}

/**
 * Shapes the final result from the three per-move scores (0-3 each).
 * `freeformScore` comes from either the AI grade or the heuristic fallback.
 */
export function buildProductSenseResult(
  mcqAnswers: McqAnswers,
  freeformScore: number,
): ProductSenseResult {
  const frame = scoreMcq('frame', mcqAnswers.frame)
  const optimize = scoreMcq('optimize', mcqAnswers.optimize)
  const win = Math.max(0, Math.min(3, Math.round(freeformScore)))

  const moveScores: Record<CalibrationMove, number> = {
    frame,
    optimize,
    win,
    list: 0, // not tested here; kept for type completeness
  }

  const total = frame + optimize + win
  const verdict: Verdict = total >= 8 ? 'sharp' : total >= 5 ? 'solid' : 'developing'

  // Strongest and weakest among the three tested moves. Ties break by a fixed
  // order so the same answers always produce the same named moves.
  const tested: CalibrationMove[] = ['frame', 'optimize', 'win']
  const strongMove = tested.reduce((a, b) => (moveScores[b] > moveScores[a] ? b : a))
  const weakMove = tested.reduce((a, b) => (moveScores[b] < moveScores[a] ? b : a))

  return {
    total,
    verdict,
    headline: VERDICT_HEADLINE[verdict],
    strongMove,
    weakMove,
    moveScores,
  }
}

// ── Share slug (compact, URL-safe) ───────────────────────────
// Encodes verdict + strong/weak move so the OG card can render a per-result
// image without needing the raw answers. Shape: "<verdict>-<strong>-<weak>".

export function resultSlug(result: ProductSenseResult): string {
  return `${result.verdict}-${result.strongMove}-${result.weakMove}`
}

export function parseResultSlug(slug: string | undefined): {
  verdict: Verdict
  strongMove: CalibrationMove
  weakMove: CalibrationMove
} | null {
  if (!slug) return null
  const [verdict, strong, weak] = slug.split('-')
  const verdicts: Verdict[] = ['sharp', 'solid', 'developing']
  const moves: CalibrationMove[] = ['frame', 'list', 'optimize', 'win']
  if (
    !verdicts.includes(verdict as Verdict) ||
    !moves.includes(strong as CalibrationMove) ||
    !moves.includes(weak as CalibrationMove)
  ) {
    return null
  }
  return {
    verdict: verdict as Verdict,
    strongMove: strong as CalibrationMove,
    weakMove: weak as CalibrationMove,
  }
}
