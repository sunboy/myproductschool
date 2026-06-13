#!/usr/bin/env npx tsx
/**
 * Export published challenges that lack a ready solution into batch job files
 * for Claude Code sub-agent generation (zero API-token cost, per CLAUDE.md).
 *
 * Writes scripts/content/solutions/{type}/batch-NNN.json, each an array of:
 *   { id, challenge_type, title, source_context }
 * where source_context is the exact user-content block the lazy generation
 * route would send (built by src/lib/solutions/source-context.ts), so
 * backfilled and lazily generated solutions see identical inputs.
 *
 * Also writes scripts/content/solutions/INSTRUCTIONS.md with the per-type
 * system prompts (the full content contract) for the sub-agents.
 *
 * Flags:
 *   --type <t>       Only export one challenge_type.
 *   --ids a,b,c      Export exactly these challenge ids (even if a solution exists).
 *   --batch-size <n> Items per batch (default 10; solutions are large outputs).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/solutions/export-solution-jobs.ts
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { buildSolutionSourceContext } from '../../src/lib/solutions/source-context'
import { buildAllSolutionPromptSections } from '../../src/lib/solutions/prompt'
import { CHALLENGE_TYPES_WITH_SOLUTIONS } from '../../src/lib/solutions/schema'

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
const BATCH_SIZE = (() => { const i = args.indexOf('--batch-size'); return i >= 0 ? Number(args[i + 1]) : 10 })()
const IDS = (() => { const i = args.indexOf('--ids'); return i >= 0 ? args[i + 1].split(',').map((s) => s.trim()).filter(Boolean) : null })()

const OUT_ROOT = join('scripts', 'content', 'solutions')

async function main() {
  // Challenges with a ready solution are skipped (unless --ids pins them).
  const readyIds = new Set<string>()
  if (!IDS) {
    const { data: readyRows, error } = await supabase
      .from('challenge_solutions')
      .select('challenge_id')
      .eq('generation_status', 'ready')
    if (error) throw new Error(error.message)
    for (const row of readyRows ?? []) readyIds.add(row.challenge_id as string)
  }

  const types = TYPE ? [TYPE] : [...CHALLENGE_TYPES_WITH_SOLUTIONS]
  let query = supabase
    .from('challenges')
    .select('id, title, challenge_type')
    .eq('is_published', true)
    .in('challenge_type', types)
    .order('challenge_type')
    .order('id')
  if (IDS) query = supabase.from('challenges').select('id, title, challenge_type').in('id', IDS)

  const { data: challenges, error } = await query
  if (error) throw new Error(error.message)

  const pending = (challenges ?? []).filter((c) => !readyIds.has(c.id as string))
  console.log(`${challenges?.length ?? 0} candidates, ${pending.length} without a ready solution`)

  if (!IDS && existsSync(OUT_ROOT)) rmSync(OUT_ROOT, { recursive: true })
  mkdirSync(OUT_ROOT, { recursive: true })

  // Group by type, batch, and build source contexts.
  const byType = new Map<string, typeof pending>()
  for (const challenge of pending) {
    const list = byType.get(challenge.challenge_type as string) ?? []
    list.push(challenge)
    byType.set(challenge.challenge_type as string, list)
  }

  let total = 0
  for (const [type, list] of byType) {
    const dir = join(OUT_ROOT, type)
    mkdirSync(dir, { recursive: true })
    for (let batchIdx = 0; batchIdx * BATCH_SIZE < list.length; batchIdx++) {
      const slice = list.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE)
      const items = []
      for (const challenge of slice) {
        const source = await buildSolutionSourceContext(supabase, challenge.id as string)
        if (!source) {
          console.warn(`  skip ${challenge.id}: no source context`)
          continue
        }
        items.push({
          id: challenge.id,
          challenge_type: type,
          title: challenge.title,
          source_context: source.userContent,
        })
        total++
      }
      if (items.length === 0) continue
      const name = `${IDS ? 'redo' : 'batch'}-${String(batchIdx + 1).padStart(3, '0')}.json`
      writeFileSync(join(dir, name), JSON.stringify(items, null, 2))
      console.log(`  ${type}/${name}: ${items.length} items`)
    }
  }

  // INSTRUCTIONS.md: the contract a sub-agent follows for one batch file.
  const prompts = buildAllSolutionPromptSections()
  const instructions = [
    '# Solution generation instructions (Claude Code sub-agents)',
    '',
    'You are generating official solution documents for HackProduct challenges.',
    'Input: one `batch-NNN.json` file in this directory tree. Each item has `id`,',
    '`challenge_type`, `title`, and `source_context` (the full challenge material).',
    '',
    'Output: write `batch-NNN.solutions.json` next to the input file, containing an',
    'array of `{ "id": "<challenge id>", "challenge_type": "<type>", "content": <solution JSON> }`.',
    '',
    'For each item, follow the system prompt for its challenge_type below, using the',
    'item\'s source_context as the challenge material. The `content` value must be the',
    'JSON object the prompt describes (it is validated against',
    '`src/lib/solutions/schema.ts` by `scripts/solutions/validate-solution-jobs.ts`;',
    'run it before handing the batch back).',
    '',
    ...Object.entries(prompts).flatMap(([type, prompt]) => [
      `\n---\n\n## challenge_type: ${type}\n`,
      '```',
      prompt,
      '```',
    ]),
  ].join('\n')
  writeFileSync(join(OUT_ROOT, 'INSTRUCTIONS.md'), instructions)

  console.log(`\nExported ${total} jobs under ${OUT_ROOT}/ (+ INSTRUCTIONS.md)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
