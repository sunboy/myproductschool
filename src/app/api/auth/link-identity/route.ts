import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sameOriginRedirect } from '@/lib/auth/rate-limit'
import { createClient } from '@/lib/supabase/server'

const linkIdentitySchema = z.object({
  redirectTo: z.string().trim().max(2048).optional(),
})

const unlinkIdentitySchema = z.object({
  provider: z.literal('google').optional().default('google'),
  identityId: z.string().trim().max(256).optional(),
})

function authRequiredResponse() {
  return NextResponse.json({ error: 'auth_required' }, { status: 401 })
}

function providerErrorResponse(message = 'Could not update linked accounts.') {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = linkIdentitySchema.safeParse(body)
  if (!parsed.success) {
    return providerErrorResponse('Check the redirect URL and try again.')
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
      redirectTo: sameOriginRedirect(request, parsed.data.redirectTo, '/auth/callback?next=/settings'),
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) return providerErrorResponse()

  return NextResponse.json({ ok: true, linked: false, url: data.url })
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = unlinkIdentitySchema.safeParse(body)
  if (!parsed.success) {
    return providerErrorResponse()
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return authRequiredResponse()

  const identitiesResult = await supabase.auth.getUserIdentities()
  if (identitiesResult.error) return providerErrorResponse()

  const identities = identitiesResult.data.identities
  const target = identities.find(identity =>
    identity.provider === parsed.data.provider &&
    (!parsed.data.identityId || identity.identity_id === parsed.data.identityId)
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
