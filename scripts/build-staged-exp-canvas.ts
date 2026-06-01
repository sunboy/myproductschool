#!/usr/bin/env npx tsx
/**
 * Merge experience-derived canvas challenge output (system_design or
 * data_modeling) into staged entries appended to
 * seeds/staged-interview-challenges.json.
 *
 * Usage:
 *   npx tsx scripts/build-staged-exp-canvas.ts --type system_design --dry-run
 *   npx tsx scripts/build-staged-exp-canvas.ts --type system_design
 *   npx tsx scripts/build-staged-exp-canvas.ts --type data_modeling
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS = path.join(process.cwd(), 'seeds')
const STAGED = path.join(SEEDS, 'staged-interview-challenges.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const TYPE = (() => {
  const i = args.indexOf('--type')
  return i >= 0 ? args[i + 1] : 'system_design'
})()

if (TYPE !== 'system_design' && TYPE !== 'data_modeling') {
  console.error('--type must be system_design or data_modeling')
  process.exit(1)
}

// system_design uses required_components/scalability_signals/reference_diagram_description;
// data_modeling uses required_entities/modeling_signals/reference_schema_description.
const CFG =
  TYPE === 'system_design'
    ? {
        briefs: path.join(SEEDS, 'chillinterview', 'exp-author', 'system_design.json'),
        out: path.join(SEEDS, 'chillinterview', 'exp-sd-agent-out'),
        listFields: ['required_components', 'scalability_signals'] as const,
        descField: 'reference_diagram_description',
      }
    : {
        briefs: path.join(SEEDS, 'chillinterview', 'exp-author', 'data_modeling.json'),
        out: path.join(SEEDS, 'chillinterview', 'dm-agent-out'),
        listFields: ['required_entities', 'modeling_signals'] as const,
        descField: 'reference_schema_description',
      }

interface Brief {
  key: string
  title: string
  difficulty: string
  company_tag: string | null
  source_url: string
}

function validate(r: Record<string, unknown>, brief: Brief): string[] {
  const e: string[] = []
  const stmt = r.problem_statement_markdown as string
  if (!stmt || stmt.length < 150) e.push('problem_statement too short')
  if (/—/.test(stmt ?? '')) e.push('em dash in problem_statement')
  if (!Array.isArray(r.requirements) || (r.requirements as unknown[]).length < 3)
    e.push('need >=3 requirements')
  for (const f of CFG.listFields)
    if (!Array.isArray(r[f]) || (r[f] as unknown[]).length < 3) e.push(`need >=3 ${f}`)
  if (!r[CFG.descField]) e.push(`missing ${CFG.descField}`)
  return e
}

function main() {
  const briefs = JSON.parse(fs.readFileSync(CFG.briefs, 'utf-8')) as Brief[]
  const byKey = new Map(briefs.map((b) => [b.key, b]))
  const files = fs.existsSync(CFG.out) ? fs.readdirSync(CFG.out).filter((f) => f.endsWith('.json')) : []
  console.log(`${TYPE}: ${files.length} agent output files`)

  const existing = fs.existsSync(STAGED)
    ? (JSON.parse(fs.readFileSync(STAGED, 'utf-8')) as Array<Record<string, unknown>>)
    : []
  const existingKeys = new Set(existing.map((e) => (e.source_question_id as string) ?? '').filter(Boolean))

  const staged: Array<Record<string, unknown>> = []
  let invalid = 0
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(CFG.out, f), 'utf-8')) as Record<string, unknown>
    const brief = byKey.get(r.key as string)
    if (!brief) {
      console.warn(`  ${f}: no brief for key ${r.key}`)
      continue
    }
    if (existingKeys.has(r.key as string)) continue
    const errs = validate(r, brief)
    if (errs.length) {
      console.warn(`  ${f} INVALID: ${errs.join('; ')}`)
      invalid++
      continue
    }
    const metadata: Record<string, unknown> = {
      requirements: r.requirements,
      [CFG.descField]: r[CFG.descField],
      source: 'chillinterview',
      source_url: brief.source_url,
      source_fidelity: 'expanded',
      is_expanded: true,
      company_tags: brief.company_tag ? [brief.company_tag] : [],
      topic_tags: [],
      technique_tags: [],
    }
    for (const lf of CFG.listFields) metadata[lf] = r[lf]

    staged.push({
      title: r.title || brief.title,
      challenge_type: TYPE,
      difficulty: brief.difficulty,
      estimated_minutes: 45,
      problem_statement_markdown: r.problem_statement_markdown,
      metadata,
      source_question_id: r.key,
      approved: false,
      generated_at: new Date().toISOString(),
    })
    existingKeys.add(r.key as string)
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
