import type { FlowStep, RoleLens } from '@/lib/types'
import { FLOW_MAX_SCORE, scoreToGrade } from '@/lib/scoring/flow-scale'

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
    stepResults.reduce((s, r) => s + FLOW_MAX_SCORE * roleLens[stepWeightKey(r.step)], 0) * 100
  ) / 100

  const grade_label = scoreToGrade(total_score, max_score)
  return { total_score, max_score, grade_label }
}
