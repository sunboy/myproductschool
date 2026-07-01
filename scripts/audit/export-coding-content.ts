#!/usr/bin/env npx tsx
/**
 * Export published algorithm + sql challenge content for local grading validation.
 * Output: /tmp/coding-content.json consumed by scripts/audit/validate-challenge-content.py
 *
 * Usage: npx tsx --env-file=.env.local scripts/audit/export-coding-content.ts
 */

import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env (use --env-file=.env.local)')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const rows: unknown[] = []
  const PAGE = 200
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title, challenge_type, metadata')
      .eq('is_published', true)
      .in('challenge_type', ['algorithm', 'sql'])
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  writeFileSync('/tmp/coding-content.json', JSON.stringify(rows))
  console.log(`Exported ${rows.length} challenges to /tmp/coding-content.json`)
}

main()
