import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf, expectNoConsoleErrors } from './helpers'

test.describe('library + practice', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop) })

  test('library shelves, chips and featured', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => { await gotoReady(page, '/explore') })
    const featured = page.getByTestId('lib-featured'); await expect(featured).toBeVisible(); expect((await featured.boundingBox())!.height).toBeLessThanOrEqual(170)
    const firstShelf = page.locator('[data-testid^=shelf-]').first(); expect(Math.round((await firstShelf.boundingBox())!.y)).toBeLessThanOrEqual(340)
    const arts = await page.locator('[data-testid=lib-card] [data-geo]').evaluateAll(els => els.slice(0, 8).map(e => e.getAttribute('data-geo')))
    expect(new Set(arts).size).toBeGreaterThanOrEqual(4)
    await page.getByTestId('lib-chip-saved').click(); await expect(page).toHaveURL(/type=saved/); await expect(page.getByTestId('lib-featured')).toHaveCount(0)
    await page.getByTestId('lib-chip-all').click(); const card = page.getByTestId('lib-card').first(); const href = await card.getAttribute('href'); await card.click(); await expect(page).toHaveURL(new RegExp(href!.replace(/[?]/g, '\\?')))
  })

  test('practice band, toggle persistence, card mode, pick dismiss', async ({ page }) => {
    await gotoReady(page, '/challenges')
    expect((await page.getByTestId('header-band').boundingBox())!.height).toBeLessThanOrEqual(100)
    await expect(page.getByTestId('chip-interviews')).toHaveAttribute('href', '/live-interviews')
    await page.getByTestId('view-cards').first().click(); await expect(page.getByTestId('challenge-card').first()).toBeVisible()
    expect(await topOf(page, '[data-testid=challenge-card]')).toBeLessThanOrEqual(270)
    await expect(page.getByText('In progress', { exact: true })).toHaveCount(0)
    await page.reload(); await gotoReady(page, '/challenges'); await expect(page.getByTestId('view-cards').first()).toHaveAttribute('aria-pressed', 'true')
    const pick = page.getByTestId('practice-hatch-pick'); if (await pick.count()) { const h = await pick.locator('a').first().getAttribute('href'); expect(h).toMatch(/\/workspace\/challenges\//); await page.getByTestId('practice-hatch-pick-dismiss').click(); await expect(pick).toHaveCount(0); await page.reload(); await gotoReady(page, '/challenges'); await expect(page.getByTestId('practice-hatch-pick')).toHaveCount(0) }
    await page.getByTestId('view-list').first().click(); await expect(page.getByTestId('challenge-card')).toHaveCount(0)
    const cta = page.getByTestId('challenge-cta').or(page.locator('a:has-text("Resume"), a:has-text("Start")')).first(); const href = await cta.getAttribute('href'); expect(href).toMatch(/\/workspace\/challenges\/.+returnTo=/)
  })

  test('mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile); await gotoReady(page, '/challenges'); await expect(page.getByTestId('header-band')).toBeVisible(); await gotoReady(page, '/explore'); await expect(page.getByTestId('lib-featured')).toBeVisible()
  })
})
