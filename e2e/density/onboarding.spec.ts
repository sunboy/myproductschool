import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestUser } from '../helpers'
import { VIEWPORTS, loginViaApi, expectNoConsoleErrors } from './helpers'

test.describe('/welcome', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>
  test.beforeAll(async () => { user = await createTestUser({ onboarded: false }) })
  test.afterAll(async () => { await cleanupTestUser(user.id) })

  test('five steps, resume after refresh, results and completion', async ({ page }) => {
    await loginViaApi(page, user)
    await page.setViewportSize(VIEWPORTS.desktop)
    await expectNoConsoleErrors(page, async () => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/welcome/)
      await page.getByTestId('role-swe').click()
      await page.getByTestId('also-tech_lead').click()
      await page.getByTestId('welcome-next').click()
      await page.getByTestId('goal-level_up_current').click()
      await page.getByTestId('timeline-1_3mo').click()
      await page.getByTestId('target-company').fill('Stripe')
      await page.getByTestId('context-both').click()
      await page.reload()
      await expect(page.getByTestId('goal-level_up_current')).toHaveAttribute('aria-pressed', 'true') // resumed
      await page.getByTestId('welcome-next').click()
      for (const [move, idx] of [['frame', 0], ['list', 0], ['optimize', 0], ['win', 0]] as const) {
        const opt = page.locator(`[data-testid^="option-${move}-"]`).nth(idx)
        await opt.click()
        await page.getByTestId('welcome-next').click()
      }
      await expect(page.getByTestId('score-frame')).toBeVisible({ timeout: 20_000 })
      await page.getByTestId('results-start').click()
      await expect(page).toHaveURL(/\/challenges/)
    })
    const prof = await page.request.get('/api/profile').then(r => r.json())
    expect(prof.onboarding_completed_at).toBeTruthy()
  })

  test('skip for now completes with role only', async ({ page }) => {
    const u = await createTestUser({ onboarded: false })
    await loginViaApi(page, u)
    await page.goto('/welcome')
    await page.getByTestId('role-pm').click()
    await page.getByTestId('welcome-skip').click()
    await expect(page).toHaveURL(/\/(workspace|challenges)/)
    const prof = await page.request.get('/api/profile').then(r => r.json())
    expect(prof.onboarding_completed_at).toBeTruthy()
    await cleanupTestUser(u.id)
  })

  test('mobile stacks the panel above the form', async ({ page }) => {
    const u = await createTestUser({ onboarded: false })
    await loginViaApi(page, u)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/welcome')
    const panel = await page.getByTestId('welcome-panel').boundingBox()
    const next = await page.getByTestId('welcome-next').boundingBox()
    expect(panel!.width).toBeGreaterThan(300)
    expect(next!.y).toBeGreaterThan(panel!.y + panel!.height)
    await cleanupTestUser(u.id)
  })
})
