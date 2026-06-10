import { NextResponse, type NextRequest } from 'next/server'
import { AFFILIATE_COOKIE_NAME, affiliatesEnabled } from '@/lib/affiliate/config'
import { applyReferralAttribution } from '@/lib/affiliate/server'
import { FIT_CLAIM_COOKIE, claimPublicFitReports } from '@/lib/careerops/public/claim'
import { sendWelcomeEmail } from '@/lib/email/transactional'
import { captureServerImmediate } from '@/lib/posthog/server'
import { EVENT_USER_SIGNED_UP } from '@/lib/posthog/events'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('next')
  if (!raw) return null

  try {
    const candidate = new URL(raw, request.url)
    if (candidate.origin !== request.nextUrl.origin) return null
    return `${candidate.pathname}${candidate.search}${candidate.hash}`
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const admin = createAdminClient()

  // Fire-and-forget welcome email. The `welcome:${userId}` dedupeKey guarantees
  // it sends only once per user, so repeat confirmations / magic-link logins /
  // OAuth sign-ins never trigger a second send. Never await — email must not
  // block the redirect.
  void sendWelcomeEmail(admin, {
    userId: data.user.id,
    name:
      (data.user.user_metadata?.display_name as string | undefined) ??
      (data.user.user_metadata?.name as string | undefined) ??
      null,
  })

  // Fire-and-forget signup event. The welcome email dedupeKey ensures once-only
  // delivery; we match that pattern here — the provider identifies OAuth vs email.
  const oauthProvider = (data.user.app_metadata?.provider as string | undefined) ?? 'oauth'
  void captureServerImmediate({
    distinctId: data.user.id,
    event: EVENT_USER_SIGNED_UP,
    properties: {
      method: 'oauth' as const,
      provider: oauthProvider,
    },
  })

  if (affiliatesEnabled()) {
    await applyReferralAttribution(
      admin,
      data.user.id,
      request.cookies.get(AFFILIATE_COOKIE_NAME)?.value
    )
  }

  // Claim any anonymous /job-fit report this visitor ran before signing up.
  // Best-effort by contract: claimPublicFitReports never throws, and is not
  // awaited so it can never delay the redirect.
  void claimPublicFitReports(admin, data.user.id, request.cookies.get(FIT_CLAIM_COOKIE)?.value)

  const { data: profile } = await admin
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', data.user.id)
    .single()

  const destination = profile?.onboarding_completed_at
    ? safeNextPath(request) ?? '/dashboard'
    : '/dashboard'
  return NextResponse.redirect(new URL(destination, request.url))
}
