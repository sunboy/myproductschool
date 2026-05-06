import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { sameOriginRedirect } from '@/lib/auth/rate-limit'
import { createClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  redirectTo: z.string().trim().max(2048).optional(),
})

const DeleteRequestSchema = z.object({
  provider: z.literal('google').optional().default('google'),
  identityId: z.string().trim().max(256).optional(),
})

function authRequiredResponse() {
  return NextResponse.json({ error: 'auth_required' }, { status: 401 })
}

function providerErrorResponse(message = 'Could not update linked accounts.') {
  return NextResponse.json({ error: message }, { status: 400 })
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
  if (userError || !user) return authRequiredResponse()

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
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return authRequiredResponse()

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
