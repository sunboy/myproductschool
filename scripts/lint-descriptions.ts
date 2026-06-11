#!/usr/bin/env npx tsx
/**
 * Lint published challenge descriptions against docs/CHALLENGE_DESCRIPTION_SPEC.md.
 *
 * READ-ONLY against the DB. Also lints rewritten batch files (Phase 4) via --file.
 *
 * Flags:
 *   --type <t>     Filter by challenge_type (algorithm | sql | system_design | data_modeling | flow | quick_take)
 *   --ids          Print failing challenge ids (one per line) instead of the summary table
 *   --verbose      Print every issue per challenge
 *   --warnings     Count warnings as failures too (default: errors only)
 *   --file <path>  Lint a rewritten batch JSON file (array of {id, challenge_type, scenario_context, scenario_trigger, scenario_question, metadata}) instead of the DB
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/lint-descriptions.ts
 *   npx tsx --env-file=.env.local scripts/lint-descriptions.ts --type algorithm --verbose
 *   npx tsx scripts/lint-descriptions.ts --file scripts/content/rewrites/algorithm/batch-001.rewritten.json
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { validateDescription } from '../src/lib/content/description-spec'

const args = process.argv.slice(2)
function flagValue(name: string): string | null {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const TYPE = flagValue('--type')
const FILE = flagValue('--file')
const PRINT_IDS = args.includes('--ids')
const VERBOSE = args.includes('--verbose')
const STRICT = args.includes('--warnings')

interface Row {
  id: string
  title: string
  challenge_type: string
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  prompt_text: string | null
  metadata: Record<string, unknown> | null
}

async function loadRows(): Promise<Row[]> {
  if (FILE) {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as Row[]
    return TYPE ? parsed.filter((r) => r.challenge_type === TYPE) : parsed
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const rows: Row[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from('challenges')
      .select('id, title, challenge_type, scenario_context, scenario_trigger, scenario_question, prompt_text, metadata')
      .eq('is_published', true)
      .order('id')
      .range(from, from + PAGE - 1)
    if (TYPE) query = query.eq('challenge_type', TYPE)
    const { data, error } = await query
    if (error) {
      console.error('Query failed:', error.message)
      process.exit(1)
    }
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function main() {
  const rows = await loadRows()

  type Stat = { total: number; failing: number; errors: number; warnings: number }
  const stats = new Map<string, Stat>()
  const failingIds: string[] = []

  for (const row of rows) {
    const { errors, warnings } = validateDescription(row.challenge_type, {
      context: row.scenario_context,
      trigger: row.scenario_trigger,
      question: row.scenario_question,
      prompt_text: row.prompt_text,
      metadata: row.metadata,
    })

    const stat = stats.get(row.challenge_type) ?? { total: 0, failing: 0, errors: 0, warnings: 0 }
    stat.total += 1
    stat.errors += errors.length
    stat.warnings += warnings.length
    const fails = errors.length > 0 || (STRICT && warnings.length > 0)
    if (fails) {
      stat.failing += 1
      failingIds.push(row.id)
      if (VERBOSE) {
        console.log(`\n✗ [${row.challenge_type}] ${row.title} (${row.id})`)
        for (const e of errors) console.log(`    ERROR ${e.field}: ${e.message}`)
        for (const w of warnings) console.log(`    warn  ${w.field}: ${w.message}`)
      }
    }
    stats.set(row.challenge_type, stat)
  }

  if (PRINT_IDS) {
    for (const id of failingIds) console.log(id)
    process.exit(failingIds.length > 0 ? 1 : 0)
  }

  console.log(`\nLinted ${rows.length} challenges${FILE ? ` from ${FILE}` : ' (published)'}\n`)
  console.log('type'.padEnd(22), 'total'.padStart(6), 'failing'.padStart(8), 'errors'.padStart(7), 'warnings'.padStart(9))
  for (const [type, s] of [...stats.entries()].sort((a, b) => b[1].failing - a[1].failing)) {
    console.log(type.padEnd(22), String(s.total).padStart(6), String(s.failing).padStart(8), String(s.errors).padStart(7), String(s.warnings).padStart(9))
  }
  const totalFailing = failingIds.length
  console.log(`\n${totalFailing} failing / ${rows.length} total`)
  process.exit(totalFailing > 0 ? 1 : 0)
}

main()
