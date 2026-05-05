import { createHmac, timingSafeEqual } from 'node:crypto'

export type NotificationPreferenceKey =
  | 'streak_reminder'
  | 'weekly_digest'
  | 'completion_email'
  | 'marketing'
  | 'push_enabled'
  | 'discussion_reply'
  | 'billing_alerts'

interface UnsubscribePayload {
  userId: string
  preference: NotificationPreferenceKey
}

const PREFERENCES = new Set<NotificationPreferenceKey>([
  'streak_reminder',
  'weekly_digest',
  'completion_email',
  'marketing',
  'push_enabled',
  'discussion_reply',
  'billing_alerts',
])

function signingSecret() {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET
    ?? process.env.CRON_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? ''
}

function base64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function sign(value: string) {
  const secret = signingSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createUnsubscribeToken(payload: UnsubscribePayload) {
  const encoded = base64Url(JSON.stringify(payload))
  const signature = sign(encoded)
  if (!signature) return null
  return `${encoded}.${signature}`
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  if (!expected) return null

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<UnsubscribePayload>
    if (!parsed.userId || !parsed.preference) return null
    if (!PREFERENCES.has(parsed.preference)) return null
    return {
      userId: parsed.userId,
      preference: parsed.preference,
    }
  } catch {
    return null
  }
}
