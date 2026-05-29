import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { resendVerificationSchema } from '@/lib/auth/validation'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const RequestSchema = resendVerificationSchema.extend({
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
  const { email } = body

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:resend-verification:${ip}:${email}`, limit: 1, windowSec: 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const supabase = await createClient()
  await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: sameOriginRedirect(request, body.redirectTo, '/dashboard'),
    },
  })

  return NextResponse.json({ ok: true })
}
