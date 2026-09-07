/** Preserve the complete workspace destination across auth and canonical redirects. */
export function workspaceLocation(id: string, query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item)
  }
  const suffix = params.toString()
  return `/workspace/challenges/${encodeURIComponent(id)}${suffix ? `?${suffix}` : ''}`
}
