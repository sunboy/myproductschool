import { NextResponse, type NextRequest } from 'next/server'
import { AFFILIATE_COOKIE_NAME, affiliatesEnabled } from '@/lib/affiliate/config'
import { applyReferralAttribution } from '@/lib/affiliate/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { protectedSignupSchema } from '@/lib/auth/validation'
import { isHoneypotFilled, turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'
import { apiError } from '@/lib/api/error'
import { sendWelcomeEmail } from '@/lib/email/transactional'
import { captureServerImmediate } from '@/lib/posthog/server'
import { EVENT_USER_SIGNED_UP, EVENT_SIGNUP_FROM_MAGNET } from '@/lib/posthog/events'
import { z, ZodError } from 'zod'

const RequestSchema = protectedSignupSchema.extend({
  redirectTo: z.string().trim().max(2048).optional(),
  magnetSource: z.string().trim().max(128).optional(),
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

export async function POST(request: NextRequest) {
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
  const { email, password, name, turnstileToken, website, magnetSource } = body

  if (isHoneypotFilled(website)) {
    return apiError(400, 'bot_trap_triggered', 'Unable to submit this form.')
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:signup:ip:${ip}`, limit: 5, windowSec: 60 * 60 },
    { key: `auth:signup:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return apiError(400, 'turnstile_failed', turnstileErrorMessage(turnstile))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { display_name: name } : undefined,
      emailRedirectTo: sameOriginRedirect(request, body.redirectTo, '/dashboard'),
    },
  })

  if (error) {
    return apiError(400, 'signup_failed', error.message)
  }

  if (data.user?.id) {
    const admin = createAdminClient()
    if (affiliatesEnabled()) {
      await applyReferralAttribution(
        admin,
        data.user.id,
        request.cookies.get(AFFILIATE_COOKIE_NAME)?.value
      )
    }
    // Fire-and-forget welcome email. With email confirmation disabled, signups
    // land here with a session and never pass through /auth/callback, so this is
    // the welcome hook for email/password users. The `welcome:${userId}`
    // dedupeKey makes it once-only and safe alongside the OAuth callback send.
    void sendWelcomeEmail(admin, {
      userId: data.user.id,
      name: name ?? null,
    })
    void captureServerImmediate({
      distinctId: data.user.id,
      event: EVENT_USER_SIGNED_UP,
      properties: {
        method: 'email_password',
        ...(magnetSource ? { from_magnet: true } : {}),
      },
    })
    if (magnetSource) {
      void captureServerImmediate({
        distinctId: data.user.id,
        event: EVENT_SIGNUP_FROM_MAGNET,
        properties: { source_slug: magnetSource },
      })
    }
  }

  return NextResponse.json({
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
  })
}
