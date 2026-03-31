import type { FlowOption, OptionQuality } from '@/lib/types'

const QUALITY_POINTS: Record<OptionQuality, number> = { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }
const TIER_CAPS: Record<number, number> = { 0: 0.5, 1: 1.75, 2: 2.75, 3: 3.0 }

export function scoreOption(selectedOptionId: string, options: FlowOption[]) {
  const option = options.find(o => o.id === selectedOptionId)
  if (!option) throw new Error(`Option ${selectedOptionId} not found`)
  const rawPoints = QUALITY_POINTS[option.quality]
  return {
    score: TIER_CAPS[rawPoints],
    quality_label: option.quality,
    competencies_demonstrated: option.competencies,
    grading_explanation: option.explanation,
    is_correct: option.quality === 'best',
  }
}
