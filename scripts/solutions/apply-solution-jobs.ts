#!/usr/bin/env npx tsx
/**
 * Apply validated sub-agent solution outputs to the challenge_solutions table.
 *
 * Dry-run by default; pass --write to upsert. Each item is re-validated with
 * the Zod schema before writing (defense in depth on top of
 * validate-solution-jobs.ts). Applied ids are checkpointed to
 * scripts/content/solutions/checkpoint.json so a re-run skips them.
 *
 * Flags:
 *   --write          Actually upsert (default is dry-run).
 *   --force          Re-apply ids already in the checkpoint.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/solutions/apply-solution-jobs.ts
 *   npx tsx --env-file=.env.local scripts/solutions/apply-solution-jobs.ts --write
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { SolutionContentSchema } from '../../src/lib/solutions/schema'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

const OUT_ROOT = join('scripts', 'content', 'solutions')
const CHECKPOINT = join(OUT_ROOT, 'checkpoint.json')

function findOutputFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findOutputFiles(full))
    else if (entry.endsWith('.solutions.json')) results.push(full)
  }
  return results
}

async function main() {
  const applied = new Set<string>(
    existsSync(CHECKPOINT) ? (JSON.parse(readFileSync(CHECKPOINT, 'utf-8')) as string[]) : []
  )

  const files = findOutputFiles(OUT_ROOT)
  if (files.length === 0) {
    console.error(`No .solutions.json files found under ${OUT_ROOT}/`)
    process.exit(1)
  }

  let upserts = 0
  let skipped = 0
  let invalid = 0

  for (const file of files) {
    const items = JSON.parse(readFileSync(file, 'utf-8')) as Array<{ id: string; content: unknown }>
    for (const item of items) {
      if (!FORCE && applied.has(item.id)) {
        skipped++
        continue
      }
      const parsed = SolutionContentSchema.safeParse(item.content)
      if (!parsed.success) {
        console.error(`✗ ${item.id}: schema invalid, not applied (run validate-solution-jobs.ts)`)
        invalid++
        continue
      }

      // Confirm the challenge exists and is the type the content claims.
      const { data: challenge } = await supabase
        .from('challenges')
        .select('id, challenge_type')
        .eq('id', item.id)
        .maybeSingle()
      if (!challenge) {
        console.error(`✗ ${item.id}: challenge not found, not applied`)
        invalid++
        continue
      }
      if (challenge.challenge_type !== parsed.data.challenge_type) {
        console.error(`✗ ${item.id}: content type "${parsed.data.challenge_type}" != challenge type "${challenge.challenge_type}"`)
        invalid++
        continue
      }

      if (WRITE) {
        const { error } = await supabase
          .from('challenge_solutions')
          .upsert({
            challenge_id: item.id,
            schema_version: 1,
            content: parsed.data,
            generation_status: 'ready',
            generation_error: null,
            generated_by: 'backfill',
            model: 'claude-code-subagent',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'challenge_id' })
        if (error) {
          console.error(`✗ ${item.id}: upsert failed: ${error.message}`)
          invalid++
          continue
        }
        applied.add(item.id)
        writeFileSync(CHECKPOINT, JSON.stringify([...applied], null, 2))
      }
      upserts++
      console.log(`${WRITE ? '✓ applied' : '· would apply'} ${item.id} (${parsed.data.approaches.length} approaches)`)
    }
  }

  console.log(`\n${WRITE ? 'Applied' : 'Would apply'} ${upserts}, skipped ${skipped} (checkpointed), ${invalid} invalid`)
  if (!WRITE) console.log('Dry run. Pass --write to upsert.')
  process.exit(invalid > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
