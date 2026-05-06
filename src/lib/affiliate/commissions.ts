import type Stripe from 'stripe'
import { commissionAmountCents } from './config'
import { invoicePromotionCodeId } from './stripe'

type SupabaseLike = {
  from(table: string): unknown
}

type QueryLike = {
  select(columns: string): QueryLike
  eq(field: string, value: unknown): QueryLike
  maybeSingle(): Promise<{ data: Record<string, unknown> | null }>
  upsert(
    values: Record<string, unknown>,
    options?: Record<string, unknown>
  ): PromiseLike<unknown>
}

function table(supabase: SupabaseLike, name: string) {
  return supabase.from(name) as QueryLike
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const value = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  return typeof value === 'string' ? value : value?.id ?? null
}

async function invoiceWithExpandedDiscounts(stripe: Stripe, invoice: Stripe.Invoice) {
  if (invoicePromotionCodeId(invoice)) return invoice
  if (!invoice.discounts?.some(discount => typeof discount === 'string')) return invoice

  return stripe.invoices.retrieve(invoice.id, { expand: ['discounts'] })
}

async function invoiceAffiliateIdFromMetadata(stripe: Stripe, invoice: Stripe.Invoice) {
  if (invoice.metadata?.affiliate_id) return invoice.metadata.affiliate_id

  const subscriptionId = invoiceSubscriptionId(invoice)
  if (!subscriptionId) return null

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription.metadata?.affiliate_id ?? null
}

export async function recordAffiliateCommission(
  stripe: Stripe,
  supabase: SupabaseLike,
  invoice: Stripe.Invoice
) {
  if (invoice.amount_paid <= 0) return

  const expandedInvoice = await invoiceWithExpandedDiscounts(stripe, invoice)
  const promotionCodeId = invoicePromotionCodeId(expandedInvoice)
  const affiliateId = promotionCodeId
    ? null
    : await invoiceAffiliateIdFromMetadata(stripe, expandedInvoice)
  if (!promotionCodeId && !affiliateId) return

  let affiliateQuery = table(supabase, 'affiliates')
    .select('id, commission_pct, status')

  affiliateQuery = promotionCodeId
    ? affiliateQuery.eq('stripe_promo_code_id', promotionCodeId)
    : affiliateQuery.eq('id', affiliateId)

  const { data: affiliate } = await affiliateQuery.maybeSingle()

  if (!affiliate || affiliate.status === 'disabled') return

  const amountCents = commissionAmountCents(invoice.amount_paid, Number(affiliate.commission_pct))
  if (amountCents <= 0) return

  await table(supabase, 'affiliate_commissions').upsert({
    affiliate_id: affiliate.id,
    invoice_id: invoice.id,
    amount_cents: amountCents,
    currency: invoice.currency,
    status: 'pending',
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'affiliate_id,invoice_id',
    ignoreDuplicates: true,
  })
}
