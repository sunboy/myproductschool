import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { firstZodError, passwordResetRequestSchema } from '@/lib/auth/validation'

interface PasswordResetBodyExtras {
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
  const body = await request.json().catch(() => ({})) as PasswordResetBodyExtras
  const parsed = passwordResetRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { email } = parsed.data

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:password-reset:ip:${ip}`, limit: 3, windowSec: 60 * 60 },
    { key: `auth:password-reset:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: sameOriginRedirect(request, body.redirectTo, '/reset-password'),
  })

  return NextResponse.json({ ok: true })
}
