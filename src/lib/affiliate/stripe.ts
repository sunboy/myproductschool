import type Stripe from 'stripe'

type InvoiceWithLegacyDiscount = Stripe.Invoice & {
  discount?: string | Stripe.Discount | Stripe.DeletedDiscount | null
}

function promotionCodeIdFromDiscount(
  discount: string | Stripe.Discount | Stripe.DeletedDiscount | null | undefined
) {
  if (!discount || typeof discount === 'string') return null
  if ('deleted' in discount && discount.deleted) return null

  const promotionCode = discount.promotion_code
  return typeof promotionCode === 'string'
    ? promotionCode
    : promotionCode?.id ?? null
}

export function invoicePromotionCodeId(invoice: Stripe.Invoice) {
  for (const discount of invoice.discounts ?? []) {
    const promotionCodeId = promotionCodeIdFromDiscount(discount)
    if (promotionCodeId) return promotionCodeId
  }

  return promotionCodeIdFromDiscount((invoice as InvoiceWithLegacyDiscount).discount)
}
