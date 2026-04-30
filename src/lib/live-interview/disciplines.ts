// src/lib/live-interview/disciplines.ts
//
// Single source of truth for live-interview disciplines.
// Wider than `LoopDiscipline` (which stays at 4 values for the loop runner) —
// this 5-value union is what the lobby picker, active-interview UI, and
// system prompt builder all use. SQL is a top-level discipline here even
// though it's not yet a loop round.

export type LiveInterviewDiscipline =
  | 'product_sense'
  | 'system_design'
  | 'data_modeling'
  | 'coding'
  | 'sql'

export type LiveArtifactKind = 'canvas' | 'editor' | 'none'

export type EditorLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'sql'

export interface DisciplineMeta {
  label: string
  shortLabel: string
  icon: string
  description: string
  artifact: LiveArtifactKind
  defaultLanguage?: EditorLanguage
  challengeTypeFilter: string[]
}

export const DISCIPLINE_META: Record<LiveInterviewDiscipline, DisciplineMeta> = {
  product_sense: {
    label: 'Product Sense',
    shortLabel: 'Product Sense',
    icon: 'psychology',
    description: 'Voice or chat conversation. Frame, list, optimize, win.',
    artifact: 'none',
    challengeTypeFilter: ['flow', 'freeform', 'quick_take'],
  },
  system_design: {
    label: 'System Design',
    shortLabel: 'System Design',
    icon: 'schema',
    description: 'Sketch on the canvas. Trade-offs out loud.',
    artifact: 'canvas',
    challengeTypeFilter: ['system_design'],
  },
  data_modeling: {
    label: 'Data Modeling',
    shortLabel: 'Data Modeling',
    icon: 'database',
    description: 'Model entities and relationships on the canvas.',
    artifact: 'canvas',
    challengeTypeFilter: ['data_modeling'],
  },
  coding: {
    label: 'Coding',
    shortLabel: 'Coding',
    icon: 'code',
    description: 'Write code in the editor. Talk through your approach.',
    artifact: 'editor',
    defaultLanguage: 'python',
    challengeTypeFilter: ['algorithm'],
  },
  sql: {
    label: 'SQL',
    shortLabel: 'SQL',
    icon: 'terminal',
    description: 'Write SQL in the editor against the prompt.',
    artifact: 'editor',
    defaultLanguage: 'sql',
    challengeTypeFilter: ['sql'],
  },
}

export const LIVE_INTERVIEW_DISCIPLINES: LiveInterviewDiscipline[] = [
  'product_sense',
  'system_design',
  'data_modeling',
  'coding',
  'sql',
]

const CHALLENGE_TYPE_TO_DISCIPLINE: Record<string, LiveInterviewDiscipline> = {
  flow: 'product_sense',
  freeform: 'product_sense',
  quick_take: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  algorithm: 'coding',
  sql: 'sql',
}

/**
 * Map a `challenges.challenge_type` value to its live-interview discipline.
 * Returns `null` for unknown / unsupported types.
 */
export function challengeTypeToDiscipline(
  challengeType: string | null | undefined
): LiveInterviewDiscipline | null {
  if (!challengeType) return null
  return CHALLENGE_TYPE_TO_DISCIPLINE[challengeType] ?? null
}

/**
 * Normalize an arbitrary discipline-like string (URL param, API field) to a
 * canonical `LiveInterviewDiscipline`. Treats `algorithm` as `coding` so legacy
 * callers passing the raw challenge_type still work.
 */
export function normalizeDiscipline(
  input: string | null | undefined
): LiveInterviewDiscipline | null {
  if (!input) return null
  if (input === 'algorithm') return 'coding'
  if (
    input === 'product_sense' ||
    input === 'system_design' ||
    input === 'data_modeling' ||
    input === 'coding' ||
    input === 'sql'
  ) {
    return input
  }
  // Also accept any challenge_type form the lobby might still emit.
  return CHALLENGE_TYPE_TO_DISCIPLINE[input] ?? null
}
