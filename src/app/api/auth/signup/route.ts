import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { protectedSignupSchema } from '@/lib/auth/validation'
import { isHoneypotFilled, turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'
import { z, ZodError } from 'zod'

const RequestSchema = protectedSignupSchema.extend({
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
  const { email, password, name, turnstileToken, website } = body

  if (isHoneypotFilled(website)) {
    return NextResponse.json({ error: 'Unable to submit this form.' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:signup:ip:${ip}`, limit: 5, windowSec: 60 * 60 },
    { key: `auth:signup:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const turnstile = await verifyTurnstileToken({ token: turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstileErrorMessage(turnstile) }, { status: 400 })
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    userId: data.user?.id ?? null,
    hasSession: Boolean(data.session),
  })
}
