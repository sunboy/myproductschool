import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, setDensityFlag } from './helpers'

test.describe('shell-v2', () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeAll(async () => {
    if (process.env.DENSITY_FLAG_WAIT === '1') {
      await setDensityFlag(true)
      await new Promise(r => setTimeout(r, 61_000))
    }
  })

  test.beforeEach(async ({ page }) => { await loginViaApi(page) })

  test('desktop dimensions and collapse persistence', async ({ page }) => {
    await page.request.patch('/api/profile', { data: { ui_prefs: { nav_collapsed: false } } })
    try {
      await page.setViewportSize(VIEWPORTS.desktop)
      await gotoReady(page, '/dashboard')
      const side = page.getByTestId('shell-sidebar'); const top = page.getByTestId('shell-topbar')
      expect((await side.boundingBox())!.width).toBe(200)
      expect((await top.boundingBox())!.height).toBe(48)
      await page.getByTestId('shell-nav-toggle').click()
      await expect(side).toHaveAttribute('data-collapsed', 'true')
      await expect.poll(async () => Math.round((await side.boundingBox())!.width), { timeout: 5000 }).toBe(56)
      await page.reload(); await gotoReady(page, '/dashboard')
      await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
      const prefs = await page.request.get('/api/profile').then(r => r.json())
      expect(prefs.ui_prefs?.nav_collapsed).toBe(true)
      await page.getByTestId('shell-nav-toggle').click()
      await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'false')
    } finally {
      await page.request.patch('/api/profile', { data: { ui_prefs: { nav_collapsed: false } } })
    }
  })

  test('reader routes force the rail and restore on exit', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/explore/modules/context-engineering')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('shell-nav-toggle')).toBeDisabled()
    await gotoReady(page, '/explore')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  test('route-scoped search', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/explore')
    await expect(page.getByTestId('shell-search')).toHaveAttribute('placeholder', 'Search guides, companies, or skills')
    await page.getByTestId('shell-search').fill('gmail'); await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/explore\?q=gmail/)
    await gotoReady(page, '/challenges')
    await page.getByTestId('shell-search').fill('sum'); await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/challenges\?q=sum/)
  })

  test('workspace uses the shared shell with the rail forced', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/workspace/challenges/answering-range-sum-queries-over-fixed-sensor-readings')
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.locator('nav.rounded-full')).toHaveCount(0)
    await expect(page.getByTestId('run-button')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('submit-button')).toBeVisible()
    expect(await topOf(page, '[data-testid=monaco-editor-container]')).toBeLessThan(140)
  })

  test('mobile keeps the bottom tabs and a 44px bar', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await gotoReady(page, '/dashboard')
    await expect(page.getByTestId('shell-sidebar')).toBeHidden()
    await expect(page.locator('nav.fixed.inset-x-0.bottom-0')).toBeVisible()
  })
})
