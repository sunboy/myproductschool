import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp } from '@/lib/auth/rate-limit'
import { firstZodError, turnstileTokenSchema } from '@/lib/auth/validation'
import { turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'

const VerifyTurnstileSchema = z.object({
  token: turnstileTokenSchema,
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = VerifyTurnstileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  const result = await verifyTurnstileToken({
    token: parsed.data.token,
    remoteIp: getClientIp(request),
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: turnstileErrorMessage(result) },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, skipped: Boolean(result.skipped) })
}
