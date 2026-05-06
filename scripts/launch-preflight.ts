type CheckLevel = 'ok' | 'warn' | 'fail'

interface CheckResult {
  level: CheckLevel
  label: string
  detail?: string
}

const args = new Set(process.argv.slice(2))
const skipNetwork = args.has('--skip-network')

function argValue(name: string) {
  const prefix = `${name}=`
  const value = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  return value ? value.slice(prefix.length) : null
}

const baseUrl = (argValue('--url') ?? process.env.LAUNCH_PREFLIGHT_URL ?? 'https://hackproduct.com').replace(/\/$/, '')

const requiredEnv = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_ANNUAL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'CRON_SECRET',
  'ADMIN_SECRET',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_AUTH_TOKEN',
] as const

const forbiddenProductionFlags = [
  'RATE_LIMIT_MEMORY_FALLBACK',
  'DISCUSSION_MODERATION_E2E_FALLBACK',
  'TURNSTILE_E2E_FALLBACK',
  'USE_MOCK_DATA',
  'NEXT_PUBLIC_MOCK_MODE',
  'NEXT_PUBLIC_USE_MOCK_DATA',
  'STRIPE_TEST_MODE',
  'NEXT_PUBLIC_ADMIN_SECRET',
] as const

const publicRoutes = [
  '/',
  '/privacy',
  '/terms',
  '/pricing',
  '/help',
  '/changelog',
  '/api/health',
] as const

const results: CheckResult[] = []

function cleanEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) return null
  if (/^(changeme|change-me|example|your_|todo|placeholder|hackproduct-admin-dev)$/i.test(value)) return null
  return value
}

function add(level: CheckLevel, label: string, detail?: string) {
  results.push({ level, label, detail })
}

function checkRequiredEnv() {
  for (const name of requiredEnv) {
    add(cleanEnv(name) ? 'ok' : 'fail', `env ${name}`, cleanEnv(name) ? 'set' : 'missing')
  }

  const publishable = cleanEnv('NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY')
    ?? cleanEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  add(publishable ? 'ok' : 'fail', 'env Stripe publishable key', publishable ? 'set' : 'missing')
}

function checkProductionFlags() {
  for (const name of forbiddenProductionFlags) {
    const value = process.env[name]?.trim()
    add(value && value !== 'false' && value !== '0' ? 'fail' : 'ok', `production flag ${name}`, value ? 'set' : 'unset')
  }

  const stripeMode = process.env.STRIPE_MODE?.trim() ?? process.env.NEXT_PUBLIC_STRIPE_MODE?.trim()
  add(stripeMode === 'test' ? 'fail' : 'ok', 'Stripe production mode', stripeMode ? `mode=${stripeMode}` : 'default/live')
}

function checkStripeShape() {
  const secret = cleanEnv('STRIPE_SECRET_KEY')
  const publishable = cleanEnv('NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY')
    ?? cleanEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')

  if (secret) {
    add(
      secret.startsWith('sk_live_') || secret.startsWith('rk_live_') ? 'ok' : 'fail',
      'Stripe secret key is live-mode',
      secret.startsWith('sk_test_') || secret.startsWith('rk_test_') ? 'test key configured' : 'checked without printing value'
    )
  }

  if (publishable) {
    add(
      publishable.startsWith('pk_live_') ? 'ok' : 'fail',
      'Stripe publishable key is live-mode',
      publishable.startsWith('pk_test_') ? 'test key configured' : 'checked without printing value'
    )
  }

  for (const name of ['STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_ANNUAL'] as const) {
    const value = cleanEnv(name)
    if (value) add(value.startsWith('price_') ? 'ok' : 'fail', `${name} shape`, 'checked without printing value')
  }
}

function checkAffiliateGate() {
  if (process.env.NEXT_PUBLIC_ENABLE_AFFILIATES !== 'true') {
    add('ok', 'affiliates disabled by default', 'NEXT_PUBLIC_ENABLE_AFFILIATES is not true')
    return
  }

  for (const name of ['AFFILIATE_HASH_SECRET', 'STRIPE_AFFILIATE_COUPON_ID'] as const) {
    add(cleanEnv(name) ? 'ok' : 'fail', `affiliate env ${name}`, cleanEnv(name) ? 'set' : 'missing while affiliates are enabled')
  }
}

async function fetchUrl(path: string) {
  const url = new URL(path, baseUrl).toString()
  return fetch(url, { redirect: 'follow' })
}

async function checkRoute(path: string) {
  try {
    const response = await fetchUrl(path)
    const finalPath = new URL(response.url).pathname.replace(/\/$/, '') || '/'
    const expectedPath = path.replace(/\/$/, '') || '/'
    const wrongFinalPath = finalPath !== expectedPath
    const level = response.ok && !wrongFinalPath ? 'ok' : 'fail'
    const redirectDetail = wrongFinalPath ? `, final path ${finalPath}` : ''
    add(level, `route ${path}`, `${response.status} ${response.url}${redirectDetail}`)
    return response
  } catch (error) {
    add('fail', `route ${path}`, error instanceof Error ? error.message : 'fetch failed')
    return null
  }
}

async function checkNetwork() {
  if (skipNetwork) {
    add('warn', 'network checks skipped', 'rerun without --skip-network after deploy')
    return
  }

  const responses = await Promise.all(publicRoutes.map(checkRoute))
  const firstPage = responses[0]
  const headerResponse = responses.find(Boolean)

  if (firstPage) {
    const body = await firstPage.text()
    const lower = body.toLowerCase()
    add(!lower.includes('luma') ? 'ok' : 'fail', 'production copy has no Luma', lower.includes('luma') ? 'legacy Luma copy detected' : 'clean')
    add(!lower.includes('join waitlist') ? 'ok' : 'fail', 'production serves app not waitlist', lower.includes('join waitlist') ? 'waitlist copy detected' : 'current app content detected')
  }

  if (headerResponse) {
    const headers = headerResponse.headers
    const requiredHeaders = [
      'content-security-policy',
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy',
      'permissions-policy',
    ] as const

    for (const name of requiredHeaders) {
      add(headers.has(name) ? 'ok' : 'fail', `header ${name}`, headers.has(name) ? 'present' : 'missing')
    }
  }

  try {
    const manifest = await fetchUrl('/manifest.json')
    if (!manifest.ok) {
      add('fail', 'PWA manifest', `${manifest.status} ${manifest.url}`)
      return
    }

    const json = await manifest.json() as { display?: string; icons?: Array<{ sizes?: string; purpose?: string }> }
    const sizes = new Set((json.icons ?? []).flatMap(icon => (icon.sizes ?? '').split(/\s+/).filter(Boolean)))
    const hasMaskable = (json.icons ?? []).some(icon => icon.purpose?.includes('maskable'))
    add(json.display === 'standalone' ? 'ok' : 'fail', 'PWA manifest display', json.display ?? 'missing')
    add(sizes.has('192x192') ? 'ok' : 'fail', 'PWA manifest 192 icon', sizes.has('192x192') ? 'present' : 'missing')
    add(sizes.has('512x512') ? 'ok' : 'fail', 'PWA manifest 512 icon', sizes.has('512x512') ? 'present' : 'missing')
    add(hasMaskable ? 'ok' : 'fail', 'PWA manifest maskable icon', hasMaskable ? 'present' : 'missing')
  } catch (error) {
    add('fail', 'PWA manifest', error instanceof Error ? error.message : 'manifest check failed')
  }
}

function printResults() {
  const counts = {
    ok: results.filter(result => result.level === 'ok').length,
    warn: results.filter(result => result.level === 'warn').length,
    fail: results.filter(result => result.level === 'fail').length,
  }

  for (const result of results) {
    const prefix = result.level.toUpperCase().padEnd(4)
    console.log(`${prefix} ${result.label}${result.detail ? ` - ${result.detail}` : ''}`)
  }

  console.log(`\nSummary: ${counts.ok} ok, ${counts.warn} warnings, ${counts.fail} failures`)
  if (counts.fail > 0) process.exitCode = 1
}

async function main() {
  console.log(`Launch preflight target: ${baseUrl}`)
  checkRequiredEnv()
  checkProductionFlags()
  checkStripeShape()
  checkAffiliateGate()
  await checkNetwork()
  printResults()
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
