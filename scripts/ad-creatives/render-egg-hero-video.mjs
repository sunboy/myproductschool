#!/usr/bin/env node
// Produces the "egg hero" motion ad: a 15s 1080x1920 30fps video rendered
// deterministically (frame-stepped via window.__seek, no screen recording, no
// dropped frames). Replaces the rejected raw flow capture.
//
// Usage: node scripts/ad-creatives/render-egg-hero-video.mjs

import { chromium } from '@playwright/test'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const OUT_DIR = join(ROOT, 'docs/notes/ad-creatives/egg')
const FRAMES_DIR = join(OUT_DIR, '.frames')
const FPS = 30
const DURATION = 15

const ctaPose = join(ROOT, 'public/images/hatch/ad-poses/hatch-wave-cta-b.png')
const poseUrl = existsSync(ctaPose)
  ? pathToFileURL(ctaPose).href
  : pathToFileURL(join(ROOT, 'public/lottie/hatch/pieces/hatch-pop-512.png')).href

rmSync(FRAMES_DIR, { recursive: true, force: true })
mkdirSync(FRAMES_DIR, { recursive: true })

// Load the egg-hatch Lottie JSON in Node (fetch is blocked on file:// pages)
// and point its raster asset at a file:// URL so the image layer resolves.
const lottieData = JSON.parse(
  readFileSync(join(ROOT, 'public/lottie/hatch/egg-hatch-img.json'), 'utf8'),
)
for (const asset of lottieData.assets ?? []) {
  if (asset.u && asset.p) {
    asset.u = pathToFileURL(join(ROOT, 'public', asset.u)).href.replace(/\/?$/, '/')
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await page.addInitScript((data) => {
  window.__LOTTIE_DATA__ = data
}, lottieData)

const templateUrl =
  pathToFileURL(join(HERE, 'templates/egg-hero.html')).href + `?pose=${encodeURIComponent(poseUrl)}`
await page.goto(templateUrl)
await page.waitForFunction('window.__ready === true', { timeout: 30000 })
await page.evaluate(() => document.fonts.ready)

const totalFrames = FPS * DURATION
for (let f = 0; f < totalFrames; f++) {
  const t = f / FPS
  await page.evaluate((tt) => window.__seek(tt), t)
  await page.screenshot({ path: join(FRAMES_DIR, `f${String(f).padStart(4, '0')}.png`) })
  if (f % 60 === 0) console.log(`frame ${f}/${totalFrames}`)
}

await browser.close()

const out = join(OUT_DIR, 'egg-hero-1080x1920.mp4')
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${join(FRAMES_DIR, 'f%04d.png')}" -c:v libx264 -pix_fmt yuv420p -crf 19 -movflags +faststart "${out}"`,
  { stdio: 'inherit' },
)
rmSync(FRAMES_DIR, { recursive: true, force: true })
console.log('\nWrote', out)
