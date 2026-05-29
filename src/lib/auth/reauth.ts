import { createHmac, timingSafeEqual } from 'node:crypto'

export const REAUTH_COOKIE_NAME = 'reauth_token'
export const REAUTH_MAX_AGE_SECONDS = 5 * 60

type ReauthPayload = {
  sub: string
  iat: number
  exp: number
}

function signingSecret() {
  return process.env.REAUTH_TOKEN_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.CRON_SECRET
    ?? ''
}

function sign(value: string) {
  const secret = signingSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=')
    if (rawKey === name) return rawValue.join('=') || null
  }

  return null
}

export function createReauthToken(userId: string, now = Date.now()) {
  const payload: ReauthPayload = {
    sub: userId,
    iat: now,
    exp: now + REAUTH_MAX_AGE_SECONDS * 1000,
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = sign(encoded)
  if (!signature) return null
  return `${encoded}.${signature}`
}

export function verifyReauthToken(token: string | null | undefined, userId: string, now = Date.now()) {
  if (!token) return false

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return false

  const expected = sign(encoded)
  if (!expected) return false

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<ReauthPayload>
    return payload.sub === userId
      && typeof payload.exp === 'number'
      && payload.exp > now
  } catch {
    return false
  }
}

export function hasValidReauthToken(request: Request, userId: string) {
  return verifyReauthToken(cookieValue(request, REAUTH_COOKIE_NAME), userId)
}
