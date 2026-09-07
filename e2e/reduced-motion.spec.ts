/**
 * Reduced-motion evidence spec.
 *
 * Verifies `prefers-reduced-motion: reduce` actually stops running
 * animations/transitions across key routes and viewports, using
 * page.emulateMedia({ reducedMotion }) (real Playwright media emulation,
 * not a CSS class toggle). Captures screenshots + a JSON summary to
 * docs/visual-overhaul/evidence/staging-20260906/reduced-motion/.
 *
 * Run with:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/reduced-motion.spec.ts
 */

import { test, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import type { TestUser } from './helpers'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'

const EVIDENCE_DIR = path.join(
  __dirname,
  '..',
  'docs/visual-overhaul/evidence/staging-20260906/reduced-motion',
)

const VIEWPORTS = [
  { name: '375x812', width: 375, height: 812 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
] as const

const CODING_CHALLENGE_ID = '773dea07-2f08-4b29-a011-64e7f4917b72'

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'explore', path: '/explore' },
  { name: 'challenges', path: '/challenges' },
  { name: 'progress', path: '/progress' },
  { name: 'settings', path: '/settings' },
  { name: 'pricing', path: '/pricing' },
  { name: 'coding-workspace', path: `/challenges/${CODING_CHALLENGE_ID}` },
] as const

const ANIMATION_SELECTOR = '[class*=animate], .hatch-glyph svg *, .shepherd-element, video'

interface PageAnimationReport {
  runningAnimationsCount: number
  elementsWithNonZeroAnimationDuration: number
  elementsWithNonZeroTransitionDuration: number
  smilAnimateElementCount: number
  smilAnimateElementsRunning: number
  playingVideoCount: number
  details: Array<{
    selector: string
    tag: string
    animationDuration: string
    transitionDuration: string
  }>
}

async function measureAnimations(page: Page): Promise<PageAnimationReport> {
  return page.evaluate((selector) => {
    const runningAnimationsCount = document.getAnimations().length

    const elements = Array.from(document.querySelectorAll(selector))
    let elementsWithNonZeroAnimationDuration = 0
    let elementsWithNonZeroTransitionDuration = 0
    const details: PageAnimationReportDetail[] = []

    const parseDur = (v: string) => {
      // computed duration strings look like "0.3s" / "300ms" / "0s, 1s" (lists)
      return v
        .split(',')
        .map((part) => {
          const trimmed = part.trim()
          if (trimmed.endsWith('ms')) return parseFloat(trimmed)
          if (trimmed.endsWith('s')) return parseFloat(trimmed) * 1000
          return 0
        })
        .some((ms) => ms > 1) // >1ms so the 0.001ms reduced-motion guard counts as "off"
    }

    for (const el of elements) {
      const cs = window.getComputedStyle(el)
      const animDur = cs.animationDuration
      const transDur = cs.transitionDuration
      const animOn = parseDur(animDur)
      const transOn = parseDur(transDur)
      if (animOn) elementsWithNonZeroAnimationDuration++
      if (transOn) elementsWithNonZeroTransitionDuration++
      if (animOn || transOn) {
        details.push({
          selector,
          tag: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).toString().split(' ').slice(0, 2).join('.') : ''),
          animationDuration: animDur,
          transitionDuration: transDur,
        })
      }
    }

    // SMIL <animate>/<animateTransform> elements (SVG). These are NOT covered
    // by CSS animation-duration and must be checked separately.
    const smilNodes = Array.from(document.querySelectorAll('animate, animateTransform, animateMotion'))
    const smilAnimateElementCount = smilNodes.length
    let smilAnimateElementsRunning = 0
    for (const node of smilNodes) {
      const repeat = node.getAttribute('repeatCount')
      const dur = node.getAttribute('dur')
      // Consider "running" if it has a real duration and indefinite/loop repeat.
      if (dur && dur !== '0s' && (repeat === 'indefinite' || (repeat && parseFloat(repeat) > 1))) {
        smilAnimateElementsRunning++
      }
    }

    // Autoplaying/looping <video> elements not paused.
    const videos = Array.from(document.querySelectorAll('video'))
    const playingVideoCount = videos.filter((v) => !(v as HTMLVideoElement).paused).length

    return {
      runningAnimationsCount,
      elementsWithNonZeroAnimationDuration,
      elementsWithNonZeroTransitionDuration,
      smilAnimateElementCount,
      smilAnimateElementsRunning,
      playingVideoCount,
      details: details.slice(0, 25),
    }

    interface PageAnimationReportDetail {
      selector: string
      tag: string
      animationDuration: string
      transitionDuration: string
    }
  }, ANIMATION_SELECTOR)
}

interface RunResult {
  route: string
  viewport: string
  reducedMotion: 'reduce' | 'no-preference'
  screenshot: string
  report: PageAnimationReport
}

test.describe.configure({ mode: 'serial' })

test('reduced-motion evidence sweep', async ({ browser }) => {
  test.setTimeout(30 * 60 * 1000)

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

  const results: RunResult[] = []

  const user: TestUser = {
    id: 'n/a',
    email: process.env.HACKPRODUCT_PRO_TEST_EMAIL || '',
    password: process.env.HACKPRODUCT_PRO_TEST_PASSWORD || '',
  }

  if (!user.email || !user.password) {
    throw new Error(
      'Set HACKPRODUCT_PRO_TEST_EMAIL / HACKPRODUCT_PRO_TEST_PASSWORD env vars before running this spec (credentials live in CLAUDE.local.md, never hardcode them here).',
    )
  }

  for (const viewport of VIEWPORTS) {
    for (const media of ['no-preference', 'reduce'] as const) {
      const context = await browser.newContext({
        baseURL: BASE_URL,
        viewport: { width: viewport.width, height: viewport.height },
      })
      const page = await context.newPage()
      await page.emulateMedia({ reducedMotion: media })

      await page.goto(`${BASE_URL}/login`)
      await page.waitForSelector('input[type="email"]', { timeout: 15000 })
      await page.fill('input[type="email"]', user.email)
      await page.fill('input[type="password"]', user.password)
      await page.click('button[type="submit"]')
      await page
        .waitForURL(/\/(dashboard|onboarding|explore|challenges)/, { timeout: 60000, waitUntil: 'commit' })
        .catch(() => {
          // Some rebuilt routes never fire a fresh "load"/"commit" event
          // Playwright can observe (client-side nav already settled). Fall
          // back to polling the URL directly.
        })
      await page.waitForFunction(
        () => /\/(dashboard|onboarding|explore|challenges)/.test(window.location.pathname),
        { timeout: 30000 },
      )

      for (const route of ROUTES) {
        // Dev-server cold compiles can take well over a minute for the first
        // hit on a route; give this generous headroom rather than failing
        // the whole sweep on a slow first compile.
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
        // Let entrance animations/videos/hydration settle.
        await page.waitForTimeout(2500)

        const shotName = `${route.name}__${viewport.name}__${media}.png`
        const shotPath = path.join(EVIDENCE_DIR, shotName)
        await page.screenshot({ path: shotPath, fullPage: false })

        const report = await measureAnimations(page)

        results.push({
          route: route.name,
          viewport: viewport.name,
          reducedMotion: media,
          screenshot: shotName,
          report,
        })
      }

      await context.close()
    }
  }

  const jsonPath = path.join(EVIDENCE_DIR, 'reduced-motion-report.json')
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2))

  // Markdown summary table.
  const lines: string[] = []
  lines.push('# Reduced-motion evidence — ' + new Date().toISOString())
  lines.push('')
  lines.push('| Route | Viewport | Media | getAnimations() | CSS anim-dur>0 | CSS trans-dur>0 | SMIL elements | SMIL running | Playing video |')
  lines.push('|---|---|---|---|---|---|---|---|---|')
  for (const r of results) {
    lines.push(
      `| ${r.route} | ${r.viewport} | ${r.reducedMotion} | ${r.report.runningAnimationsCount} | ${r.report.elementsWithNonZeroAnimationDuration} | ${r.report.elementsWithNonZeroTransitionDuration} | ${r.report.smilAnimateElementCount} | ${r.report.smilAnimateElementsRunning} | ${r.report.playingVideoCount} |`,
    )
  }
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'SUMMARY.md'), lines.join('\n') + '\n')

  console.log('Wrote', jsonPath)
})
