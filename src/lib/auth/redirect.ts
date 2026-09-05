/** Only local application paths may survive a sign-in transition. */
export function safeAuthRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return undefined
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return undefined
  try {
    const url = new URL(value, 'https://auth.invalid')
    if (url.origin !== 'https://auth.invalid') return undefined
    // Returning to authentication would create a redirect loop for signed-in users.
    if (['/login', '/signup', '/auth/callback'].includes(url.pathname.replace(/\/$/, ''))) return undefined
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

export function authRedirectFromParams(params: Record<string, unknown>): string | undefined {
  return safeAuthRedirect(params.returnTo) ?? safeAuthRedirect(params.redirectTo) ?? safeAuthRedirect(params.next)
}
