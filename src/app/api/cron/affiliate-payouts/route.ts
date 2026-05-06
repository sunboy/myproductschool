import { NextResponse, type NextRequest } from 'next/server'
import { runAffiliatePayouts } from '@/lib/affiliate/payouts'
import { sendAffiliatePayoutEmail } from '@/lib/email/transactional'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  if (process.env.NEXT_PUBLIC_ENABLE_AFFILIATES !== 'true') {
    return NextResponse.json({ ok: true, disabled: true, paid: [], skipped: [], failed: [] })
  }

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured', detail: config.error, mode: config.mode },
      { status: 503 }
    )
  }

  const admin = createAdminClient()
  const { result, status } = await runAffiliatePayouts({
    admin,
    stripe,
    dashboardUrl: appUrl(request, '/affiliate'),
    sendEmail: input => sendAffiliatePayoutEmail(admin, input),
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json(result, { status })
}
