import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createLiveInterviewVoiceToken } from '@/lib/live-interview/voice-token'

export const runtime = 'nodejs'

const SAMPLE_RATE = 16000
const DEEPGRAM_TOKEN_TTL_SECONDS = 60

function publicOrigin(request: Request) {
  const configured = process.env.DEEPGRAM_VOICE_THINK_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? null
  if (configured) return configured.replace(/\/$/, '')
  return new URL(request.url).origin
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
        language: 'en',
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
            url: `${publicOrigin(request)}/api/live-interview/${id}/voice-think`,
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
