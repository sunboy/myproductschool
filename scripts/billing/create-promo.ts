/**
 * Create a Stripe coupon + promotion code for a promo campaign.
 *
 * Checkout already has allow_promotion_codes: true, so the code is usable the
 * moment this script succeeds — users type it on the Stripe checkout page.
 * No deploy, no env change. Full operator guide: docs/runbooks/limits-and-pricing.md
 *
 * Usage (uses STRIPE_SECRET_KEY from the env file — sk_test_ or sk_live_ decides
 * which mode the promo lands in):
 *
 *   # 50% off the first 3 months, code LAUNCH50, max 100 redemptions
 *   ENV_PATH=.env.production.local npx tsx scripts/billing/create-promo.ts \
 *     --code LAUNCH50 --percent 50 --duration repeating --months 3 --max-redemptions 100
 *
 *   # Flat $10 off once, expires end of July
 *   ENV_PATH=.env.production.local npx tsx scripts/billing/create-promo.ts \
 *     --code SUMMER10 --amount-off 1000 --duration once --expires 2026-07-31
 *
 * Flags:
 *   --code <CODE>            promotion code customers type (required, uppercased)
 *   --percent <n>            percent off (mutually exclusive with --amount-off)
 *   --amount-off <cents>     flat USD amount off in cents
 *   --duration once|repeating|forever   (default: once)
 *   --months <n>             required when --duration repeating
 *   --max-redemptions <n>    optional cap on total uses
 *   --expires <YYYY-MM-DD>   optional code expiry (UTC end of day)
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import Stripe from 'stripe'

loadEnv({ path: resolve(process.cwd(), process.env.ENV_PATH ?? '.env.local') })

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 ? process.argv[idx + 1] : undefined
}

async function main() {
  // Same resolution as the app (src/lib/stripe/config.ts): STRIPE_MODE decides
  // first; test mode prefers STRIPE_TEST_SECRET_KEY. This keeps the script from
  // ever hitting live Stripe out of an env file the app treats as test.
  const explicitMode = process.env.STRIPE_MODE ?? process.env.NEXT_PUBLIC_STRIPE_MODE
  const anyKey = process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY
  const isTest = explicitMode === 'test' || (explicitMode !== 'live' && anyKey?.startsWith('sk_test_'))
  const sk = isTest
    ? process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY
  if (!sk?.startsWith('sk_')) {
    console.error('No usable Stripe secret key in env for the resolved mode. Set ENV_PATH to the right env file.')
    process.exit(1)
  }
  if (isTest && sk.startsWith('sk_live_')) {
    console.error('Resolved mode is test but only a live key is present. Refusing to run.')
    process.exit(1)
  }
  const mode = sk.startsWith('sk_live_') ? 'LIVE' : 'TEST'

  const code = arg('code')?.toUpperCase()
  const percent = arg('percent') ? Number(arg('percent')) : undefined
  const amountOff = arg('amount-off') ? Number(arg('amount-off')) : undefined
  const duration = (arg('duration') ?? 'once') as 'once' | 'repeating' | 'forever'
  const months = arg('months') ? Number(arg('months')) : undefined
  const maxRedemptions = arg('max-redemptions') ? Number(arg('max-redemptions')) : undefined
  const expires = arg('expires')

  if (!code) { console.error('--code is required'); process.exit(1) }
  if (!percent && !amountOff) { console.error('one of --percent or --amount-off is required'); process.exit(1) }
  if (percent && amountOff) { console.error('--percent and --amount-off are mutually exclusive'); process.exit(1) }
  if (duration === 'repeating' && !months) { console.error('--months is required with --duration repeating'); process.exit(1) }

  const stripe = new Stripe(sk, { apiVersion: '2026-02-25.clover' })

  console.log(`Mode: ${mode}`)
  const coupon = await stripe.coupons.create({
    name: code,
    duration,
    ...(duration === 'repeating' ? { duration_in_months: months } : {}),
    ...(percent ? { percent_off: percent } : { amount_off: amountOff, currency: 'usd' }),
  })
  console.log(`Coupon created: ${coupon.id} (${percent ? `${percent}% off` : `$${(amountOff! / 100).toFixed(2)} off`}, ${duration}${months ? ` x${months}mo` : ''})`)

  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code,
    ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
    ...(expires ? { expires_at: Math.floor(new Date(`${expires}T23:59:59Z`).getTime() / 1000) } : {}),
  })
  console.log(`Promotion code created: ${promo.code} (id ${promo.id})`)
  console.log('\nDone. The code works at checkout immediately — no deploy needed.')
  console.log('Deactivate anytime: Stripe Dashboard -> Products -> Coupons, or:')
  console.log(`  stripe promotion_codes update ${promo.id} --active=false`)
}

main().catch(e => { console.error(e.message ?? e); process.exit(1) })
