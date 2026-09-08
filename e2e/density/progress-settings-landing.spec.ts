import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf } from './helpers'

test.describe('progress, settings, landing', () => {
  test('progress band and next focus', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/progress')
    expect((await page.getByTestId('header-band').boundingBox())!.height).toBeLessThanOrEqual(100)
    await expect(page.getByTestId('chip-ladder')).toHaveAttribute('href', '/progress/skill-ladder')
    const nf = page.getByTestId('progress-next-focus'); if (await nf.count()) expect(await nf.locator('a').last().getAttribute('href')).toMatch(/\/challenges\?move=(frame|list|optimize|win)/)
    expect(await topOf(page, '[data-testid=streak-heatmap]')).toBeLessThanOrEqual(520)
  })

  test('settings title row', async ({ page }) => {
    await loginViaApi(page); await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/settings')
    expect(await topOf(page, '#settings-account')).toBeLessThanOrEqual(140)
    await page.getByTestId('chip-membership').click(); await page.waitForTimeout(500); expect(await topOf(page, '#settings-membership')).toBeLessThanOrEqual(120)
    await expect(page.getByTestId('chip-notifications')).toHaveAttribute('href', '/settings/notifications')
  })

  test('landing fits one viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop); await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('landing-hero')).toContainText('more than code')
    const proof = await page.getByTestId('landing-proof').boundingBox(); expect(proof!.y + proof!.height).toBeLessThanOrEqual(900)
    await expect(page.locator('nav.reference-nav')).not.toContainText('Home'); await expect(page.locator('nav.reference-nav')).toContainText('Pricing')
    await page.setViewportSize(VIEWPORTS.laptop); await page.reload(); const cta = await page.locator('.hero-reference-primary').boundingBox(); expect(cta!.y + cta!.height).toBeLessThanOrEqual(720)
    await page.setViewportSize(VIEWPORTS.mobile); await page.reload(); await expect(page.getByTestId('landing-hero')).toBeVisible()
  })
})
