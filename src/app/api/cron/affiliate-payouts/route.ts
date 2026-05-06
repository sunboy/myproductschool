import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { sendAffiliatePayoutEmail } from '@/lib/email/transactional'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'

type CommissionRow = {
  id: string
  affiliate_id: string
  amount_cents: number | string
  currency: string
}

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  stripe_connect_account_id: string | null
  status: string
}

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

function toCents(value: number | string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function groupCommissions(rows: CommissionRow[]) {
  const groups = new Map<string, CommissionRow[]>()
  for (const row of rows) {
    const current = groups.get(row.affiliate_id) ?? []
    current.push(row)
    groups.set(row.affiliate_id, current)
  }
  return groups
}

function hasActiveTransfers(account: Stripe.Account) {
  return account.capabilities?.transfers === 'active' || account.payouts_enabled
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured', detail: config.error, mode: config.mode },
      { status: 503 }
    )
  }

  const admin = createAdminClient()
  const { data: pendingRows, error } = await admin
    .from('affiliate_commissions')
    .select('id, affiliate_id, amount_cents, currency')
    .eq('status', 'pending')
    .eq('currency', 'usd')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const commissions = (pendingRows ?? []) as CommissionRow[]
  if (commissions.length === 0) {
    return NextResponse.json({ ok: true, paid: [], skipped: [], failed: [] })
  }

  const grouped = groupCommissions(commissions)
  const { data: affiliateRows } = await admin
    .from('affiliates')
    .select('id, user_id, code, stripe_connect_account_id, status')
    .in('id', [...grouped.keys()])

  const affiliates = new Map((affiliateRows ?? []).map(row => [row.id, row as AffiliateRow]))
  const paid: Array<{ affiliateId: string; transferId: string; amount: number; commissions: number }> = []
  const skipped: Array<{ affiliateId: string; reason: string }> = []
  const failed: Array<{ affiliateId: string; reason: string }> = []

  for (const [affiliateId, rows] of grouped) {
    const affiliate = affiliates.get(affiliateId)
    if (!affiliate) {
      skipped.push({ affiliateId, reason: 'affiliate_not_found' })
      continue
    }
    if (affiliate.status !== 'active' || !affiliate.stripe_connect_account_id) {
      skipped.push({ affiliateId, reason: 'connect_not_active' })
      continue
    }

    try {
      const account = await stripe.accounts.retrieve(affiliate.stripe_connect_account_id)
      if (!hasActiveTransfers(account)) {
        skipped.push({ affiliateId, reason: 'transfers_capability_inactive' })
        continue
      }

      const amount = rows.reduce((sum, row) => sum + toCents(row.amount_cents), 0)
      if (amount <= 0) {
        skipped.push({ affiliateId, reason: 'empty_amount' })
        continue
      }

      const transfer = await stripe.transfers.create({
        amount,
        currency: 'usd',
        destination: affiliate.stripe_connect_account_id,
        description: `HackProduct affiliate payout ${affiliate.code}`,
        metadata: {
          affiliate_id: affiliateId,
          affiliate_code: affiliate.code,
          commission_count: String(rows.length),
        },
      })

      const paidAt = new Date().toISOString()
      const commissionIds = rows.map(row => row.id)
      await admin
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: paidAt,
          stripe_transfer_id: transfer.id,
          updated_at: paidAt,
        })
        .in('id', commissionIds)
        .eq('status', 'pending')

      await sendAffiliatePayoutEmail(admin, {
        dedupeKey: `affiliate_payout:${transfer.id}`,
        userId: affiliate.user_id,
        amount,
        currency: 'usd',
        url: appUrl(request, '/affiliate'),
      })

      paid.push({ affiliateId, transferId: transfer.id, amount, commissions: rows.length })
    } catch (err) {
      failed.push({
        affiliateId,
        reason: err instanceof Error ? err.message : 'unknown_error',
      })
    }
  }

  return NextResponse.json({
    ok: failed.length === 0,
    paid,
    skipped,
    failed,
  }, { status: failed.length === 0 ? 200 : 207 })
}
