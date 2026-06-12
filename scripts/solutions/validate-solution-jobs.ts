#!/usr/bin/env npx tsx
/**
 * Validate sub-agent solution outputs (batch-NNN.solutions.json files) before apply.
 *
 * Checks per item:
 *   - Hard errors (exit 1): Zod schema failures, id/type mismatches against the
 *     batch input, em dashes in editorial markdown.
 *   - Warnings (reported, non-blocking): AI-slop words, per-type structural
 *     expectations (solutionStructureWarnings), role-framing in editorial copy.
 *
 * Quoted AI prompts (ai_collaboration.prompts[].prompt) are exempt from the
 * role-framing check: they are instructions addressed to an AI assistant.
 *
 * Usage:
 *   npx tsx scripts/solutions/validate-solution-jobs.ts            # all outputs
 *   npx tsx scripts/solutions/validate-solution-jobs.ts <file...>  # specific files
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SolutionContentSchema, solutionStructureWarnings } from '../../src/lib/solutions/schema'
import { BANNED_SLOP } from '../../src/lib/ai/voice-rules'

const OUT_ROOT = join('scripts', 'content', 'solutions')

const EM_DASH_RE = /—|(?<=\S)\s--\s(?=\S)/
const ROLE_FRAMING_RE = /\b(?:you are (?:a|an)\s|as a (?:senior|staff|founding|tech lead|product manager|engineer)|imagine you)\b/i

function findOutputFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findOutputFiles(full))
    else if (entry.endsWith('.solutions.json')) results.push(full)
  }
  return results
}

function editorialTexts(content: Record<string, unknown>): Array<{ path: string; text: string }> {
  const texts: Array<{ path: string; text: string }> = []
  const c = content as {
    overview_md?: string
    key_takeaways?: string[]
    approaches?: Array<{ id?: string; title?: string; tagline?: string; body_md?: string; tradeoffs?: Array<{ gain?: string; cost?: string }> }>
    ai_collaboration?: { body_md?: string; pitfalls?: string[]; prompts?: Array<{ title?: string; why?: string }> }
  }
  if (c.overview_md) texts.push({ path: 'overview_md', text: c.overview_md })
  for (const [i, takeaway] of (c.key_takeaways ?? []).entries()) texts.push({ path: `key_takeaways[${i}]`, text: takeaway })
  for (const approach of c.approaches ?? []) {
    const base = `approaches[${approach.id}]`
    if (approach.title) texts.push({ path: `${base}.title`, text: approach.title })
    if (approach.tagline) texts.push({ path: `${base}.tagline`, text: approach.tagline })
    if (approach.body_md) texts.push({ path: `${base}.body_md`, text: approach.body_md })
    for (const [i, tradeoff] of (approach.tradeoffs ?? []).entries()) {
      if (tradeoff.gain) texts.push({ path: `${base}.tradeoffs[${i}].gain`, text: tradeoff.gain })
      if (tradeoff.cost) texts.push({ path: `${base}.tradeoffs[${i}].cost`, text: tradeoff.cost })
    }
  }
  const ai = c.ai_collaboration
  if (ai?.body_md) texts.push({ path: 'ai_collaboration.body_md', text: ai.body_md })
  for (const [i, pitfall] of (ai?.pitfalls ?? []).entries()) texts.push({ path: `ai_collaboration.pitfalls[${i}]`, text: pitfall })
  for (const [i, prompt] of (ai?.prompts ?? []).entries()) {
    // prompt.prompt intentionally excluded (quoted AI instructions)
    if (prompt.title) texts.push({ path: `ai_collaboration.prompts[${i}].title`, text: prompt.title })
    if (prompt.why) texts.push({ path: `ai_collaboration.prompts[${i}].why`, text: prompt.why })
  }
  return texts
}

/** Strip code fences/inline code before linting prose (code may legitimately contain banned tokens). */
function proseOnly(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ')
}

async function main() {
  const explicit = process.argv.slice(2)
  const files = explicit.length > 0 ? explicit : findOutputFiles(OUT_ROOT)
  if (files.length === 0) {
    console.error(`No .solutions.json files found under ${OUT_ROOT}/`)
    process.exit(1)
  }

  let hardErrors = 0
  let warnings = 0
  let valid = 0

  for (const file of files) {
    const inputFile = file.replace(/\.solutions\.json$/, '.json')
    let inputIds = new Map<string, string>()
    try {
      const input = JSON.parse(readFileSync(inputFile, 'utf-8')) as Array<{ id: string; challenge_type: string }>
      inputIds = new Map(input.map((item) => [item.id, item.challenge_type]))
    } catch {
      console.warn(`! ${file}: matching input ${inputFile} unreadable; skipping id cross-check`)
    }

    let items: Array<{ id?: string; challenge_type?: string; content?: unknown }>
    try {
      items = JSON.parse(readFileSync(file, 'utf-8'))
      if (!Array.isArray(items)) throw new Error('not an array')
    } catch (error) {
      console.error(`✗ ${file}: unreadable JSON (${error instanceof Error ? error.message : error})`)
      hardErrors++
      continue
    }

    for (const item of items) {
      const label = `${file} :: ${item.id ?? '<missing id>'}`
      if (!item.id || !item.content) {
        console.error(`✗ ${label}: missing id or content`)
        hardErrors++
        continue
      }
      if (inputIds.size > 0 && !inputIds.has(item.id)) {
        console.error(`✗ ${label}: id not present in ${inputFile}`)
        hardErrors++
        continue
      }

      const parsed = SolutionContentSchema.safeParse(item.content)
      if (!parsed.success) {
        console.error(`✗ ${label}: schema errors`)
        for (const issue of parsed.error.issues.slice(0, 8)) {
          console.error(`    - ${issue.path.join('.')}: ${issue.message}`)
        }
        hardErrors++
        continue
      }

      const expectedType = inputIds.get(item.id)
      if (expectedType && parsed.data.challenge_type !== expectedType) {
        console.error(`✗ ${label}: challenge_type "${parsed.data.challenge_type}" != input "${expectedType}"`)
        hardErrors++
        continue
      }

      let itemHardError = false
      for (const { path, text } of editorialTexts(parsed.data as unknown as Record<string, unknown>)) {
        const prose = proseOnly(text)
        if (EM_DASH_RE.test(prose)) {
          console.error(`✗ ${label}: em dash in ${path}`)
          itemHardError = true
        }
        for (const slop of BANNED_SLOP) {
          if (new RegExp(`\\b${slop.replace(/[-\s]/g, '[-\\s]')}\\b`, 'i').test(prose)) {
            console.warn(`! ${label}: slop "${slop}" in ${path}`)
            warnings++
          }
        }
        if (ROLE_FRAMING_RE.test(prose)) {
          console.warn(`! ${label}: role framing in ${path}`)
          warnings++
        }
      }
      if (itemHardError) {
        hardErrors++
        continue
      }

      for (const warning of solutionStructureWarnings(parsed.data)) {
        console.warn(`! ${label}: ${warning}`)
        warnings++
      }
      valid++
    }
  }

  console.log(`\n${valid} valid, ${warnings} warnings, ${hardErrors} hard errors across ${files.length} files`)
  process.exit(hardErrors > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
