import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findRateLimitBlock, getClientIp } from '@/lib/auth/rate-limit'
import { loginSchema } from '@/lib/auth/validation'
import { z, ZodError } from 'zod'

const RequestSchema = loginSchema

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
  const { email, password } = body

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
