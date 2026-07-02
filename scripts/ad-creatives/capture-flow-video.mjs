#!/usr/bin/env node
// Records the real /go/failure-mode/i instant flow as a 9:16 native-style ad
// video: hook → four taps (with visible tap ripples) → triple-tap egg crack →
// result card. Output: docs/notes/ad-creatives/egg/flow-capture.webm (+ mp4
// 1080x1920 if ffmpeg is available).
//
// Usage: BASE_URL=http://localhost:3100 node scripts/ad-creatives/capture-flow-video.mjs

import { chromium } from '@playwright/test'
import { mkdirSync, readdirSync, renameSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const OUT_DIR = join(ROOT, 'docs/notes/ad-creatives/egg')
const BASE = process.env.BASE_URL ?? 'http://localhost:3100'

mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  recordVideo: { dir: OUT_DIR, size: { width: 390, height: 844 } },
})
const page = await context.newPage()

// Visible tap ripple so the viewer can follow the interaction.
await page.addInitScript(() => {
  window.addEventListener(
    'click',
    (e) => {
      const r = document.createElement('div')
      r.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;border:3px solid rgba(74,124,89,.9);background:rgba(74,124,89,.25);z-index:99999;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out;`
      document.body.appendChild(r)
      requestAnimationFrame(() => {
        r.style.transform = 'scale(1.9)'
        r.style.opacity = '0'
      })
      setTimeout(() => r.remove(), 500)
    },
    true,
  )
})

const human = (min, max) => Math.round(min + Math.random() * (max - min))

await page.goto(`${BASE}/go/failure-mode/i`)
await page.waitForTimeout(1600)
// dismiss cookie banner out of frame if present
const essential = page.locator('button', { hasText: 'Essential only' })
if (await essential.count()) {
  await essential.click()
  await page.waitForTimeout(400)
}

// hook → start
await page.locator('.lmi-cta').first().click()
await page.waitForTimeout(human(700, 1000))

// answer 4 questions (pick the strong option to land a clean result)
for (let q = 0; q < 4; q++) {
  await page.waitForSelector('.lmi-option')
  await page.waitForTimeout(human(650, 950))
  await page.locator('.lmi-option').first().click()
  // quip + advance window
  await page.waitForTimeout(1400)
}

// egg: three taps, paced for drama
await page.waitForSelector('.lmi-egg-btn')
await page.waitForTimeout(900)
for (let t = 0; t < 3; t++) {
  await page.locator('.lmi-egg-btn').click()
  await page.waitForTimeout(t < 2 ? 900 : 2600) // let the final hatch play out
}

// result card linger
await page.waitForTimeout(2200)

await page.close()
await context.close()
await browser.close()

// Playwright writes a random-named webm; rename it.
const webm = readdirSync(OUT_DIR).find((f) => f.endsWith('.webm') && f !== 'flow-capture.webm')
if (webm) {
  renameSync(join(OUT_DIR, webm), join(OUT_DIR, 'flow-capture.webm'))
  console.log('Wrote', join(OUT_DIR, 'flow-capture.webm'))
}

// Upscale + convert when ffmpeg exists.
try {
  execSync('ffmpeg -version', { stdio: 'ignore' })
  execSync(
    `ffmpeg -y -i "${join(OUT_DIR, 'flow-capture.webm')}" -vf "scale=1080:1920:flags=lanczos,setsar=1" -r 30 -c:v libx264 -pix_fmt yuv420p -crf 20 "${join(OUT_DIR, 'flow-capture-1080x1920.mp4')}"`,
    { stdio: 'inherit' },
  )
  console.log('Wrote', join(OUT_DIR, 'flow-capture-1080x1920.mp4'))
} catch {
  console.warn('ffmpeg not available; kept webm only')
}
