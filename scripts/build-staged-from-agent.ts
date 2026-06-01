#!/usr/bin/env npx tsx
/**
 * Merge sub-agent enrichment output with the normalized chillinterview entries
 * to produce staged coding challenges, appended to
 * seeds/staged-interview-challenges.json (approved:false).
 *
 * Agents write one JSON file per challenge into seeds/chillinterview/agent-out/,
 * each matching the EnrichmentResult shape below. This script does the
 * deterministic assembly + validation so the creative work stays in the agent
 * and the data shaping stays auditable here.
 *
 * Validation mirrors scripts/enrich-scraped-coding.ts: starter_code + reference
 * _solution in python & javascript, >=5 test_cases with required fields, a
 * reference_approach, and a rewritten statement that is NOT the source verbatim.
 *
 * Usage:
 *   npx tsx scripts/build-staged-from-agent.ts --dry-run
 *   npx tsx scripts/build-staged-from-agent.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS = path.join(process.cwd(), 'seeds')
const SCRAPED = path.join(SEEDS, 'scraped-raw.json')
const AGENT_OUT = path.join(SEEDS, 'chillinterview', 'agent-out')
const STAGED = path.join(SEEDS, 'staged-interview-challenges.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

interface EnrichmentResult {
  key: string // matches source_question_id, e.g. "chillinterview:slug"
  title: string
  rewritten_statement: string
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: Array<{
    id: string
    label: string
    args: unknown[]
    expected: unknown
    hidden: boolean
  }>
  reference_approach: string
}

interface ScrapedEntry {
  title: string
  difficulty: string
  source_question_id: string
  source_category: string
  problem_statement_markdown: string
  metadata: Record<string, unknown>
}

function normTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ')
}

function validate(r: EnrichmentResult, source: ScrapedEntry): string[] {
  const e: string[] = []
  if (!r.rewritten_statement || r.rewritten_statement.length < 120)
    e.push('rewritten_statement too short')
  if (r.rewritten_statement && normTitle(r.rewritten_statement) === normTitle(source.problem_statement_markdown))
    e.push('rewritten_statement is verbatim copy of source')
  if (/—/.test(r.rewritten_statement)) e.push('rewritten_statement contains an em dash (banned)')
  if (!r.starter_code?.python || !r.starter_code?.javascript) e.push('missing starter_code')
  if (!r.reference_solution?.python || !r.reference_solution?.javascript)
    e.push('missing reference_solution')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 5)
    e.push(`need >=5 test_cases, got ${r.test_cases?.length ?? 0}`)
  else
    for (const tc of r.test_cases)
      if (!tc.id || tc.label === undefined || tc.args === undefined || tc.expected === undefined)
        e.push(`test_case ${tc.id ?? '?'} missing fields`)
  if (!r.reference_approach) e.push('missing reference_approach')
  return e
}

function main() {
  const scraped = (JSON.parse(fs.readFileSync(SCRAPED, 'utf-8')) as ScrapedEntry[]).filter(
    (e) => (e.metadata as any).source === 'chillinterview'
  )
  const byKey = new Map(scraped.map((e) => [e.source_question_id, e]))

  if (!fs.existsSync(AGENT_OUT)) {
    console.error(`Missing ${path.relative(process.cwd(), AGENT_OUT)} — agents have not written output yet.`)
    process.exit(1)
  }
  const files = fs.readdirSync(AGENT_OUT).filter((f) => f.endsWith('.json'))
  console.log(`${files.length} agent output files`)

  const existing = fs.existsSync(STAGED)
    ? (JSON.parse(fs.readFileSync(STAGED, 'utf-8')) as Array<Record<string, unknown>>)
    : []
  const existingKeys = new Set(
    existing.map((e) => (e.source_question_id as string) ?? '').filter(Boolean)
  )

  const staged: Array<Record<string, unknown>> = []
  let invalid = 0
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(AGENT_OUT, f), 'utf-8')) as EnrichmentResult
    const source = byKey.get(r.key)
    if (!source) {
      console.warn(`  ${f}: no scraped entry for key ${r.key} — skip`)
      continue
    }
    if (existingKeys.has(r.key)) continue
    const errs = validate(r, source)
    if (errs.length) {
      console.warn(`  ${f} INVALID: ${errs.join('; ')}`)
      invalid++
      continue
    }
    staged.push({
      title: r.title || source.title,
      challenge_type: 'algorithm',
      is_sql: false,
      difficulty: source.difficulty,
      time_limit_seconds: 30 * 60,
      pattern: source.source_category,
      problem_statement_markdown: r.rewritten_statement,
      metadata: {
        ...source.metadata, // carries source/source_url/company_tags/topic_tags/technique_tags/flags
        starter_code: r.starter_code,
        reference_solution: r.reference_solution,
        test_cases: r.test_cases,
        reference_approach: r.reference_approach,
        // drop the raw source statement now that we have a clean rewrite
        source_problem_statement: undefined,
      },
      source_question_id: r.key,
      approved: false,
      generated_at: new Date().toISOString(),
    })
    existingKeys.add(r.key)
  }

  console.log(`  ${staged.length} valid staged, ${invalid} invalid`)
  if (DRY_RUN) {
    if (staged[0]) console.log('\nfirst:', JSON.stringify(staged[0], null, 2).slice(0, 900))
    return
  }
  fs.writeFileSync(STAGED, JSON.stringify([...existing, ...staged], null, 2))
  console.log(`Wrote ${existing.length + staged.length} total (${staged.length} new) → ${path.relative(process.cwd(), STAGED)}`)
}

main()
