import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  createStripeClient: vi.fn(),
  getStripePlanConfig: vi.fn(),
  hasValidReauthToken: vi.fn(),
  subscriptionRetrieve: vi.fn(),
  subscriptionUpdate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/auth/reauth', () => ({ hasValidReauthToken: mocks.hasValidReauthToken }))
vi.mock('@/lib/stripe/config', async (original) => ({
  ...await original<typeof import('@/lib/stripe/config')>(),
  createStripeClient: mocks.createStripeClient,
  getStripePlanConfig: mocks.getStripePlanConfig,
}))

import { POST } from '../../src/app/api/billing/subscription/route'

function request(action: string, plan?: string) {
  return new NextRequest('http://localhost:3000/api/billing/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, plan }),
  })
}

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
        data: { stripe_subscription_id: 'sub_1' },
        error: null,
      }),
    })),
  })
  mocks.createStripeClient.mockReturnValue({
    stripe: {
      subscriptions: {
        retrieve: mocks.subscriptionRetrieve,
        update: mocks.subscriptionUpdate,
      },
    },
    config: { error: null },
  })
  mocks.hasValidReauthToken.mockReturnValue(true)
  mocks.getStripePlanConfig.mockReturnValue({ priceId: 'price_monthly' })
  mocks.subscriptionRetrieve.mockResolvedValue({ items: { data: [{ id: 'si_1' }] } })
  mocks.subscriptionUpdate.mockResolvedValue({ id: 'sub_1' })
})

describe('billing subscription updates', () => {
  it('clears either Stripe cancellation representation when reactivating', async () => {
    const response = await POST(request('reactivate'))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: false,
      cancel_at: null,
    })
  })

  it('leaves Stripe cancellation timing intact until reactivation is requested', async () => {
    const response = await POST(request('cancel'))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: true,
    })
  })

  it('clears either Stripe cancellation representation when switching price', async () => {
    const response = await POST(request('change-plan', 'monthly'))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith('sub_1', {
      cancel_at_period_end: false,
      cancel_at: null,
      proration_behavior: 'create_prorations',
      items: [{ id: 'si_1', price: 'price_monthly' }],
    })
  })
})
