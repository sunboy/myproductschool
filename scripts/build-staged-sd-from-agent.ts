#!/usr/bin/env npx tsx
/**
 * Merge Opus sub-agent output for system-design guides into staged
 * system_design challenges, appended to seeds/staged-interview-challenges.json.
 *
 * Agents write one JSON per guide into seeds/chillinterview/sd-agent-out/,
 * matching the SdResult shape below. This script does the deterministic
 * assembly + validation; the creative authoring stays in the agent.
 *
 * Usage:
 *   npx tsx scripts/build-staged-sd-from-agent.ts --dry-run
 *   npx tsx scripts/build-staged-sd-from-agent.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS = path.join(process.cwd(), 'seeds')
const BRIEFS = path.join(SEEDS, 'chillinterview', 'sd-briefs.json')
const AGENT_OUT = path.join(SEEDS, 'chillinterview', 'sd-agent-out')
const STAGED = path.join(SEEDS, 'staged-interview-challenges.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

interface SdResult {
  key: string
  title: string
  problem_statement_markdown: string
  requirements: string[]
  required_components: string[]
  scalability_signals: string[]
  reference_diagram_description: string
}

interface SdBrief {
  key: string
  title: string
  difficulty: string
  topics: string[]
  company_tags: string[]
  source_url: string
  source_preview: string
}

function validate(r: SdResult, brief: SdBrief): string[] {
  const e: string[] = []
  if (!r.problem_statement_markdown || r.problem_statement_markdown.length < 150)
    e.push('problem_statement too short')
  if (
    r.problem_statement_markdown &&
    r.problem_statement_markdown.trim() === (brief.source_preview ?? '').trim()
  )
    e.push('problem_statement is verbatim copy of source preview')
  if (/—/.test(r.problem_statement_markdown)) e.push('problem_statement has an em dash (banned)')
  if (!Array.isArray(r.requirements) || r.requirements.length < 3)
    e.push('need >=3 requirements')
  if (!Array.isArray(r.required_components) || r.required_components.length < 4)
    e.push('need >=4 required_components')
  if (!Array.isArray(r.scalability_signals) || r.scalability_signals.length < 2)
    e.push('need >=2 scalability_signals')
  if (!r.reference_diagram_description) e.push('missing reference_diagram_description')
  return e
}

function main() {
  const briefs = JSON.parse(fs.readFileSync(BRIEFS, 'utf-8')) as SdBrief[]
  const byKey = new Map(briefs.map((b) => [b.key, b]))

  if (!fs.existsSync(AGENT_OUT)) {
    console.error(`Missing ${path.relative(process.cwd(), AGENT_OUT)} — agents have not written output.`)
    process.exit(1)
  }
  const files = fs.readdirSync(AGENT_OUT).filter((f) => f.endsWith('.json'))
  console.log(`${files.length} SD agent output files`)

  const existing = fs.existsSync(STAGED)
    ? (JSON.parse(fs.readFileSync(STAGED, 'utf-8')) as Array<Record<string, unknown>>)
    : []
  const existingKeys = new Set(
    existing.map((e) => (e.source_question_id as string) ?? '').filter(Boolean)
  )

  const staged: Array<Record<string, unknown>> = []
  let invalid = 0
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(AGENT_OUT, f), 'utf-8')) as SdResult
    const brief = byKey.get(r.key)
    if (!brief) {
      console.warn(`  ${f}: no brief for key ${r.key} — skip`)
      continue
    }
    if (existingKeys.has(r.key)) continue
    const errs = validate(r, brief)
    if (errs.length) {
      console.warn(`  ${f} INVALID: ${errs.join('; ')}`)
      invalid++
      continue
    }
    staged.push({
      title: r.title || brief.title,
      challenge_type: 'system_design',
      difficulty: brief.difficulty,
      estimated_minutes: 45,
      problem_statement_markdown: r.problem_statement_markdown,
      metadata: {
        requirements: r.requirements,
        required_components: r.required_components,
        scalability_signals: r.scalability_signals,
        reference_diagram_description: r.reference_diagram_description,
        source: 'chillinterview',
        source_url: brief.source_url,
        source_fidelity: 'preview',
        is_expanded: true,
        company_tags: brief.company_tags,
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
  if (DRY_RUN) {
    if (staged[0]) console.log('\nfirst:', JSON.stringify(staged[0], null, 2).slice(0, 1000))
    return
  }
  fs.writeFileSync(STAGED, JSON.stringify([...existing, ...staged], null, 2))
  console.log(`Wrote ${existing.length + staged.length} total (${staged.length} new) → ${path.relative(process.cwd(), STAGED)}`)
}

main()
