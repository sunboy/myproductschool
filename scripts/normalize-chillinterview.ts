#!/usr/bin/env npx tsx
/**
 * Normalize scraped chillinterview coding rows into the ScrapedEntry shape that
 * scripts/enrich-scraped-coding.ts (and, downstream, the sub-agent enrichment
 * brief) consumes via seeds/scraped-raw.json.
 *
 * Only FULL (free) coding rows become challenge candidates — gated rows have no
 * solvable statement and are skipped here (they still feed company aggregation
 * via scripts/aggregate-companies.ts).
 *
 * The source statement is preserved as raw material under
 * metadata.source_problem_statement; the enrichment step rewrites it so nothing
 * is published verbatim (transform-not-copy).
 *
 * Usage:
 *   npx tsx scripts/normalize-chillinterview.ts --dry-run
 *   npx tsx scripts/normalize-chillinterview.ts            # merge into scraped-raw.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { resolveCompanies, resolveCodingTags } from './lib/chillinterview-map'

const SEEDS = path.join(process.cwd(), 'seeds')
const CODING_IN = path.join(SEEDS, 'chillinterview', 'coding.json')
const SCRAPED_OUT = path.join(SEEDS, 'scraped-raw.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

interface ScrapedRow {
  type: string
  id: string
  source_url: string
  gated: boolean
  data: {
    title?: string
    slug?: string
    description?: string
    difficulty?: string
    tags?: string[]
    starterCode?: string | null
    companies?: Array<{ name: string; slug: string }>
    isFree?: boolean
    parsed_test_cases?: Array<{ input_raw: string; output_raw: string }>
  }
}

interface ScrapedEntry {
  title: string
  challenge_type: string
  is_sql: boolean
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_solution_prose: string
  source_approaches: string
  source_complexity: string
  time_min?: number
  difficulty: string
  problem_statement_markdown: string
  metadata: Record<string, unknown>
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'warmup',
  medium: 'standard',
  hard: 'advanced',
}

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toScrapedEntry(row: ScrapedRow): ScrapedEntry {
  const d = row.data
  const tags = d.tags ?? []
  const { topic_tags, technique_tags } = resolveCodingTags(tags)
  const companies = resolveCompanies((d.companies ?? []).map((c) => c.name))
  const knownCompanies = companies.filter((c) => c.known).map((c) => c.slug)
  const unknownCompanies = companies.filter((c) => !c.known).map((c) => c.slug)

  return {
    title: d.title ?? row.id,
    challenge_type: 'algorithm',
    is_sql: false,
    source_question_id: `chillinterview:${row.id}`,
    source_category: tags[0] ?? '',
    source_companies: companies.map((c) => c.slug),
    source_solution_prose: '',
    source_approaches: '',
    source_complexity: '',
    difficulty: DIFFICULTY_MAP[(d.difficulty ?? 'medium').toLowerCase()] ?? 'standard',
    problem_statement_markdown: d.description ?? '',
    metadata: {
      source: 'chillinterview',
      source_url: row.source_url,
      source_slug: row.id,
      source_tags: tags,
      // Provenance flags consumed by the commit step.
      source_fidelity: 'full',
      is_expanded: false,
      // Raw material — rewritten during enrichment, never published verbatim.
      source_problem_statement: d.description ?? '',
      source_parsed_test_cases: d.parsed_test_cases ?? [],
      source_starter_code: d.starterCode ?? null,
      // Canonical tags (suggested) for the commit + backfill steps.
      company_tags: knownCompanies,
      company_tags_unknown: unknownCompanies,
      topic_tags,
      technique_tags,
    },
  }
}

function main() {
  if (!fs.existsSync(CODING_IN)) {
    console.error(`Missing ${path.relative(process.cwd(), CODING_IN)}. Run scrape-chillinterview.ts --type coding first.`)
    process.exit(1)
  }
  const rows = JSON.parse(fs.readFileSync(CODING_IN, 'utf-8')) as ScrapedRow[]
  const full = rows.filter((r) => !r.gated && r.data.description)
  console.log(`coding.json: ${rows.length} rows, ${full.length} full → normalizing`)

  const existing: ScrapedEntry[] = fs.existsSync(SCRAPED_OUT)
    ? JSON.parse(fs.readFileSync(SCRAPED_OUT, 'utf-8'))
    : []
  const existingTitles = new Set(existing.map((e) => normalizeTitle(e.title)))
  const existingSourceIds = new Set(existing.map((e) => e.source_question_id))

  const entries: ScrapedEntry[] = []
  let dupes = 0
  for (const r of full) {
    const e = toScrapedEntry(r)
    if (existingSourceIds.has(e.source_question_id) || existingTitles.has(normalizeTitle(e.title))) {
      dupes++
      continue
    }
    existingTitles.add(normalizeTitle(e.title))
    existingSourceIds.add(e.source_question_id)
    entries.push(e)
  }

  console.log(`  ${entries.length} new entries, ${dupes} dupes skipped`)
  const unmappedCompanies = new Set<string>()
  for (const e of entries)
    for (const u of (e.metadata.company_tags_unknown as string[]) ?? []) unmappedCompanies.add(u)
  if (unmappedCompanies.size)
    console.log(`  unmapped companies (need company_profiles backfill): ${[...unmappedCompanies].join(', ')}`)

  if (DRY_RUN) {
    console.log('\nDRY RUN — first entry:')
    console.log(JSON.stringify(entries[0], null, 2).slice(0, 1200))
    return
  }

  const merged = [...existing, ...entries]
  fs.writeFileSync(SCRAPED_OUT, JSON.stringify(merged, null, 2))
  console.log(`\nWrote ${merged.length} total (${entries.length} new) → ${path.relative(process.cwd(), SCRAPED_OUT)}`)
}

main()
