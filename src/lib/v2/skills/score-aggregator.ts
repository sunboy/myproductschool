import type { FlowStep, RoleLens } from '@/lib/types'

export function aggregateChallenge(
  stepResults: Array<{ step: FlowStep; step_score: number }>,
  roleLens: RoleLens
): { total_score: number; max_score: number; grade_label: string } {
  const stepWeightKey = (step: FlowStep) =>
    `${step}_weight` as keyof Pick<RoleLens, 'frame_weight' | 'list_weight' | 'optimize_weight' | 'win_weight'>

  const total_score = Math.round(
    stepResults.reduce((s, r) => s + r.step_score * roleLens[stepWeightKey(r.step)], 0) * 100
  ) / 100

  const max_score = Math.round(
    stepResults.reduce((s, r) => s + 3.0 * roleLens[stepWeightKey(r.step)], 0) * 100
  ) / 100

  const grade_label = total_score >= 2.5 ? 'Outstanding' : total_score >= 2.0 ? 'Strong' : total_score >= 1.5 ? 'Developing' : 'Needs Practice'
  return { total_score, max_score, grade_label }
}
