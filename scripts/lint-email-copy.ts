/**
 * Email copy lint: enforces the writing-style hard rules from
 * docs/notes/email-copy-brief.md across every string literal in the email
 * sender files and samples.
 *
 *   npx tsx scripts/lint-email-copy.ts
 *
 * Fails (exit 1) on:
 *  - em dashes in prose (the Hatch signature "— Hatch" is the one exception)
 *  - AI slop words (delve, leverage, utilize, ...)
 *  - second-person role framing ("you are a senior...", "as a tech lead")
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const TARGETS = [
  'src/lib/email/senders',
  'src/lib/email/samples.ts',
  'src/lib/email/send-core.ts',
  'src/lib/email/layout.ts',
  'src/lib/email/newsletter.ts',
]

const SLOP = [
  'delve', 'leverage', 'utilize', 'holistic', 'robust', 'seamlessly',
  'it’s worth noting', "it's worth noting", 'in order to', 'as well as',
  'embark on', 'tapestry', 'tailored', 'cutting-edge', 'revolutionary',
  'game-changing',
]
// Words banned only as verbs are checked with light heuristics.
const SLOP_VERBISH = ['unlock your', 'unlocks your', 'navigate the', 'ensure ']

const ROLE_FRAMING = /\byou are an? (senior|tech|staff|product|founding|engineering)\b|\bas an? (senior|tech lead|staff engineer|product manager)\b/i

interface Violation {
  file: string
  line: number
  rule: string
  excerpt: string
}

function listFiles(target: string): string[] {
  try {
    const entries = readdirSync(target, { withFileTypes: true })
    return entries.flatMap(e => (e.isDirectory() ? listFiles(join(target, e.name)) : [join(target, e.name)]))
  } catch {
    return [target]
  }
}

/** Pull string-literal contents ('...', "...", `...`) with their line numbers. */
function stringLiterals(source: string): { text: string; line: number }[] {
  // Blank out comments first (preserving newlines so line numbers hold):
  // apostrophes inside jsdoc otherwise open phantom string literals that
  // swallow real code until the next quote.
  const decommented = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '))
  const out: { text: string; line: number }[] = []
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/gs
  let m: RegExpExecArray | null
  while ((m = re.exec(decommented))) {
    const text = m[1] ?? m[2] ?? m[3] ?? ''
    if (!text.trim()) continue
    const line = decommented.slice(0, m.index).split('\n').length
    out.push({ text, line })
  }
  return out
}

const violations: Violation[] = []

for (const target of TARGETS) {
  for (const file of listFiles(target)) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue
    const source = readFileSync(file, 'utf8')
    for (const { text, line } of stringLiterals(source)) {
      // Skip pure-markup literals (inline-styled HTML) but keep their visible text.
      const visible = text.replace(/<[^>]+>/g, ' ').replace(/style="[^"]*"/g, ' ')

      // Em dash: allowed only in the Hatch signature.
      if (visible.includes('—')) {
        const withoutSignature = visible.replaceAll(/— Hatch\b[^]*?(?=$|\n)/g, '')
        if (withoutSignature.includes('—')) {
          violations.push({ file, line, rule: 'em-dash', excerpt: visible.trim().slice(0, 90) })
        }
      }

      const lower = ` ${visible.toLowerCase()} `
      for (const word of SLOP) {
        if (lower.includes(` ${word}`)) {
          violations.push({ file, line, rule: `slop:${word}`, excerpt: visible.trim().slice(0, 90) })
        }
      }
      for (const phrase of SLOP_VERBISH) {
        if (lower.includes(phrase)) {
          violations.push({ file, line, rule: `slop:${phrase.trim()}`, excerpt: visible.trim().slice(0, 90) })
        }
      }
      if (ROLE_FRAMING.test(visible)) {
        violations.push({ file, line, rule: 'role-framing', excerpt: visible.trim().slice(0, 90) })
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Email copy lint: ${violations.length} violation(s)\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.excerpt}`)
  }
  process.exit(1)
}
console.log('Email copy lint: clean')
