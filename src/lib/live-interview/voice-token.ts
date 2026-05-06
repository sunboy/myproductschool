import { createHmac, timingSafeEqual } from 'node:crypto'

export const LIVE_INTERVIEW_VOICE_TOKEN_TTL_MS = 30 * 60 * 1000

export interface LiveInterviewVoiceTokenPayload {
  sessionId: string
  userId: string
  exp: number
}

function signingSecret() {
  return process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.CRON_SECRET
    ?? ''
}

function sign(value: string) {
  const secret = signingSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createLiveInterviewVoiceToken(
  input: { sessionId: string; userId: string },
  now = Date.now()
) {
  const payload: LiveInterviewVoiceTokenPayload = {
    sessionId: input.sessionId,
    userId: input.userId,
    exp: now + LIVE_INTERVIEW_VOICE_TOKEN_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = sign(encoded)
  if (!signature) return null
  return `${encoded}.${signature}`
}

export function verifyLiveInterviewVoiceToken(
  token: string | null | undefined,
  expectedSessionId: string,
  now = Date.now()
): LiveInterviewVoiceTokenPayload | null {
  if (!token) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  if (!expected) return null

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<LiveInterviewVoiceTokenPayload>
    if (payload.sessionId !== expectedSessionId) return null
    if (!payload.userId || typeof payload.exp !== 'number') return null
    if (payload.exp <= now) return null
    return {
      sessionId: payload.sessionId,
      userId: payload.userId,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}
