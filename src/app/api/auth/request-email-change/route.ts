import { NextResponse } from 'next/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { emailChangeSchema, firstZodError } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/server'

interface EmailChangeBodyExtras {
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
  const body = await request.json().catch(() => ({})) as EmailChangeBodyExtras
  const parsed = emailChangeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Email changes require an email account.' }, { status: 400 })
  }

  const { email, currentPassword } = parsed.data
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Enter a different email.' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:email-change:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
    { key: `auth:email-change:user:${user.id}`, limit: 3, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  }

  const { error: updateError } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: sameOriginRedirect(request, body.redirectTo, '/auth/callback?next=/settings') }
  )
  if (updateError) {
    return NextResponse.json({ error: 'Could not request email change.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, email })
}
