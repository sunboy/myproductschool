import { loadEnvConfig } from '@next/env'
import Stripe from 'stripe'
import {
  BILLING_PLANS,
  formatPlanPrice,
  type BillingPlanConfig,
  type BillingPlanId,
} from '../src/lib/billing/plans'
import { STRIPE_API_VERSION } from '../src/lib/stripe/config'

loadEnvConfig(process.cwd())

const args = new Set(process.argv.slice(2))
const createPaymentLink = args.has('--payment-link')

function getTestSecretKey(): string {
  const key = process.env.STRIPE_TEST_SECRET_KEY
    ?? (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || process.env.STRIPE_SECRET_KEY?.startsWith('rk_test_')
      ? process.env.STRIPE_SECRET_KEY
      : null)

  if (!key) {
    throw new Error(
      'Set STRIPE_TEST_SECRET_KEY=sk_test_... before running this script. It refuses to use live Stripe keys.'
    )
  }

  return key
}

async function findOrCreateProduct(stripe: Stripe): Promise<Stripe.Product> {
  const products = await stripe.products.list({ active: true, limit: 100 })
  const existing = products.data.find(product =>
    product.metadata.app === 'hackproduct' &&
    product.metadata.flow === 'freemium-test' &&
    product.name === 'HackProduct Pro'
  )

  if (existing) return existing

  return stripe.products.create({
    name: 'HackProduct Pro',
    description: 'Test-mode Pro subscription for HackProduct paywall and freemium QA.',
    metadata: {
      app: 'hackproduct',
      flow: 'freemium-test',
      managed_by: 'scripts/stripe-test-flow.ts',
    },
  })
}

async function findOrCreatePrice(
  stripe: Stripe,
  product: Stripe.Product,
  plan: BillingPlanConfig
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
  const existing = prices.data.find(price =>
    price.currency === 'usd' &&
    price.unit_amount === plan.unitAmount &&
    price.recurring?.interval === plan.interval &&
    price.metadata.app === 'hackproduct' &&
    price.metadata.plan === plan.id
  )

  if (existing) return existing

  return stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: plan.unitAmount,
    recurring: { interval: plan.interval },
    nickname: plan.label,
    metadata: {
      app: 'hackproduct',
      flow: 'freemium-test',
      plan: plan.id,
      managed_by: 'scripts/stripe-test-flow.ts',
    },
  })
}

async function main() {
  const stripe = new Stripe(getTestSecretKey(), { apiVersion: STRIPE_API_VERSION })
  const account = await stripe.accounts.retrieve()
  const product = await findOrCreateProduct(stripe)
  const priceEntries = await Promise.all(
    (Object.entries(BILLING_PLANS) as Array<[BillingPlanId, BillingPlanConfig]>)
      .map(async ([planId, plan]) => [planId, await findOrCreatePrice(stripe, product, plan)] as const)
  )
  const prices = Object.fromEntries(priceEntries) as Record<BillingPlanId, Stripe.Price>

  console.log('\nStripe test flow is ready.')
  console.log(`Account: ${account.id}`)
  console.log(`Product: ${product.id}`)
  console.log(`Monthly: ${prices.monthly.id} (${formatPlanPrice(BILLING_PLANS.monthly)}/mo)`)
  console.log(`Annual: ${prices.annual.id} (${formatPlanPrice(BILLING_PLANS.annual)}/yr)`)

  if (createPaymentLink) {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: prices.monthly.id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        app: 'hackproduct',
        flow: 'freemium-test',
        plan: 'monthly',
      },
    })
    console.log(`Payment Link smoke test: ${paymentLink.url}`)
    console.log('Note: Payment Links do not carry app user metadata, so use the app checkout route for entitlement QA.')
  }

  console.log('\nAdd these to local test env:')
  console.log('STRIPE_MODE=test')
  console.log('NEXT_PUBLIC_STRIPE_MODE=test')
  console.log(`STRIPE_TEST_PRICE_MONTHLY=${prices.monthly.id}`)
  console.log(`STRIPE_TEST_PRICE_ANNUAL=${prices.annual.id}`)
  console.log('\nThen run the app and start checkout from a logged-in test user.')
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
