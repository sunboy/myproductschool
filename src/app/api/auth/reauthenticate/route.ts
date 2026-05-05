import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  findRateLimitBlock,
  getClientIp,
} from '@/lib/auth/rate-limit'
import {
  createReauthToken,
  REAUTH_COOKIE_NAME,
  REAUTH_MAX_AGE_SECONDS,
} from '@/lib/auth/reauth'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  password: z.string().min(1, 'Current password is required.'),
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
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const { password } = body
  if (!user.email) return NextResponse.json({ error: 'Password reauthentication is not available for this account.' }, { status: 400 })

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:reauth:ip:${ip}`, limit: 10, windowSec: 10 * 60 },
    { key: `auth:reauth:user:${user.id}`, limit: 5, windowSec: 10 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (error) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })

  const token = createReauthToken(user.id)
  if (!token) return NextResponse.json({ error: 'Reauthentication is not configured.' }, { status: 500 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(REAUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REAUTH_MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}
