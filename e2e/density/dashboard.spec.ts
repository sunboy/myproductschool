import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('dashboard v4', () => {
  test('returning user: hero, shelves, every control acts', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop)
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/dashboard') })
    const hero = page.getByTestId('dashboard-hero'); expect((await hero.boundingBox())!.height).toBeLessThanOrEqual(260)
    expect(await topOf(page, '[data-testid=practice-areas]')).toBeLessThanOrEqual(340)
    await expect(page.getByTestId('hatch-thought')).toBeVisible()
    // Continue challenge or Hatch pick resolves to a workspace URL
    const cont = page.getByTestId('continue-challenge').or(page.getByTestId('hatch-pick'))
    await expect(cont).toBeVisible()
    const href = await cont.locator('a').first().getAttribute('href'); expect(href).toMatch(/\/workspace\/challenges\//)
    // Practice area card navigates with the discipline param
    await page.getByTestId('area-sql').click(); await expect(page).toHaveURL(/\/challenges\?discipline=sql/); await page.goBack(); await gotoReady(page, '/dashboard')
    // Hatch prompt opens the chat
    await page.getByTestId('hatch-prompt').first().click(); await expect(page.getByTestId('hatch-fab')).toBeVisible(); await expect(page.locator('[data-testid=hatch-fab] ~ *, [data-testid=hatch-fab]').first()).toBeVisible()
    // Editorial + week
    await expect(page.getByTestId('editorial-shelf')).toBeVisible()
    await expect(page.getByTestId('week-card')).toHaveAttribute('href', '/progress')
  })

  test('laptop and mobile layouts', async ({ page }) => {
    await loginViaApi(page)
    await page.setViewportSize(VIEWPORTS.laptop); await gotoReady(page, '/dashboard')
    expect(await topOf(page, '[data-testid=practice-areas]')).toBeLessThanOrEqual(320)
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('dashboard-hero')).toBeVisible(); await expect(page.getByTestId('hatch-thought')).toBeVisible()
  })

  test('new user: calibration card and first reps', async ({ page }) => {
    await loginViaApi(page, { email: 'hackproduct.onboarding.review@gmail.com', password: 'Review#Onboard89' })
    await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('calibration-card')).toBeVisible()
    await expect(page.getByTestId('calibration-start')).toHaveAttribute('href', '/welcome')
    await expect(page.getByTestId('calibration-skip')).toHaveAttribute('href', '/challenges')
    await expect(page.getByTestId('first-rep-start')).toHaveCount(3)
    await expect(page.getByTestId('editorial-shelf')).toHaveCount(0)
  })
})
