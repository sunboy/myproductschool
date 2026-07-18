import type Stripe from 'stripe'

/**
 * Pure Stripe invoice/plan helpers. Historically lived in the (otherwise dead
 * and now deleted) src/lib/email/billing.ts; the Stripe webhook and the
 * trial-ending cron are the live consumers.
 */

export function planLabelFromInterval(interval?: string | null) {
  return interval === 'year' ? 'HackProduct Pro Annual' : 'HackProduct Pro Monthly'
}

export function invoicePeriodEnd(invoice: Stripe.Invoice) {
  const line = invoice.lines?.data?.[0]
  const periodEnd = line?.period?.end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}
