#!/usr/bin/env npx tsx
/**
 * Export challenges that fail docs/CHALLENGE_DESCRIPTION_SPEC.md into batch files for
 * sub-agent rewriting (Phase 4 of the description upgrade).
 *
 * Writes scripts/content/rewrites/{type}/batch-NNN.json, each an array of items with the
 * raw material a rewrite agent needs:
 *   - current body (scenario_context / prompt_text), title, difficulty
 *   - lint issues (what's failing)
 *   - algorithm: visible test cases (verbatim Input/Output for Examples), starter code signature
 *   - sql: expected_rows column names + match_mode (for the ## Output section)
 *
 * Flags:
 *   --type <t>       Only export one challenge_type.
 *   --batch-size <n> Items per batch (default 22).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/export-descriptions-for-rewrite.ts
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { validateDescription } from '../src/lib/content/description-spec'

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
const TYPE = (() => { const i = args.indexOf('--type'); return i >= 0 ? args[i + 1] : null })()
const BATCH_SIZE = (() => { const i = args.indexOf('--batch-size'); return i >= 0 ? Number(args[i + 1]) : 22 })()
// --ids a,b,c : export exactly these challenge ids (regardless of lint status) into
// redo-NNN.json batches, without wiping existing batch files. Used to redo rewrites
// whose source body turned out to be the truncated copy.
const IDS = (() => { const i = args.indexOf('--ids'); return i >= 0 ? args[i + 1].split(',').map((s) => s.trim()).filter(Boolean) : null })()

const OUT_ROOT = join('scripts', 'content', 'rewrites')

interface Row {
  id: string
  title: string
  challenge_type: string
  difficulty: string | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  prompt_text: string | null
  metadata: Record<string, unknown> | null
}

async function loadRows(): Promise<Row[]> {
  const rows: Row[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from('challenges')
      .select('id, title, challenge_type, difficulty, scenario_context, scenario_trigger, scenario_question, prompt_text, metadata')
      .eq('is_published', true)
      .order('id')
      .range(from, from + PAGE - 1)
    if (TYPE) query = query.eq('challenge_type', TYPE)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

interface TestCaseLike {
  hidden?: boolean
  is_hidden?: boolean
  // Test case payloads appear in several shapes across import generations:
  // {args, expected} (commit-interview-seeds), {input, expected_output|output},
  // {input_raw, output_raw} (chillinterview scrape).
  args?: unknown
  expected?: unknown
  input?: unknown
  input_raw?: unknown
  expected_output?: unknown
  output?: unknown
  output_raw?: unknown
  label?: string
  description?: string
  match_mode?: string
  expected_rows?: Record<string, unknown>[]
}

function exportItem(row: Row, issues: string[]): Record<string, unknown> {
  const md = row.metadata ?? {}
  const testCases = (Array.isArray(md.test_cases) ? md.test_cases : []) as TestCaseLike[]
  const visible = testCases.filter((tc) => !(tc.hidden ?? tc.is_hidden))

  const base: Record<string, unknown> = {
    id: row.id,
    challenge_type: row.challenge_type,
    title: row.title,
    difficulty: row.difficulty,
    // Use the FULLER of the two body columns: older imports kept the complete
    // statement in prompt_text and a truncated copy in scenario_context.
    current_body: [(row.scenario_context ?? '').trim(), (row.prompt_text ?? '').trim()]
      .sort((a, b) => b.length - a.length)[0],
    body_column: ((row.prompt_text ?? '').trim().length > (row.scenario_context ?? '').trim().length)
      ? 'prompt_text'
      : 'scenario_context',
    scenario_trigger: row.scenario_trigger,
    scenario_question: row.scenario_question,
    lint_issues: issues,
  }

  if (row.challenge_type === 'algorithm') {
    base.visible_test_cases = visible.map((tc) => ({
      input: tc.args ?? tc.input ?? tc.input_raw ?? null,
      expected_output: tc.expected ?? tc.expected_output ?? tc.output ?? tc.output_raw ?? null,
      label: tc.label ?? tc.description,
    }))
    const starter = md.starter_code as Record<string, string> | undefined
    if (starter) {
      // Just the signature lines, not full bodies, to keep batches small
      base.starter_signatures = Object.fromEntries(
        Object.entries(starter).map(([lang, code]) => [lang, String(code).split('\n').slice(0, 6).join('\n')]),
      )
    }
  }

  if (row.challenge_type === 'sql') {
    base.expected_output_shape = visible
      .filter((tc) => Array.isArray(tc.expected_rows))
      .map((tc) => ({
        label: tc.label ?? tc.description,
        match_mode: tc.match_mode,
        columns: Object.keys(tc.expected_rows?.[0] ?? {}),
        sample_row: tc.expected_rows?.[0] ?? null,
      }))
    const schema = (md.sql_schema as { schema_diagram?: { tables?: { name?: string }[] } } | undefined)?.schema_diagram
    if (schema?.tables) base.table_names = schema.tables.map((t) => t.name)
  }

  return base
}

async function main() {
  const rows = await loadRows()
  const selected = new Map<string, Array<Record<string, unknown>>>()

  for (const row of rows) {
    if (IDS) {
      if (!IDS.includes(row.id)) continue
      const item = exportItem(row, ['redo: rewrite from the fuller prompt_text source'])
      // Redo mode exists because prompt_text held the complete statement; force it
      // as the source regardless of relative lengths.
      if ((row.prompt_text ?? '').trim()) {
        item.current_body = (row.prompt_text ?? '').trim()
        item.body_column = 'prompt_text'
      }
      const list = selected.get(row.challenge_type) ?? []
      list.push(item)
      selected.set(row.challenge_type, list)
      continue
    }
    const { errors } = validateDescription(row.challenge_type, {
      context: row.scenario_context,
      trigger: row.scenario_trigger,
      question: row.scenario_question,
      prompt_text: row.prompt_text,
      metadata: row.metadata,
    })
    if (errors.length === 0) continue
    const list = selected.get(row.challenge_type) ?? []
    list.push(exportItem(row, errors.map((e) => `${e.field}: ${e.message}`)))
    selected.set(row.challenge_type, list)
  }

  const prefix = IDS ? 'redo' : 'batch'
  for (const [type, items] of selected.entries()) {
    const dir = join(OUT_ROOT, type)
    if (!IDS && existsSync(dir)) rmSync(dir, { recursive: true })
    mkdirSync(dir, { recursive: true })
    let batchNum = 0
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batchNum += 1
      const file = join(dir, `${prefix}-${String(batchNum).padStart(3, '0')}.json`)
      writeFileSync(file, JSON.stringify(items.slice(i, i + BATCH_SIZE), null, 2))
    }
    console.log(`${type}: ${items.length} items → ${batchNum} ${prefix} batches in ${dir}`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
