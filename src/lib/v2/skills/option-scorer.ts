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

export function scoreMultiSelect(selectedOptionIds: string[], options: FlowOption[]) {
  const selected = options.filter(o => selectedOptionIds.includes(o.id))

  if (selected.length === 0 || selected.some(o => o.quality === 'plausible_wrong')) {
    return {
      score: TIER_CAPS[0],
      quality_label: 'plausible_wrong' as OptionQuality,
      competencies_demonstrated: [] as string[],
      grading_explanation: selected.length === 0
        ? 'No options selected.'
        : selected.find(o => o.quality === 'plausible_wrong')?.explanation ?? 'One or more selections were incorrect.',
      is_correct: false,
    }
  }

  const avgPoints = selected.reduce((sum, o) => sum + QUALITY_POINTS[o.quality], 0) / selected.length
  const score = TIER_CAPS[Math.round(avgPoints)]
  const quality_label: OptionQuality = selected.every(o => o.quality === 'best')
    ? 'best'
    : selected.some(o => o.quality === 'best')
    ? 'good_but_incomplete'
    : 'surface'

  return {
    score,
    quality_label,
    competencies_demonstrated: [...new Set(selected.flatMap(o => o.competencies))],
    grading_explanation: selected.map(o => o.explanation).join(' '),
    is_correct: selected.every(o => o.quality === 'best'),
  }
}
