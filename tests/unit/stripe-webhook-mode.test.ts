import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createStripeClient: vi.fn(),
  createAdminClient: vi.fn(),
  sendCancellationConfirmedEmail: vi.fn(),
  sendCancellationScheduledEmail: vi.fn(),
  sendPaymentActionRequiredEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
  sendPaymentReceiptEmail: vi.fn(),
  sendPlanChangedEmail: vi.fn(),
  sendSubscriptionReactivatedEmail: vi.fn(),
  sendTrialEndingEmail: vi.fn(),
}))

vi.mock('@/lib/stripe/config', () => ({ createStripeClient: mocks.createStripeClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/stripe/affiliates', () => ({
  processAffiliateInvoicePaid: vi.fn(),
  updateAffiliateAccountFromStripeAccount: vi.fn(),
  upsertAffiliateReferralFromCheckoutSession: vi.fn(),
}))
vi.mock('@/lib/email/transactional', () => ({
  sendCancellationConfirmedEmail: mocks.sendCancellationConfirmedEmail,
  sendCancellationScheduledEmail: mocks.sendCancellationScheduledEmail,
  sendPaymentActionRequiredEmail: mocks.sendPaymentActionRequiredEmail,
  sendPaymentFailedEmail: mocks.sendPaymentFailedEmail,
  sendPaymentReceiptEmail: mocks.sendPaymentReceiptEmail,
  sendPlanChangedEmail: mocks.sendPlanChangedEmail,
  sendSubscriptionReactivatedEmail: mocks.sendSubscriptionReactivatedEmail,
  sendTrialEndingEmail: mocks.sendTrialEndingEmail,
}))
vi.mock('@/lib/posthog/server', () => ({ captureServerImmediate: vi.fn() }))

import { POST } from '../../src/app/api/stripe/webhook/route'

const signingSecret = 'whsec_fixture_for_local_signature_tests'
const signingStripe = new Stripe('sk_test_fixture')

type EventStatus = 'processing' | 'processed' | 'failed'

interface WebhookHarnessOptions {
  claimError?: { message: string; code?: string }
  completeFailures?: number
  initialStatus?: EventStatus
  retrieveFailures?: number
  stealLeaseOnFirstComplete?: boolean
  subscription?: Record<string, unknown>
  subscriptionRows?: Array<Record<string, unknown>>
}

function createWebhookHarness(options: WebhookHarnessOptions = {}) {
  const eventStates = new Map<string, EventStatus>()
  const eventTokens = new Map<string, string>()
  const effects = new Set<string>()
  const mutations: Array<{
    table: string
    operation: 'update' | 'upsert'
    values: Record<string, unknown>
  }> = []
  let completionFailures = options.completeFailures ?? 0
  let paymentFailureIncrements = 0
  let subscriptionRetrieveFailures = options.retrieveFailures ?? 0
  let tokenSequence = 0

  if (options.initialStatus) {
    eventStates.set('evt_mode_fixture', options.initialStatus)
    if (options.initialStatus === 'processing') {
      eventTokens.set('evt_mode_fixture', 'token-existing')
    }
  }

  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    const eventId = String(args.p_event_id ?? '')

    if (name === 'claim_stripe_event') {
      if (options.claimError) return { data: null, error: options.claimError }
      const status = eventStates.get(eventId)
      if (status === 'processed') return { data: { status: 'processed' }, error: null }
      if (status === 'processing') return { data: { status: 'in_progress' }, error: null }
      const token = `token-${++tokenSequence}`
      eventStates.set(eventId, 'processing')
      eventTokens.set(eventId, token)
      return { data: { status: 'claimed', token }, error: null }
    }

    if (name === 'complete_stripe_event') {
      if (options.stealLeaseOnFirstComplete && tokenSequence === 1) {
        tokenSequence += 1
        eventTokens.set(eventId, `token-${tokenSequence}`)
      }
      if (eventTokens.get(eventId) !== args.p_processing_token) {
        return { data: null, error: { message: 'processing lease is no longer owned' } }
      }
      if (completionFailures > 0) {
        completionFailures -= 1
        return { data: null, error: { message: 'completion unavailable' } }
      }
      eventStates.set(eventId, 'processed')
      eventTokens.delete(eventId)
      return { data: true, error: null }
    }

    if (name === 'release_stripe_event') {
      if (eventTokens.get(eventId) !== args.p_processing_token) {
        return { data: false, error: null }
      }
      eventStates.set(eventId, 'failed')
      eventTokens.delete(eventId)
      return { data: true, error: null }
    }

    if (name === 'record_stripe_payment_failure') {
      if (eventTokens.get(eventId) !== args.p_processing_token) {
        return { data: null, error: { message: 'processing lease is no longer owned' } }
      }
      const alreadyRecorded = effects.has(eventId)
      if (!alreadyRecorded) {
        effects.add(eventId)
        paymentFailureIncrements += 1
      }
      return { data: !alreadyRecorded, error: null }
    }

    throw new Error(`Unexpected RPC: ${name}`)
  })

  function from(table: string) {
    let operation: 'select' | 'update' | 'upsert' = 'select'
    const filters = new Map<string, unknown>()

    const result = () => {
      if (operation !== 'select') return { data: null, error: null }

      if (table === 'subscriptions') {
        if (filters.has('user_id') && !filters.has('stripe_subscription_id')) {
          return { data: options.subscriptionRows ?? [], error: null }
        }
        return {
          data: { user_id: 'user_1', plan: 'pro', billing_interval: 'month' },
          error: null,
        }
      }

      if (table === 'profiles') {
        return {
          data: { payment_failures: 0, subscription_status: 'active', past_due_since: null },
          error: null,
        }
      }

      return { data: null, error: null }
    }

    const builder = {
      select: vi.fn(() => {
        operation = 'select'
        return builder
      }),
      update: vi.fn((values: Record<string, unknown>) => {
        operation = 'update'
        mutations.push({ table, operation, values })
        return builder
      }),
      upsert: vi.fn((values: Record<string, unknown>) => {
        operation = 'upsert'
        mutations.push({ table, operation, values })
        return builder
      }),
      eq: vi.fn((column: string, value: unknown) => {
        filters.set(column, value)
        return builder
      }),
      single: vi.fn(async () => result()),
      maybeSingle: vi.fn(async () => result()),
      then: (
        resolve: (value: { data: unknown; error: null }) => unknown,
        reject?: (reason: unknown) => unknown
      ) => Promise.resolve(result()).then(resolve, reject),
    }

    return builder
  }

  const admin = { rpc, from: vi.fn(from) }
  const retrieveSubscription = vi.fn(async () => {
    if (subscriptionRetrieveFailures > 0) {
      subscriptionRetrieveFailures -= 1
      throw new Error('Stripe subscription retrieval failed')
    }
    return options.subscription
  })
  const stripeClient = {
    webhooks: signingStripe.webhooks,
    subscriptions: { retrieve: retrieveSubscription },
  }

  return {
    admin,
    eventStates,
    eventTokens,
    mutations,
    paymentFailureIncrements: () => paymentFailureIncrements,
    retrieveSubscription,
    rpc,
    stripeClient,
  }
}

function signedRequest(event: Record<string, unknown>, secret = signingSecret) {
  const payload = JSON.stringify(event)
  return new NextRequest('https://app.test/api/stripe/webhook', {
    method: 'POST',
    body: payload,
    headers: {
      'stripe-signature': signingStripe.webhooks.generateTestHeaderString({ payload, secret }),
    },
  })
}

function event(
  type = 'test.unhandled',
  object: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {}
) {
  return {
    id: 'evt_mode_fixture',
    object: 'event',
    type,
    created: 1_700_000_000,
    livemode: false,
    data: { object },
    ...overrides,
  }
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    customer: 'cus_123',
    status: 'active',
    metadata: { user_id: 'user_1' },
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    items: {
      data: [{
        current_period_end: 1_800_000_000,
        plan: { interval: 'month' },
        price: { id: 'price_current' },
      }],
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', signingSecret)
  for (const emailMock of [
    mocks.sendCancellationConfirmedEmail,
    mocks.sendCancellationScheduledEmail,
    mocks.sendPaymentActionRequiredEmail,
    mocks.sendPaymentFailedEmail,
    mocks.sendPaymentReceiptEmail,
    mocks.sendPlanChangedEmail,
    mocks.sendSubscriptionReactivatedEmail,
    mocks.sendTrialEndingEmail,
  ]) {
    emailMock.mockResolvedValue(undefined)
  }
})

afterEach(() => vi.unstubAllEnvs())

describe('webhook environment isolation', () => {
  it.each([
    ['test', true],
    ['live', false],
  ] as const)('rejects a correctly signed opposite-mode event in %s before database access', async (mode, livemode) => {
    const harness = createWebhookHarness()
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('test.unhandled', {}, { livemode })))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Stripe event mode mismatch' })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it.each([
    ['test', false],
    ['live', true],
  ] as const)('accepts a correctly signed matching-mode event in %s', async (mode, livemode) => {
    const harness = createWebhookHarness()
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('test.unhandled', {}, { livemode })))

    expect(response.status).toBe(200)
    expect(mocks.createAdminClient).toHaveBeenCalledOnce()
  })

  it('still rejects an invalid signature before database access', async () => {
    const harness = createWebhookHarness()
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event(), 'whsec_wrong_fixture'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid signature' })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
})

describe('webhook delivery reliability', () => {
  it('releases a failed attempt so the same event can retry successfully', async () => {
    const currentSubscription = subscription()
    const harness = createWebhookHarness({
      retrieveFailures: 1,
      subscription: currentSubscription,
    })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const first = await POST(signedRequest(event('customer.subscription.updated', currentSubscription)))
    const second = await POST(signedRequest(event('customer.subscription.updated', currentSubscription)))

    expect(first.status).toBe(500)
    expect(second.status).toBe(200)
    expect(harness.eventStates.get('evt_mode_fixture')).toBe('processed')
    expect(harness.rpc.mock.calls.filter(([name]) => name === 'claim_stripe_event')).toHaveLength(2)
    expect(harness.rpc.mock.calls.filter(([name]) => name === 'release_stripe_event')).toHaveLength(1)
  })

  it('acknowledges an already processed duplicate without dispatching it', async () => {
    const harness = createWebhookHarness({ initialStatus: 'processed' })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event()))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, duplicate: true })
    expect(harness.rpc.mock.calls.some(([name]) => name === 'complete_stripe_event')).toBe(false)
  })

  it('returns a retryable non-2xx response for an in-progress duplicate', async () => {
    const harness = createWebhookHarness({ initialStatus: 'processing' })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event()))

    expect(response.status).toBe(409)
    expect(harness.rpc.mock.calls.some(([name]) => name === 'complete_stripe_event')).toBe(false)
  })

  it('returns 503 when claiming fails and performs no side effects', async () => {
    const harness = createWebhookHarness({ claimError: { message: 'database unavailable' } })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event()))

    expect(response.status).toBe(503)
    expect(harness.admin.from).not.toHaveBeenCalled()
    expect(harness.rpc).toHaveBeenCalledTimes(1)
  })

  it('does not let an expired worker complete or release a successor lease', async () => {
    const harness = createWebhookHarness({ stealLeaseOnFirstComplete: true })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event()))

    expect(response.status).toBe(500)
    expect(harness.eventStates.get('evt_mode_fixture')).toBe('processing')
    expect(harness.eventTokens.get('evt_mode_fixture')).toBe('token-2')
    const completeArgs = harness.rpc.mock.calls.find(([name]) => name === 'complete_stripe_event')?.[1]
    const releaseArgs = harness.rpc.mock.calls.find(([name]) => name === 'release_stripe_event')?.[1]
    expect(completeArgs?.p_processing_token).toBe('token-1')
    expect(releaseArgs?.p_processing_token).toBe('token-1')
  })

  it('does not increment payment failures twice when completion fails and Stripe retries', async () => {
    const harness = createWebhookHarness({ completeFailures: 1 })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)
    const invoice = {
      id: 'in_123',
      customer: 'cus_123',
      customer_email: 'buyer@example.com',
      customer_name: 'Buyer',
      amount_due: 3900,
      currency: 'usd',
      hosted_invoice_url: 'https://invoice.test/in_123',
      next_payment_attempt: null,
      lines: { data: [] },
      parent: {
        type: 'subscription_details',
        subscription_details: { subscription: 'sub_123' },
      },
    }

    const first = await POST(signedRequest(event('invoice.payment_failed', invoice)))
    const second = await POST(signedRequest(event('invoice.payment_failed', invoice)))

    expect(first.status).toBe(500)
    expect(second.status).toBe(200)
    expect(harness.paymentFailureIncrements()).toBe(1)
    expect(harness.rpc.mock.calls.filter(([name]) => name === 'record_stripe_payment_failure')).toHaveLength(2)
  })

  it('uses the current Stripe subscription state for a delayed update', async () => {
    const canonical = subscription({ status: 'active' })
    const delivered = subscription({ status: 'canceled', cancel_at_period_end: true })
    const harness = createWebhookHarness({ subscription: canonical })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event(
      'customer.subscription.updated',
      delivered,
      { data: { object: delivered, previous_attributes: { cancel_at_period_end: false } } }
    )))

    expect(response.status).toBe(200)
    expect(harness.retrieveSubscription).toHaveBeenCalledWith('sub_123')
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'subscriptions',
      operation: 'upsert',
      values: expect.objectContaining({ status: 'active', plan: 'pro' }),
    }))
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'profiles',
      operation: 'update',
      values: expect.objectContaining({ plan: 'pro', pro_access: true }),
    }))
    expect(mocks.sendCancellationScheduledEmail).not.toHaveBeenCalled()
  })

  it('does not revoke access for a deleted snapshot when Stripe still reports an entitling subscription', async () => {
    const canonical = subscription({ status: 'active' })
    const delivered = subscription({ status: 'canceled' })
    const harness = createWebhookHarness({ subscription: canonical })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', delivered)))

    expect(response.status).toBe(200)
    expect(harness.retrieveSubscription).toHaveBeenCalledWith('sub_123')
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'subscriptions',
      operation: 'upsert',
      values: expect.objectContaining({ status: 'active', plan: 'pro' }),
    }))
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'profiles',
      operation: 'update',
      values: expect.objectContaining({ plan: 'pro', pro_access: true }),
    }))
    expect(harness.mutations.some(({ values }) => values.plan === 'free' || values.pro_access === false)).toBe(false)
    expect(mocks.sendCancellationConfirmedEmail).not.toHaveBeenCalled()
  })

  it('clears the profile entitlement and dunning mirrors for a deleted Pro subscription', async () => {
    const canceled = subscription({ status: 'canceled' })
    const harness = createWebhookHarness({ subscription: canceled })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', canceled)))

    expect(response.status).toBe(200)
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'subscriptions',
      operation: 'upsert',
      values: expect.objectContaining({ plan: 'free', status: 'canceled' }),
    }))
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'profiles',
      operation: 'update',
      values: expect.objectContaining({
        plan: 'free',
        pro_access: false,
        subscription_status: 'canceled',
        payment_failures: 0,
        past_due_since: null,
      }),
    }))
  })

  it('does not let an old Pro deletion overwrite a distinct current entitling subscription', async () => {
    const canceled = subscription({ id: 'sub_old', status: 'canceled' })
    const harness = createWebhookHarness({
      subscription: canceled,
      subscriptionRows: [{
        stripe_subscription_id: 'sub_new',
        plan: 'pro',
        status: 'active',
        current_period_end: 1_800_000_000,
        cancel_at_period_end: false,
      }],
    })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', canceled)))

    expect(response.status).toBe(200)
    expect(harness.retrieveSubscription).toHaveBeenCalledWith('sub_old')
    expect(harness.mutations.some(({ table, operation }) => (
      table === 'subscriptions' && operation === 'upsert'
    ))).toBe(false)
    expect(harness.mutations.some(({ table, values }) => (
      table === 'profiles'
      && (values.plan === 'free'
        || values.pro_access === false
        || values.subscription_status === 'canceled')
    ))).toBe(false)
  })

  it('revokes Analytics access and clears shared Pro mirrors when no other subscription entitles access', async () => {
    const canceled = subscription({
      status: 'canceled',
      metadata: { user_id: 'user_1', plan: 'analytics_monthly' },
    })
    const harness = createWebhookHarness({
      subscription: canceled,
      subscriptionRows: [{
        stripe_subscription_id: 'sub_123',
        plan: 'analytics_monthly',
        status: 'canceled',
        current_period_end: null,
        cancel_at_period_end: false,
      }],
    })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', canceled)))

    expect(response.status).toBe(200)
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'subscriptions',
      operation: 'upsert',
      values: expect.objectContaining({ plan: 'analytics_monthly', status: 'canceled' }),
    }))
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'profiles',
      operation: 'update',
      values: expect.objectContaining({
        plan: 'free',
        pro_access: false,
        subscription_status: 'canceled',
        payment_failures: 0,
        past_due_since: null,
        cc_analytics_access: false,
      }),
    }))
  })

  it('revokes Analytics access without clearing a distinct current Pro subscription', async () => {
    const canceled = subscription({
      id: 'sub_analytics_old',
      status: 'canceled',
      metadata: { user_id: 'user_1', plan: 'analytics_monthly' },
    })
    const harness = createWebhookHarness({
      subscription: canceled,
      subscriptionRows: [{
        stripe_subscription_id: 'sub_pro_new',
        plan: 'pro',
        status: 'active',
        current_period_end: 1_800_000_000,
        cancel_at_period_end: false,
      }],
    })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', canceled)))

    expect(response.status).toBe(200)
    expect(harness.mutations.some(({ table, operation }) => (
      table === 'subscriptions' && operation === 'upsert'
    ))).toBe(false)
    expect(harness.mutations).toContainEqual(expect.objectContaining({
      table: 'profiles',
      operation: 'update',
      values: { cc_analytics_access: false },
    }))
  })

  it('preserves Analytics access for a distinct current Analytics subscription', async () => {
    const canceled = subscription({
      id: 'sub_analytics_old',
      status: 'canceled',
      metadata: { user_id: 'user_1', plan: 'analytics_monthly' },
    })
    const harness = createWebhookHarness({
      subscription: canceled,
      subscriptionRows: [{
        stripe_subscription_id: 'sub_analytics_new',
        plan: 'analytics_annual',
        status: 'active',
        current_period_end: 1_800_000_000,
        cancel_at_period_end: false,
      }],
    })
    mocks.createStripeClient.mockReturnValue({ stripe: harness.stripeClient, config: { mode: 'test' } })
    mocks.createAdminClient.mockReturnValue(harness.admin)

    const response = await POST(signedRequest(event('customer.subscription.deleted', canceled)))

    expect(response.status).toBe(200)
    expect(harness.mutations.some(({ table, operation }) => (
      table === 'subscriptions' && operation === 'upsert'
    ))).toBe(false)
    expect(harness.mutations.some(({ table, values }) => (
      table === 'profiles' && values.cc_analytics_access === false
    ))).toBe(false)
  })
})
