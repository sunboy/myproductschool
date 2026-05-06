import { expect, test, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''
const HAS_SUPABASE_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
)
const IS_MOCK_SERVER = process.env.USE_MOCK_DATA === 'true'
const RUN_PREFIX = `N3-E2E-${Date.now()}`
const ALL_RUN_PREFIX = 'N3-E2E-%'

type PersonaKey = 'freeNew' | 'freeActive' | 'freeCapped' | 'proActive' | 'admin'

interface TestUser {
  id: string
  email: string
}

interface ChallengeFixture {
  id: string
  slug: string
  title: string
}

interface ApiResult {
  status: number
  body: Record<string, unknown>
}

interface DiscussionRow {
  id: string
  challenge_id: string
  user_id: string | null
  content: string
  upvote_count: number
  upvoted_by?: string[] | null
}

const EMAILS: Record<PersonaKey, string> = {
  freeNew: 'e2e+free-new@hackproduct.com',
  freeActive: 'e2e+free-active@hackproduct.com',
  freeCapped: 'e2e+free-capped@hackproduct.com',
  proActive: 'e2e+pro-active@hackproduct.com',
  admin: 'e2e+admin@hackproduct.com',
}

function getAdminClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for discussion e2e tests.')
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

async function loginAs(page: Page, email: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', TEST_PASSWORD)

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
    await page.goto(`${BASE_URL}/dashboard`)
    return
  }

  throw new Error(`Could not log in as ${email}; auth login remained rate-limited.`)
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

    return { status: response.status, body }
  }, { path, method: options.method ?? 'GET', data: options.data })
}

async function getDiscussionChallenge(admin: SupabaseClient): Promise<ChallengeFixture> {
  const { data, error } = await admin
    .from('challenges')
    .select('id, slug, title, challenge_type')
    .eq('is_published', true)
    .not('slug', 'is', null)
    .limit(100)

  if (error) throw new Error(`Could not load discussion challenge: ${error.message}`)

  const match = (data ?? []).find(row =>
    row.slug &&
    row.slug !== row.id &&
    row.challenge_type !== 'quick_take'
  )

  if (!match?.slug) {
    throw new Error('No published non-quick-take challenge with a distinct slug was found.')
  }

  return {
    id: String(match.id),
    slug: String(match.slug),
    title: String(match.title),
  }
}

async function createEmptyChallenge(admin: SupabaseClient): Promise<ChallengeFixture> {
  const slug = `${RUN_PREFIX.toLowerCase()}-empty`
  const id = `${RUN_PREFIX}-empty`
  const title = 'E2E Empty Discussion Challenge'

  const { error } = await admin.from('challenges').upsert({
    id,
    slug,
    title,
    scenario_context: 'A test-only challenge for empty discussion state.',
    scenario_trigger: 'The discussion board has no posts yet.',
    scenario_question: 'What should appear before the first post?',
    prompt_text: 'A test-only challenge for empty discussion state.',
    challenge_type: 'freeform',
    paradigm: 'traditional',
    difficulty: 'standard',
    estimated_minutes: 5,
    tags: ['e2e'],
    relevant_roles: ['swe'],
    is_published: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) throw new Error(`Could not create empty-state challenge: ${error.message}`)
  return { id, slug, title }
}

async function createDiscussion(
  admin: SupabaseClient,
  challengeId: string,
  userId: string,
  content: string,
  input: Partial<DiscussionRow> & { created_at?: string } = {}
) {
  const { data, error } = await admin
    .from('challenge_discussions')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      content,
      upvote_count: input.upvote_count ?? 0,
      upvoted_by: input.upvoted_by ?? [],
      created_at: input.created_at,
    })
    .select('id, challenge_id, user_id, content, upvote_count, upvoted_by')
    .single()

  if (error) throw new Error(`Could not create discussion: ${error.message}`)
  return data as DiscussionRow
}

async function discussionById(admin: SupabaseClient, id: string) {
  const { data, error } = await admin
    .from('challenge_discussions')
    .select('id, challenge_id, user_id, content, upvote_count, upvoted_by')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Could not load discussion ${id}: ${error.message}`)
  return data as DiscussionRow | null
}

async function cleanupRunData(admin: SupabaseClient) {
  const { data: rows, error } = await admin
    .from('challenge_discussions')
    .select('id')
    .like('content', ALL_RUN_PREFIX)

  if (error) throw new Error(`Could not find discussion cleanup rows: ${error.message}`)

  const ids = (rows ?? []).map(row => row.id as string)
  if (ids.length > 0) {
    await admin.from('discussion_reports').delete().in('discussion_id', ids)
    await admin.from('discussion_replies').delete().in('discussion_id', ids)
    await admin.from('challenge_discussions').delete().in('id', ids)
  }

  await admin.from('challenges').delete().like('id', ALL_RUN_PREFIX)
}

function uniqueContent(label: string) {
  return `${RUN_PREFIX} ${label} ${Math.random().toString(36).slice(2, 8)}`
}

function threadCard(page: Page, text: string) {
  return page.locator('div.bg-white.rounded-xl').filter({ hasText: text }).first()
}

async function postFromDiscussionPage(page: Page, challengeSlug: string, content: string) {
  await page.goto(`${BASE_URL}/challenges/${challengeSlug}/discussion`)
  await page.getByPlaceholder('Add to the discussion...').last().fill(content)
  await page.getByRole('button', { name: /^Post$/ }).last().click()
  await expect(page.getByText(content)).toBeVisible({ timeout: 30000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Discussion scenarios', () => {
  test.skip(!HAS_SUPABASE_ENV || !TEST_PASSWORD, 'Run scripts/seed-test-users.ts and set E2E_TEST_PASSWORD.')
  test.skip(IS_MOCK_SERVER, 'Discussion persistence requires the real Supabase-backed app.')

  let admin: SupabaseClient
  let users: Record<PersonaKey, TestUser>
  let challenge: ChallengeFixture

  test.beforeAll(async () => {
    admin = getAdminClient()
    users = await loadUsers(admin)
    challenge = await getDiscussionChallenge(admin)
    await cleanupRunData(admin)
  })

  test.afterAll(async () => {
    await cleanupRunData(admin)
  })

  test('N3.1 User A can post and User B can reply on the same thread', async ({ page }) => {
    const postContent = uniqueContent('top-level-post')
    const replyContent = uniqueContent('reply-from-user-b')

    await loginAs(page, users.freeActive.email)
    await postFromDiscussionPage(page, challenge.slug, postContent)

    await page.context().clearCookies()
    await loginAs(page, users.freeCapped.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 30000 })

    const post = await admin
      .from('challenge_discussions')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('content', postContent)
      .single()
    expect(post.error).toBeNull()

    const reply = await appFetch(page, `/api/challenges/${challenge.slug}/discussions/${post.data.id}/replies`, {
      method: 'POST',
      data: { content: replyContent },
    })
    expect(reply.status, JSON.stringify(reply.body)).toBe(201)

    await page.reload()
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 30000 })

    const discussions = await appFetch(page, `/api/challenges/${challenge.id}/discussions`)
    expect(discussions.status).toBe(200)
    expect(JSON.stringify(discussions.body)).toContain(replyContent)
  })

  test('N3.2 User can edit and delete their own discussion without a reload', async ({ page }) => {
    const original = uniqueContent('editable-original')
    const edited = uniqueContent('editable-updated')

    await createDiscussion(admin, challenge.id, users.freeActive.id, original)
    await loginAs(page, users.freeActive.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)

    const card = threadCard(page, original)
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.locator('button[aria-label="Discussion actions"]').click()
    await card.getByRole('button', { name: 'Edit' }).click()
    await card.locator('textarea').fill(edited)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(edited)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(original)).toHaveCount(0)

    page.once('dialog', dialog => dialog.accept())
    const editedCard = threadCard(page, edited)
    await editedCard.locator('button[aria-label="Discussion actions"]').click()
    await editedCard.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(edited)).toHaveCount(0, { timeout: 30000 })
  })

  test("N3.3 Other users cannot edit or delete someone else's discussion", async ({ page }) => {
    const content = uniqueContent('owner-only')
    const discussion = await createDiscussion(admin, challenge.id, users.freeActive.id, content)

    await loginAs(page, users.freeCapped.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    const card = threadCard(page, content)
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.locator('button[aria-label="Discussion actions"]').click()
    await expect(card.getByRole('button', { name: 'Edit' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: 'Delete' })).toHaveCount(0)

    const forbidden = await appFetch(page, `/api/challenges/${challenge.slug}/discussions/${discussion.id}`, {
      method: 'DELETE',
    })
    expect(forbidden.status).toBe(403)
    expect(await discussionById(admin, discussion.id)).not.toBeNull()
  })

  test('N3.4 Upvotes are user-deduped across refreshes', async ({ page }) => {
    const content = uniqueContent('upvote-dedupe')
    const discussion = await createDiscussion(admin, challenge.id, users.freeActive.id, content)

    await loginAs(page, users.freeActive.email)
    const first = await appFetch(page, `/api/challenges/${challenge.slug}/discussions/${discussion.id}/upvote`, {
      method: 'PATCH',
    })
    expect(first.status, JSON.stringify(first.body)).toBe(200)
    expect(first.body.upvote_count).toBe(1)
    expect(first.body.upvoted).toBe(true)

    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    await expect(page.getByText(content)).toBeVisible({ timeout: 30000 })
    await page.reload()

    const second = await appFetch(page, `/api/challenges/${challenge.slug}/discussions/${discussion.id}/upvote`, {
      method: 'PATCH',
    })
    expect(second.status, JSON.stringify(second.body)).toBe(200)
    expect(second.body.upvote_count).not.toBe(2)
    expect((await discussionById(admin, discussion.id))?.upvote_count).not.toBe(2)
  })

  test('N3.5 Workspace Discussions tab matches the dedicated discussion page', async ({ page }) => {
    const dedicatedContent = uniqueContent('dedicated-to-workspace')
    const workspaceContent = uniqueContent('workspace-to-dedicated')

    await loginAs(page, users.freeActive.email)
    await postFromDiscussionPage(page, challenge.slug, dedicatedContent)

    await page.goto(`${BASE_URL}/workspace/challenges/${challenge.slug}`)
    await page.getByRole('button', { name: /Discussions/ }).click({ timeout: 90000 })
    await expect(page.getByText(dedicatedContent)).toBeVisible({ timeout: 30000 })

    await page.getByPlaceholder('Add to the discussion...').last().fill(workspaceContent)
    await page.getByRole('button', { name: /^Post$/ }).last().click()
    await expect(page.getByText(workspaceContent)).toBeVisible({ timeout: 30000 })

    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    await expect(page.getByText(workspaceContent)).toBeVisible({ timeout: 30000 })
  })

  test('N3.6 Reported discussions appear in admin moderation and can be hidden', async ({ page }) => {
    const content = uniqueContent('reported-discussion')
    const reason = uniqueContent('report-reason')
    await createDiscussion(admin, challenge.id, users.freeActive.id, content)

    await loginAs(page, users.freeCapped.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    const card = threadCard(page, content)
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.locator('button[aria-label="Discussion actions"]').click()
    page.once('dialog', dialog => dialog.accept(reason))
    await card.getByRole('button', { name: 'Report' }).click()
    await expect(page.getByText('Report sent')).toBeVisible({ timeout: 30000 })

    await page.context().clearCookies()
    await loginAs(page, users.admin.email)
    await page.goto(`${BASE_URL}/admin/discussions`)
    await expect(page.getByText(content)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(reason)).toBeVisible()
    await page.getByRole('button', { name: /Hide/ }).first().click()
    await expect(page.getByText(content)).toHaveCount(0, { timeout: 30000 })

    await page.context().clearCookies()
    await loginAs(page, users.freeCapped.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    await expect(page.getByText('[Removed by moderator]')).toBeVisible({ timeout: 30000 })
  })

  test('N3.7 Replying to another user logs a discussion reply email', async ({ page }) => {
    const content = uniqueContent('email-parent')
    const replyContent = uniqueContent('email-reply')
    const discussion = await createDiscussion(admin, challenge.id, users.freeActive.id, content)

    await admin.from('notification_prefs').upsert({
      user_id: users.freeActive.id,
      discussion_reply: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await loginAs(page, users.freeCapped.email)
    const reply = await appFetch(page, `/api/challenges/${challenge.slug}/discussions/${discussion.id}/replies`, {
      method: 'POST',
      data: { content: replyContent },
    })
    expect(reply.status, JSON.stringify(reply.body)).toBe(201)

    const { data, error } = await admin
      .from('email_dedupes')
      .select('template, status, user_id, dedupe_key')
      .eq('template', 'discussion_reply')
      .eq('user_id', users.freeActive.id)
      .like('dedupe_key', `discussion_reply:${discussion.id}:%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    expect(error).toBeNull()
    expect(data?.template).toBe('discussion_reply')
    expect(['sent', 'failed']).toContain(data?.status)
  })

  test('N3.8 Moderation rejects BAD_WORD_TEST discussion content', async ({ page }) => {
    await loginAs(page, users.freeNew.email)
    const result = await appFetch(page, `/api/challenges/${challenge.slug}/discussions`, {
      method: 'POST',
      data: { content: `${RUN_PREFIX} BAD_WORD_TEST should be blocked` },
    })

    expect(result.status).toBe(400)
    expect(result.body.code).toBe('content_not_allowed')
  })

  test('N3.9 Empty state is replaced by the first discussion post', async ({ page }) => {
    const emptyChallenge = await createEmptyChallenge(admin)
    const content = uniqueContent('first-empty-post')

    await loginAs(page, users.freeActive.email)
    await page.goto(`${BASE_URL}/challenges/${emptyChallenge.slug}/discussion`)
    await expect(page.getByText('No discussion yet. Start one.')).toBeVisible({ timeout: 30000 })

    await page.getByPlaceholder('Add to the discussion...').last().fill(content)
    await page.getByRole('button', { name: /^Post$/ }).last().click()
    await expect(page.getByText(content)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('No discussion yet. Start one.')).toHaveCount(0)
  })

  test('N3.10 Discussion sorting and pagination use 20 posts per page', async ({ page }) => {
    const seeded = Array.from({ length: 25 }, (_, index) => {
      const createdAt = new Date(Date.now() - index * 60_000).toISOString()
      const label = index.toString().padStart(2, '0')
      return {
        challenge_id: challenge.id,
        user_id: users.freeActive.id,
        content: `${RUN_PREFIX} paginated ${label}`,
        upvote_count: index === 24 ? 10 : 0,
        upvoted_by: [],
        created_at: createdAt,
      }
    })

    const { error } = await admin.from('challenge_discussions').insert(seeded)
    expect(error).toBeNull()

    await loginAs(page, users.freeActive.email)
    await page.goto(`${BASE_URL}/challenges/${challenge.slug}/discussion`)
    await expect(page.getByText(`${RUN_PREFIX} paginated 24`)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('Page 1 of 2')).toBeVisible()

    await page.getByRole('button', { name: 'New' }).click()
    await expect(page.getByText(`${RUN_PREFIX} paginated 00`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} paginated 24`)).toHaveCount(0)

    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} paginated 24`)).toBeVisible()
  })
})
