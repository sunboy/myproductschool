// src/lib/live-interview/flow-coverage-credits.ts
//
// Helper for the per-turn dedup registry on live_interview_sessions.
// Three writers (/analyze, /turn, /grade-turn) each call applyCoverageCredit
// before incrementing flow_coverage. If the (move, turn_index) pair is already
// credited, the increment is skipped — preventing double-credit when more than
// one writer fires for the same user turn.

export type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

export type FlowCoverage = Partial<Record<FlowMove, number>>
export type FlowCoverageCredits = Partial<Record<FlowMove, number[]>>

const FLOW_INCREMENT = 0.15
const FLOW_CAP = 1.0

export interface ApplyCreditInput {
  coverage: FlowCoverage | null | undefined
  credits: FlowCoverageCredits | null | undefined
  move: FlowMove
  turnIndex: number | null | undefined
}

export interface ApplyCreditResult {
  credited: boolean
  coverage: FlowCoverage
  credits: FlowCoverageCredits
}

/**
 * Pure function: given the current coverage + credits map and a move + turn,
 * return the new coverage + credits + whether anything was credited.
 *
 * If `turnIndex` is null/undefined, we still credit (best-effort) but do not
 * record a dedup key. This keeps callers safe during transitional periods or
 * when the turn isn't known.
 */
export function applyCoverageCredit(input: ApplyCreditInput): ApplyCreditResult {
  const move = input.move
  const coverageBase: FlowCoverage = { frame: 0, list: 0, optimize: 0, win: 0, ...(input.coverage ?? {}) }
  const creditsBase: FlowCoverageCredits = { frame: [], list: [], optimize: [], win: [], ...(input.credits ?? {}) }

  const turnIndex = input.turnIndex
  const moveCredits = creditsBase[move] ?? []

  if (typeof turnIndex === 'number' && moveCredits.includes(turnIndex)) {
    return { credited: false, coverage: coverageBase, credits: creditsBase }
  }

  const current = coverageBase[move] ?? 0
  const nextCoverage: FlowCoverage = {
    ...coverageBase,
    [move]: Math.min(FLOW_CAP, current + FLOW_INCREMENT),
  }

  const nextCredits: FlowCoverageCredits = typeof turnIndex === 'number'
    ? { ...creditsBase, [move]: [...moveCredits, turnIndex] }
    : creditsBase

  return { credited: true, coverage: nextCoverage, credits: nextCredits }
}
