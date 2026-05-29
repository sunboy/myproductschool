import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { getClientIp } from '@/lib/auth/rate-limit'
import { turnstileTokenSchema } from '@/lib/auth/validation'
import { turnstileErrorMessage, verifyTurnstileToken } from '@/lib/security/turnstile'
import { apiError } from '@/lib/api/error'

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
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const result = await verifyTurnstileToken({
    token: body.token,
    remoteIp: getClientIp(request),
  })

  if (!result.ok) {
    return apiError(400, 'turnstile_failed', turnstileErrorMessage(result))
  }

  return NextResponse.json({ ok: true, skipped: Boolean(result.skipped) })
}
