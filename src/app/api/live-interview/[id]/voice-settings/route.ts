import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createLiveInterviewVoiceToken } from '@/lib/live-interview/voice-token'

export const runtime = 'nodejs'

const SAMPLE_RATE = 16000
const DEEPGRAM_TOKEN_TTL_SECONDS = 3600

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

function voiceThinkOrigin(request: Request) {
  const explicit = process.env.DEEPGRAM_VOICE_THINK_BASE_URL?.trim()
  if (explicit) {
    const origin = explicit.replace(/\/$/, '')
    if (isLocalOrigin(origin)) {
      return {
        origin: null,
        needsPublicCallback: true,
      }
    }

    return {
      origin,
      needsPublicCallback: false,
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl) {
    const origin = appUrl.replace(/\/$/, '')
    if (!isLocalOrigin(origin)) {
      return {
        origin,
        needsPublicCallback: false,
      }
    }
  }

  const requestOrigin = new URL(request.url).origin
  if (isLocalOrigin(requestOrigin)) {
    return {
      origin: null,
      needsPublicCallback: true,
    }
  }

  return {
    origin: requestOrigin,
    needsPublicCallback: false,
  }
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
