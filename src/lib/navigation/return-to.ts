const SAFE_RETURN_PREFIXES = [
  '/autopsies',
  '/challenges',
  '/dashboard',
  '/domains',
  '/explore',
  '/interview-prep',
  '/learn',
  '/live-interviews',
  '/progress',
  '/vocabulary',
]

export function sanitizeReturnTo(value?: string | null): string | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return undefined
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return undefined

  const lower = trimmed.toLowerCase()
  if (lower.startsWith('/\\') || lower.includes('javascript:')) return undefined

  return SAFE_RETURN_PREFIXES.some((prefix) => (
    trimmed === prefix ||
    trimmed.startsWith(`${prefix}/`) ||
    trimmed.startsWith(`${prefix}?`)
  ))
    ? trimmed
    : undefined
}

export function appendReturnTo(href: string, returnTo?: string): string {
  const safeReturnTo = sanitizeReturnTo(returnTo)
  if (!safeReturnTo) return href

  const separator = href.includes('?') ? '&' : '?'
  const params = new URLSearchParams({ returnTo: safeReturnTo })
  return `${href}${separator}${params.toString()}`
}
