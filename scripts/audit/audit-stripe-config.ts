/**
 * Audit script: prints resolved Stripe runtime config and asserts test-mode hygiene.
 *
 * Usage:
 *   npx tsx scripts/audit/audit-stripe-config.ts
 *
 * Exits non-zero if:
 *   - STRIPE_SECRET_KEY is set but does NOT begin with `sk_test_` (rejects rk_test_, sk_live_, mk_, malformed, absent)
 *   - Resolved runtime is not configured (isConfigured=false)
 *
 * This is the Phase 1.1 audit hook for the Stripe + paywall production-readiness plan.
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Load .env.local explicitly — tsx does NOT auto-load Next.js env files.
loadEnv({ path: resolve(process.cwd(), '.env.local') })

import {
  getStripeRuntimeConfig,
  getStripePlanConfig,
} from '../../src/lib/stripe/config'

type LineKind = 'info' | 'ok' | 'warn' | 'fail'

const SYMBOLS: Record<LineKind, string> = {
  info: '  ',
  ok: 'OK',
  warn: 'WARN',
  fail: 'FAIL',
}

function line(kind: LineKind, label: string, value?: string) {
  const tag = SYMBOLS[kind].padEnd(4)
  const body = value != null ? `${label}: ${value}` : label
  console.log(`[${tag}] ${body}`)
}

function maskKey(key: string | null): string {
  if (!key) return '<unset>'
  if (key.length <= 12) return key
  return `${key.slice(0, 10)}...${key.slice(-4)} (len=${key.length})`
}

function keyFamily(key: string | null): string {
  if (!key) return 'absent'
  if (key.startsWith('sk_test_')) return 'sk_test_ (Stripe test secret)'
  if (key.startsWith('rk_test_')) return 'rk_test_ (Stripe restricted test key)'
  if (key.startsWith('sk_live_')) return 'sk_live_ (Stripe LIVE secret — danger)'
  if (key.startsWith('rk_live_')) return 'rk_live_ (Stripe LIVE restricted — danger)'
  if (key.startsWith('pk_test_')) return 'pk_test_ (publishable — wrong slot!)'
  if (key.startsWith('pk_live_')) return 'pk_live_ (publishable — wrong slot!)'
  if (key.startsWith('mk_')) return 'mk_ (UNKNOWN — looks malformed, NOT a Stripe API key)'
  return `unknown-prefix (${key.slice(0, 6)}...)`
}

function header(title: string) {
  console.log('')
  console.log('=== ' + title + ' '.repeat(Math.max(0, 60 - title.length - 4)))
}

let failures = 0
let warnings = 0

function fail(msg: string) {
  failures += 1
  line('fail', msg)
}

function warn(msg: string) {
  warnings += 1
  line('warn', msg)
}

// -----------------------------------------------------------------------------
// Hard guard on STRIPE_SECRET_KEY shape (Phase 1.1 explicit requirement)
// -----------------------------------------------------------------------------
header('STRIPE_SECRET_KEY shape guard')

const rawSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? null
const rawTestSecret = process.env.STRIPE_TEST_SECRET_KEY?.trim() ?? null

line('info', 'STRIPE_SECRET_KEY value', maskKey(rawSecret))
line('info', 'STRIPE_SECRET_KEY family', keyFamily(rawSecret))
line('info', 'STRIPE_TEST_SECRET_KEY value', maskKey(rawTestSecret))
line('info', 'STRIPE_TEST_SECRET_KEY family', keyFamily(rawTestSecret))

if (!rawSecret) {
  warn('STRIPE_SECRET_KEY is unset. Test mode reads STRIPE_TEST_SECRET_KEY first, so this is OK if the test key is present.')
} else if (rawSecret.startsWith('sk_test_')) {
  line('ok', 'STRIPE_SECRET_KEY shape is a valid Stripe test secret (sk_test_)')
} else {
  fail(
    `STRIPE_SECRET_KEY does NOT start with sk_test_. Got family: ${keyFamily(rawSecret)}.\n` +
      '       Production-readiness plan requires sk_test_ here, or removal of the variable entirely.\n' +
      '       Acceptable fixes:\n' +
      '         (a) delete STRIPE_SECRET_KEY from .env.local — test mode will use STRIPE_TEST_SECRET_KEY\n' +
      '         (b) replace it with the matching sk_test_ value from Stripe Dashboard (test mode)'
  )
}

if (!rawTestSecret) {
  fail('STRIPE_TEST_SECRET_KEY is unset — required when STRIPE_MODE=test.')
} else if (!rawTestSecret.startsWith('sk_test_') && !rawTestSecret.startsWith('rk_test_')) {
  fail(`STRIPE_TEST_SECRET_KEY has wrong family: ${keyFamily(rawTestSecret)}.`)
} else {
  line('ok', 'STRIPE_TEST_SECRET_KEY shape is a valid Stripe test secret')
}

// -----------------------------------------------------------------------------
// Resolved runtime config (this is what the app actually uses)
// -----------------------------------------------------------------------------
header('Resolved Stripe runtime (getStripeRuntimeConfig)')

const runtime = getStripeRuntimeConfig(process.env)

line('info', 'STRIPE_MODE', process.env.STRIPE_MODE ?? '<unset>')
line('info', 'NEXT_PUBLIC_STRIPE_MODE', process.env.NEXT_PUBLIC_STRIPE_MODE ?? '<unset>')
line('info', 'Resolved mode', runtime.mode)
line('info', 'Resolved secretKey', maskKey(runtime.secretKey))
line('info', 'Resolved secretKey family', keyFamily(runtime.secretKey))
line('info', 'Resolved publishableKey', maskKey(runtime.publishableKey))
line('info', 'Resolved publishableKey family', keyFamily(runtime.publishableKey))
line('info', 'isConfigured', String(runtime.isConfigured))
line('info', 'error', runtime.error ?? '<none>')

// Which env var path "won"?
if (runtime.mode === 'test') {
  if (runtime.secretKey && rawTestSecret && runtime.secretKey === rawTestSecret) {
    line('ok', 'Active secret key path: STRIPE_TEST_SECRET_KEY (correct for test mode)')
    if (rawSecret && !rawSecret.startsWith('sk_test_')) {
      line('ok', `Malformed STRIPE_SECRET_KEY (${keyFamily(rawSecret)}) was BYPASSED by test-mode precedence. This confirms CODEX-1 mitigation.`)
    }
  } else if (runtime.secretKey && rawSecret && runtime.secretKey === rawSecret) {
    warn('Active secret key path: STRIPE_SECRET_KEY fallback (STRIPE_TEST_SECRET_KEY was empty).')
  } else {
    warn('Active secret key path: could not determine which env var supplied the resolved secret.')
  }
} else {
  warn(`Resolved mode is "${runtime.mode}". Test mode was expected per STRIPE_MODE=test in .env.local.`)
}

if (!runtime.isConfigured) {
  fail(`Stripe runtime not configured. Reason: ${runtime.error}`)
} else {
  line('ok', 'Stripe runtime is configured')
}

// -----------------------------------------------------------------------------
// Price IDs for both billing plans
// -----------------------------------------------------------------------------
header('Resolved price IDs (getStripePlanConfig)')

const monthly = getStripePlanConfig('monthly', process.env)
const annual = getStripePlanConfig('annual', process.env)

line('info', 'STRIPE_TEST_PRICE_MONTHLY', process.env.STRIPE_TEST_PRICE_MONTHLY ?? '<unset>')
line('info', 'STRIPE_TEST_PRICE_ANNUAL', process.env.STRIPE_TEST_PRICE_ANNUAL ?? '<unset>')
line('info', 'STRIPE_PRICE_MONTHLY', process.env.STRIPE_PRICE_MONTHLY ?? '<unset>')
line('info', 'STRIPE_PRICE_ANNUAL', process.env.STRIPE_PRICE_ANNUAL ?? '<unset>')
line('info', 'Resolved monthly priceId', monthly.priceId ?? '<null>')
line('info', 'Resolved annual priceId', annual.priceId ?? '<null>')

if (!monthly.priceId) fail('Monthly priceId did not resolve.')
else if (!monthly.priceId.startsWith('price_')) fail(`Monthly priceId has wrong shape: ${monthly.priceId}`)
else line('ok', `Monthly priceId: ${monthly.priceId}`)

if (!annual.priceId) fail('Annual priceId did not resolve.')
else if (!annual.priceId.startsWith('price_')) fail(`Annual priceId has wrong shape: ${annual.priceId}`)
else line('ok', `Annual priceId: ${annual.priceId}`)

// -----------------------------------------------------------------------------
// Coupon / affiliate / webhook env presence (existence only, no validation)
// -----------------------------------------------------------------------------
header('Adjacent Stripe env presence')

const adjacent: Array<[string, string | undefined]> = [
  ['STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET],
  ['STRIPE_AFFILIATE_COUPON_ID', process.env.STRIPE_AFFILIATE_COUPON_ID],
  ['STRIPE_TEST_AFFILIATE_COUPON_ID', process.env.STRIPE_TEST_AFFILIATE_COUPON_ID],
  ['AFFILIATE_HASH_SECRET', process.env.AFFILIATE_HASH_SECRET],
  ['NEXT_PUBLIC_ENABLE_AFFILIATES', process.env.NEXT_PUBLIC_ENABLE_AFFILIATES],
]

for (const [name, value] of adjacent) {
  if (value && value.trim().length > 0) {
    line('info', name, name.includes('SECRET') || name.includes('HASH') ? `<set, len=${value.length}>` : value)
  } else {
    line('info', name, '<unset>')
  }
}

// -----------------------------------------------------------------------------
// Summary + exit
// -----------------------------------------------------------------------------
header('Summary')

line('info', 'Failures', String(failures))
line('info', 'Warnings', String(warnings))

if (failures > 0) {
  console.log('')
  console.error(`audit-stripe-config: FAILED with ${failures} failure(s).`)
  process.exit(1)
}

console.log('')
console.log(`audit-stripe-config: PASSED (${warnings} warning(s)).`)
process.exit(0)
