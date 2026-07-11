// Screenshot the round-4 HTML previews at 1440 (+375 for dashboard/catalog).
// Run from repo root: node docs/redesign/round4-codex-direction/screenshot-previews.mjs
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const root = process.cwd()
const previews = path.join(root, 'docs/redesign/previews/round4')
const out = path.join(root, 'docs/redesign/screenshots/round4')
fs.mkdirSync(out, { recursive: true })

const all = [
  { file: 'dashboard.html', mobile: true },
  { file: 'practice-catalog.html', mobile: true },
  { file: 'flow-workspace.html', mobile: false },
  { file: 'feedback-debrief.html', mobile: false },
  { file: 'interviews-hub.html', mobile: false },
  { file: 'progress.html', mobile: false },
  // batch 2 — library + reading surfaces
  { file: 'autopsies-hub.html', mobile: false },
  { file: 'autopsy-reader.html', mobile: true },
  { file: 'study-plans.html', mobile: false },
  { file: 'study-plan-detail.html', mobile: false },
  { file: 'guides-hub.html', mobile: false },
  { file: 'chapter-reader.html', mobile: true },
  // batch 3 — interaction + user-state screens
  { file: 'canvas-workspace.html', mobile: false },
  { file: 'dashboard-first-run.html', mobile: true },
  { file: 'dashboard-pro.html', mobile: false },
]
// pass file names as args to shoot a subset: node screenshot-previews.mjs autopsy-reader.html ...
const wanted = process.argv.slice(2)
const screens = wanted.length ? all.filter(s => wanted.includes(s.file)) : all

const browser = await chromium.launch()
for (const { file, mobile } of screens) {
  const src = path.join(previews, file)
  if (!fs.existsSync(src)) { console.log(`SKIP (missing): ${file}`); continue }
  const base = file.replace('.html', '')
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('file://' + src, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900) // fonts settle
  await page.screenshot({ path: path.join(out, `${base}-1440.png`), fullPage: true })
  // horizontal-overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(`${base} 1440 done${overflow > 2 ? `  ⚠ H-OVERFLOW ${overflow}px` : ''}`)
  await page.close()

  if (mobile) {
    const m = await browser.newPage({ viewport: { width: 375, height: 812 } })
    await m.goto('file://' + src, { waitUntil: 'networkidle' })
    await m.waitForTimeout(900)
    await m.screenshot({ path: path.join(out, `${base}-375.png`), fullPage: true })
    const mo = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    console.log(`${base} 375 done${mo > 2 ? `  ⚠ H-OVERFLOW ${mo}px` : ''}`)
    await m.close()
  }
}
await browser.close()
console.log('ALL DONE')
