import { NextResponse, type NextRequest } from 'next/server'
import { AFFILIATE_COOKIE_MAX_AGE, AFFILIATE_COOKIE_NAME, normalizeAffiliateCode } from '@/lib/affiliate/config'
import { hashAffiliateSignal } from '@/lib/affiliate/server'
import { getClientIp } from '@/lib/auth/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params
  const code = normalizeAffiliateCode(rawCode)
  const destination = new URL('/', request.url)

  if (process.env.NEXT_PUBLIC_ENABLE_AFFILIATES !== 'true') {
    return NextResponse.redirect(destination)
  }

  if (!code) {
    return NextResponse.redirect(destination)
  }

  destination.searchParams.set('ref', code)

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('code', code)
    .maybeSingle()

  const response = NextResponse.redirect(destination)
  if (!affiliate || affiliate.status === 'disabled') return response

  await admin.from('affiliate_clicks').insert({
    affiliate_id: affiliate.id,
    code,
    ip_hash: hashAffiliateSignal(getClientIp(request)),
    ua_hash: hashAffiliateSignal(request.headers.get('user-agent')),
  })

  response.cookies.set(AFFILIATE_COOKIE_NAME, code, {
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  })

  return response
}
