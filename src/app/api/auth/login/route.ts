import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findRateLimitBlock, getClientIp } from '@/lib/auth/rate-limit'
import { loginSchema } from '@/lib/auth/validation'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const RequestSchema = loginSchema

function rateLimitedResponse(retryAfter: number) {
  const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
  response.headers.set('Retry-After', String(retryAfter))
  return response
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(request: Request) {
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }
  const { email, password } = body

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:login:ip:${ip}`, limit: 10, windowSec: 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return apiError(401, 'invalid_credentials', error?.message ?? 'Sign in failed')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('onboarding_completed_at, display_name')
    .eq('id', data.user.id)
    .single()

  const meta = data.user.user_metadata
  const metaName = meta?.display_name ?? meta?.full_name ?? meta?.name ?? null
  if (!profile?.display_name && typeof metaName === 'string' && metaName.trim()) {
    await admin
      .from('profiles')
      .update({ display_name: metaName.trim() })
      .eq('id', data.user.id)
  }

  return NextResponse.json({
    userId: data.user.id,
    onboardingCompleted: Boolean(profile?.onboarding_completed_at),
  })
}
