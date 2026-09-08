import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors, resetOnboarding } from './helpers'

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
    const profile = await page.request.get('/api/profile').then(r => r.json())
    await resetOnboarding(profile.id)
    await page.setViewportSize(VIEWPORTS.desktop)
    // New users are redirected /dashboard → /welcome until hp-welcome-seen is
    // set (WelcomeFlow sets it on mount); visit /welcome first so the cookie
    // is present, then land on /dashboard for the calibration-card assertions.
    // /welcome has no shell-v2 chrome, so use a plain goto (gotoReady waits
    // for `[data-shell="v2"]`, which never attaches there and times out).
    await page.goto('/welcome', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('welcome')).toBeVisible()
    await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('calibration-card')).toBeVisible()
    await expect(page.getByTestId('calibration-start')).toHaveAttribute('href', '/welcome')
    await expect(page.getByTestId('calibration-skip')).toHaveAttribute('href', '/challenges')
    await expect(page.getByTestId('first-rep-start')).toHaveCount(3)
    await expect(page.getByTestId('editorial-shelf')).toHaveCount(0)
  })
})
