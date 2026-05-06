import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createStripeClient } from '@/lib/stripe/config'
import { affiliatesEnabled } from '@/lib/affiliate/config'
import { refreshAffiliateConnectAccount } from '@/lib/affiliate/connect'

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin))
}

export async function GET(request: NextRequest) {
  if (!affiliatesEnabled()) {
    return redirect(request, '/dashboard')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect(request, '/login')

  const { stripe } = createStripeClient()
  if (!stripe) return redirect(request, '/affiliate?connect=stripe-not-configured')

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, stripe_connect_account_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!affiliate?.stripe_connect_account_id) {
    return redirect(request, '/affiliate?connect=missing-account')
  }

  const { programStatus } = await refreshAffiliateConnectAccount(
    stripe,
    admin,
    affiliate.stripe_connect_account_id
  )

  return redirect(request, programStatus === 'active' ? '/affiliate?connect=complete' : '/affiliate?connect=pending')
}
