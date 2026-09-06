import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  createStripeClient: vi.fn(),
  resolveBillingCustomer: vi.fn(),
  portalCreate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/stripe/config', () => ({ createStripeClient: mocks.createStripeClient }))
vi.mock('@/lib/stripe/billing-customer', () => ({
  resolveBillingCustomer: mocks.resolveBillingCustomer,
}))
vi.mock('@/lib/api/error', () => ({
  apiError: (status: number, code: string, message: string) =>
    Response.json({ error: message, code }, { status }),
}))

import { POST } from '../../src/app/api/stripe/portal/route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user_1' } },
        error: null,
      }),
    },
  })
  mocks.createAdminClient.mockReturnValue({
    from: vi.fn(() => ({
      select() { return this },
      eq() { return this },
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          stripe_customer_id: 'cus_verified',
          stripe_subscription_id: 'sub_user',
        },
        error: null,
      }),
    })),
  })
  mocks.createStripeClient.mockReturnValue({
    stripe: { billingPortal: { sessions: { create: mocks.portalCreate } } },
    config: { mode: 'test', error: null },
  })
  mocks.resolveBillingCustomer.mockResolvedValue({
    customerId: 'cus_verified',
    blockingSubscription: null,
    source: 'stored_customer',
  })
})

describe('Stripe billing portal customer safety', () => {
  it('opens the portal for the resolved mode-verified customer', async () => {
    mocks.portalCreate.mockResolvedValue({ url: 'https://billing.stripe.test/session' })
    const response = await POST(new NextRequest(
      'https://preview.hackproduct.com/api/stripe/portal',
      { method: 'POST' }
    ))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      url: 'https://billing.stripe.test/session',
      mode: 'test',
    })
    expect(mocks.portalCreate).toHaveBeenCalledWith({
      customer: 'cus_verified',
      return_url: 'https://preview.hackproduct.com/settings',
    })
  })
})
