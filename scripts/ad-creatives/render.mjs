#!/usr/bin/env node
// Composites ad creatives: manifest × ratios → PNGs via Playwright Chromium.
// Usage:
//   node scripts/ad-creatives/render.mjs              # render everything
//   node scripts/ad-creatives/render.mjs --guides     # overlay TikTok safe zones
//   node scripts/ad-creatives/render.mjs --only graded-second-sentence-a

import { chromium } from '@playwright/test'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CREATIVES, destinationUrl } from './manifest.mjs'
import { lintManifest } from './compliance-lint.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const OUT_ROOT = join(ROOT, 'docs/notes/ad-creatives')
const POSE_DIRS = [
  join(ROOT, 'public/images/hatch/ad-poses'),
  join(ROOT, 'public/lottie/hatch/pieces'),
]

const RATIO_SIZES = {
  '9x16': { width: 1080, height: 1920 },
  '4x5': { width: 1080, height: 1350 },
  '1x1': { width: 1080, height: 1080 },
}

const args = process.argv.slice(2)
const guides = args.includes('--guides')
const onlyIdx = args.indexOf('--only')
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null

// ── Compliance gate ─────────────────────────────────────────
const violations = lintManifest(CREATIVES)
if (violations.length > 0) {
  console.error('COMPLIANCE LINT FAILED — refusing to render:')
  for (const v of violations) {
    console.error(`  [${v.creativeId}] ${v.field}: ${v.rule}\n    "${v.text}"`)
  }
  process.exit(1)
}

function findPose(file) {
  if (!file) return null
  for (const dir of POSE_DIRS) {
    const p = join(dir, file)
    if (existsSync(p)) return pathToFileURL(p).href
  }
  return null
}

const browser = await chromium.launch()
const targets = CREATIVES.filter((c) => !only || c.id === only)
let rendered = 0
const missingPoses = []

for (const creative of targets) {
  const templatePath = join(HERE, 'templates', `${creative.template}.html`)
  if (!existsSync(templatePath)) {
    console.error(`SKIP ${creative.id}: template ${creative.template}.html missing`)
    continue
  }
  const poseUrl = findPose(creative.pose)
  if (creative.pose && !poseUrl) missingPoses.push(`${creative.id} → ${creative.pose}`)

  for (const ratio of creative.ratios) {
    const size = RATIO_SIZES[ratio]
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
    await page.addInitScript(
      (data) => {
        window.__AD_DATA__ = data
      },
      { ...creative, ratio, poseUrl },
    )
    const url = pathToFileURL(templatePath).href + (guides ? '?guides=1' : '')
    await page.goto(url)
    await page.evaluate(() => document.fonts.ready)
    // settle webfont layout + image decode
    await page.waitForTimeout(250)

    const outDir = join(OUT_ROOT, creative.series)
    mkdirSync(outDir, { recursive: true })
    const outPath = join(outDir, `${creative.id}-${ratio}${guides ? '-guides' : ''}.png`)
    await page.screenshot({ path: outPath })
    await page.close()
    rendered++
    console.log(`✓ ${creative.id} ${ratio}  →  ${outPath.replace(ROOT + '/', '')}`)
  }
}

await browser.close()
console.log(`\nRendered ${rendered} creatives.`)
if (missingPoses.length) {
  console.warn('Missing pose files (rendered without character):')
  for (const m of missingPoses) console.warn(`  - ${m}`)
}
console.log('\nDestination URLs (instagram):')
for (const c of targets) console.log(`  ${c.id}: ${destinationUrl(c)}`)
