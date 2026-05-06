import { expect, test, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const HAS_SUPABASE_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
)
const HAS_ANTHROPIC_ENV = Boolean(process.env.ANTHROPIC_API_KEY)
const IS_MOCK_SERVER = process.env.USE_MOCK_DATA === 'true'

type PersonaKey =
  | 'freeNew'
  | 'freeActive'
  | 'freeCapped'
  | 'proActive'

type AiCounterFeature =
  | 'hatch_chat_msgs'
  | 'hatch_nudges'
  | 'quick_takes'

interface TestUser {
  id: string
  email: string
}

interface ApiResult {
  status: number
  retryAfter: string | null
  body: Record<string, unknown>
}

const EMAILS: Record<PersonaKey, string> = {
  freeNew: 'e2e+free-new@hackproduct.com',
  freeActive: 'e2e+free-active@hackproduct.com',
  freeCapped: 'e2e+free-capped@hackproduct.com',
  proActive: 'e2e+pro-active@hackproduct.com',
}

const FALLBACK_LIMITS = {
  hatch_chat_msgs: 50,
  hatch_nudges: 25,
  quick_takes: 30,
  interviews: 1,
}

function getAdminClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for paywall e2e tests.')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findUserByEmail(admin: SupabaseClient, email: string): Promise<TestUser> {
  let page = 1
  const perPage = 1000

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Could not list Supabase auth users: ${error.message}`)

    const match = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())
    if (match?.email) return { id: match.id, email: match.email }

    if (!data.nextPage || data.users.length === 0) break
    page = data.nextPage
  }

  throw new Error(`Missing ${email}. Run npx tsx scripts/seed-test-users.ts first.`)
}

async function loadUsers(admin: SupabaseClient): Promise<Record<PersonaKey, TestUser>> {
  const entries = await Promise.all(
    Object.entries(EMAILS).map(async ([key, email]) => [key, await findUserByEmail(admin, email)] as const)
  )

  return Object.fromEntries(entries) as Record<PersonaKey, TestUser>
}

function currentMonthStart(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)
}

async function getPlanLimit(
  admin: SupabaseClient,
  plan: 'free' | 'pro',
  feature: string,
  fallback: number
) {
  const { data } = await admin
    .from('plan_limits')
    .select('limit_value')
    .eq('plan', plan)
    .eq('feature', feature)
    .maybeSingle()

  const value = Number((data as { limit_value?: unknown } | null)?.limit_value)
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

async function setAiCounter(
  admin: SupabaseClient,
  userId: string,
  feature: AiCounterFeature,
  count: number
) {
  const { error } = await admin.from('usage_counters').upsert({
    user_id: userId,
    feature,
    period_start: currentMonthStart(),
    count,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,feature,period_start' })

  if (error) throw new Error(`Could not set ${feature} usage counter: ${error.message}`)
}

async function clearAiCounters(admin: SupabaseClient, userId: string) {
  const { error } = await admin
    .from('usage_counters')
    .delete()
    .eq('user_id', userId)
    .eq('period_start', currentMonthStart())
    .in('feature', ['hatch_chat_msgs', 'hatch_nudges', 'quick_takes'])

  if (error) throw new Error(`Could not clear AI counters: ${error.message}`)
}

async function setProfilePlan(admin: SupabaseClient, userId: string, plan: 'free' | 'pro') {
  const { error } = await admin.from('profiles').update({ plan }).eq('id', userId)
  if (error) throw new Error(`Could not set profile plan: ${error.message}`)
}

async function setRollingUsage(
  admin: SupabaseClient,
  userId: string,
  feature: 'interviews',
  count: number
) {
  await admin.from('usage_events').delete().eq('user_id', userId).eq('feature', feature)

  if (count === 0) return

  const rows = Array.from({ length: count }, (_, index) => ({
    user_id: userId,
    feature,
    event_type: 'start',
    quantity: 1,
    estimated_cost_cents: 0,
    metadata: { seeded_by: 'e2e/paywall.spec.ts', index },
    created_at: new Date().toISOString(),
  }))

  const { error } = await admin.from('usage_events').insert(rows)
  if (error) throw new Error(`Could not set rolling ${feature} usage: ${error.message}`)
}

async function getQuickTakeId(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin
    .from('challenges')
    .select('id')
    .eq('challenge_type', 'quick_take')
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Could not load quick take: ${error.message}`)
  const id = String((data as { id?: unknown } | null)?.id ?? '')
  if (!id) throw new Error('No published quick-take challenge found.')
  return id
}

async function loginAs(page: Page, email: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|onboarding|explore|challenges|welcome|role|calibration|baseline)/, {
    timeout: 90000,
  })
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
      retryAfter: response.headers.get('Retry-After'),
      body,
    }
  }, { path, method: options.method ?? 'GET', data: options.data })
}

function expectLimitReached(result: ApiResult, feature: string) {
  expect(result.status).toBe(402)
  expect(result.body.error).toBe('limit_reached')
  expect(result.body.feature).toBe(feature)
  expect(Number(result.body.used)).toBeGreaterThanOrEqual(Number(result.body.limit))
}

function retryAfterMs(result: ApiResult) {
  const seconds = Number(result.retryAfter ?? result.body.retryAfter ?? 1)
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 1) * 1000 + 250
}

async function appFetchAfterThrottleReset(
  page: Page,
  path: string,
  options: { method?: string; data?: unknown } = {}
) {
  let result = await appFetch(page, path, options)

  if (result.status === 429) {
    await page.waitForTimeout(retryAfterMs(result))
    result = await appFetch(page, path, options)
  }

  return result
}

test.describe.configure({ mode: 'serial' })

test.describe('Paywall scenarios', () => {
  test.skip(!HAS_SUPABASE_ENV || !TEST_PASSWORD, 'Run scripts/seed-test-users.ts and set E2E_TEST_PASSWORD.')
  test.skip(IS_MOCK_SERVER, 'Paywall enforcement is bypassed when USE_MOCK_DATA=true.')

  let admin: SupabaseClient
  let users: Record<PersonaKey, TestUser>

  test.beforeAll(async () => {
    admin = getAdminClient()
    users = await loadUsers(admin)
  })

  test.beforeEach(async () => {
    await Promise.all(Object.values(users).map(user => clearAiCounters(admin, user.id)))
    await Promise.all([
      setProfilePlan(admin, users.freeNew.id, 'free'),
      setProfilePlan(admin, users.freeActive.id, 'free'),
      setProfilePlan(admin, users.freeCapped.id, 'free'),
      setProfilePlan(admin, users.proActive.id, 'pro'),
      setRollingUsage(admin, users.freeActive.id, 'interviews', 0),
      setRollingUsage(admin, users.proActive.id, 'interviews', 0),
    ])
  })

  test('N2.1 Free user at Hatch chat limit receives a server 402', async ({ page }) => {
    test.skip(!HAS_ANTHROPIC_ENV, 'ANTHROPIC_API_KEY is required because Hatch chat mock mode bypasses plan checks.')

    const limit = await getPlanLimit(admin, 'free', 'hatch_chat_msgs', FALLBACK_LIMITS.hatch_chat_msgs)
    await setAiCounter(admin, users.freeCapped.id, 'hatch_chat_msgs', limit)
    await loginAs(page, users.freeCapped.email)

    const result = await appFetch(page, '/api/hatch/chat', {
      method: 'POST',
      data: {
        message: 'What should I do next?',
        history: [],
        pageContext: { pageType: 'dashboard', entityId: null, pathname: '/dashboard' },
      },
    })

    expectLimitReached(result, 'hatch_chat_msgs')
  })

  test('N2.2 Free user at Hatch nudge limit receives a server 402', async ({ page }) => {
    test.skip(!HAS_ANTHROPIC_ENV, 'ANTHROPIC_API_KEY is required because Hatch nudge mock mode bypasses plan checks.')

    const limit = await getPlanLimit(admin, 'free', 'hatch_nudges', FALLBACK_LIMITS.hatch_nudges)
    await setAiCounter(admin, users.freeCapped.id, 'hatch_nudges', limit)
    await loginAs(page, users.freeCapped.email)

    const result = await appFetch(page, '/api/hatch/nudge', {
      method: 'POST',
      data: {
        challengePrompt: 'Improve activation for a developer tool.',
        draft: 'I would improve onboarding and measure activation.',
        step: 'frame',
      },
    })

    expectLimitReached(result, 'hatch_nudges')
  })

  test('N2.3 Free user crossing the quick-take cap receives a server 402', async ({ page }) => {
    test.skip(!HAS_ANTHROPIC_ENV, 'ANTHROPIC_API_KEY is required because quick-take mock mode bypasses plan checks.')

    const limit = await getPlanLimit(admin, 'free', 'quick_takes', FALLBACK_LIMITS.quick_takes)
    const quickTakeId = await getQuickTakeId(admin)
    await setAiCounter(admin, users.freeCapped.id, 'quick_takes', Math.max(limit - 4, 0))
    await loginAs(page, users.freeCapped.email)

    const statuses: number[] = []
    for (let i = 0; i < 5; i++) {
      const result = await appFetchAfterThrottleReset(page, '/api/challenges/quick-take/submit', {
        method: 'POST',
        data: {
          challenge_id: quickTakeId,
          response_text: `Attempt ${i + 1}: I would diagnose the funnel, segment new users, and pick one activation metric.`,
        },
      })
      statuses.push(result.status)
      if (i < 4) expect(result.status, JSON.stringify(result.body)).toBe(200)
      if (i === 4) expectLimitReached(result, 'quick_takes')
    }

    expect(statuses).toEqual([200, 200, 200, 200, 402])
  })

  test('N2.4 Free live interview start is blocked, while Pro can start', async ({ page }) => {
    const freeLimit = await getPlanLimit(admin, 'free', 'interviews', FALLBACK_LIMITS.interviews)
    await setRollingUsage(admin, users.freeActive.id, 'interviews', freeLimit)

    await loginAs(page, users.freeActive.email)
    const freeResult = await appFetch(page, '/api/live-interview/start', {
      method: 'POST',
      data: {},
    })
    expectLimitReached(freeResult, 'interviews')

    await page.context().clearCookies()
    await loginAs(page, users.proActive.email)
    const proResult = await appFetch(page, '/api/live-interview/start', {
      method: 'POST',
      data: {},
    })
    expect(proResult.status).toBe(200)
    expect(typeof proResult.body.sessionId).toBe('string')
  })

  test('N2.5 Hatch chat enforces the per-minute throttle before model work', async ({ page }) => {
    test.skip(!HAS_ANTHROPIC_ENV, 'ANTHROPIC_API_KEY is required because Hatch chat mock mode bypasses throttling.')

    const limit = await getPlanLimit(admin, 'free', 'hatch_chat_msgs', FALLBACK_LIMITS.hatch_chat_msgs)
    await setAiCounter(admin, users.freeNew.id, 'hatch_chat_msgs', limit)
    await loginAs(page, users.freeNew.email)

    const statuses: number[] = []
    let last: ApiResult | null = null
    for (let i = 0; i < 6; i++) {
      last = await appFetch(page, '/api/hatch/chat', {
        method: 'POST',
        data: {
          message: `Throttle check ${i + 1}`,
          history: [],
          pageContext: { pageType: 'dashboard', entityId: null, pathname: '/dashboard' },
        },
      })
      statuses.push(last.status)
    }

    expect(statuses.slice(0, 5)).toEqual([402, 402, 402, 402, 402])
    expect(last?.status).toBe(429)
    expect(last?.retryAfter).toBeTruthy()
    expect(last?.body.error).toBe('rate_limited')
  })

  test('N2.6 Pro user is not gated on the same AI and interview surfaces', async ({ page }) => {
    test.skip(!HAS_ANTHROPIC_ENV, 'ANTHROPIC_API_KEY is required for the Pro AI surface checks.')

    const [chatLimit, nudgeLimit, quickTakeLimit, quickTakeId] = await Promise.all([
      getPlanLimit(admin, 'free', 'hatch_chat_msgs', FALLBACK_LIMITS.hatch_chat_msgs),
      getPlanLimit(admin, 'free', 'hatch_nudges', FALLBACK_LIMITS.hatch_nudges),
      getPlanLimit(admin, 'free', 'quick_takes', FALLBACK_LIMITS.quick_takes),
      getQuickTakeId(admin),
    ])

    await Promise.all([
      setAiCounter(admin, users.proActive.id, 'hatch_chat_msgs', chatLimit),
      setAiCounter(admin, users.proActive.id, 'hatch_nudges', nudgeLimit),
      setAiCounter(admin, users.proActive.id, 'quick_takes', quickTakeLimit),
    ])

    await loginAs(page, users.proActive.email)

    const chat = await appFetch(page, '/api/hatch/chat', {
      method: 'POST',
      data: {
        message: 'Give me one product critique.',
        history: [],
        pageContext: { pageType: 'dashboard', entityId: null, pathname: '/dashboard' },
      },
    })
    expect(chat.status).not.toBe(402)
    expect(chat.status).not.toBe(429)

    const nudge = await appFetch(page, '/api/hatch/nudge', {
      method: 'POST',
      data: {
        challengePrompt: 'Improve activation for a developer tool.',
        draft: 'I would compare cohorts and pick a leading activation metric.',
        step: 'frame',
      },
    })
    expect(nudge.status).not.toBe(402)
    expect(nudge.status).not.toBe(429)

    const quickTake = await appFetch(page, '/api/challenges/quick-take/submit', {
      method: 'POST',
      data: {
        challenge_id: quickTakeId,
        response_text: 'I would diagnose the funnel, segment new users, and choose one activation metric with a guardrail.',
      },
    })
    expect(quickTake.status).not.toBe(402)
    expect(quickTake.status).not.toBe(429)

    const interview = await appFetch(page, '/api/live-interview/start', {
      method: 'POST',
      data: {},
    })
    expect(interview.status).toBe(200)
  })
})
