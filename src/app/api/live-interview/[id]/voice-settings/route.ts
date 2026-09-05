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

  // 2. The public host that actually served this request. On Vercel, the function's
  //    own `request.url` does NOT reliably resolve to the canonical public host —
  //    it can be an internal/deployment origin — so Deepgram's server-to-server
  //    callback to that URL never lands (voice-settings logs a 200 but voice-think
  //    is never hit). Resolve from the forwarded host header instead, mirroring the
  //    working chat route. `request.url` stays only as a last-resort fallback.
  const host = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https'
  const requestOrigin = host ? `${proto}://${host}` : new URL(request.url).origin
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
    hostHeader: request.headers.get('host'),
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
        // Flux is Deepgram's turn-aware STT: it detects end-of-turn from the
        // speech itself instead of a fixed silence timeout, which removes most
        // of the dead air between the candidate finishing and Hatch replying.
        // eager_eot starts the think call before the turn fully closes (more
        // LLM calls, lower perceived latency). LIVE_VOICE_FLUX=0 reverts to
        // nova-3 if Flux misbehaves for an account or region.
        listen: process.env.LIVE_VOICE_FLUX === '0'
          ? {
              provider: {
                type: 'deepgram',
                model: 'nova-3',
                language: 'en-US',
                smart_format: true,
              },
            }
          : {
              provider: {
                type: 'deepgram',
                model: 'flux-general-en',
                version: 'v2',
                // Flux infers language from its model; the Voice Agent schema
                // rejects the Nova-only language option for this provider.
                eot_threshold: 0.7,
                eager_eot_threshold: 0.5,
                eot_timeout_ms: 4000,
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
