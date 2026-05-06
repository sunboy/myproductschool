import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
} from '@/lib/auth/rate-limit'
import {
  createReauthToken,
  REAUTH_COOKIE_NAME,
  REAUTH_MAX_AGE_SECONDS,
} from '@/lib/auth/reauth'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  password: z.string().min(1, 'Current password is required.'),
})

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
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

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
  const { password } = body
  if (!user.email) return apiError(400, 'email_account_required', 'Password reauthentication is not available for this account.')

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:reauth:ip:${ip}`, limit: 10, windowSec: 10 * 60 },
    { key: `auth:reauth:user:${user.id}`, limit: 5, windowSec: 10 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (error) return apiError(401, 'invalid_current_password', 'Current password is incorrect.')

  const token = createReauthToken(user.id)
  if (!token) return apiError(500, 'reauth_not_configured', 'Reauthentication is not configured.')

  const response = NextResponse.json({ ok: true })
  response.cookies.set(REAUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REAUTH_MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}
