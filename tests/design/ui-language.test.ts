import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Scans the UI-language trees for patterns the design system forbids
 *  (docs/design/ui-language.md). Legacy trees are exempt until removed. */
const ROOTS = ['src/design', 'src/components/shell-v2', 'src/components/density', 'src/components/onboarding/welcome']
const RULES: Array<{ name: string; re: RegExp; allow?: RegExp }> = [
  { name: 'arbitrary font size (use text-caption … text-display)', re: /\btext-\[\d+(?:\.\d+)?px\]/g },
  { name: 'pixel height on an element (cards size to content; use min-h or aspect-ratio)', re: /\b(?:h|min-h|max-h)-\[\d+px\]/g },
  { name: 'inline layout style (use grid/flex utilities)', re: /style=\{\{[^}]*\b(?:display|gridTemplateColumns|flexDirection)\s*:/g, allow: /data-geo|dashboard-hero/ },
  { name: 'hex colour in className (use a token)', re: /className=(?:"[^"]*|'[^']*|\{`[^`]*)#[0-9a-fA-F]{3,6}/g, allow: /src\/design\/Badge\.tsx/ },
]

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(p)
  }
  return out
}

describe('ui-language', () => {
  const files = ROOTS.flatMap(r => { try { return walk(r) } catch { return [] } })
  it('scans the density trees', () => { expect(files.length).toBeGreaterThan(10) })
  for (const rule of RULES) {
    it(`no ${rule.name}`, () => {
      const hits: string[] = []
      for (const f of files) {
        if (rule.allow?.test(f)) continue
        const src = readFileSync(f, 'utf8')
        for (const m of src.matchAll(rule.re)) {
          if (rule.allow?.test(m[0])) continue
          const line = src.slice(0, m.index).split('\n').length
          hits.push(`${f}:${line} ${m[0].slice(0, 60)}`)
        }
      }
      expect(hits, hits.join('\n')).toEqual([])
    })
  }
})
