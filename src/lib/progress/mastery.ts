export interface MasteryAttempt {
  challenge_id: string
  total_score: number | string | null
  max_score: number | string | null
}

export interface MasteryEntry {
  challenge_id: string
  score: number | null
  is_completed: boolean
  /** False for historical completions that are no longer in the published catalog. */
  is_catalogued?: boolean
}

export const MASTERY_PAGE_SIZE = 1000

/** Supabase limits select responses to 1,000 rows, even when more rows match. */
export async function collectPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = MASTERY_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = []

  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1)
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

export async function collectPublishedChallengeIds(
  fetchPage: (from: number, to: number) => Promise<Array<{ id: string }>>,
): Promise<string[]> {
  const rows = await collectPages(fetchPage)
  return rows.map(challenge => challenge.id)
}

function normalizedScore(attempt: MasteryAttempt): number | null {
  const total = Number(attempt.total_score)
  const max = Number(attempt.max_score)
  if (attempt.total_score == null || !Number.isFinite(total) || !(max > 0)) return null
  return Math.round(Math.max(0, Math.min(1, total / max)) * 100)
}

/** One row per challenge; repeated attempts keep their best score. */
export function buildMasteryEntries(
  publishedChallengeIds: string[],
  attempts: MasteryAttempt[],
): MasteryEntry[] {
  const completedMap = new Map<string, number | null>()

  for (const attempt of attempts) {
    const score = normalizedScore(attempt)
    const previous = completedMap.get(attempt.challenge_id)
    if (!completedMap.has(attempt.challenge_id) || (score != null && (previous == null || score > previous))) {
      completedMap.set(attempt.challenge_id, score)
    }
  }

  const entries: MasteryEntry[] = publishedChallengeIds.map(challengeId => ({
    challenge_id: challengeId,
    score: completedMap.has(challengeId) ? (completedMap.get(challengeId) ?? null) : null,
    is_completed: completedMap.has(challengeId),
  }))

  const published = new Set(publishedChallengeIds)
  for (const [challengeId, score] of completedMap.entries()) {
    if (published.has(challengeId)) continue
    entries.push({
      challenge_id: challengeId,
      score,
      is_completed: true,
      is_catalogued: false,
    })
  }

  return entries
}
