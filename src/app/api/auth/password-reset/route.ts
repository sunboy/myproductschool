import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  normalizeAuthEmail,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'

interface PasswordResetBody {
  email?: string
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
  const body = await request.json().catch(() => ({})) as PasswordResetBody
  const email = normalizeAuthEmail(body.email ?? '')

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

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
