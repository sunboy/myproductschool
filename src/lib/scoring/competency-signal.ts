// src/lib/scoring/competency-signal.ts
//
// Unified per-item shape for competency signals across challenges and live
// interviews. Challenge `step_attempts.competency_signal` stores one of these
// per question (object). Live interview `debrief_json.competencySignals` stores
// an array of these per session.

export type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

export interface CompetencySignal {
  /** Competency this signal speaks to (e.g. 'strategic_thinking'). */
  competency: string
  /** Short narrative the user reads back. 1–2 sentences. */
  signal: string
  /** Optional framework hint sourced from option metadata or LLM grading. */
  framework_hint?: string
  /**
   * For interview signals, which FLOW step it was detected on.
   * Loosely typed as `string` since the value comes back from an LLM; in
   * practice it's one of `FlowMove` but we don't enforce that at parse time.
   */
  stepDetected?: FlowMove | string
}
