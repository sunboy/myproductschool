// Shared contracts for the /go/* lead-magnet quiz engine.
//
// One engine (MagnetQuiz) + one config module per magnet under
// src/lib/lead-magnets/quizzes/. Everything here is import-safe on both server
// and client: configs are plain data + pure functions, no server-only deps.

/**
 * Tier mapping for live Hatch reaction in the instant player.
 * best → 'delighted' state, good → 'intrigued', surface/wrong → 'challenging'.
 * When tier is set on an option, the player shows a speech bubble quip
 * (~900ms) before auto-advancing instead of the default 250ms.
 */
export type QuizOptionTier = 'best' | 'good' | 'surface' | 'wrong'

/** One selectable option inside an MCQ step. */
export interface QuizOption {
  id: string
  text: string
  /**
   * Per-dimension points this option contributes, e.g. { frame: 100 } or
   * { evals: 2 }. Keys are magnet-defined dimension keys.
   */
  scores?: Record<string, number>
  /**
   * Quality tier — drives Hatch's live reaction in the instant player.
   * Maps from calibration option quality:
   *   best → 'best', good_but_incomplete → 'good',
   *   surface → 'surface', plausible_wrong → 'wrong'
   */
  tier?: QuizOptionTier
  /**
   * Optional per-option quip override. When absent the player uses the
   * default per-tier line from TIER_QUIPS in InstantMagnet.
   */
  quip?: string
}

export type QuizStep =
  | {
      kind: 'mcq'
      id: string
      /** Short eyebrow label, e.g. "Scenario 1 of 4" is added by the engine. */
      prompt: string
      /** Optional scenario/context paragraph rendered above the prompt. */
      context?: string
      options: QuizOption[]
      /**
       * When present the step becomes an instant-reveal: after picking, the
       * engine highlights correct/wrong and shows the explanation (the
       * reusable rule this step teaches) before advancing.
       */
      reveal?: { correctId: string; explain: string }
    }
  | {
      kind: 'picker'
      id: string
      prompt: string
      context?: string
      options: { id: string; label: string; sub?: string }[]
    }
  | {
      kind: 'inputs'
      id: string
      prompt: string
      context?: string
      fields: {
        id: string
        label: string
        type: 'select' | 'number'
        options?: { value: string; label: string }[]
        placeholder?: string
      }[]
    }

/** step.id -> selected option id, or for inputs steps a field map. */
export type QuizAnswers = Record<string, string | Record<string, string | number>>

/** A scored dimension shown as a bar (never a naked overall number). */
export interface QuizDimension {
  key: string
  label: string
  value: number
  max: number
}

export interface QuizOutcome {
  /** The memorable label: archetype, readiness band, push/hold signal. */
  band: { key: string; label: string; blurb: string }
  /** 0-100 where meaningful. Display as bands/bars, not a naked score. */
  score?: number
  dimensions?: QuizDimension[]
  /**
   * Result-matched activation (the highest-ROI piece): where this result band
   * should send the user for their first real rep, with CTA copy.
   */
  recommendedNext?: { label: string; href: string }
  /** Magnet-specific extras (gap list, comp band, reframed story, ...). */
  detail?: Record<string, unknown>
}

export interface MagnetQuizConfig {
  /** Must match a LEAD_MAGNETS key. */
  magnet: string
  /** Bump when steps/scoring change; stored alongside the result. */
  version: number
  steps: QuizStep[]
  /** Pure + deterministic. */
  deriveResult: (answers: QuizAnswers) => QuizOutcome
}

/** What lands in leads.magnet_result. */
export interface MagnetResultPayload {
  magnet: string
  version: number
  answers: QuizAnswers
  band: string
  score?: number
  dimensions?: Record<string, number>
  utm?: Record<string, string>
  [k: string]: unknown
}

export function toMagnetResultPayload(
  config: Pick<MagnetQuizConfig, 'magnet' | 'version'>,
  answers: QuizAnswers,
  outcome: QuizOutcome,
  utm?: Record<string, string>,
): MagnetResultPayload {
  return {
    magnet: config.magnet,
    version: config.version,
    answers,
    band: outcome.band.key,
    ...(outcome.score !== undefined ? { score: outcome.score } : {}),
    ...(outcome.dimensions
      ? { dimensions: Object.fromEntries(outcome.dimensions.map(d => [d.key, d.value])) }
      : {}),
    ...(utm && Object.keys(utm).length > 0 ? { utm } : {}),
  }
}
