import { NextResponse } from 'next/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { hasValidReauthToken } from '@/lib/auth/reauth'
import { emailChangeSchema } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const RequestSchema = emailChangeSchema.extend({
  redirectTo: z.string().trim().max(2048).optional(),
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

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return apiError(401, 'auth_required', 'auth_required')
  }

  if (!user.email) {
    return apiError(400, 'email_account_required', 'Email changes require an email account.')
  }
  if (!hasValidReauthToken(request, user.id)) {
    return apiError(403, 'reauth_required', 'reauth_required')
  }

  const { email, currentPassword } = body
  if (email === user.email.toLowerCase()) {
    return apiError(400, 'same_email', 'Enter a different email.')
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:email-change:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
    { key: `auth:email-change:user:${user.id}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return apiError(400, 'invalid_current_password', 'Current password is incorrect.')
  }

  const { error: updateError } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: sameOriginRedirect(request, body.redirectTo, '/auth/callback?next=/settings') }
  )
  if (updateError) {
    return apiError(400, 'email_change_failed', 'Could not request email change.')
  }

  return NextResponse.json({ ok: true, email })
}
