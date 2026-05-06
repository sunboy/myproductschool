import { NextResponse } from 'next/server'
import {
  findRateLimitBlock,
  getClientIp,
  sameOriginRedirect,
} from '@/lib/auth/rate-limit'
import { hasValidReauthToken } from '@/lib/auth/reauth'
import { emailChangeSchema } from '@/lib/auth/validation'
import { createClient } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'

const RequestSchema = emailChangeSchema.extend({
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

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json({ error: 'Email changes require an email account.' }, { status: 400 })
  }
  if (!hasValidReauthToken(request, user.id)) {
    return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
  }

  const { email, currentPassword } = body
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
