import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('readers', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop) })

  test('module reader', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/explore/modules/context-engineering') })
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/modules')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('reader-hero')).toBeVisible()
    const toc = page.getByTestId('right-toc'); await expect(toc).toBeVisible(); expect(await toc.locator('a').count()).toBeGreaterThanOrEqual(5)
    const headingBtn = toc.locator('button').first(); if (await headingBtn.count()) { await headingBtn.click(); await page.waitForTimeout(600); expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(50) }
    await page.mouse.wheel(0, 1500); await page.waitForTimeout(2000)
    const rows = await page.request.get('/api/reading-progress?limit=5').then(r => r.json()); expect(rows.rows.some((r: any) => r.content_type === 'module_chapter' && r.parent_id === 'context-engineering')).toBe(true)
    await toc.locator('a').nth(1).click(); await expect(page).toHaveURL(/\?chapter=/)
  })

  test('autopsy reader', async ({ page }) => {
    await gotoReady(page, '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp')
    await expect(page.locator('.reader-outline')).toHaveCount(0)
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/autopsies/buffer')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('right-toc')).toBeVisible()
    const save = page.getByRole('button', { name: /save|saved/i }).first(); const before = await save.textContent(); await save.click(); await page.waitForTimeout(800); await page.reload(); await gotoReady(page, '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp'); expect(await page.getByRole('button', { name: /save|saved/i }).first().textContent()).not.toBe(before)
    await page.getByRole('button', { name: /save|saved/i }).first().click() // restore
  })

  test('mobile: no toc column, chrome present', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/explore/modules/context-engineering')
    await expect(page.getByTestId('right-toc')).toBeHidden(); await expect(page.locator('#guide-chapter')).toBeVisible()
  })
})
