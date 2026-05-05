import { describe, expect, it } from 'vitest'
import {
  getCheckoutBrandingSettings,
  getStripeMode,
  getStripePlanConfig,
  getStripeRuntimeConfig,
} from '../../src/lib/stripe/config'

describe('Stripe runtime config', () => {
  it('rejects legacy or invalid secret key formats', () => {
    const config = getStripeRuntimeConfig({
      STRIPE_SECRET_KEY: 'mk_live_legacy',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_123',
    })

    expect(config.isConfigured).toBe(false)
    expect(config.mode).toBe('live')
    expect(config.error).toContain('live mode requires')
  })

  it('infers test mode from a test secret key', () => {
    expect(getStripeMode({
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    })).toBe('test')
  })

  it('uses explicit test price ids in test mode', () => {
    const monthly = getStripePlanConfig('monthly', {
      STRIPE_MODE: 'test',
      STRIPE_TEST_SECRET_KEY: 'sk_test_123',
      STRIPE_TEST_PRICE_MONTHLY: 'price_test_monthly',
      STRIPE_PRICE_MONTHLY: 'price_live_monthly',
    })

    expect(monthly.priceId).toBe('price_test_monthly')
    expect(monthly.unitAmount).toBe(2900)
  })

  it('does not reuse live price env vars when test mode is explicitly enabled', () => {
    const annual = getStripePlanConfig('annual', {
      STRIPE_MODE: 'test',
      STRIPE_TEST_SECRET_KEY: 'sk_test_123',
      STRIPE_PRICE_ANNUAL: 'price_live_annual',
    })

    expect(annual.priceId).toBeNull()
    expect(annual.unitAmount).toBe(19900)
  })

  it('builds checkout branding URLs from the app URL', () => {
    const branding = getCheckoutBrandingSettings('https://hackproduct.com')

    expect(branding.display_name).toBe('HackProduct')
    expect(branding.icon).toEqual({ type: 'url', url: 'https://hackproduct.com/images/logo.png' })
    expect(branding.logo).toEqual({ type: 'url', url: 'https://hackproduct.com/images/wordmark.png' })
  })
})
