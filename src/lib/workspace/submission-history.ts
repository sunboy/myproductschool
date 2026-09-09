/** Fetch the normal history page and, when needed, the specific linked attempt.
 * The API scopes both reads to the signed-in user and requested challenge.
 */
export async function loadWorkspaceHistory<T extends { id: string }>(
  challengeId: string,
  initialAttemptId?: string,
  fetcher: typeof fetch = fetch,
): Promise<T[] | null> {
  const query = new URLSearchParams({ limit: '20', summary: '1', challenge_id: challengeId })
  const response = await fetcher(`/api/attempts?${query}`)
  if (!response.ok) return null
  const rows: T[] = await response.json()
  if (!initialAttemptId || rows.some(row => row.id === initialAttemptId)) return rows
  query.set('attempt_id', initialAttemptId)
  try {
    const selected = await fetcher(`/api/attempts?${query}`)
    if (selected.ok) {
      const selectedRows: T[] = await selected.json()
      rows.push(...selectedRows.filter(row => row.id === initialAttemptId))
    }
  } catch {
    // A failed old-attempt lookup must not discard the available recent history.
  }
  return rows
}

/** History URLs remain read-only even when the requested row cannot be loaded.
 * Only a deliberate start action can move that visit into an active attempt.
 */
export function canStartWorkspaceAttempt(initialAttemptId: string | undefined, practiceRequested: boolean): boolean {
  return !initialAttemptId || practiceRequested
}
