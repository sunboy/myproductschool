import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createLiveInterviewVoiceToken, signingSecretSource } from '@/lib/live-interview/voice-token'

export const runtime = 'nodejs'

const SAMPLE_RATE = 16000
const DEEPGRAM_TOKEN_TTL_SECONDS = 3600

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin)
    // URL parsing yields '[::1]' (with brackets) for the IPv6 loopback.
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]'
    )
  } catch {
    return false
  }
}

type OriginSource = 'env-var' | 'env-var-local' | 'request-origin' | 'request-origin-local'

function voiceThinkOrigin(request: Request): {
  origin: string | null
  needsPublicCallback: boolean
  source: OriginSource
} {
  // 1. Explicit override (e.g. a tunnel URL for local dev).
  const explicit = process.env.DEEPGRAM_VOICE_THINK_BASE_URL?.trim()
  if (explicit) {
    const origin = explicit.replace(/\/$/, '')
    if (isLocalOrigin(origin)) {
      return { origin: null, needsPublicCallback: true, source: 'env-var-local' }
    }
    return { origin, needsPublicCallback: false, source: 'env-var' }
  }

  // 2. The request's own origin. Every deployment (prod, preview, custom domain)
  //    then calls back to the exact host serving it — no cross-host redirect, which
  //    is what broke prod (apex NEXT_PUBLIC_APP_URL 307-redirected to www).
  const requestOrigin = new URL(request.url).origin
  if (!isLocalOrigin(requestOrigin)) {
    return { origin: requestOrigin, needsPublicCallback: false, source: 'request-origin' }
  }

  // 3. Request is localhost. Deepgram can't reach it — fail loudly rather than
  //    silently baking NEXT_PUBLIC_APP_URL (which sends the callback to the wrong
  //    environment). Set DEEPGRAM_VOICE_THINK_BASE_URL to a tunnel for local voice.
  return { origin: null, needsPublicCallback: true, source: 'request-origin-local' }
}

async function createDeepgramAccessToken() {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl_seconds: DEEPGRAM_TOKEN_TTL_SECONDS }),
  })

  if (!response.ok) return null
  const body = await response.json().catch(() => null) as { access_token?: string } | null
  return body?.access_token ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const requestId = randomUUID()

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  const adminClient = createAdminClient()
  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('id, user_id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session || session.status !== 'active') {
    return apiError(404, 'session_not_found', 'Session not found or not active')
  }

  const callback = voiceThinkOrigin(request)
  console.log('[voice-settings]', JSON.stringify({
    requestId,
    sessionId: id,
    requestOrigin: new URL(request.url).origin,
    originSource: callback.source,
    callbackOrigin: callback.origin,
    needsPublicCallback: callback.needsPublicCallback,
    signingSecretSource: signingSecretSource(),
  }))
  if (callback.needsPublicCallback || !callback.origin) {
    return apiError(
      503,
      'voice_callback_unconfigured',
      'Voice needs a public callback URL for local dev. Set DEEPGRAM_VOICE_THINK_BASE_URL, or use chat here.',
      { feature: 'voice', requiresPublicCallback: true }
    )
  }

  const token = createLiveInterviewVoiceToken({
    sessionId: id,
    userId: user.id,
  })
  if (!token) {
    return apiError(503, 'voice_unavailable', 'Voice mode is unavailable. Use chat mode.')
  }
  const deepgramToken = await createDeepgramAccessToken()
  if (!deepgramToken) {
    return apiError(503, 'voice_unavailable', 'Voice mode is unavailable. Use chat mode.')
  }

  return Response.json({
    deepgramToken,
    requestId,
    callbackOrigin: callback.origin,
    settings: {
      type: 'Settings',
      tags: ['hackproduct', 'live_interview'],
      mip_opt_out: true,
      flags: { history: true },
      audio: {
        input: { encoding: 'linear16', sample_rate: SAMPLE_RATE },
        output: { encoding: 'linear16', sample_rate: SAMPLE_RATE },
      },
      agent: {
        listen: {
          provider: {
            type: 'deepgram',
            model: 'nova-3',
            language: 'en-US',
            smart_format: true,
          },
        },
        think: {
          provider: {
            type: 'open_ai',
            model: 'hackproduct-live-interview',
            temperature: 0.7,
          },
          endpoint: {
            url: `${callback.origin}/api/live-interview/${id}/voice-think`,
            headers: {
              authorization: `Bearer ${token}`,
              'x-hp-voice-request-id': requestId,
            },
          },
          context_length: 'max',
        },
        speak: {
          provider: {
            type: 'deepgram',
            model: 'aura-2-asteria-en',
          },
        },
      },
    },
  })
}
