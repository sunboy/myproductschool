/**
 * Client-side types for the Walkthrough player. These mirror the
 * server-projected payload shape exactly (see the Phase 2 task brief) — the
 * API owner produces this shape from cc_cases / cc_case_attempts / expert
 * session content. This file has zero server imports and zero sandbox/LLM
 * dependencies; it is pure UI contract.
 */

export type WalkthroughTurnRole = 'user' | 'assistant' | 'tool'

export interface WalkthroughTurn {
  t: number
  role: WalkthroughTurnRole
  text: string
}

export interface CheckpointOption {
  id: string
  text: string
}

export interface Checkpoint {
  id: string
  t: number
  question: string
  /** Present in full mode. Absent in teaser mode (watch-only, no answering). */
  options?: CheckpointOption[]
}

export interface WalkthroughModule {
  id: string
  title: string
  hook: string
}

export interface WalkthroughPayload {
  module: WalkthroughModule
  duration_s: number
  transcript: WalkthroughTurn[]
  checkpoints: Checkpoint[]
}
