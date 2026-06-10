#!/usr/bin/env node
// Builds the review contact sheet: docs/notes/ad-creatives/index.html
// One card per creative: renders, hook copy, destination URL, lint status.

import { writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CREATIVES, destinationUrl } from './manifest.mjs'
import { lintManifest } from './compliance-lint.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const OUT_ROOT = join(ROOT, 'docs/notes/ad-creatives')

const violations = lintManifest(CREATIVES)
const flagged = new Set(violations.map((v) => v.creativeId))

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

const cards = CREATIVES.map((c) => {
  const imgs = c.ratios
    .map((r) => {
      const rel = `${c.series}/${c.id}-${r}.png`
      const abs = join(OUT_ROOT, rel)
      return existsSync(abs)
        ? `<figure><img src="${rel}" loading="lazy" /><figcaption>${r}</figcaption></figure>`
        : `<figure class="missing"><div>missing ${r}</div></figure>`
    })
    .join('')
  return `
  <section class="card">
    <header>
      <span class="series">${esc(c.series)}</span>
      <strong>${esc(c.id)}</strong>
      <span class="lint ${flagged.has(c.id) ? 'fail' : 'pass'}">${flagged.has(c.id) ? 'LINT FAIL' : 'lint ok'}</span>
    </header>
    <div class="renders">${imgs}</div>
    <dl>
      ${c.hook.eyebrow ? `<dt>eyebrow</dt><dd>${esc(c.hook.eyebrow)}</dd>` : ''}
      <dt>headline</dt><dd>${esc(c.hook.headline)}</dd>
      ${c.hook.sub ? `<dt>sub</dt><dd>${esc(c.hook.sub)}</dd>` : ''}
      <dt>cta</dt><dd>${esc(c.hook.cta)}</dd>
      <dt>destination</dt><dd><a href="${esc(destinationUrl(c))}">${esc(destinationUrl(c))}</a></dd>
    </dl>
  </section>`
}).join('\n')

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>HackProduct ad creatives — review sheet</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #f5f1ea; color: #1e211c; margin: 0; padding: 40px; }
  h1 { font-size: 22px; margin: 0 0 6px; } .note { color: #78715f; font-size: 13px; margin: 0 0 28px; }
  .card { background: #fffdf7; border: 1px solid #dfd8c8; border-radius: 14px; padding: 20px; margin-bottom: 26px; }
  .card header { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
  .series { background: #4a7c59; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; }
  .lint { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
  .lint.pass { background: #cfe3d3; color: #244232; } .lint.fail { background: #c0392b; color: #fff; }
  .renders { display: flex; gap: 16px; flex-wrap: wrap; }
  figure { margin: 0; } figure img { height: 420px; width: auto; border: 1px solid #dfd8c8; border-radius: 8px; }
  figure.missing div { height: 420px; width: 236px; display: flex; align-items: center; justify-content: center; border: 1px dashed #c0392b; border-radius: 8px; color: #c0392b; font-size: 12px; }
  figcaption { font-size: 11px; color: #78715f; text-align: center; margin-top: 4px; }
  dl { font-size: 13px; margin: 14px 0 0; } dt { font-weight: 800; color: #78715f; text-transform: uppercase; font-size: 10px; margin-top: 8px; } dd { margin: 2px 0 0; }
  a { color: #4a7c59; word-break: break-all; }
</style></head>
<body>
<h1>HackProduct ad creatives</h1>
<p class="note">Generated ${CREATIVES.length} creative definitions. Renders regenerable via <code>node scripts/ad-creatives/render.mjs</code>.</p>
${cards}
</body></html>`

writeFileSync(join(OUT_ROOT, 'index.html'), html)
console.log('Wrote', join(OUT_ROOT, 'index.html'))
if (violations.length) {
  console.error('Lint violations present:', violations.length)
  process.exit(1)
}
