import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('readers', () => {
  // Avoid depending on smooth-scroll animation timing; RightToc uses instant
  // scroll when this is set, so the scrollY assertion isn't racing a CSS animation.
  test.use({ reducedMotion: 'reduce' })

  test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop) })

  test('module reader', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/explore/modules/context-engineering') })
    await expect(page.getByTestId('reader-back')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('shell-sidebar')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/modules')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('reader-hero')).toBeVisible()
    const toc = page.getByTestId('right-toc'); await expect(toc).toBeVisible(); expect(await toc.locator('a').count()).toBeGreaterThanOrEqual(5)
    const headingBtns = toc.locator('[data-toc-group="On this page"] button'); const btnCount = await headingBtns.count()
    if (btnCount > 1) {
      const before = await page.evaluate(() => window.scrollY)
      await headingBtns.last().click()
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(before)
      // The active marker follows the scroll position, not just the click.
      await expect(headingBtns.last()).toHaveAttribute('aria-current', 'true', { timeout: 5000 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(headingBtns.first()).toHaveAttribute('aria-current', 'true', { timeout: 5000 })
    }
    // Reading progress is reported (debounced PUT). Finished reads (>=0.98) are excluded from GET by design, so observe the PUT.
    const put = page.waitForResponse(r => r.url().includes('/api/reading-progress') && r.request().method() === 'PUT' && r.ok(), { timeout: 15_000 })
    await page.mouse.wheel(0, 600); await page.waitForTimeout(300); await page.mouse.wheel(0, 300)
    const body = JSON.parse((await put).request().postData() ?? '{}'); expect(body.content_type).toBe('module_chapter'); expect(body.parent_id).toBe('context-engineering')
    await toc.locator('a').nth(1).click(); await expect(page).toHaveURL(/\?chapter=/)
  })

  test('autopsy reader', async ({ page }) => {
    await gotoReady(page, '/explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp')
    await expect(page.getByTestId('reader-back')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.reader-outline')).toHaveCount(0)
    await expect(page.getByTestId('reader-back')).toHaveAttribute('href', '/explore/autopsies/buffer')
    expect(await topOf(page, 'article h1')).toBeLessThanOrEqual(130)
    await expect(page.getByTestId('right-toc')).toBeVisible()
    // Active section follows the scroll (sections are data-section-id targets).
    const items = page.getByTestId('right-toc').locator('button')
    await expect(items.first()).toHaveAttribute('aria-current', 'true')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(items.last()).toHaveAttribute('aria-current', 'true', { timeout: 5000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(items.first()).toHaveAttribute('aria-current', 'true', { timeout: 5000 })
    const saveLocator = () => page.locator('[data-testid=shell-topbar] button', { hasText: /save/i }).first()
    let save = saveLocator()
    await expect(save).toBeVisible({ timeout: 30_000 })
    const before = await save.textContent()
    await save.click()
    await expect(save).not.toHaveText(before ?? '', { timeout: 10_000 })
    // Re-locate before the restore click: the toggle re-renders through the
    // shell-v2 reader-chrome slot, so the safest bet is a fresh handle rather
    // than trusting the original locator hasn't gone stale.
    save = saveLocator()
    await expect(save).toBeEnabled({ timeout: 30_000 })
    await save.click({ timeout: 30_000 }) // restore
  })

  test('mobile: no toc column, chrome present', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/explore/modules/context-engineering')
    await expect(page.locator('#guide-chapter')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('right-toc')).toBeHidden()
  })
})
