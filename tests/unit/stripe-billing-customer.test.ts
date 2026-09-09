import { describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import {
  resolveBillingCustomer,
  resolveOrCreateCheckoutCustomer,
  type StoredBillingReferences,
} from '../../src/lib/stripe/billing-customer'

function customer(id: string, livemode = false) {
  return { id, livemode, deleted: false } as unknown as Stripe.Customer
}

function subscription(
  id: string,
  customerId: string,
  status: Stripe.Subscription.Status,
  options: { livemode?: boolean; userId?: string } = {}
) {
  return {
    id,
    customer: customerId,
    status,
    livemode: options.livemode ?? false,
    metadata: options.userId ? { user_id: options.userId } : {},
  } as Stripe.Subscription
}

function stripeFixture(input: {
  customers?: Record<string, Stripe.Customer>
  subscriptions?: Record<string, Stripe.Subscription>
  listed?: Record<string, Stripe.Subscription[]>
  createdCustomer?: Stripe.Customer
}) {
  return {
    customers: {
      create: vi.fn(async () => input.createdCustomer ?? customer('cus_created')),
      retrieve: vi.fn(async (id: string) => {
        const result = input.customers?.[id]
        if (!result) throw { code: 'resource_missing', statusCode: 404 }
        return result
      }),
    },
    subscriptions: {
      retrieve: vi.fn(async (id: string) => {
        const result = input.subscriptions?.[id]
        if (!result) throw { code: 'resource_missing', statusCode: 404 }
        return result
      }),
      list: vi.fn(async ({ customer: id }: { customer: string }) => ({
        data: input.listed?.[id] ?? [],
      })),
    },
  } as unknown as Stripe
}

describe('resolveBillingCustomer', () => {
  it('reuses a verified stored customer and finds its protected subscription', async () => {
    const active = subscription('sub_active', 'cus_user', 'active')
    const stripe = stripeFixture({
      customers: { cus_user: customer('cus_user') },
      listed: { cus_user: [active] },
    })

    const result = await resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: { stripe_customer_id: 'cus_user' },
    })

    expect(result).toMatchObject({
      customerId: 'cus_user',
      blockingSubscription: active,
      source: 'stored_customer',
    })
    expect(stripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_user', status: 'all', limit: 100,
    })
  })

  it.each(['active', 'trialing', 'past_due'] as const)(
    'blocks checkout for a %s subscription',
    async (status) => {
      const protectedSubscription = subscription('sub_protected', 'cus_user', status)
      const stripe = stripeFixture({
        customers: { cus_user: customer('cus_user') },
        listed: { cus_user: [protectedSubscription] },
      })
      const result = await resolveBillingCustomer({
        stripe,
        mode: 'test',
        userId: 'user_1',
        stored: { stripe_customer_id: 'cus_user' },
      })
      expect(result.blockingSubscription?.id).toBe('sub_protected')
    }
  )

  it('isolates references from the other Stripe mode', async () => {
    const stripe = stripeFixture({
      customers: { cus_live: customer('cus_live', true) },
      subscriptions: {
        sub_live: subscription('sub_live', 'cus_live', 'active', { livemode: true }),
      },
    })
    const result = await resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: {
        stripe_customer_id: 'cus_live',
        stripe_subscription_id: 'sub_live',
      },
    })
    expect(result).toEqual({ customerId: null, blockingSubscription: null, source: null })
    expect(stripe.subscriptions.list).not.toHaveBeenCalled()
  })

  it('uses the protected stored subscription customer when historical ids split', async () => {
    const active = subscription('sub_active', 'cus_current', 'active', {
      userId: 'user_1',
    })
    const stripe = stripeFixture({
      customers: {
        cus_stale: customer('cus_stale'),
        cus_current: customer('cus_current'),
      },
      subscriptions: { sub_active: active },
      listed: { cus_current: [active] },
    })
    const result = await resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: {
        stripe_customer_id: 'cus_stale',
        stripe_subscription_id: 'sub_active',
      },
    })
    expect(result).toMatchObject({
      customerId: 'cus_current',
      blockingSubscription: active,
      source: 'stored_subscription',
    })
    expect(stripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_current', status: 'all', limit: 100,
    })
  })

  it('does not adopt a subscription whose metadata names another user', async () => {
    const stripe = stripeFixture({
      customers: {
        cus_user: customer('cus_user'),
        cus_other: customer('cus_other'),
      },
      subscriptions: {
        sub_other: subscription('sub_other', 'cus_other', 'active', {
          userId: 'user_2',
        }),
      },
      listed: { cus_user: [] },
    })
    const result = await resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: {
        stripe_customer_id: 'cus_user',
        stripe_subscription_id: 'sub_other',
      },
    })
    expect(result).toMatchObject({ customerId: 'cus_user', blockingSubscription: null })
    expect(stripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_user', status: 'all', limit: 100,
    })
  })

  it('fails closed on transient Stripe lookup errors', async () => {
    const stripe = stripeFixture({})
    vi.mocked(stripe.customers.retrieve).mockRejectedValueOnce(new Error('timeout'))
    await expect(resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: { stripe_customer_id: 'cus_user' },
    })).rejects.toThrow('timeout')
  })

  it('fails closed when a protected stored subscription points to an unverifiable customer', async () => {
    const stripe = stripeFixture({
      customers: { cus_stale: customer('cus_stale') },
      subscriptions: {
        sub_active: subscription('sub_active', 'cus_missing', 'active', {
          userId: 'user_1',
        }),
      },
    })
    await expect(resolveBillingCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: {
        stripe_customer_id: 'cus_stale',
        stripe_subscription_id: 'sub_active',
      },
    })).rejects.toThrow('active subscription customer could not be verified')
  })

  it('creates and persists one stable customer before the first checkout', async () => {
    let stored: StoredBillingReferences | null = null
    const created = customer('cus_created')
    const stripe = stripeFixture({
      createdCustomer: created,
      customers: { cus_created: created },
      listed: { cus_created: [] },
    })
    const persistence = {
      persistIfUnclaimed: vi.fn(async (customerId: string) => {
        stored = { stripe_customer_id: customerId, stripe_subscription_id: null }
        return true
      }),
      reloadStored: vi.fn(async () => stored),
    }

    const first = await resolveOrCreateCheckoutCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      email: 'user@example.com',
      stored,
      persistence,
    })
    expect(first).toEqual({
      customerId: 'cus_created',
      blockingSubscription: null,
      source: 'created_customer',
    })
    expect(stripe.customers.create).toHaveBeenCalledWith(
      {
        email: 'user@example.com',
        metadata: { user_id: 'user_1', stripe_mode: 'test' },
      },
      { idempotencyKey: 'billing-customer-test-user_1' }
    )
    expect(persistence.persistIfUnclaimed).toHaveBeenCalledWith('cus_created')

    const repeated = await resolveOrCreateCheckoutCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      email: 'user@example.com',
      stored,
      persistence,
    })
    expect(repeated).toMatchObject({
      customerId: 'cus_created',
      blockingSubscription: null,
      source: 'stored_customer',
    })
    expect(stripe.customers.create).toHaveBeenCalledTimes(1)
  })

  it('re-reads canonical paid state when a webhook wins the first-checkout row race', async () => {
    const active = subscription('sub_active', 'cus_canonical', 'active', {
      userId: 'user_1',
    })
    const stripe = stripeFixture({
      createdCustomer: customer('cus_idempotent'),
      customers: { cus_canonical: customer('cus_canonical') },
      subscriptions: { sub_active: active },
      listed: { cus_canonical: [active] },
    })
    const result = await resolveOrCreateCheckoutCustomer({
      stripe,
      mode: 'test',
      userId: 'user_1',
      stored: null,
      persistence: {
        persistIfUnclaimed: vi.fn().mockResolvedValue(false),
        reloadStored: vi.fn().mockResolvedValue({
          stripe_customer_id: 'cus_canonical',
          stripe_subscription_id: 'sub_active',
        }),
      },
    })
    expect(result).toMatchObject({
      customerId: 'cus_canonical',
      blockingSubscription: active,
    })
  })
})
