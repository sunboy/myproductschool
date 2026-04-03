import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:3002'
const E2E_EMAIL = process.env.E2E_EMAIL || 'test-e2e-1774745731@hackproduct.dev'
const E2E_PASSWORD = process.env.E2E_PASSWORD || 'e2etest123!'
const SCREENSHOT_DIR = path.join(__dirname, '../.playwright-screenshots')

function ss(name: string) {
  return path.join(SCREENSHOT_DIR, `${name}.png`)
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
})

test('Full user journey', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── 1. Landing / Login ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('01-login-page'), fullPage: true })

  await page.fill('input[type="email"]', E2E_EMAIL)
  await page.fill('input[type="password"]', E2E_PASSWORD)
  await page.screenshot({ path: ss('02-login-filled') })
  await page.click('button[type="submit"]')

  // ── 2. Dashboard ──────────────────────────────────────────────────────
  await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500) // let TopBar hydrate
  await page.screenshot({ path: ss('03-dashboard'), fullPage: true })

  // ── 3. Explore Hub ────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/explore`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('04-explore-hub'), fullPage: true })

  // ── 4. Product Autopsies (Showcase) ──────────────────────────────────
  await page.goto(`${BASE_URL}/explore/showcase`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('05-showcase-grid'), fullPage: true })

  // Click first product card
  const firstCard = page.locator('a[href*="/explore/showcase/"]').first()
  const productHref = await firstCard.getAttribute('href')
  await firstCard.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.screenshot({ path: ss('06-showcase-detail-initial'), fullPage: true })

  // ── 5. Showcase challenge — step through FLOW ─────────────────────────
  // Frame step
  await page.screenshot({ path: ss('07-showcase-frame-step') })

  // Select an option if visible
  const frameOptions = page.locator('[data-testid="option-card"], .option-card, button').filter({ hasText: /^[A-D]\./ })
  const frameOptionCount = await frameOptions.count()
  if (frameOptionCount > 0) {
    await frameOptions.first().click()
    await page.screenshot({ path: ss('08-showcase-option-selected') })
  }

  // Look for a Submit / Next / Continue button (may be disabled — use force)
  const submitBtn = page.locator('button').filter({ hasText: /submit|next|continue/i }).first()
  if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitBtn.click({ force: true })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: ss('09-showcase-after-submit') })
  }

  // ── 6. Practice Hub (Challenges) ──────────────────────────────────────
  await page.goto(`${BASE_URL}/challenges`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('10-challenges-hub'), fullPage: true })

  // Click the first challenge card
  const challengeCard = page.locator('a[href*="/challenges/"]').first()
  if (await challengeCard.count() > 0) {
    const challengeHref = await challengeCard.getAttribute('href')
    await challengeCard.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: ss('11-challenge-workspace-initial'), fullPage: true })

    // If there's a "Start Challenge" or intro button
    const startBtn = page.locator('button').filter({ hasText: /start|begin|let's go|dive in/i }).first()
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: ss('12-challenge-workspace-started') })
    }

    // Try to interact with the challenge workspace
    // Look for a text area or option cards
    const textarea = page.locator('textarea').first()
    const optionCard = page.locator('[class*="option"], [class*="OptionCard"]').first()

    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill('I would analyze the drop in sessions by first segmenting users into cohorts — power users vs casual users. The 15% drop likely affects different segments differently. I\'d look at session length, feature usage, and retention curves before jumping to conclusions.')
      await page.screenshot({ path: ss('13-challenge-answer-typed') })
    } else if (await optionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await optionCard.click()
      await page.screenshot({ path: ss('13-challenge-option-selected') })
    }
  }

  // ── 7. Progress Page ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/progress`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('14-progress-page'), fullPage: true })

  // ── 8. Settings / Profile ─────────────────────────────────────────────
  await page.goto(`${BASE_URL}/settings`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('15-settings-page'), fullPage: true })

  // ── 9. Mobile viewport — check responsiveness ─────────────────────────
  await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14
  await page.goto(`${BASE_URL}/dashboard`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: ss('16-dashboard-mobile'), fullPage: true })

  await page.goto(`${BASE_URL}/explore/showcase`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: ss('17-showcase-mobile'), fullPage: true })

  // Reset to desktop
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── 10. Explore deeper — topic/domain page ────────────────────────────
  await page.goto(`${BASE_URL}/explore`)
  await page.waitForLoadState('networkidle')
  // Click any domain/topic link
  const topicLink = page.locator('a[href*="/domains/"]').first()
  if (await topicLink.count() > 0) {
    await topicLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('18-topic-detail'), fullPage: true })
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`)
  console.log('Files:', fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).join(', '))
})
