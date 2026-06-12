import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { protectedPasswordResetRequestSchema } from '@/lib/auth/validation'
import { turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'
import { apiError } from '@/lib/api/error'
import { captureServerAnonymous } from '@/lib/posthog/server'
import { EVENT_AUTH_PASSWORD_RESET_FAILED } from '@/lib/posthog/events'
import { z, ZodError } from 'zod'

const RequestSchema = protectedPasswordResetRequestSchema.extend({
  redirectTo: z.string().trim().max(2048).optional(),
})

// Every failure response also lands in PostHog so this funnel's success
// rate is alertable, independent of error masking.
async function fail(status: number, code: string, message: string, details?: Record<string, unknown>) {
  await captureServerAnonymous(EVENT_AUTH_PASSWORD_RESET_FAILED, { code, status })
  return apiError(status, code, message, details)
}

async function rateLimitedResponse(retryAfter: number) {
  const response = await fail(429, 'rate_limited', 'rate_limited', { retryAfter })
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
      return fail(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return fail(400, 'invalid_json', 'Invalid JSON body')
  }
  const { email, turnstileToken } = body

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:password-reset:ip:${ip}`, limit: 3, windowSec: 60 * 60 },
    { key: `auth:password-reset:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return fail(400, 'turnstile_failed', turnstileErrorMessage(turnstile))
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: sameOriginRedirect(request, body.redirectTo, '/reset-password'),
  })

  return NextResponse.json({ ok: true })
}
