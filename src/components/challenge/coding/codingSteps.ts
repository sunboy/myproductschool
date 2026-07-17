/**
 * Advisory step model for the coding workspace stepper
 * (Understand → Plan → Code → Test → Optimize).
 *
 * Pure data module: no 'use client', no React imports. Imported by the
 * stepper component, by FlowWorkspace (state + autosave), and threadable
 * into the Hatch interpret payload as `coding_step`.
 *
 * The path is advisory. Nothing gates on it, clicking a node never submits
 * anything, and auto-advance signals only ever move it forward.
 */

export type CodingStep = 'understand' | 'plan' | 'code' | 'test' | 'optimize'

export const CODING_STEPS: { id: CodingStep; label: string }[] = [
  { id: 'understand', label: 'Understand' },
  { id: 'plan', label: 'Plan' },
  { id: 'code', label: 'Code' },
  { id: 'test', label: 'Test' },
  { id: 'optimize', label: 'Optimize' },
]

export function isCodingStep(value: unknown): value is CodingStep {
  return (
    value === 'understand' ||
    value === 'plan' ||
    value === 'code' ||
    value === 'test' ||
    value === 'optimize'
  )
}

export function codingStepIndex(step: CodingStep): number {
  return CODING_STEPS.findIndex((s) => s.id === step)
}

/**
 * Monotonic advance: returns whichever of the two steps is further along the
 * path. Auto-signals call this so a late "plan" signal never regresses a user
 * who is already testing.
 */
export function advanceCodingStep(current: CodingStep, next: CodingStep): CodingStep {
  return codingStepIndex(next) > codingStepIndex(current) ? next : current
}
