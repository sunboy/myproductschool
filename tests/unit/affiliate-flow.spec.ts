import { describe, expect, it } from 'vitest'
import type Stripe from 'stripe'
import {
  commissionAmountCents,
  getAffiliateCouponId,
  normalizeAffiliateCode,
  suggestAffiliateCode,
} from '../../src/lib/affiliate/config'
import { invoicePromotionCodeId } from '../../src/lib/affiliate/stripe'

describe('affiliate flow helpers', () => {
  it('normalizes valid affiliate codes and rejects invalid codes', () => {
    expect(normalizeAffiliateCode(' hatch-20 ')).toBe('HATCH-20')
    expect(normalizeAffiliateCode('abc')).toBeNull()
    expect(normalizeAffiliateCode('bad code')).toBeNull()
    expect(normalizeAffiliateCode('code_with_underscore')).toBeNull()
  })

  it('suggests a stable uppercase code from profile data', () => {
    expect(suggestAffiliateCode('Ada Lovelace', 'user_123')).toBe('ADA-LOVELACE')
    expect(suggestAffiliateCode('ada@example.com', 'user_123')).toBe('HP-USER123')
  })

  it('uses mode-specific affiliate coupon ids', () => {
    expect(getAffiliateCouponId('test', {
      STRIPE_AFFILIATE_COUPON_ID: 'coupon_live',
      STRIPE_TEST_AFFILIATE_COUPON_ID: 'coupon_test',
    })).toBe('coupon_test')

    expect(getAffiliateCouponId('live', {
      STRIPE_AFFILIATE_COUPON_ID: 'coupon_live',
      STRIPE_TEST_AFFILIATE_COUPON_ID: 'coupon_test',
    })).toBe('coupon_live')
  })

  it('calculates invoice commission in cents', () => {
    expect(commissionAmountCents(2900, 20)).toBe(580)
    expect(commissionAmountCents(19900, 12.5)).toBe(2488)
    expect(commissionAmountCents(0, 20)).toBe(0)
  })

  it('extracts promotion code ids from expanded invoice discounts', () => {
    const invoice = {
      discounts: [
        {
          id: 'di_123',
          object: 'discount',
          promotion_code: { id: 'promo_123', object: 'promotion_code' },
        },
      ],
    } as unknown as Stripe.Invoice

    expect(invoicePromotionCodeId(invoice)).toBe('promo_123')
  })
})
