import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { getClientIp } from '@/lib/auth/rate-limit'
import { turnstileTokenSchema } from '@/lib/auth/validation'
import { turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'

const RequestSchema = z.object({
  token: turnstileTokenSchema,
})

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

  const result = await verifyTurnstileToken({
    token: body.token,
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
