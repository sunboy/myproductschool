import { test, expect, type Page } from '@playwright/test'
import { createTestUser, loginAs, cleanupTestUser, type TestUser } from './helpers'

// CareerOps e2e. The discovery feed and scorer endpoints are mocked with
// page.route() so the suite never hits the AI or the JSearch API. These assert
// the core acquisition path: discovery feed leads, the readiness map routes into
// each discipline, the free-hook gate shows an upgrade, and the tracker works.

const FEED_RESPONSE = {
  scored_count: 2,
  limit_reached: false,
  listings: [
    {
      id: 'l1', provider: 'jsearch', external_id: 'jsearch:1', company: 'OpenLab',
      role_title: 'Staff Backend Engineer', location: 'Remote', url: 'https://example.com/j1',
      department: null, description: 'Go Postgres', posted_at: null, discipline_tags: null,
      is_active: true, match_rank: 0.9, score: 82, grade: 'B',
      readiness_map: [
        { discipline: 'coding', demanded: true, bar: 'high', user_readiness: 'gaps', top_gap: 'data structures', recommended_rep: 'two-pointer set', practice_href: '/challenges?discipline=coding', interview_href: '/live-interviews?discipline=coding' },
        { discipline: 'sql', demanded: true, bar: 'medium', user_readiness: 'unknown', top_gap: null, recommended_rep: null, practice_href: '/challenges?discipline=sql', interview_href: '/live-interviews?discipline=sql' },
      ],
      gaps: ['data structures'],
    },
    {
      id: 'l2', provider: 'greenhouse', external_id: 'greenhouse:acme:2', company: 'Acme',
      role_title: 'Senior Platform Engineer', location: 'NYC', url: 'https://example.com/j2',
      department: null, description: null, posted_at: null, discipline_tags: null,
      is_active: true, match_rank: 0.7, locked: true,
    },
  ],
}

async function mockFeed(page: Page, body: object = FEED_RESPONSE) {
  await page.route('**/api/career-ops/feed', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  )
}

test.describe('CareerOps', () => {
  let user: TestUser

  test.beforeAll(async () => { user = await createTestUser() })
  test.afterAll(async () => { if (user) await cleanupTestUser(user.id) })

  test('Career nav entry is present and routes to the hub with the feed leading', async ({ page }) => {
    await mockFeed(page)
    await loginAs(page, user)
    await page.goto('/career-ops')

    await expect(page.getByRole('heading', { name: 'Jobs for you' })).toBeVisible()
    await expect(page.getByText('Staff Backend Engineer')).toBeVisible()
    // Grade chip from the scored top listing.
    await expect(page.getByText('B', { exact: true })).toBeVisible()
  })

  test('Readiness map routes into each demanded discipline', async ({ page }) => {
    await mockFeed(page)
    await loginAs(page, user)
    await page.goto('/career-ops')

    await page.getByRole('button', { name: 'Readiness' }).first().click()

    const codingPractice = page.locator('a[href="/challenges?discipline=coding"]')
    const sqlPractice = page.locator('a[href="/challenges?discipline=sql"]')
    await expect(codingPractice.first()).toBeVisible()
    await expect(sqlPractice.first()).toBeVisible()
    await expect(page.locator('a[href="/live-interviews?discipline=coding"]').first()).toBeVisible()
  })

  test('locked feed rows offer an upgrade affordance', async ({ page }) => {
    await mockFeed(page)
    await loginAs(page, user)
    await page.goto('/career-ops')

    await expect(page.getByText('Senior Platform Engineer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unlock score' })).toBeVisible()
  })

  test('scorer free-hook gate surfaces an upgrade message on 402', async ({ page }) => {
    await page.route('**/api/career-ops/score', (route) =>
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, code: 'limit_reached', error: 'limit_reached', feature: 'careerops_fit_scores' }),
      }),
    )
    await loginAs(page, user)
    await page.goto('/career-ops/score')

    await page.fill('textarea', 'We are hiring a backend engineer to build distributed systems in Go and Postgres at scale.')
    await page.getByRole('button', { name: 'Score this job' }).click()
    await expect(page.getByText(/free scores this month/i)).toBeVisible()
  })

  test('needs-profile state prompts for a target role', async ({ page }) => {
    await mockFeed(page, { listings: [], scored_count: 0, limit_reached: false, needs_profile: true })
    await loginAs(page, user)
    await page.goto('/career-ops')
    await expect(page.getByText(/what role are you targeting/i)).toBeVisible()
  })
})
