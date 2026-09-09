/**
 * Builds the stable workspace URL for a completed attempt while retaining the
 * route's origin, return, and QA query parameters.
 */
export function workspaceAttemptUrl(currentHref: string, attemptId: string | null) {
  const url = new URL(currentHref)

  if (attemptId) {
    url.searchParams.set('attempt', attemptId)
  } else {
    url.searchParams.delete('attempt')
  }

  return `${url.pathname}${url.search}${url.hash}`
}
