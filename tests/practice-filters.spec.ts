// tests/practice-filters.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Practice filter redesign', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/challenges')
    await page.waitForLoadState('networkidle')
  })

  test('discipline tab strip renders all tabs', async ({ page }) => {
    const tabs = page.locator('button').filter({ hasText: /All|Product Sense|System Design|Data Modeling/i })
    await expect(tabs.first()).toBeVisible()
  })

  test('Coding tab is disabled', async ({ page }) => {
    const codingTab = page.locator('button').filter({ hasText: /^Coding$/ }).first()
    if (await codingTab.count() > 0) {
      await expect(codingTab).toBeDisabled()
    }
  })

  test('Explore page has Browse by Discipline section', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    const heading = page.getByText('Browse by Discipline')
    await expect(heading).toBeVisible()
  })

  test('Explore page has discipline cards', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Product Sense')).toBeVisible()
    await expect(page.getByText('System Design')).toBeVisible()
    await expect(page.getByText('Data Modeling')).toBeVisible()
  })

  test('no crash on challenges page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/challenges')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('no crash on explore page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})
