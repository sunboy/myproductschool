import type Stripe from 'stripe'

export type CommissionRow = {
  id: string
  affiliate_id: string
  amount_cents: number | string
  currency: string
}

export type AffiliateRow = {
  id: string
  user_id: string
  code: string
  stripe_connect_account_id: string | null
  status: string
}

type SupabaseLike = {
  from(table: string): unknown
}

type QueryLike = {
  select(columns: string): QueryLike
  eq(field: string, value: unknown): QueryLike
  in(field: string, values: unknown[]): QueryLike
  order(field: string, options: { ascending: boolean }): QueryLike
  update(values: Record<string, unknown>): QueryLike
  then(resolve: (value: { data?: unknown[] | null; error?: { message: string } | null }) => void): void
}

type AffiliatePayoutEmailInput = {
  dedupeKey: string
  userId: string
  amount: number
  currency: string
  url: string
}

type RunAffiliatePayoutsInput = {
  admin: SupabaseLike
  stripe: Stripe
  dashboardUrl: string
  sendEmail(input: AffiliatePayoutEmailInput): Promise<unknown>
}

function table(admin: SupabaseLike, name: string) {
  return admin.from(name) as QueryLike
}

function toCents(value: number | string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function groupCommissions(rows: CommissionRow[]) {
  const groups = new Map<string, CommissionRow[]>()
  for (const row of rows) {
    const current = groups.get(row.affiliate_id) ?? []
    current.push(row)
    groups.set(row.affiliate_id, current)
  }
  return groups
}

export function hasActiveTransfers(account: Stripe.Account) {
  return account.capabilities?.transfers === 'active' || account.payouts_enabled
}

export async function runAffiliatePayouts({
  admin,
  stripe,
  dashboardUrl,
  sendEmail,
}: RunAffiliatePayoutsInput) {
  const { data: pendingRows, error } = await table(admin, 'affiliate_commissions')
    .select('id, affiliate_id, amount_cents, currency')
    .eq('status', 'pending')
    .eq('currency', 'usd')
    .order('created_at', { ascending: true })

  if (error) {
    return {
      result: { error: error.message, ok: false, paid: [], skipped: [], failed: [] },
      status: 500,
    }
  }

  const commissions = (pendingRows ?? []) as CommissionRow[]
  if (commissions.length === 0) {
    return {
      result: { ok: true, paid: [], skipped: [], failed: [] },
      status: 200,
    }
  }

  const grouped = groupCommissions(commissions)
  const { data: affiliateRows } = await table(admin, 'affiliates')
    .select('id, user_id, code, stripe_connect_account_id, status')
    .in('id', [...grouped.keys()])

  const affiliates = new Map(((affiliateRows ?? []) as AffiliateRow[]).map(row => [row.id, row]))
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
      await table(admin, 'affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: paidAt,
          stripe_transfer_id: transfer.id,
          updated_at: paidAt,
        })
        .in('id', commissionIds)
        .eq('status', 'pending')

      await sendEmail({
        dedupeKey: `affiliate_payout:${transfer.id}`,
        userId: affiliate.user_id,
        amount,
        currency: 'usd',
        url: dashboardUrl,
      })

      paid.push({ affiliateId, transferId: transfer.id, amount, commissions: rows.length })
    } catch (err) {
      failed.push({
        affiliateId,
        reason: err instanceof Error ? err.message : 'unknown_error',
      })
    }
  }

  return {
    result: {
      ok: failed.length === 0,
      paid,
      skipped,
      failed,
    },
    status: failed.length === 0 ? 200 : 207,
  }
}
