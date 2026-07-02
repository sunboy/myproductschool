#!/usr/bin/env node
// Generates an illustrated Hatch pose from the OFFICIAL mascot reference via
// the OpenAI gpt-image-1 edits endpoint (style-bible rule: Hatch variants must
// derive from the reference, never prompt-only).
//
// Usage:
//   node scripts/hatch-art/generate-pose.mjs <out-name> "<pose description>"
// Example:
//   node scripts/hatch-art/generate-pose.mjs hatch-pop "bursting upward joyfully, arms raised"
//
// Reads OPENAI_API_KEY from .env.local (or the environment). Writes a
// transparent 1024x1024 PNG to public/lottie/hatch/pieces/<out-name>.png

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const REFERENCE = join(ROOT, 'public/images/hatch/hatch-official-mascot.png')
const OUT_DIR = join(ROOT, 'public/lottie/hatch/pieces')

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  const m = env.match(/^OPENAI_API_KEY=(.+)$/m)
  if (!m) throw new Error('OPENAI_API_KEY not found in env or .env.local')
  return m[1].trim()
}

const [outName, pose] = process.argv.slice(2)
if (!outName || !pose) {
  console.error('usage: generate-pose.mjs <out-name> "<pose description>"')
  process.exit(1)
}
if (!existsSync(REFERENCE)) throw new Error(`reference missing: ${REFERENCE}`)

const prompt =
  `Redraw this exact mascot character in a new pose: ${pose}. ` +
  'Keep every character trait identical to the reference: rounded forest-green head frame, cream face and cream body, ' +
  'graduation cap on top of the head, upward growth arrow near the cap, green H mark on the chest, ' +
  'bright friendly cartoon eyes with simple highlights, simple mitten hands, friendly coach expression. ' +
  'Flat clean vector-like illustration, crisp edges, no gradients, no 3D, no photorealism, no texture. ' +
  'Transparent background. No text, no shadow, no extra objects.'

const form = new FormData()
form.append('model', 'gpt-image-1')
form.append('image', new Blob([readFileSync(REFERENCE)], { type: 'image/png' }), 'mascot.png')
form.append('prompt', prompt)
form.append('size', '1024x1024')
form.append('background', 'transparent')
form.append('quality', 'high')

const res = await fetch('https://api.openai.com/v1/images/edits', {
  method: 'POST',
  headers: { Authorization: `Bearer ${loadApiKey()}` },
  body: form,
})
if (!res.ok) {
  console.error('OpenAI error', res.status, await res.text())
  process.exit(1)
}
const json = await res.json()
const b64 = json.data?.[0]?.b64_json
if (!b64) throw new Error('no image in response')

mkdirSync(OUT_DIR, { recursive: true })
const outPath = join(OUT_DIR, `${outName}.png`)
writeFileSync(outPath, Buffer.from(b64, 'base64'))
console.log('wrote', outPath)
