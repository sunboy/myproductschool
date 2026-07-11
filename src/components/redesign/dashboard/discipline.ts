import type { Discipline } from '@/components/redesign/DisciplineTile'

/**
 * Maps a challenge_type (+ optional domain title fallback for 'flow'/'freeform'
 * product-sense challenges) to the redesign's 5-way Discipline taxonomy and to
 * the eyebrow label shown on recommendation cards. AI/ML has no dedicated
 * challenge_type today — domain title carries that signal when present.
 */
export function disciplineFor(
  challengeType: string | null | undefined,
  domainName?: string | null,
): Discipline {
  switch (challengeType) {
    case 'system_design':
      return 'system-design'
    case 'data_modeling':
      return 'data-modeling'
    case 'sql':
      return 'sql'
    case 'algorithm':
      return 'sql' // no dedicated DSA tint in spec; falls under the same code-forward accent as SQL
    case 'flow':
    case 'freeform':
    case 'quick_take':
    default:
      if (domainName && /ai|ml|machine learning/i.test(domainName)) return 'ai-ml'
      return 'product-sense'
  }
}

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  'system-design': 'System Design',
  'product-sense': 'Product Sense',
  'data-modeling': 'Data Modeling',
  sql: 'SQL',
  'ai-ml': 'AI / ML',
}

export function disciplineLabelFor(challengeType: string | null | undefined, domainName?: string | null): string {
  return DISCIPLINE_LABEL[disciplineFor(challengeType, domainName)]
}
