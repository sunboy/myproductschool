#!/usr/bin/env npx tsx
/**
 * Deterministic backfill of scenario_trigger / scenario_question per
 * docs/CHALLENGE_DESCRIPTION_SPEC.md. No AI calls.
 *
 * Fixes two data bugs introduced by older commit-interview-seeds.ts runs:
 *
 *  1. system_design / data_modeling rows where scenario_question and/or
 *     scenario_trigger duplicate scenario_context (or are generic boilerplate like
 *     "Design X at production scale." / "You have 30 minutes." / "Design your
 *     solution on the canvas..."). Both fields → NULL; buildChallengeBrief
 *     supplies the "What to draw"/"What to model" defaults.
 *
 *  2. sql rows carrying canvas boilerplate:
 *     trigger "You have 30 minutes."             → "Write the query in the editor. Run the visible tests as you go."
 *     question "Design your solution on the canvas. Use Hatch for coaching." → NULL
 *
 * Originals are backed up to metadata._legacy_scenario (first write only) so the
 * change is reversible until verified.
 *
 * Flags:
 *   --write       Actually write. Default is dry-run.
 *   --type <t>    Restrict to one challenge_type.
 *   --limit <n>   Process at most n rows.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-scenario-fields.ts            # dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-scenario-fields.ts --write
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const TYPE = (() => { const i = args.indexOf('--type'); return i >= 0 ? args[i + 1] : null })()
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? Number(args[i + 1]) : Infinity })()

const GENERIC_PATTERNS = [
  /design your solution on the canvas/i,
  /use hatch for coaching/i,
  /^you have \d+\s*minutes\.?$/i,
  /^design .{0,120} at production scale\.?$/i,
]

const SQL_TRIGGER = 'Write the query in the editor. Run the visible tests as you go.'

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function duplicatesContext(value: string | null, context: string | null): boolean {
  const v = normalize(value)
  const c = normalize(context)
  if (!v || !c) return false
  return v === c || c.startsWith(v.slice(0, 120)) || v.startsWith(c.slice(0, 120))
}

function isGeneric(value: string | null): boolean {
  const v = (value ?? '').trim()
  if (!v) return false
  return GENERIC_PATTERNS.some((re) => re.test(v))
}

interface Row {
  id: string
  title: string
  challenge_type: string
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  metadata: Record<string, unknown> | null
}

async function loadRows(): Promise<Row[]> {
  const rows: Row[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const query = supabase
      .from('challenges')
      .select('id, title, challenge_type, scenario_context, scenario_trigger, scenario_question, metadata')
      .eq('is_published', true)
      .in('challenge_type', TYPE ? [TYPE] : ['system_design', 'data_modeling', 'sql'])
      .order('id')
      .range(from, from + PAGE - 1)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function main() {
  const rows = await loadRows()
  console.log(`Scanning ${rows.length} rows...${WRITE ? '' : ' (DRY RUN)'}`)

  const counts: Record<string, number> = {}
  let processed = 0

  for (const row of rows) {
    if (processed >= LIMIT) break

    let newTrigger: string | null | undefined // undefined = no change
    let newQuestion: string | null | undefined

    if (row.challenge_type === 'sql') {
      if (isGeneric(row.scenario_trigger) || duplicatesContext(row.scenario_trigger, row.scenario_context)) {
        newTrigger = SQL_TRIGGER
      }
      if (isGeneric(row.scenario_question) || duplicatesContext(row.scenario_question, row.scenario_context)) {
        newQuestion = null
      }
    } else {
      // system_design / data_modeling
      if (isGeneric(row.scenario_trigger) || duplicatesContext(row.scenario_trigger, row.scenario_context)) {
        newTrigger = null
      }
      if (isGeneric(row.scenario_question) || duplicatesContext(row.scenario_question, row.scenario_context)) {
        newQuestion = null
      }
    }

    if (newTrigger === undefined && newQuestion === undefined) continue
    processed += 1
    counts[row.challenge_type] = (counts[row.challenge_type] ?? 0) + 1

    if (!WRITE) {
      console.log(`  [dry] ${row.challenge_type} "${row.title}"`)
      if (newTrigger !== undefined) console.log(`        trigger:  ${JSON.stringify(row.scenario_trigger)} → ${JSON.stringify(newTrigger)}`)
      if (newQuestion !== undefined) console.log(`        question: ${JSON.stringify(row.scenario_question)} → ${JSON.stringify(newQuestion)}`)
      continue
    }

    const metadata = { ...(row.metadata ?? {}) }
    if (!metadata._legacy_scenario) {
      metadata._legacy_scenario = {
        scenario_trigger: row.scenario_trigger,
        scenario_question: row.scenario_question,
        backfilled_at: new Date().toISOString(),
      }
    }

    const update: Record<string, unknown> = { metadata }
    if (newTrigger !== undefined) update.scenario_trigger = newTrigger
    if (newQuestion !== undefined) update.scenario_question = newQuestion

    const { error } = await supabase.from('challenges').update(update).eq('id', row.id)
    if (error) {
      console.error(`  ✗ ${row.title}: ${error.message}`)
    } else {
      console.log(`  ✓ ${row.challenge_type} "${row.title}"`)
    }
  }

  console.log('\nPer-type changes:')
  for (const [type, n] of Object.entries(counts)) console.log(`  ${type}: ${n}`)
  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.')
}

main().catch((err) => { console.error(err); process.exit(1) })
