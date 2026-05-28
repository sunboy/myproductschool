/**
 * Canonical difficulty system for Practice browse surfaces.
 *
 * @internal URL-edge and content-authoring only. DB queries that already have
 * a normalized `easy | medium | hard` value should NOT need these helpers.
 *
 * Remaining legitimate callers:
 * - URL filter input: FilteredChallengesView, /api/challenges, /api/admin PATCH dual-accept
 * - Content publisher: publisher.ts (normalises legacy DB values on write)
 * - Hatch context: skill-context builder, urls helper
 *
 * One axis everywhere users browse challenges or learn modules:
 *   easy | medium | hard
 *
 * Legacy DB values (warmup/standard/advanced/staff_plus on challenges;
 * foundation/beginner/intermediate/advanced/new-era/entry-point on learn_modules)
 * are normalized through `coerceDifficulty()`. The R1 release uses this helper
 * so reads work against both old and new DB values; R2 rewrites the DB; R3
 * removes the helper once nothing writes legacy values.
 *
 * Legacy `concepts.difficulty` and `challenge_prompts.difficulty` keep their
 * own enum — they live on different tables and are out of scope.
 */

export type PracticeDifficulty = 'easy' | 'medium' | 'hard'

export const PRACTICE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

/** Human-readable labels for chips, pills, dropdowns. */
export const DIFFICULTY_LABELS: Record<PracticeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/**
 * Tailwind classes for the difficulty pill in a challenge row.
 * Easy=primary green, Medium=tertiary amber, Hard=error red — Terra palette.
 */
export const DIFFICULTY_PILL_CLASSES: Record<PracticeDifficulty, string> = {
  easy: 'bg-primary-container text-on-primary-container',
  medium: 'bg-tertiary-container text-on-secondary-container',
  hard: 'bg-error/10 text-error',
}

/** Single source of truth for the filter-dropdown / bottom-sheet options. */
export interface DifficultyOption {
  /** Canonical value stored in URL params and post-R2 DB. */
  value: PracticeDifficulty
  /** Display label. */
  label: string
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

/**
 * Map any legacy or canonical difficulty string to the canonical bucket.
 * Returns null for unknown values so callers can decide to skip vs. default.
 */
export function coerceDifficulty(input: string | null | undefined): PracticeDifficulty | null {
  if (!input) return null
  const v = input.toLowerCase().trim()
  switch (v) {
    case 'easy':
    case 'warmup':
    case 'beginner':
    case 'foundation':
    case 'entry-point':
      return 'easy'
    case 'medium':
    case 'standard':
    case 'intermediate':
    case 'new-era':
      return 'medium'
    case 'hard':
    case 'advanced':
    case 'staff_plus':
    case 'staff+':
      return 'hard'
    default:
      return null
  }
}

/**
 * Inverse of coerceDifficulty for DB queries that need to match rows storing
 * legacy values. Given a canonical bucket, return every DB value that maps to it.
 * Use this for Supabase `.in('difficulty', expandDifficultyForQuery(...))` calls
 * during the R1→R2 dual-accept window.
 */
export function expandDifficultyForQuery(d: PracticeDifficulty): string[] {
  switch (d) {
    case 'easy':
      return ['easy', 'warmup', 'beginner', 'foundation', 'entry-point']
    case 'medium':
      return ['medium', 'standard', 'intermediate', 'new-era']
    case 'hard':
      return ['hard', 'advanced', 'staff_plus']
  }
}

/** Convenience: expand a list of canonical buckets into the union of DB values. */
export function expandDifficultiesForQuery(ds: PracticeDifficulty[]): string[] {
  const out = new Set<string>()
  for (const d of ds) for (const v of expandDifficultyForQuery(d)) out.add(v)
  return Array.from(out)
}
