import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

// Mock profile response to prevent TopBar's 401 → /login redirect
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

// Intercept /api/profile so the TopBar doesn't redirect to /login
test.beforeEach(async ({ page }) => {
  await page.route('**/api/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PROFILE) })
  )
})

test.describe('Live Interviews Landing Page', () => {
  test('page loads with title and persona cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    // Page heading
    await expect(page.locator('h1:has-text("Live Interviews")')).toBeVisible({ timeout: 15000 })
    // Subtitle
    await expect(page.locator('text=Practice product sense with Luma')).toBeVisible()
    // At least 4 persona cards with Start Interview buttons
    const startButtons = page.locator('button:has-text("Start Interview")')
    await expect(startButtons.first()).toBeVisible({ timeout: 10000 })
    const count = await startButtons.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('role filter chips are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    await expect(page.locator('h1:has-text("Live Interviews")')).toBeVisible({ timeout: 15000 })
    // Filter chips
    await expect(page.locator('button:has-text("All")')).toBeVisible()
    await expect(page.locator('button:has-text("PM")')).toBeVisible()
    await expect(page.locator('button:has-text("SWE")')).toBeVisible()
  })

  test('PM filter shows only PM personas', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    await expect(page.locator('h1:has-text("Live Interviews")')).toBeVisible({ timeout: 15000 })

    // Click PM filter
    await page.locator('button:has-text("PM")').click()

    // All visible role badges should say PM
    const roleBadges = page.locator('span:has-text("PM")').filter({ hasText: /^PM$/ })
    await expect(roleBadges.first()).toBeVisible({ timeout: 5000 })

    // Start buttons should still be visible (PM personas exist)
    const startButtons = page.locator('button:has-text("Start Interview")')
    await expect(startButtons.first()).toBeVisible()
  })

  test('SWE filter shows SWE personas', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews`)
    await expect(page.locator('h1:has-text("Live Interviews")')).toBeVisible({ timeout: 15000 })

    // Click SWE filter
    await page.locator('button:has-text("SWE")').click()

    // Start buttons should still be visible (SWE personas exist)
    const startButtons = page.locator('button:has-text("Start Interview")')
    await expect(startButtons.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Live Interview Session Page (mock)', () => {
  test('session page loads without crashing', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id`)
    // Should not show application error
    await page.waitForTimeout(3000)
    const content = await page.content()
    expect(content).not.toContain('Application error')

    // Mock mode banner
    await expect(page.locator('text=Mock Mode')).toBeVisible({ timeout: 10000 })

    // Turn counter visible
    await expect(page.locator('text=/Turn.*\\d+/').first()).toBeVisible()
  })

  test('session page shows FLOW coverage and transcript', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id`)
    await expect(page.locator('text=Mock Mode')).toBeVisible({ timeout: 10000 })

    // FLOW coverage panel — look for FLOW step labels
    await expect(page.locator('text=Frame').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=List').first()).toBeVisible()

    // Transcript panel — should have at least one turn
    await expect(page.locator('text=Luma').first()).toBeVisible({ timeout: 5000 })
  })

  test('session page has interview controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id`)
    await expect(page.locator('text=Mock Mode')).toBeVisible({ timeout: 10000 })

    // End Interview button (icon-only, uses aria-label)
    await expect(page.locator('button[aria-label="End interview"]')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Debrief Page (mock)', () => {
  test('debrief page loads with score and FLOW breakdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id/debrief`)
    // Wait for page to load
    await expect(page.locator('text=Live Interview Debrief').first()).toBeVisible({ timeout: 15000 })

    // Overall score visible (68 from mock data)
    await expect(page.locator('text=68').first()).toBeVisible()

    // Grade badge
    await expect(page.locator('text=Good').first()).toBeVisible()

    // FLOW Scores section
    await expect(page.locator('text=FLOW Scores')).toBeVisible()
  })

  test('debrief shows strengths and areas for growth', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id/debrief`)
    await expect(page.locator('text=Live Interview Debrief').first()).toBeVisible({ timeout: 15000 })

    // Strengths section
    await expect(page.locator('text=Strengths').first()).toBeVisible()

    // Areas for growth
    await expect(page.locator('text=Areas for Growth').first()).toBeVisible()
  })

  test('debrief has action buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id/debrief`)
    await expect(page.locator('text=Live Interview Debrief').first()).toBeVisible({ timeout: 15000 })

    // Start Another Interview link
    await expect(page.locator('text=Start Another Interview').first()).toBeVisible()

    // Practice Challenges link
    await expect(page.locator('text=Practice Challenges').first()).toBeVisible()
  })

  test('debrief has LumaGlyph celebrating', async ({ page }) => {
    await page.goto(`${BASE_URL}/live-interviews/mock-session-id/debrief`)
    await expect(page.locator('text=Live Interview Debrief').first()).toBeVisible({ timeout: 15000 })

    // LumaGlyph renders as SVG
    const svgElements = page.locator('svg')
    const svgCount = await svgElements.count()
    expect(svgCount).toBeGreaterThan(0)
  })
})

test.describe('Prep Hub CTA', () => {
  test('prep hub shows live interview CTA card', async ({ page }) => {
    await page.goto(`${BASE_URL}/prep`)

    // CTA text
    await expect(page.locator('text=Practice with an on-demand interviewer')).toBeVisible({ timeout: 15000 })

    // Start Interview button on the CTA card (rendered as <button>)
    await expect(page.locator('button:has-text("Start Interview")')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('nav sidebar has Live Interviews link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/dashboard`)

    // Nav rail link to /live-interviews
    const navLink = page.locator('a[href="/live-interviews"]')
    await expect(navLink).toBeVisible({ timeout: 15000 })
  })
})
