import { expect, test, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'
const HAS_SUPABASE_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
)
const IS_MOCK_SERVER = process.env.USE_MOCK_DATA === 'true'
const RUN_PREFIX = `e2e-auth-${Date.now()}`
const TEST_DOMAIN = 'hackproduct.dev'

interface TestUser {
  id: string
  email: string
  password: string
}

interface ApiResult {
  status: number
  body: Record<string, unknown>
  headers: Record<string, string>
}

function getAdminClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for auth e2e tests.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function uniqueEmail(label: string) {
  return `${RUN_PREFIX}-${label}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`
}

function uniquePassword(label: string) {
  return `Auth-${label}-${Math.random().toString(36).slice(2, 8)}1!`
}

function supabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for auth e2e tests.')
  return new URL(url).hostname.split('.')[0]
}

async function installLocalSessionFromCurrentHash(page: Page) {
  const hash = new URL(page.url()).hash.replace(/^#/, '')
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const expiresAt = Number(params.get('expires_at'))
  const expiresIn = Number(params.get('expires_in') ?? 3600)
  const tokenType = params.get('token_type') ?? 'bearer'

  if (!accessToken || !refreshToken || !Number.isFinite(expiresAt)) {
    throw new Error(`Supabase auth link did not return session tokens: ${page.url()}`)
  }

  const cookieValue = `base64-${Buffer.from(JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    expires_in: expiresIn,
    token_type: tokenType,
  }), 'utf8').toString('base64url')}`
  const localUrl = new URL(BASE_URL)

  await page.context().addCookies([{
    name: `sb-${supabaseProjectRef()}-auth-token`,
    value: cookieValue,
    domain: localUrl.hostname,
    path: '/',
    expires: expiresAt,
    sameSite: 'Lax',
    secure: localUrl.protocol === 'https:',
  }])
}

async function cleanupRunUsers(admin: SupabaseClient) {
  let page = 1
  const perPage = 1000
  const ids: string[] = []

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Could not list auth users: ${error.message}`)

    for (const user of data.users) {
      const email = user.email?.toLowerCase() ?? ''
      if (email.startsWith('e2e-auth-') && email.endsWith(`@${TEST_DOMAIN}`)) {
        ids.push(user.id)
      }
    }

    if (!data.nextPage || data.users.length === 0) break
    page = data.nextPage
  }

  await Promise.all(ids.map(id => admin.auth.admin.deleteUser(id)))
}

async function createOnboardedUser(admin: SupabaseClient, label: string): Promise<TestUser> {
  const email = uniqueEmail(label)
  const password = uniquePassword(label)
  const displayName = `E2E Auth ${label}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error || !data.user) {
    throw new Error(`Could not create auth user: ${error?.message ?? 'missing user'}`)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: data.user.id,
      display_name: displayName,
      plan: 'free',
      onboarding_completed_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (profileError) {
    throw new Error(`Could not create auth profile: ${profileError.message}`)
  }

  return { id: data.user.id, email, password }
}

async function appFetch(
  page: Page,
  path: string,
  options: { method?: string; data?: unknown } = {}
): Promise<ApiResult> {
  return page.evaluate(async ({ path: requestPath, method, data }) => {
    const response = await fetch(requestPath, {
      method,
      headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    const text = await response.text()
    let body: Record<string, unknown> = {}
    try {
      body = text ? JSON.parse(text) as Record<string, unknown> : {}
    } catch {
      body = { raw: text }
    }

    return {
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers.entries()),
    }
  }, { path, method: options.method ?? 'GET', data: options.data })
}

async function loginWithApi(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`)

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await appFetch(page, '/api/auth/login', {
      method: 'POST',
      data: { email, password },
    })

    if (result.status === 429) {
      const retryAfter = Number(result.headers['retry-after'] ?? 1)
      await page.waitForTimeout((Number.isFinite(retryAfter) ? retryAfter : 1) * 1000 + 500)
      continue
    }

    expect(result.status, JSON.stringify(result.body)).toBe(200)
    return
  }

  throw new Error(`Could not log in as ${email}; auth login remained rate-limited.`)
}

async function loginWithUi(page: Page, email: string, password: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)

    const loginResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') &&
      response.request().method() === 'POST'
    )
    await page.click('button[type="submit"]')
    const loginResponse = await loginResponsePromise

    if (loginResponse.status() === 429) {
      const retryAfter = Number(loginResponse.headers()['retry-after'] ?? 1)
      await page.waitForTimeout((Number.isFinite(retryAfter) ? retryAfter : 1) * 1000 + 500)
      continue
    }

    expect(loginResponse.status()).toBe(200)
    await page.waitForURL(/\/dashboard/, { timeout: 30000 })
    return
  }

  throw new Error(`Could not log in as ${email}; auth login remained rate-limited.`)
}

async function clearBrowserSession(page: Page) {
  await page.context().clearCookies()
  await page.goto(`${BASE_URL}/login`)
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

async function expectDashboard(page: Page) {
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/i })).toBeVisible({
    timeout: 30000,
  })
}

test.describe.configure({ mode: 'serial' })

test.describe('Auth launch scenarios', () => {
  test.skip(!HAS_SUPABASE_ENV, 'Auth e2e tests require Supabase environment variables.')
  test.skip(IS_MOCK_SERVER, 'Auth launch flows require the real Supabase-backed app.')
  test.skip(Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY), 'Turnstile browser challenges are not solvable in headless e2e.')

  let admin: SupabaseClient

  test.beforeAll(async () => {
    admin = getAdminClient()
    await cleanupRunUsers(admin)
  })

  test.afterAll(async () => {
    await cleanupRunUsers(admin)
  })

  test('N4.1 Signup verification callback can complete onboarding and reach dashboard', async ({ page }) => {
    const email = uniqueEmail('signup')
    const password = uniquePassword('signup')
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { display_name: 'E2E Auth Signup' },
        redirectTo: `${BASE_URL}/auth/callback`,
      },
    })
    expect(error).toBeNull()
    expect(data.properties.action_link).toContain('/auth/v1/verify')

    await page.goto(data.properties.action_link)
    await expect.poll(() => new URL(page.url()).hash).toContain('access_token=')
    await installLocalSessionFromCurrentHash(page)
    await page.goto(`${BASE_URL}/onboarding/welcome`)
    await expect(page).toHaveURL(/\/onboarding\/welcome/, { timeout: 30000 })

    const complete = await appFetch(page, '/api/onboarding/complete', {
      method: 'POST',
      data: {
        role_context: 'Software engineer',
        experience_level: 'mid',
        calibration_answers: [],
      },
    })
    expect(complete.status, JSON.stringify(complete.body)).toBe(200)

    await page.goto(`${BASE_URL}/dashboard`)
    await expectDashboard(page)
  })

  test('N4.2 Password login reaches dashboard for an onboarded user', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'login')

    await loginWithUi(page, user.email, user.password)
    await expectDashboard(page)
  })

  test('N4.3 Magic link signs in an onboarded user', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'magic')
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: `${BASE_URL}/auth/callback` },
    })
    expect(error).toBeNull()
    expect(data.properties.action_link).toContain('/auth/v1/verify')

    await page.goto(data.properties.action_link)
    await expect.poll(() => new URL(page.url()).hash).toContain('access_token=')
    await installLocalSessionFromCurrentHash(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await expectDashboard(page)
  })

  test('N4.4 Forgot-password recovery resets password and new password logs in', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'recovery')
    const nextPassword = uniquePassword('recovery-new')
    const ipSeed = Date.now() % 60000

    await page.setExtraHTTPHeaders({
      'x-forwarded-for': `10.${Math.floor(ipSeed / 256)}.${ipSeed % 256}.${test.info().workerIndex + 1}`,
    })
    await page.goto(`${BASE_URL}/forgot-password`)
    await page.getByPlaceholder('you@company.com').fill(user.email)
    const resetResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/password-reset') &&
      response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'Send reset link' }).click()
    const resetResponse = await resetResponsePromise
    expect(resetResponse.status()).toBe(200)
    await expect(page.getByText('If an account exists for that email, a reset link will arrive shortly.')).toBeVisible()

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: { redirectTo: `${BASE_URL}/reset-password` },
    })
    expect(error).toBeNull()

    await page.goto(data.properties.action_link)
    const recoveryHash = new URL(page.url()).hash
    expect(recoveryHash).toContain('access_token=')
    await page.goto(`${BASE_URL}/reset-password${recoveryHash}`)
    await expect(page.getByText('Choose a new password')).toBeVisible({ timeout: 30000 })
    await page.locator('input[type="password"]').nth(0).fill(nextPassword)
    await page.locator('input[type="password"]').nth(1).fill(nextPassword)
    await page.getByRole('button', { name: 'Set new password' }).click()
    await expectDashboard(page)

    await clearBrowserSession(page)
    await loginWithUi(page, user.email, nextPassword)
    await expectDashboard(page)
  })

  test('N4.5 Google identity linking starts from the existing account without duplicating it', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'google-link')
    await loginWithApi(page, user.email, user.password)

    const before = await admin.auth.admin.getUserById(user.id)
    expect(before.error).toBeNull()

    const result = await appFetch(page, '/api/auth/link-identity', {
      method: 'POST',
      data: { redirectTo: `${BASE_URL}/auth/callback?next=/settings` },
    })
    if (result.status === 400 && result.body.code === 'identity_provider_error') {
      test.skip(true, 'Google OAuth provider or local redirect allow-list is not available in this environment.')
    }
    expect(result.status, JSON.stringify(result.body)).toBe(200)
    expect(result.body.ok).toBe(true)
    expect(String(result.body.url ?? '')).toContain('provider=google')

    const after = await admin.auth.admin.getUserById(user.id)
    expect(after.error).toBeNull()
    expect(after.data.user?.email).toBe(user.email)
  })

  test('N4.6 Reauth modal blocks sensitive password changes until current password is verified', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'reauth')
    const nextPassword = uniquePassword('reauth-new')

    await loginWithApi(page, user.email, user.password)
    const blocked = await appFetch(page, '/api/auth/change-password', {
      method: 'POST',
      data: {
        currentPassword: user.password,
        password: nextPassword,
        confirm: nextPassword,
      },
    })
    expect(blocked.status, JSON.stringify(blocked.body)).toBe(403)
    expect(blocked.body.error).toBe('reauth_required')

    await page.goto(`${BASE_URL}/settings`)
    await page.locator('#settings-password').fill(nextPassword)
    await page.locator('#settings-confirm').fill(nextPassword)
    await page.getByRole('button', { name: 'Update password' }).click()
    const reauthDialog = page.getByRole('dialog', { name: 'Confirm password change' })
    await expect(reauthDialog).toBeVisible()
    await reauthDialog.locator('#reauth-password').fill(user.password)
    await reauthDialog.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByText('Password updated.')).toBeVisible({ timeout: 30000 })

    await clearBrowserSession(page)
    await loginWithUi(page, user.email, nextPassword)
    await expectDashboard(page)
  })

  test('N4.7 Idle timeout signs out inactive sessions', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'idle')
    await loginWithApi(page, user.email, user.password)
    await page.clock.install()
    await page.goto(`${BASE_URL}/dashboard`)
    await expectDashboard(page)

    await page.clock.fastForward(30 * 60 * 1000 + 1000)
    await expect(page.getByRole('dialog', { name: 'Still working?' })).toBeVisible({ timeout: 10000 })

    await page.clock.runFor(61 * 1000)
    await page.waitForURL(/\/login(?:\?reason=idle)?$/, { timeout: 15000 })
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForURL(/\/login(?:\?.*)?$/, { timeout: 15000 })
  })

  test('N4.8 Account deletion requires reauth and removes auth/profile data', async ({ page }) => {
    const user = await createOnboardedUser(admin, 'delete')
    await loginWithApi(page, user.email, user.password)

    const blocked = await appFetch(page, '/api/profile/delete', {
      method: 'DELETE',
      data: { email: user.email, confirmation: 'DELETE' },
    })
    expect(blocked.status, JSON.stringify(blocked.body)).toBe(403)
    expect(blocked.body.error).toBe('reauth_required')

    const reauth = await appFetch(page, '/api/auth/reauthenticate', {
      method: 'POST',
      data: { password: user.password },
    })
    expect(reauth.status, JSON.stringify(reauth.body)).toBe(200)

    const deleted = await appFetch(page, '/api/profile/delete', {
      method: 'DELETE',
      data: { email: user.email, confirmation: 'DELETE' },
    })
    expect(deleted.status, JSON.stringify(deleted.body)).toBe(200)
    expect(deleted.body.ok).toBe(true)

    const authUser = await admin.auth.admin.getUserById(user.id)
    expect(authUser.data.user).toBeNull()

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    expect(profileError).toBeNull()
    expect(profile).toBeNull()

    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    expect(subscriptionError).toBeNull()
    expect(subscription).toBeNull()
  })
})
