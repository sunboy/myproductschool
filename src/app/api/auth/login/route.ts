import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findRateLimitBlock, getClientIp, normalizeAuthEmail } from '@/lib/auth/rate-limit'

interface LoginBody {
  email?: string
  password?: string
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
  const body = await request.json().catch(() => ({})) as LoginBody
  const email = normalizeAuthEmail(body.email ?? '')
  const password = body.password ?? ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:login:ip:${ip}`, limit: 10, windowSec: 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'Sign in failed' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('onboarding_completed_at, display_name')
    .eq('id', data.user.id)
    .single()

  const meta = data.user.user_metadata
  const metaName = meta?.display_name ?? meta?.full_name ?? meta?.name ?? null
  if (!profile?.display_name && typeof metaName === 'string' && metaName.trim()) {
    await admin
      .from('profiles')
      .update({ display_name: metaName.trim() })
      .eq('id', data.user.id)
  }

  return NextResponse.json({
    userId: data.user.id,
    onboardingCompleted: Boolean(profile?.onboarding_completed_at),
  })
}
