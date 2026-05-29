import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  appUrlFromRequest,
  referralLandingPath,
  recordAffiliateClick,
  setAffiliateCookies,
} from '@/lib/stripe/affiliates'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const appUrl = appUrlFromRequest(req)
  const landingPath = referralLandingPath(req)
  const redirectUrl = new URL(landingPath, appUrl)
  const supabase = createAdminClient()

  const click = await recordAffiliateClick(supabase, req, code, landingPath)
  const response = NextResponse.redirect(redirectUrl)

  if (click) {
    setAffiliateCookies(response, {
      code: click.partner.slug,
      clickId: click.clickId,
      visitorId: click.visitorId,
    })
  }

  return response
}
