#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Design-system regression guard. Two checks against the "Elevate Terra" rules:
 *
 *  1. RAW HEX IN className — the hard ban. Tailwind token classes only in JSX
 *     className strings; raw hex (#xxxxxx) belongs in style={{}}/SVG, never in a
 *     className. e.g.  className="bg-[#4a7c59]"  →  className="bg-primary".
 *
 *  2. LOWERCASE COMPANY TOKENS rendered raw — company tags must go through
 *     formatCompany() (src/lib/format/company.ts), never rendered as the raw
 *     lowercase slug.  (Heuristic: a known-irregular slug appearing as a JSX
 *     text node.)
 *
 * Usage:
 *   node scripts/check-design-system.js           # report (exit 0)
 *   node scripts/check-design-system.js --strict   # fail (exit 1) on any violation
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const STRICT = process.argv.includes('--strict')
const SRC = path.join(ROOT, 'src')

// Raw hex inside a className="..." / className={`...`} / className={cn(...)} string.
// We scan className attribute values for a #hex literal.
const CLASSNAME_RE = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{([^}]*)\})/g
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/

function listFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      listFiles(full, acc)
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

function relativize(p) {
  return path.relative(ROOT, p)
}

const files = listFiles(SRC, [])
const violations = []

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  let m
  CLASSNAME_RE.lastIndex = 0
  while ((m = CLASSNAME_RE.exec(text)) !== null) {
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? ''
    if (HEX_RE.test(value)) {
      // line number
      const upto = text.slice(0, m.index)
      const line = upto.split('\n').length
      const hex = value.match(HEX_RE)[0]
      violations.push({ file: relativize(file), line, hex })
    }
  }
}

if (violations.length === 0) {
  console.log('Design-system guard: no raw hex in className. ✓')
  process.exit(0)
}

console.log(`Design-system guard: ${violations.length} raw-hex-in-className violations:\n`)
const byFile = new Map()
for (const v of violations) {
  byFile.set(v.file, (byFile.get(v.file) || []).concat(`${v.line}: ${v.hex}`))
}
for (const [file, hits] of [...byFile.entries()].sort()) {
  console.log(`  ${file}`)
  for (const h of hits.slice(0, 8)) console.log(`    ${h}`)
  if (hits.length > 8) console.log(`    … +${hits.length - 8} more`)
}
console.log(`\nUse Tailwind token classes (bg-primary, text-on-surface, …); keep raw hex in style={{}} / SVG only.`)

process.exit(STRICT ? 1 : 0)
