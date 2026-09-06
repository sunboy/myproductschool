import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ createStripeClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('@/lib/stripe/config', () => ({ createStripeClient: mocks.createStripeClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/stripe/affiliates', () => ({}))
vi.mock('@/lib/email/transactional', () => ({}))
vi.mock('@/lib/posthog/server', () => ({}))
import { POST } from '../../src/app/api/stripe/webhook/route'

const signingSecret = 'whsec_fixture_for_local_signature_tests'
const stripe = new Stripe('sk_test_fixture')

function request(livemode: boolean, secret = signingSecret) {
  const payload = JSON.stringify({
    id: 'evt_mode_fixture', object: 'event', type: 'test.unhandled',
    livemode, data: { object: {} },
  })
  return new NextRequest('https://app.test/api/stripe/webhook', {
    method: 'POST', body: payload,
    headers: { 'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret }) },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', signingSecret)
  mocks.createAdminClient.mockReturnValue({
    from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) }),
  })
})

afterEach(() => vi.unstubAllEnvs())

describe('webhook environment isolation', () => {
  it.each([
    ['test', true], ['live', false],
  ] as const)('rejects a correctly signed opposite-mode event in %s before database access', async (mode, livemode) => {
    mocks.createStripeClient.mockReturnValue({ stripe, config: { mode } })
    const response = await POST(request(livemode))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Stripe event mode mismatch' })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it.each([
    ['test', false], ['live', true],
  ] as const)('accepts a correctly signed matching-mode event in %s', async (mode, livemode) => {
    mocks.createStripeClient.mockReturnValue({ stripe, config: { mode } })
    const response = await POST(request(livemode))
    expect(response.status).toBe(200)
    expect(mocks.createAdminClient).toHaveBeenCalledOnce()
  })

  it('still rejects an invalid signature before database access', async () => {
    mocks.createStripeClient.mockReturnValue({ stripe, config: { mode: 'test' } })
    const response = await POST(request(false, 'whsec_wrong_fixture'))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid signature' })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
})
