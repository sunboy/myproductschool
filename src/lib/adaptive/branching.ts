// In-session branching + the bounded guidance state machine (adaptive B3).
// Both are pure so the branching behavior is exhaustively unit-testable
// without any session infrastructure.
// Design: docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md §3.2, §5.

import type { AnalyticsSubProblem, MarkVerdict } from '@/components/v2/mediums/types'
import type { GuidanceLevel } from '@/lib/adaptive/guidance'

// ── Guidance state machine (§3.2) ───────────────────────────────────────────

export interface GuidanceMachineState {
  passStreak: number
  retryStreak: number
  upMoved: boolean
  downMoved: boolean
}

export const INITIAL_MACHINE: GuidanceMachineState = {
  passStreak: 0,
  retryStreak: 0,
  upMoved: false,
  downMoved: false,
}

const ORDER: GuidanceLevel[] = ['scaffolded', 'guided', 'open']

function shift(level: GuidanceLevel, delta: 1 | -1): GuidanceLevel {
  const idx = Math.max(0, Math.min(ORDER.length - 1, ORDER.indexOf(level) + delta))
  return ORDER[idx]
}

/**
 * Applies one verdict to the machine. `partial` breaks both streaks and never
 * moves guidance. Net movement is capped at one per session in each direction
 * (a second same-direction move is never allowed), which kills oscillation.
 * The auto-completed mcp_setup step never reaches this function — it produces
 * no verdict.
 */
export function applyVerdict(
  state: GuidanceMachineState,
  verdict: MarkVerdict,
  guidance: GuidanceLevel,
): { state: GuidanceMachineState; guidance: GuidanceLevel; moved: 'up' | 'down' | null } {
  if (verdict === 'partial') {
    return { state: { ...state, passStreak: 0, retryStreak: 0 }, guidance, moved: null }
  }
  if (verdict === 'pass') {
    const passStreak = state.passStreak + 1
    if (passStreak >= 2 && !state.upMoved && guidance !== 'open') {
      return {
        state: { ...state, passStreak: 0, retryStreak: 0, upMoved: true },
        guidance: shift(guidance, 1),
        moved: 'up',
      }
    }
    return { state: { ...state, passStreak, retryStreak: 0 }, guidance, moved: null }
  }
  // retry
  const retryStreak = state.retryStreak + 1
  if (retryStreak >= 2 && !state.downMoved && guidance !== 'scaffolded') {
    return {
      state: { ...state, retryStreak: 0, passStreak: 0, downMoved: true },
      guidance: shift(guidance, -1),
      moved: 'down',
    }
  }
  return { state: { ...state, retryStreak, passStreak: 0 }, guidance, moved: null }
}

// ── Branch planning (§5) ────────────────────────────────────────────────────

export interface BranchInput {
  arc: AnalyticsSubProblem[]
  activeIdx: number
  /** Full verdict history, oldest first (one entry per Mark attempt). */
  verdicts: Array<{ stepId: string; verdict: MarkVerdict }>
  scaffoldsInjected: number
  stretchesInjected: number
}

export type BranchPlan =
  | { action: 'none' }
  | { action: 'inject_scaffold'; step: AnalyticsSubProblem; atIdx: number; reason: string }
  | { action: 'inject_stretch'; step: AnalyticsSubProblem; atIdx: number; reason: string }

const MAX_TOTAL_INJECTIONS = 2

/** Deterministic scaffold built from the stuck step itself — no AI call. */
export function buildScaffoldStep(stuck: AnalyticsSubProblem): AnalyticsSubProblem {
  return {
    id: `scaffold_${stuck.id}`,
    sequence: stuck.sequence,
    title: `Regroup: ${stuck.title.toLowerCase()}`,
    objective: `Break the blocked step into its smallest first move. The goal is unchanged: ${stuck.objective}`,
    successCriterion: 'Tell Hatch in one line what the step is asking for and what your last output showed.',
    suggestedPrompts: [
      'What did my last output actually say, in plain terms?',
      ...stuck.suggestedPrompts.slice(0, 1),
    ],
    kind: 'scaffold_explainer',
    teachingNote:
      'Being stuck usually means the question got too big. Shrink it: read the last output, name what it tells you, then take the single next query.',
  }
}

/** The generic stretch step (metric definition) for hot streaks. */
export const STRETCH_METRIC_STEP: AnalyticsSubProblem = {
  id: 'stretch_metric_definition',
  sequence: 99,
  title: 'Define the metric precisely',
  objective: 'Write the exact definition of the metric behind your finding: numerator, denominator, time window, and one population it deliberately excludes.',
  successCriterion: 'Paste the metric definition with all four parts.',
  suggestedPrompts: [
    'Help me pressure-test this metric definition for edge cases',
  ],
  kind: 'metric_definition',
  rubricDimension: 'communication',
}

/**
 * Decides whether this verdict changes the arc. Bounds: at most 2 injections
 * per session, at most 1 of each type, never while on the final step, never
 * scaffold a scaffold.
 */
export function planBranch(input: BranchInput): BranchPlan {
  const { arc, activeIdx, verdicts, scaffoldsInjected, stretchesInjected } = input
  const active = arc[activeIdx]
  if (!active) return { action: 'none' }
  if (scaffoldsInjected + stretchesInjected >= MAX_TOTAL_INJECTIONS) return { action: 'none' }
  if (activeIdx >= arc.length - 1) return { action: 'none' }

  // Stuck: two retries on the active step → insert a scaffold before it.
  const retriesOnActive = verdicts.filter((v) => v.stepId === active.id && v.verdict === 'retry').length
  if (retriesOnActive >= 2 && scaffoldsInjected === 0 && active.kind !== 'scaffold_explainer') {
    return {
      action: 'inject_scaffold',
      step: buildScaffoldStep(active),
      atIdx: activeIdx,
      reason: `${retriesOnActive} retries on ${active.id}`,
    }
  }

  // Flying: the last two verdicts are clean passes on two different steps →
  // insert one stretch step after the current one.
  const lastTwo = verdicts.slice(-2)
  const hotStreak =
    lastTwo.length === 2 &&
    lastTwo.every((v) => v.verdict === 'pass') &&
    lastTwo[0].stepId !== lastTwo[1].stepId
  const alreadyHasStretch = arc.some((s) => s.id === STRETCH_METRIC_STEP.id)
  if (hotStreak && stretchesInjected === 0 && !alreadyHasStretch) {
    return {
      action: 'inject_stretch',
      step: STRETCH_METRIC_STEP,
      atIdx: activeIdx + 1,
      reason: 'two consecutive clean passes',
    }
  }

  return { action: 'none' }
}

/** Inserts the planned step and re-sequences contiguously. */
export function applyBranch(arc: AnalyticsSubProblem[], plan: BranchPlan): AnalyticsSubProblem[] {
  if (plan.action === 'none') return arc
  const next = [...arc.slice(0, plan.atIdx), plan.step, ...arc.slice(plan.atIdx)]
  return next.map((s, i) => ({ ...s, sequence: i + 1 }))
}
