import type { FlowOption, OptionQuality } from '@/lib/types'
import { TIER_CAPS_FIVE } from '@/lib/scoring/flow-scale'

const QUALITY_POINTS: Record<OptionQuality, number> = { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }

export function scoreOption(selectedOptionId: string, options: FlowOption[]) {
  const option = options.find(o => o.id === selectedOptionId)
  if (!option) throw new Error(`Option ${selectedOptionId} not found`)
  const rawPoints = QUALITY_POINTS[option.quality]
  return {
    score: TIER_CAPS_FIVE[rawPoints],
    quality_label: option.quality,
    competencies_demonstrated: option.competencies,
    grading_explanation: option.explanation,
    is_correct: option.quality === 'best',
  }
}
