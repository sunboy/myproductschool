import { describe, expect, it } from 'vitest'
import { embeddedCheckoutOutcome } from '../../src/lib/stripe/checkout-client'

describe('embeddedCheckoutOutcome', () => {
  it('returns a portal redirect for an existing subscription', () => {
    expect(embeddedCheckoutOutcome({
      action: 'manage_subscription',
      url: 'https://billing.stripe.test/session',
    })).toEqual({
      kind: 'redirect',
      url: 'https://billing.stripe.test/session',
    })
  })

  it('returns the embedded client secret for a new checkout', () => {
    expect(embeddedCheckoutOutcome({ clientSecret: 'cs_test_secret' })).toEqual({
      kind: 'checkout',
      clientSecret: 'cs_test_secret',
    })
  })
})
