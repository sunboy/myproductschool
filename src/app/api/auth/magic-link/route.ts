import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { magicLinkRequestSchema } from '@/lib/auth/validation'
import { turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'
import { z, ZodError } from 'zod'

const RequestSchema = magicLinkRequestSchema.extend({
  redirectTo: z.string().trim().max(2048).optional(),
})

function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'rate_limited', retryAfter },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
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
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { email, turnstileToken } = body

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:magic-link:${ip}:${email}`, limit: 1, windowSec: 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstileErrorMessage(turnstile) }, { status: 400 })
  }

  const supabase = await createClient()
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: sameOriginRedirect(request, body.redirectTo, '/auth/callback'),
    },
  })

  return NextResponse.json({ ok: true })
}
