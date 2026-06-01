#!/usr/bin/env npx tsx
/**
 * Merge experience-derived algorithm challenge output into staged entries.
 *
 * Agents write one EnrichmentResult per challenge into
 * seeds/chillinterview/exp-algo-out/; metadata (company/difficulty/source_url)
 * comes from seeds/chillinterview/exp-author/algorithm.json (the keeper briefs).
 *
 * Validation mirrors build-staged-from-agent.ts. Appends to
 * seeds/staged-interview-challenges.json with approved:false,
 * metadata.is_expanded:true.
 *
 * Usage:
 *   npx tsx scripts/build-staged-exp-algo.ts --dry-run
 *   npx tsx scripts/build-staged-exp-algo.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS = path.join(process.cwd(), 'seeds')
const BRIEFS = path.join(SEEDS, 'chillinterview', 'exp-author', 'algorithm.json')
const AGENT_OUT = path.join(SEEDS, 'chillinterview', 'exp-algo-out')
const STAGED = path.join(SEEDS, 'staged-interview-challenges.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

interface EnrichmentResult {
  key: string
  title: string
  rewritten_statement: string
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: Array<{ id: string; label: string; args: unknown[]; expected: unknown; hidden: boolean }>
  reference_approach: string
}

interface Brief {
  key: string
  difficulty: string
  company_tag: string | null
  topics?: string[]
  source_url: string
}

function validate(r: EnrichmentResult): string[] {
  const e: string[] = []
  if (!r.rewritten_statement || r.rewritten_statement.length < 120) e.push('statement too short')
  if (/—/.test(r.rewritten_statement)) e.push('em dash in statement')
  if (!r.starter_code?.python || !r.starter_code?.javascript) e.push('missing starter_code')
  if (!r.reference_solution?.python || !r.reference_solution?.javascript)
    e.push('missing reference_solution')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 5)
    e.push(`need >=5 test_cases, got ${r.test_cases?.length ?? 0}`)
  if (!r.reference_approach) e.push('missing reference_approach')
  return e
}

function main() {
  const briefs = JSON.parse(fs.readFileSync(BRIEFS, 'utf-8')) as Brief[]
  const byKey = new Map(briefs.map((b) => [b.key, b]))
  const files = fs.existsSync(AGENT_OUT) ? fs.readdirSync(AGENT_OUT).filter((f) => f.endsWith('.json')) : []
  console.log(`${files.length} exp-algo output files`)

  const existing = fs.existsSync(STAGED)
    ? (JSON.parse(fs.readFileSync(STAGED, 'utf-8')) as Array<Record<string, unknown>>)
    : []
  const existingKeys = new Set(existing.map((e) => (e.source_question_id as string) ?? '').filter(Boolean))

  const staged: Array<Record<string, unknown>> = []
  let invalid = 0
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(AGENT_OUT, f), 'utf-8')) as EnrichmentResult
    const brief = byKey.get(r.key)
    if (!brief) {
      console.warn(`  ${f}: no brief for key ${r.key}`)
      continue
    }
    if (existingKeys.has(r.key)) continue
    const errs = validate(r)
    if (errs.length) {
      console.warn(`  ${f} INVALID: ${errs.join('; ')}`)
      invalid++
      continue
    }
    staged.push({
      title: r.title,
      challenge_type: 'algorithm',
      is_sql: false,
      difficulty: brief.difficulty,
      time_limit_seconds: 30 * 60,
      pattern: (brief.topics ?? [])[0] ?? '',
      problem_statement_markdown: r.rewritten_statement,
      metadata: {
        starter_code: r.starter_code,
        reference_solution: r.reference_solution,
        test_cases: r.test_cases,
        reference_approach: r.reference_approach,
        source: 'chillinterview',
        source_url: brief.source_url,
        source_fidelity: 'expanded',
        is_expanded: true,
        company_tags: brief.company_tag ? [brief.company_tag] : [],
        topic_tags: [],
        technique_tags: [],
      },
      source_question_id: r.key,
      approved: false,
      generated_at: new Date().toISOString(),
    })
    existingKeys.add(r.key)
  }

  console.log(`  ${staged.length} valid staged, ${invalid} invalid`)
  if (DRY_RUN) return
  fs.writeFileSync(STAGED, JSON.stringify([...existing, ...staged], null, 2))
  console.log(`Wrote ${existing.length + staged.length} total (${staged.length} new) → ${path.relative(process.cwd(), STAGED)}`)
}

main()
