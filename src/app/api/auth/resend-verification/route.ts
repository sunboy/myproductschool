import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { resendVerificationSchema } from '@/lib/auth/validation'
import { z, ZodError } from 'zod'

const RequestSchema = resendVerificationSchema.extend({
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
