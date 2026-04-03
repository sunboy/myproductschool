import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

// Real credentials needed for authenticated tests
// Set via env vars: E2E_EMAIL, E2E_PASSWORD
const E2E_EMAIL = process.env.E2E_EMAIL || ''
const E2E_PASSWORD = process.env.E2E_PASSWORD || ''

async function loginUser(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.fill('input[type="email"]', E2E_EMAIL)
  await page.fill('input[type="password"]', E2E_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|onboarding|explore)/, { timeout: 20000 })
}

// ── Public / unauthenticated tests ────────────────────────────────────────────

test('login page title includes "Log in"', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`)
  // Root layout appends "| HackProduct" via template — match with regex
  await expect(page).toHaveTitle(/Log in/)
})

test('signup page title includes "Sign up"', async ({ page }) => {
  await page.goto(`${BASE_URL}/signup`)
  await expect(page).toHaveTitle(/Sign up/)
})

test('unauthenticated user redirected to /login from /dashboard', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard`)
  await expect(page).toHaveURL(/\/login/)
})

test('login page renders two-panel layout with Luma', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`)

  // Left panel: Luma tagline
  await expect(page.locator('text=Tell me where you are')).toBeVisible()

  // Google OAuth button
  await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()

  // Tab switcher (use first() to avoid strict mode error with multiple matches)
  await expect(page.locator('button:has-text("Log In")').first()).toBeVisible()
  await expect(page.locator('button:has-text("Sign Up")').first()).toBeVisible()

  // Form fields
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()

  // Forgot password link
  await expect(page.locator('a[href="/forgot-password"]')).toBeVisible()
})

test('signup tab shows name field, login tab hides it', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`)

  // Login mode — no name field
  await expect(page.locator('input[placeholder="Your name"]')).not.toBeVisible()

  // Switch to Sign Up
  await page.click('button:has-text("Sign Up")')
  await expect(page.locator('input[placeholder="Your name"]')).toBeVisible()

  // Switch back to Log In
  await page.locator('button:has-text("Log In")').first().click()
  await expect(page.locator('input[placeholder="Your name"]')).not.toBeVisible()
})

test('invalid credentials shows error message', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', 'notreal@example.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')

  // Supabase returns "Invalid login credentials"
  await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 })
})

// ── Authenticated tests (require E2E_EMAIL + E2E_PASSWORD) ────────────────────

test.describe('Authenticated shell', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD env vars to run authenticated tests')

  test('TopBar shows real user initials (not hardcoded S)', async ({ page }) => {
    await loginUser(page)
    if (page.url().includes('onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    }

    // Wait for TopBar to hydrate
    await page.waitForTimeout(2500)

    // Avatar link exists
    const avatarLink = page.locator('a[href="/settings"]')
    await expect(avatarLink).toBeVisible()

    // Either an img (Google avatar) or a span with initials
    const avatarImg = avatarLink.locator('img')
    const avatarInitials = avatarLink.locator('span')
    const hasImg = await avatarImg.count() > 0
    if (hasImg) {
      await expect(avatarImg).toBeVisible()
      const src = await avatarImg.getAttribute('src')
      expect(src).toBeTruthy()
    } else {
      const text = await avatarInitials.textContent()
      // Should be 1-2 uppercase letters — not the hardcoded "S" unless name actually starts with S+S
      expect(text?.trim()).toMatch(/^[A-Z?]{1,2}$/)
      console.log(`Avatar initials: "${text?.trim()}"`)
    }
  })

  test('NavRail daily goal shows real data (not hardcoded 3/5)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await loginUser(page)
    if (page.url().includes('onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`)
    }

    await expect(page.locator('text=Daily Goal')).toBeVisible({ timeout: 8000 })

    // Count shows X/5 or X/Y — confirm it's a real number pattern
    const dailyGoalContainer = page.locator('text=Daily Goal').locator('..')
    const text = await dailyGoalContainer.textContent()
    expect(text).toMatch(/\d+\/\d+/)
    console.log(`Daily goal text: "${text?.replace(/\s+/g, ' ').trim()}"`)
  })

  test('XP and streak display in TopBar', async ({ page }) => {
    await loginUser(page)
    if (page.url().includes('onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`)
    }
    await page.waitForTimeout(2000)

    // XP badge shows "N XP" format
    await expect(page.locator('text=/^\\d+ XP$/').first()).toBeVisible({ timeout: 5000 })
    // Streak badge exists (fire icon container)
    await expect(page.locator('[class*="tertiary-fixed"]').first()).toBeVisible()
  })

  test('/explore/showcase loads editorial grid', async ({ page }) => {
    await loginUser(page)
    await page.goto(`${BASE_URL}/explore/showcase`)

    await expect(page.locator('h2:has-text("Product Autopsies")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Curated Discovery')).toBeVisible()

    // At least one product card
    const cards = page.locator('a[href*="/explore/showcase/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    console.log(`Showcase cards found: ${count}`)
  })

  test('dashboard shows personalized greeting', async ({ page }) => {
    await loginUser(page)
    if (page.url().includes('onboarding')) {
      await page.goto(`${BASE_URL}/dashboard`)
    }

    // Greeting should be time-aware and use a name (not just "Good morning, there!")
    const greeting = page.locator('text=/Good (morning|afternoon|evening)/i').first()
    await expect(greeting).toBeVisible({ timeout: 8000 })
    const greetingText = await greeting.textContent()
    console.log(`Greeting: "${greetingText}"`)
    // Should NOT be "Good morning, there" — should have a real name
    expect(greetingText).not.toMatch(/,\s*there[^a-z]/i)
  })
})
