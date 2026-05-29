import { rateLimit } from '@/lib/security/rate-limit'

export interface AuthRateLimitCheck {
  key: string
  limit: number
  windowSec: number
}

export interface AuthRateLimitBlock {
  retryAfter: number
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    forwardedFor ??
    'unknown'
  )
}

export function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

export async function findRateLimitBlock(checks: AuthRateLimitCheck[]): Promise<AuthRateLimitBlock | null> {
  for (const check of checks) {
    const result = await rateLimit(check)
    if (!result.allowed) {
      return { retryAfter: retryAfterSeconds(result.resetAt) }
    }
  }

  return null
}

export function sameOriginRedirect(request: Request, raw: string | undefined, fallbackPath: string) {
  const requestUrl = new URL(request.url)
  if (!raw) return new URL(fallbackPath, requestUrl.origin).toString()

  try {
    const candidate = new URL(raw, requestUrl.origin)
    if (candidate.origin === requestUrl.origin) return candidate.toString()
  } catch {
    // Fall through to the known local fallback.
  }

  return new URL(fallbackPath, requestUrl.origin).toString()
}
