import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'
const E2E_EMAIL = process.env.E2E_EMAIL || 'test-e2e-1774745731@hackproduct.dev'
const E2E_PASSWORD = process.env.E2E_PASSWORD || 'e2etest123!'

async function login(page: import('@playwright/test').Page, email = E2E_EMAIL, password = E2E_PASSWORD) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  await page.locator('[data-hatch-target="dashboard-session"]').waitFor({ state: 'attached', timeout: 20000 })
}

async function resetHatchStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('hatch-')) localStorage.removeItem(key)
    }
  })
}

test.describe('Proactive Hatch', () => {
  test('first-time mini tour starts, highlights targets, and completes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page)
    await resetHatchStorage(page)
    await page.reload()

    const cue = page.getByTestId('hatch-cue-bubble')
    await expect(cue).toBeVisible({ timeout: 6000 })
    await expect(cue).toContainText('two-minute tour')
    await expect(page.getByTestId('hatch-cue-action')).toContainText('Show me around')

    await page.getByTestId('hatch-cue-action').click()
    await expect(page.locator('[data-hatch-target="dashboard-session"]')).toHaveClass(/hatch-target-highlight/)
    await expect(page.getByTestId('hatch-target-marker')).toBeVisible()
    await expect.poll(async () => {
      const box = await page.getByTestId('floating-hatch').boundingBox()
      return box ? Math.round(1440 - box.x - box.width) : -1
    }).toBeLessThanOrEqual(24)
    await page.mouse.wheel(0, 900)
    await expect(page.locator('[data-hatch-target="dashboard-session"]')).toHaveClass(/hatch-target-highlight/)
    await expect(page.getByTestId('hatch-target-marker')).toBeVisible()
    await expect(page.getByTestId('hatch-cue-bubble')).toBeVisible()
    await expect.poll(async () => {
      const box = await page.getByTestId('floating-hatch').boundingBox()
      return box ? Math.round(1440 - box.x - box.width) : -1
    }).toBeLessThanOrEqual(24)

    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId('hatch-cue-action').click()
    }

    await expect(page.getByTestId('hatch-cue-bubble')).toContainText('Progress shows')
    await page.getByTestId('hatch-cue-action').click()

    await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('hatch-tour:v1:completed')))).toBe(true)
    await expect(page.getByTestId('hatch-cue-bubble')).toHaveCount(0, { timeout: 2500 })
  })

  test('dismiss snoozes the dashboard surface cue for the day', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page)
    await resetHatchStorage(page)
    await page.evaluate(() => localStorage.setItem('hatch-tour:v1:completed', new Date().toISOString()))
    await page.reload()

    await expect(page.getByTestId('hatch-cue-bubble')).toBeVisible({ timeout: 6000 })
    await page.getByLabel('Dismiss').last().click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('hatch-cue-snooze:dashboard'))).not.toBeNull()

    await page.reload()
    await expect(page.getByTestId('hatch-cue-bubble')).toHaveCount(0, { timeout: 2500 })
  })

  test('reduced motion disables Hatch choreography animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page)
    await resetHatchStorage(page)
    await page.evaluate(() => localStorage.setItem('hatch-tour:v1:completed', new Date().toISOString()))
    await page.reload()

    await expect(page.getByTestId('hatch-cue-bubble')).toBeVisible({ timeout: 6000 })
    const animationName = await page.locator('.hatch-choreography').first().evaluate((el) => getComputedStyle(el).animationName)
    expect(animationName).toBe('none')
  })

  test('Masko animation fallback is present for Hatch avatar states', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await login(page)

    const avatar = page.locator('[data-hatch-masko-state]').first()
    await expect(avatar).toBeVisible()
    await expect(avatar.locator('source[type="video/webm"]')).toHaveAttribute('src', /masko\.ai/)
    await expect(avatar.locator('img[alt="Hatch mascot"]')).toHaveAttribute('src', /masko\.ai/)
  })

  test('workspace idle cue does not auto-open Hatch chat', async ({ page }) => {
    await page.addInitScript(() => {
      const realNow = Date.now
      let offset = 0
      Date.now = () => realNow() + offset
      ;(window as typeof window & { __advanceHatchTime?: (ms: number) => void }).__advanceHatchTime = (ms: number) => {
        offset += ms
      }
    })

    await login(page)
    await resetHatchStorage(page)
    const startLink = page.locator('[data-hatch-target="dashboard-next-challenge-start"]').first()
    test.skip(await startLink.count() === 0, 'Dashboard did not provide a startable workspace challenge')

    const href = await startLink.getAttribute('href')
    test.skip(!href, 'Dashboard did not provide a startable workspace challenge')

    await page.goto(new URL(href!, BASE_URL).toString())
    await page.locator('[data-hatch-target="workspace-answer-area"]').waitFor({ state: 'attached', timeout: 20000 })

    await page.evaluate(() => {
      ;(window as typeof window & { __advanceHatchTime?: (ms: number) => void }).__advanceHatchTime?.(91_000)
    })
    await expect(page.getByTestId('hatch-cue-bubble')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('hatch-chat-panel')).toHaveCount(0)
  })
})
