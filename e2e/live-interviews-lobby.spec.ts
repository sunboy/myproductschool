// Discovered by the standard Playwright e2e configuration.
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'

// Mock the profile endpoint so the TopBar does not trigger a /login redirect.
// The proxy still requires a Supabase session, so page-level tests that navigate
// to /live-interviews will redirect to /login in CI unless auth cookies are set.
// Those cases are noted per-test.
const MOCK_PROFILE = {
  id: 'mock-user-id',
  display_name: 'Test User',
  avatar_url: null,
  plan: 'free',
  role: 'engineer',
  streak_days: 3,
  xp_total: 1240,
  onboarding_completed_at: '2026-03-01T00:00:00Z',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
  subscription: null,
  daily_attempts_today: 1,
  daily_limit: 3,
}

test.describe('Live Interviews lobby', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/profile', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROFILE) })
    )
  })

  test('offers single and multi-round interviews when authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    test.skip(page.url().includes('/login'), 'Provide an authenticated Supabase storage state to verify the lobby')
    await expect(page.getByRole('tab', { name: 'Single interview', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Multi-round/ })).toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Single interview setup' })).toBeVisible()
  })

  test('switches to the multi-round builder when authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    test.skip(page.url().includes('/login'), 'Provide an authenticated Supabase storage state to verify the builder')
    const multiRound = page.getByRole('tab', { name: /^Multi-round/ })
    await multiRound.click()
    await expect(multiRound).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel', { name: 'Multi-round interview setup' })).toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Single interview setup' })).toHaveCount(0)
  })

  test('has no JavaScript errors on the rendered lobby when authenticated', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${BASE_URL}/live-interviews`)
    test.skip(page.url().includes('/login'), 'Provide an authenticated Supabase storage state to verify the lobby runtime')
    await expect(page.getByRole('tab', { name: 'Single interview', exact: true })).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})
