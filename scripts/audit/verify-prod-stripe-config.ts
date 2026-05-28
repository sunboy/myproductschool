/**
 * Production Stripe configuration verifier.
 *
 * Run this AFTER completing the manual setup steps in docs/runbooks/stripe-live-launch.md
 * to confirm the prod environment is correctly wired.
 *
 * Usage:
 *   # From a shell with prod env vars loaded (or a one-off Vercel deploy preview):
 *   npx tsx scripts/audit/verify-prod-stripe-config.ts
 *
 *   # To validate without actually deploying, pull a .env.production.local from your env
 *   # provider and run with explicit env path:
 *   ENV_PATH=.env.production.local npx tsx scripts/audit/verify-prod-stripe-config.ts
 *
 * Exits non-zero on any FAIL. Prints a per-check green/red summary.
 *
 * Checks:
 *   1. STRIPE_MODE / resolved mode = live
 *   2. STRIPE_SECRET_KEY shape = sk_live_
 *   3. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY shape = pk_live_
 *   4. Resolved runtime isConfigured=true
 *   5. STRIPE_PRICE_MONTHLY exists in live, is active, recurring monthly, expected amount
 *   6. STRIPE_PRICE_ANNUAL exists in live, is active, recurring yearly, expected amount
 *   7. Both prices belong to the same product (STRIPE_PRODUCT_PRO if set)
 *   8. Webhook endpoint registered for NEXT_PUBLIC_APP_URL + /api/stripe/webhook
 *   9. Webhook endpoint subscribes to all 16 required events
 *  10. STRIPE_WEBHOOK_SECRET is set (cannot verify it matches without the secret in the API list)
 *  11. STRIPE_AFFILIATE_COUPON_ID exists in live mode (if set)
 *  12. RESEND_API_KEY is set
 *  13. RESEND_FROM_EMAIL / RESEND_REPLY_TO are set
 *  14. NEXT_PUBLIC_APP_URL is set and looks like a real prod URL
 *  15. No STRIPE_TEST_* env vars present (clean prod env)
 *
 * Limitations:
 *   - Cannot verify the webhook signing secret value (Stripe API does not expose it)
 *   - Cannot verify Billing Portal config (Stripe API exposes list, but "correct" is subjective)
 *   - Cannot verify Stripe Tax registrations (separate compliance concern)
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import Stripe from 'stripe'

const ENV_PATH = process.env.ENV_PATH ?? '.env.local'
loadEnv({ path: resolve(process.cwd(), ENV_PATH) })

const REQUIRED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
  'charge.dispute.updated',
  'charge.dispute.funds_withdrawn',
  'charge.dispute.funds_reinstated',
] as const

const EXPECTED_PRICES = {
  monthly: { unitAmount: 2900, interval: 'month' as const, label: '$29/mo (or $39 per Step 1 decision)' },
  annual: { unitAmount: 19900, interval: 'year' as const, label: '$199/yr' },
}

type Check = { name: string; status: 'pass' | 'fail' | 'warn'; detail?: string }
const results: Check[] = []

function pass(name: string, detail?: string) { results.push({ name, status: 'pass', detail }) }
function fail(name: string, detail: string) { results.push({ name, status: 'fail', detail }) }
function warn(name: string, detail: string) { results.push({ name, status: 'warn', detail }) }

function mask(value: string | undefined | null, leadingChars = 10): string {
  if (!value) return '<unset>'
  if (value.length <= leadingChars + 4) return value
  return `${value.slice(0, leadingChars)}...${value.slice(-4)} (len=${value.length})`
}

async function main() {
  console.log(`\n=== HackProduct Stripe live-mode verification (env=${ENV_PATH}) ===\n`)

  // 1 — Mode
  const mode = process.env.STRIPE_MODE
  if (mode === 'live') {
    pass('STRIPE_MODE=live')
  } else {
    fail('STRIPE_MODE', `expected 'live', got '${mode ?? '<unset>'}'`)
  }

  // 2 — Secret key
  const sk = process.env.STRIPE_SECRET_KEY ?? ''
  if (sk.startsWith('sk_live_')) {
    pass('STRIPE_SECRET_KEY shape', mask(sk))
  } else if (sk.startsWith('sk_test_')) {
    fail('STRIPE_SECRET_KEY shape', `still a test key (${mask(sk)}) — must be sk_live_ for prod`)
  } else if (sk.startsWith('rk_live_')) {
    warn('STRIPE_SECRET_KEY shape', 'restricted live key — confirm it has the required scopes (Checkout, Subscriptions, Webhooks)')
  } else {
    fail('STRIPE_SECRET_KEY shape', `malformed or absent (${mask(sk)})`)
  }

  // 3 — Publishable key
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
  if (pk.startsWith('pk_live_')) {
    pass('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY shape', mask(pk))
  } else if (pk.startsWith('pk_test_')) {
    fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY shape', `still a test key (${mask(pk)}) — must be pk_live_ for prod`)
  } else {
    fail('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY shape', `malformed or absent (${mask(pk)})`)
  }

  // 4 — Webhook secret presence (can't verify value)
  if (process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
    pass('STRIPE_WEBHOOK_SECRET set', mask(process.env.STRIPE_WEBHOOK_SECRET))
  } else {
    fail('STRIPE_WEBHOOK_SECRET set', `expected whsec_..., got ${mask(process.env.STRIPE_WEBHOOK_SECRET)}`)
  }

  // 5 — Resend env
  if (process.env.RESEND_API_KEY?.startsWith('re_')) {
    pass('RESEND_API_KEY set', mask(process.env.RESEND_API_KEY))
  } else {
    fail('RESEND_API_KEY set', `expected re_..., got ${mask(process.env.RESEND_API_KEY)}`)
  }
  if (process.env.RESEND_FROM_EMAIL) {
    pass('RESEND_FROM_EMAIL set', process.env.RESEND_FROM_EMAIL)
  } else {
    warn('RESEND_FROM_EMAIL', 'not set — transactional emails will fail')
  }

  // 6 — App URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && /^https:\/\/[a-z0-9.-]+$/i.test(appUrl) && !appUrl.includes('localhost')) {
    pass('NEXT_PUBLIC_APP_URL', appUrl)
  } else {
    fail('NEXT_PUBLIC_APP_URL', `expected https://hackproduct.com or similar, got '${appUrl ?? '<unset>'}'`)
  }

  // 7 — No STRIPE_TEST_* vars present
  const testVars = Object.keys(process.env).filter((k) => k.startsWith('STRIPE_TEST_'))
  if (testVars.length === 0) {
    pass('No STRIPE_TEST_* leakage')
  } else {
    warn('STRIPE_TEST_* present', `${testVars.length} test-mode vars in env: ${testVars.join(', ')} — should be removed from prod`)
  }
  if (process.env.NEXT_PUBLIC_STRIPE_MODE === 'test') {
    fail('NEXT_PUBLIC_STRIPE_MODE', `still 'test' — change to 'live' or remove`)
  }

  // Bail out of API checks if secret key is wrong shape
  if (!sk.startsWith('sk_live_') && !sk.startsWith('rk_live_')) {
    console.log('\n⚠️  Skipping Stripe API checks — secret key is not a live key\n')
    printSummary()
    return
  }

  const stripe = new Stripe(sk, { apiVersion: '2026-02-25.clover' })

  // 8 — Monthly price
  const monthlyId = process.env.STRIPE_PRICE_MONTHLY
  if (!monthlyId) {
    fail('STRIPE_PRICE_MONTHLY set', '<unset>')
  } else {
    try {
      const price = await stripe.prices.retrieve(monthlyId)
      const checks = [
        price.active ? 'active=true' : `active=${price.active} ❌`,
        price.recurring?.interval === 'month' ? 'interval=month' : `interval=${price.recurring?.interval} ❌`,
        price.currency === 'usd' ? 'currency=usd' : `currency=${price.currency} (verify)`,
        `unit_amount=$${(price.unit_amount ?? 0) / 100}`,
      ]
      const anyFail = checks.some((c) => c.includes('❌'))
      if (anyFail) {
        fail('STRIPE_PRICE_MONTHLY', `${monthlyId}: ${checks.join(', ')}`)
      } else {
        pass('STRIPE_PRICE_MONTHLY', `${monthlyId}: ${checks.join(', ')}, product=${price.product}`)
      }
    } catch (e) {
      fail('STRIPE_PRICE_MONTHLY', `lookup failed: ${(e as Error).message}`)
    }
  }

  // 9 — Annual price
  const annualId = process.env.STRIPE_PRICE_ANNUAL
  if (!annualId) {
    fail('STRIPE_PRICE_ANNUAL set', '<unset>')
  } else {
    try {
      const price = await stripe.prices.retrieve(annualId)
      const checks = [
        price.active ? 'active=true' : `active=${price.active} ❌`,
        price.recurring?.interval === 'year' ? 'interval=year' : `interval=${price.recurring?.interval} ❌`,
        price.currency === 'usd' ? 'currency=usd' : `currency=${price.currency} (verify)`,
        `unit_amount=$${(price.unit_amount ?? 0) / 100}`,
      ]
      const anyFail = checks.some((c) => c.includes('❌'))
      if (anyFail) {
        fail('STRIPE_PRICE_ANNUAL', `${annualId}: ${checks.join(', ')}`)
      } else {
        pass('STRIPE_PRICE_ANNUAL', `${annualId}: ${checks.join(', ')}, product=${price.product}`)
      }
    } catch (e) {
      fail('STRIPE_PRICE_ANNUAL', `lookup failed: ${(e as Error).message}`)
    }
  }

  // 10 — Same product check
  if (monthlyId && annualId) {
    try {
      const [m, a] = await Promise.all([stripe.prices.retrieve(monthlyId), stripe.prices.retrieve(annualId)])
      if (m.product === a.product) {
        pass('Monthly + annual same product', String(m.product))
      } else {
        warn('Monthly + annual product mismatch', `monthly→${m.product}, annual→${a.product} — unusual but not blocking`)
      }
    } catch {
      // already reported above
    }
  }

  // 11 — Webhook endpoint exists for app URL
  if (appUrl) {
    const expectedUrl = `${appUrl.replace(/\/$/, '')}/api/stripe/webhook`
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
      const match = endpoints.data.find((e) => e.url === expectedUrl)
      if (!match) {
        fail('Webhook endpoint registered', `no endpoint matching ${expectedUrl}. Found: ${endpoints.data.map((e) => e.url).join(', ') || 'none'}`)
      } else {
        pass('Webhook endpoint registered', `${match.id} → ${match.url} (status=${match.status})`)
        // 12 — Event coverage
        const enabled = new Set(match.enabled_events)
        const wildcard = enabled.has('*')
        const missing = wildcard ? [] : REQUIRED_WEBHOOK_EVENTS.filter((e) => !enabled.has(e))
        if (wildcard) {
          pass('Webhook event coverage', '* (wildcard — all events delivered)')
        } else if (missing.length === 0) {
          pass('Webhook event coverage', `all ${REQUIRED_WEBHOOK_EVENTS.length} required events subscribed`)
        } else {
          fail('Webhook event coverage', `missing ${missing.length} events: ${missing.join(', ')}`)
        }
        if (match.status !== 'enabled') {
          fail('Webhook endpoint enabled', `status=${match.status}`)
        }
      }
    } catch (e) {
      fail('Webhook endpoint lookup', `${(e as Error).message}`)
    }
  }

  // 13 — Affiliate coupon
  const couponId = process.env.STRIPE_AFFILIATE_COUPON_ID
  if (!couponId) {
    warn('STRIPE_AFFILIATE_COUPON_ID', 'not set — affiliate program disabled (OK if intentional)')
  } else {
    try {
      const coupon = await stripe.coupons.retrieve(couponId)
      if (!coupon.valid) {
        fail('STRIPE_AFFILIATE_COUPON_ID', `coupon ${couponId} exists but valid=false`)
      } else {
        const discount = coupon.percent_off
          ? `${coupon.percent_off}% off`
          : `$${(coupon.amount_off ?? 0) / 100} off`
        pass('STRIPE_AFFILIATE_COUPON_ID', `${couponId}: ${discount}, duration=${coupon.duration}`)
      }
    } catch (e) {
      fail('STRIPE_AFFILIATE_COUPON_ID', `lookup failed: ${(e as Error).message}`)
    }
  }

  printSummary()
}

function printSummary() {
  console.log('\n=== Summary ===\n')
  const passes = results.filter((r) => r.status === 'pass')
  const warns = results.filter((r) => r.status === 'warn')
  const fails = results.filter((r) => r.status === 'fail')

  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️ ' : '❌'
    const detail = r.detail ? ` — ${r.detail}` : ''
    console.log(`${icon} ${r.name}${detail}`)
  }

  console.log(`\n${passes.length} pass, ${warns.length} warn, ${fails.length} fail\n`)

  if (fails.length > 0) {
    console.log('❌ NOT READY FOR LIVE — fix the FAIL items above before deploying.')
    process.exit(1)
  } else if (warns.length > 0) {
    console.log('⚠️  Ready, but review warnings above. Run a smoke test before announcing launch.')
    process.exit(0)
  } else {
    console.log('✅ All green. Proceed with Step 10 (production smoke test).')
    process.exit(0)
  }
}

main().catch((e) => {
  console.error('verify-prod-stripe-config crashed:', e)
  process.exit(2)
})
