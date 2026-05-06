import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { findRateLimitBlock, getClientIp, sameOriginRedirect } from '@/lib/auth/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'

const RequestSchema = z.object({
  redirectTo: z.string().trim().max(2048).optional(),
})

const DeleteRequestSchema = z.object({
  provider: z.literal('google').optional().default('google'),
  identityId: z.string().trim().max(256).optional(),
})

function authRequiredResponse() {
  return apiError(401, 'auth_required', 'auth_required')
}

function providerErrorResponse(message = 'Could not update linked accounts.') {
  return apiError(400, 'identity_provider_error', message)
}

function rateLimitedResponse(retryAfter: number) {
  const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
  response.headers.set('Retry-After', String(retryAfter))
  return response
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
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return authRequiredResponse()

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:link-identity:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
    { key: `auth:link-identity:user:${user.id}`, limit: 5, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const identitiesResult = await supabase.auth.getUserIdentities()
  if (identitiesResult.error) return providerErrorResponse()

  const googleIdentity = identitiesResult.data.identities.find(identity => identity.provider === 'google')
  if (googleIdentity) {
    return NextResponse.json({ ok: true, linked: true, url: null })
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: sameOriginRedirect(request, body.redirectTo, '/auth/callback?next=/settings'),
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) return providerErrorResponse()

  return NextResponse.json({ ok: true, linked: false, url: data.url })
}

export async function DELETE(request: Request) {
  let body: z.infer<typeof DeleteRequestSchema>
  try {
    body = DeleteRequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return authRequiredResponse()

  const ip = getClientIp(request)
  const block = await findRateLimitBlock([
    { key: `auth:unlink-identity:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
    { key: `auth:unlink-identity:user:${user.id}`, limit: 5, windowSec: 60 * 60 },
  ])
  if (block) return rateLimitedResponse(block.retryAfter)

  const identitiesResult = await supabase.auth.getUserIdentities()
  if (identitiesResult.error) return providerErrorResponse()

  const identities = identitiesResult.data.identities
  const target = identities.find(identity =>
    identity.provider === body.provider &&
    (!body.identityId || identity.identity_id === body.identityId)
  )

  if (!target) {
    return NextResponse.json({ ok: true, linked: false })
  }

  if (identities.length <= 1) {
    return providerErrorResponse('Add another sign-in method before removing Google.')
  }

  const { error } = await supabase.auth.unlinkIdentity(target)
  if (error) return providerErrorResponse()

  return NextResponse.json({ ok: true, linked: false })
}
