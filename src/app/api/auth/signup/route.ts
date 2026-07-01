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
import { captureServerImmediate, captureServerAnonymous } from '@/lib/posthog/server'
import { EVENT_USER_SIGNED_UP, EVENT_AUTH_SIGNUP_FAILED } from '@/lib/posthog/events'
import { archetypeBySlug } from '@/lib/calibration/deriveArchetype'
import { z, ZodError } from 'zod'

const RequestSchema = protectedSignupSchema.extend({
  redirectTo: z.string().trim().max(2048).optional(),
  // Carried from the public archetype quiz (`/quiz/archetype?a=<slug>` -> signup CTA)
  // so a quiz taker's result claims their profile the moment they create an account.
  // Optional and best-effort: an invalid/missing slug never blocks signup.
  archetype: z.string().trim().max(64).optional(),
})

// Fire-and-forget: writes the quiz archetype onto the new profile. Never awaited
// by the caller, and any failure is swallowed — claiming a quiz result is a nice-to-have,
// not a signup requirement.
async function claimQuizArchetype(admin: ReturnType<typeof createAdminClient>, userId: string, slug: string) {
  const archetype = archetypeBySlug(slug)
  if (!archetype) return
  try {
    await admin
      .from('profiles')
      .update({ archetype: archetype.name, archetype_description: archetype.description })
      .eq('id', userId)
  } catch (e) {
    console.error('[signup] quiz archetype claim failed:', e)
  }
}

// Every failure response also lands in PostHog so signup success rate is a
// real funnel (attempts vs. completions), independent of error masking.
async function fail(status: number, code: string, message: string, details?: Record<string, unknown>) {
  await captureServerAnonymous(EVENT_AUTH_SIGNUP_FAILED, { code, status })
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

export async function POST(request: NextRequest) {
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
  const { email, password, name, turnstileToken, website } = body

  if (isHoneypotFilled(website)) {
    return fail(400, 'bot_trap_triggered', 'Unable to submit this form.')
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:signup:ip:${ip}`, limit: 5, windowSec: 60 * 60 },
    { key: `auth:signup:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return fail(400, 'turnstile_failed', turnstileErrorMessage(turnstile))
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
    return fail(400, 'signup_failed', error.message)
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
      properties: { method: 'email_password' },
    })
    if (body.archetype) {
      void claimQuizArchetype(admin, data.user.id, body.archetype)
    }
  }

  return NextResponse.json({
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
  })
}
