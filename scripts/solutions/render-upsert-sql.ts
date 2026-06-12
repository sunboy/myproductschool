#!/usr/bin/env npx tsx
/**
 * Render a validated batch-NNN.solutions.json into per-challenge SQL upsert
 * statements for challenge_solutions. Used when applying through an SQL
 * console or the Supabase MCP (environments without a service-role key);
 * apply-solution-jobs.ts is the preferred path when the key is available.
 *
 * Each item is validated with the Zod schema before rendering. Output is a
 * sibling .upserts.sql file with one statement per challenge, single-quote
 * escaped (standard_conforming_strings).
 *
 * Usage:
 *   npx tsx scripts/solutions/render-upsert-sql.ts <file.solutions.json> [...]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { SolutionContentSchema } from '../../src/lib/solutions/schema'

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: npx tsx scripts/solutions/render-upsert-sql.ts <file.solutions.json> [...]')
  process.exit(1)
}

let failed = 0
for (const file of files) {
  const items = JSON.parse(readFileSync(file, 'utf-8')) as Array<{ id: string; content: unknown }>
  const statements: string[] = []
  for (const item of items) {
    const parsed = SolutionContentSchema.safeParse(item.content)
    if (!parsed.success) {
      console.error(`✗ ${file} :: ${item.id}: schema invalid, skipped`)
      failed++
      continue
    }
    statements.push(
      `INSERT INTO challenge_solutions (challenge_id, schema_version, content, generation_status, generation_error, generated_by, model, updated_at)\n` +
      `VALUES (${sqlString(item.id)}, 1, ${sqlString(JSON.stringify(parsed.data))}::jsonb, 'ready', NULL, 'backfill', 'claude-code-subagent', NOW())\n` +
      `ON CONFLICT (challenge_id) DO UPDATE SET\n` +
      `  content = EXCLUDED.content, schema_version = 1, generation_status = 'ready',\n` +
      `  generation_error = NULL, generated_by = 'backfill', model = EXCLUDED.model, updated_at = NOW();`
    )
  }
  const out = file.replace(/\.solutions\.json$/, '.upserts.sql')
  writeFileSync(out, statements.join('\n\n') + '\n')
  console.log(`${out}: ${statements.length} statements`)
}

process.exit(failed > 0 ? 1 : 0)
