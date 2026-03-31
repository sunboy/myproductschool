import type { ResponseType, FlowOption } from '@/lib/types'
import { scoreOption } from './option-scorer'

export type GradingResult = {
  score: number; quality_label: string; competencies_demonstrated: string[]
  grading_explanation: string; rubric_alignment: { closest_option: string; alignment_score: number; exceeds_option: boolean }
  confidence: number
}

export function routeResponse(responseType: ResponseType): 'deterministic' | 'hybrid' | 'ai' {
  switch (responseType) {
    case 'pure_mcq': return 'deterministic'
    case 'mcq_plus_elaboration': return 'hybrid'
    case 'modified_option': return 'ai'
    case 'freeform': return 'ai'
  }
}

export function gradePureMCQ(selectedOptionId: string, options: FlowOption[]): GradingResult {
  const result = scoreOption(selectedOptionId, options)
  return {
    ...result,
    score: result.score,
    rubric_alignment: { closest_option: selectedOptionId, alignment_score: 1.0, exceeds_option: false },
    confidence: 1.0,
  }
}
