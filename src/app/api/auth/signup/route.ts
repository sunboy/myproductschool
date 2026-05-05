import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
  normalizeAuthEmail,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'

interface SignupBody {
  email?: string
  password?: string
  name?: string
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
  const body = await request.json().catch(() => ({})) as SignupBody
  const email = normalizeAuthEmail(body.email ?? '')
  const password = body.password ?? ''
  const name = body.name?.trim() ?? ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:signup:ip:${ip}`, limit: 5, windowSec: 60 * 60 },
    { key: `auth:signup:email:${email}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

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
