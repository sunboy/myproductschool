import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  createStripeClient: vi.fn(),
  resolveOrCreateCheckoutCustomer: vi.fn(),
  resolveAffiliateForCheckout: vi.fn(),
  affiliateCheckoutMetadata: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/stripe/config', async (original) => ({
  ...await original<typeof import('@/lib/stripe/config')>(),
  createStripeClient: mocks.createStripeClient,
}))
vi.mock('@/lib/stripe/billing-customer', () => ({
  resolveOrCreateCheckoutCustomer: mocks.resolveOrCreateCheckoutCustomer,
}))
vi.mock('@/lib/stripe/affiliates', () => ({
  resolveAffiliateForCheckout: mocks.resolveAffiliateForCheckout,
  affiliateCheckoutMetadata: mocks.affiliateCheckoutMetadata,
}))

import { POST } from '../../src/app/api/stripe/create-checkout/route'

const stripe = {
  checkout: { sessions: { create: mocks.checkoutCreate } },
  billingPortal: { sessions: { create: mocks.portalCreate } },
}

function adminClient(stored = {
  stripe_customer_id: 'cus_user',
  stripe_subscription_id: 'sub_stored',
}) {
  return {
    from: vi.fn(() => ({
      select() { return this },
      eq() { return this },
      maybeSingle: vi.fn().mockResolvedValue({ data: stored, error: null }),
    })),
  }
}

function checkoutRequest(embedded = true) {
  return new NextRequest('https://preview.hackproduct.com/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ plan: 'monthly', embedded }),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user_1', email: 'user@example.com' } },
      }),
    },
  })
  mocks.createAdminClient.mockReturnValue(adminClient())
  mocks.createStripeClient.mockReturnValue({
    stripe,
    config: { mode: 'test', error: null },
  })
  mocks.resolveAffiliateForCheckout.mockResolvedValue(null)
  mocks.affiliateCheckoutMetadata.mockReturnValue({})
})

describe('Stripe checkout customer safety', () => {
  it.each([
    { source: 'stored_customer', customerId: 'cus_stored', embedded: true },
    { source: 'created_customer', customerId: 'cus_created', embedded: false },
  ])('collects and persists tax address for a $source', async ({ source, customerId, embedded }) => {
    mocks.resolveOrCreateCheckoutCustomer.mockResolvedValue({
      customerId,
      blockingSubscription: null,
      source,
    })
    mocks.checkoutCreate.mockResolvedValue({
      client_secret: 'cs_test_secret',
      url: 'https://checkout.stripe.test/session',
    })

    const response = await POST(checkoutRequest(embedded))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(
      embedded
        ? { clientSecret: 'cs_test_secret', mode: 'test' }
        : { url: 'https://checkout.stripe.test/session', mode: 'test' }
    )

    const params = mocks.checkoutCreate.mock.calls[0][0]
    expect(params.customer).toBe(customerId)
    expect(params.customer_update).toEqual({ address: 'auto' })
    expect(params.billing_address_collection).toBe('required')
    expect(params.automatic_tax).toEqual({ enabled: true })
    expect(params).not.toHaveProperty('customer_email')
  })

  it('omits customer_update on the customer_email fallback', async () => {
    mocks.resolveOrCreateCheckoutCustomer.mockResolvedValue({
      customerId: null,
      blockingSubscription: null,
      source: 'none',
    })
    mocks.checkoutCreate.mockResolvedValue({ client_secret: 'cs_test_secret' })

    const response = await POST(checkoutRequest())
    expect(response.status).toBe(200)

    const params = mocks.checkoutCreate.mock.calls[0][0]
    expect(params.customer_email).toBe('user@example.com')
    expect(params).not.toHaveProperty('customer')
    expect(params).not.toHaveProperty('customer_update')
    expect(params.billing_address_collection).toBe('required')
    expect(params.automatic_tax).toEqual({ enabled: true })
  })

  it.each(['active', 'trialing', 'past_due'])(
    'routes an existing %s subscription to the portal',
    async (status) => {
      mocks.resolveOrCreateCheckoutCustomer.mockResolvedValue({
        customerId: 'cus_user',
        blockingSubscription: { id: 'sub_existing', status },
        source: 'stored_customer',
      })
      mocks.portalCreate.mockResolvedValue({ url: 'https://billing.stripe.test/session' })

      const response = await POST(checkoutRequest())
      expect(await response.json()).toEqual({
        url: 'https://billing.stripe.test/session',
        action: 'manage_subscription',
        mode: 'test',
      })
      expect(mocks.portalCreate).toHaveBeenCalledWith({
        customer: 'cus_user',
        return_url: 'http://localhost:3000/settings',
      })
      expect(mocks.checkoutCreate).not.toHaveBeenCalled()
    }
  )
})
