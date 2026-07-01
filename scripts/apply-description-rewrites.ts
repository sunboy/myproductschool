#!/usr/bin/env npx tsx
/**
 * Apply sub-agent description rewrites (scripts/content/rewrites/{type}/batch-NNN.rewritten.json)
 * to the challenges table. Phase 4 of the description upgrade.
 *
 * Safety:
 *   - Dry-run by default; --write to apply.
 *   - Every rewritten item is re-validated with validateDescription before write;
 *     failures are skipped and reported.
 *   - The original body is backed up once to metadata._legacy_scenario.body.
 *   - Applied ids are checkpointed to scripts/content/rewrites/checkpoint.json; re-runs skip them.
 *
 * Rewritten item shape (agents must emit exactly this):
 *   { "id": "...", "challenge_type": "...", "new_body": "...markdown...",
 *     "new_trigger": "..." | null | undefined, "new_question": "..." | null | undefined }
 *   Omitted trigger/question = leave unchanged. The body always writes to scenario_context
 *   (and prompt_text is left untouched).
 *
 * Flags:
 *   --write          Apply changes (default dry-run).
 *   --file <path>    Apply a single rewritten batch file.
 *   --type <t>       Apply all rewritten batches for one type.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/apply-description-rewrites.ts --type algorithm
 *   npx tsx --env-file=.env.local scripts/apply-description-rewrites.ts --file scripts/content/rewrites/algorithm/batch-001.rewritten.json --write
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
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
const WRITE = args.includes('--write')
const FILE = (() => { const i = args.indexOf('--file'); return i >= 0 ? args[i + 1] : null })()
const TYPE = (() => { const i = args.indexOf('--type'); return i >= 0 ? args[i + 1] : null })()

const ROOT = join('scripts', 'content', 'rewrites')
const CHECKPOINT = join(ROOT, 'checkpoint.json')

interface RewrittenItem {
  id: string
  challenge_type: string
  new_body: string
  new_trigger?: string | null
  new_question?: string | null
}

function loadCheckpoint(): Set<string> {
  if (!existsSync(CHECKPOINT)) return new Set()
  return new Set(JSON.parse(readFileSync(CHECKPOINT, 'utf8')) as string[])
}

function saveCheckpoint(ids: Set<string>) {
  writeFileSync(CHECKPOINT, JSON.stringify([...ids], null, 2))
}

function collectFiles(): string[] {
  if (FILE) return [FILE]
  const types = TYPE ? [TYPE] : readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  const files: string[] = []
  for (const type of types) {
    const dir = join(ROOT, type)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.rewritten.json')) files.push(join(dir, f))
    }
  }
  return files.sort()
}

async function main() {
  const files = collectFiles()
  if (files.length === 0) {
    console.log('No .rewritten.json files found.')
    return
  }

  const applied = loadCheckpoint()
  let ok = 0, skippedDone = 0, failedValidation = 0, failedWrite = 0

  for (const file of files) {
    const items = JSON.parse(readFileSync(file, 'utf8')) as RewrittenItem[]
    console.log(`\n${file}: ${items.length} items`)

    for (const item of items) {
      if (applied.has(item.id)) { skippedDone += 1; continue }
      if (!item.id || !item.new_body || !item.challenge_type) {
        console.error(`  ✗ malformed item ${JSON.stringify(item).slice(0, 80)}`)
        failedValidation += 1
        continue
      }

      // Fetch current row (for metadata backup + trigger/question fallthrough)
      const { data: rows, error: fetchErr } = await supabase
        .from('challenges')
        .select('id, title, challenge_type, scenario_context, scenario_trigger, scenario_question, prompt_text, metadata')
        .eq('id', item.id)
        .limit(1)
      if (fetchErr || !rows?.length) {
        console.error(`  ✗ ${item.id}: not found (${fetchErr?.message ?? 'no row'})`)
        failedWrite += 1
        continue
      }
      const row = rows[0]
      if (row.challenge_type !== item.challenge_type) {
        console.error(`  ✗ ${item.id}: type mismatch (${row.challenge_type} vs ${item.challenge_type})`)
        failedValidation += 1
        continue
      }

      const nextTrigger = item.new_trigger !== undefined ? item.new_trigger : row.scenario_trigger
      const nextQuestion = item.new_question !== undefined ? item.new_question : row.scenario_question

      const { errors } = validateDescription(item.challenge_type, {
        context: item.new_body,
        trigger: nextTrigger,
        question: nextQuestion,
        metadata: row.metadata,
      })
      if (errors.length > 0) {
        console.error(`  ✗ ${row.title}: still fails spec:`)
        for (const e of errors) console.error(`      ${e.field}: ${e.message}`)
        failedValidation += 1
        continue
      }

      if (!WRITE) {
        console.log(`  [dry] ✓ ${row.title} (${item.new_body.length} chars)`)
        ok += 1
        continue
      }

      const metadata = { ...(row.metadata ?? {}) }
      const legacy = (metadata._legacy_scenario ?? {}) as Record<string, unknown>
      if (legacy.body === undefined) {
        metadata._legacy_scenario = {
          ...legacy,
          body: row.scenario_context ?? row.prompt_text,
          prompt_text: row.prompt_text,
          body_rewritten_at: new Date().toISOString(),
        }
      }

      // The rewritten body is the single source of truth in scenario_context.
      // Stale prompt_text would shadow it in card summaries (challengeTaskSummary)
      // and longerProblemText: clear it for body-in-context types; for flow/quick_take
      // (where some consumers read prompt_text) sync it to the new body instead.
      const clearPromptText = ['algorithm', 'sql', 'system_design', 'data_modeling'].includes(item.challenge_type)
      const syncPromptText = ['flow', 'quick_take'].includes(item.challenge_type) && row.prompt_text != null

      const { error } = await supabase
        .from('challenges')
        .update({
          scenario_context: item.new_body,
          scenario_trigger: nextTrigger,
          scenario_question: nextQuestion,
          ...(clearPromptText ? { prompt_text: null } : {}),
          ...(syncPromptText ? { prompt_text: item.new_body } : {}),
          metadata,
        })
        .eq('id', item.id)
      if (error) {
        console.error(`  ✗ ${row.title}: ${error.message}`)
        failedWrite += 1
      } else {
        console.log(`  ✓ ${row.title}`)
        applied.add(item.id)
        ok += 1
      }
    }
    if (WRITE) saveCheckpoint(applied)
  }

  console.log(`\n${WRITE ? 'Applied' : 'Would apply'}: ${ok}, already done: ${skippedDone}, failed validation: ${failedValidation}, failed write: ${failedWrite}`)
  if (!WRITE) console.log('Dry run. Re-run with --write to apply.')
  process.exit(failedValidation + failedWrite > 0 ? 1 : 0)
}

main().catch((err) => { console.error(err); process.exit(1) })
