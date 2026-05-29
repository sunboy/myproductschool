const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TOKEN_MAX_LENGTH = 2048

interface TurnstileSiteverifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
  'error-codes'?: string[]
}

export interface TurnstileVerificationResult {
  ok: boolean
  skipped?: boolean
  error?: string
  errorCodes?: string[]
}

interface VerifyTurnstileTokenOptions {
  token?: string | null
  remoteIp?: string | null
}

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed || null
}

export function isTurnstileConfigured() {
  return Boolean(cleanEnv(process.env.TURNSTILE_SECRET_KEY))
}

export function isTurnstileRequired() {
  return process.env.NODE_ENV === 'production' || isTurnstileConfigured()
}

function allowsTurnstileE2eFallback() {
  return process.env.TURNSTILE_E2E_FALLBACK === 'true'
}

export function isHoneypotFilled(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
}: VerifyTurnstileTokenOptions): Promise<TurnstileVerificationResult> {
  const secret = cleanEnv(process.env.TURNSTILE_SECRET_KEY)

  if (allowsTurnstileE2eFallback()) {
    return { ok: true, skipped: true }
  }

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'turnstile_not_configured' }
    }
    return { ok: true, skipped: true }
  }

  const responseToken = token?.trim() ?? ''
  if (!responseToken) {
    return { ok: false, error: 'turnstile_missing_token' }
  }

  if (responseToken.length > TOKEN_MAX_LENGTH) {
    return { ok: false, error: 'turnstile_token_too_long' }
  }

  try {
    const body: Record<string, string> = {
      secret,
      response: responseToken,
      idempotency_key: crypto.randomUUID(),
    }
    const cleanRemoteIp = remoteIp?.trim()
    if (cleanRemoteIp && cleanRemoteIp !== 'unknown') {
      body.remoteip = cleanRemoteIp
    }

    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return { ok: false, error: 'turnstile_unavailable' }
    }

    const result = await response.json() as TurnstileSiteverifyResponse
    if (!result.success) {
      return {
        ok: false,
        error: 'turnstile_failed',
        errorCodes: result['error-codes'] ?? [],
      }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'turnstile_unavailable' }
  }
}

export function turnstileErrorMessage(result: TurnstileVerificationResult) {
  if (result.error === 'turnstile_missing_token') return 'Complete the security check.'
  if (result.error === 'turnstile_token_too_long') return 'Refresh the security check and try again.'
  return 'Security check failed. Try again.'
}
