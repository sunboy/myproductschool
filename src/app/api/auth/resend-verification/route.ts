import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { firstZodError, resendVerificationSchema } from '@/lib/auth/validation'

interface ResendVerificationBodyExtras {
  redirectTo?: string
}

function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'rate_limited', retryAfter },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as ResendVerificationBodyExtras
  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { email } = parsed.data

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
