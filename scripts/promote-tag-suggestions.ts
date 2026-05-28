#!/usr/bin/env npx tsx
/**
 * Promote staged tag suggestions to the LIVE columns the UI reads.
 *
 *   topic_tags_suggested      → topic_tags
 *   technique_tags_suggested  → technique_tags
 *
 * SAFETY: only fills a live column that is currently EMPTY. Never overwrites
 * existing live tags. This is the step the earlier overhaul skipped — the
 * suggestions were written but never promoted, so the UI saw nothing.
 *
 * Flags:
 *   --dry-run        Print, do not write (default unless --write).
 *   --write          Persist.
 *   --discipline <t> challenge_type filter (e.g. sql, algorithm).
 *   --limit <n>      Cap rows.
 *   --topics-only    Promote topic_tags only (leave technique_tags untouched).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/promote-tag-suggestions.ts --discipline sql
 *   npx tsx --env-file=.env.local scripts/promote-tag-suggestions.ts --write
 */

import { createClient } from '@supabase/supabase-js'
import { isValidTopicAny, isValidTechniqueAny } from '../src/lib/data/taxonomy'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const DRY_RUN = !WRITE || args.includes('--dry-run')
const TOPICS_ONLY = args.includes('--topics-only')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined
const discIdx = args.indexOf('--discipline')
const DISCIPLINE = discIdx >= 0 ? args[discIdx + 1] : undefined

interface Row {
  id: string
  title: string | null
  challenge_type: string | null
  topic_tags: string[] | null
  technique_tags: string[] | null
  topic_tags_suggested: string[] | null
  technique_tags_suggested: string[] | null
}

async function main() {
  console.log(`\nPromote tag suggestions → live${DRY_RUN ? ' [DRY RUN]' : ' [WRITE]'}${DISCIPLINE ? ` — ${DISCIPLINE}` : ''}\n`)

  let query = supabase
    .from('challenges')
    .select('id, title, challenge_type, topic_tags, technique_tags, topic_tags_suggested, technique_tags_suggested')
    .eq('is_published', true)
  if (DISCIPLINE) query = query.eq('challenge_type', DISCIPLINE)
  if (LIMIT) query = query.limit(LIMIT)

  const { data, error } = await query
  if (error) { console.error('Query failed:', error.message); process.exit(1) }
  if (!data || data.length === 0) { console.log('No rows.'); return }

  let promotedTopics = 0
  let promotedTech = 0
  let wrote = 0
  let skipped = 0

  for (const row of data as Row[]) {
    const liveTopics = row.topic_tags ?? []
    const liveTech = row.technique_tags ?? []
    // Self-guard: only promote slugs that are valid in the taxonomy, so a stale
    // or hand-edited staging value can never leak an unknown slug into live.
    const sugTopics = (row.topic_tags_suggested ?? []).filter(isValidTopicAny)
    const sugTech = (row.technique_tags_suggested ?? []).filter(isValidTechniqueAny)

    const payload: Record<string, unknown> = {}
    if (liveTopics.length === 0 && sugTopics.length > 0) {
      payload.topic_tags = sugTopics
      promotedTopics++
    }
    if (!TOPICS_ONLY && liveTech.length === 0 && sugTech.length > 0) {
      payload.technique_tags = sugTech
      promotedTech++
    }

    if (Object.keys(payload).length === 0) { skipped++; continue }

    if (DRY_RUN) {
      const parts: string[] = []
      if ('topic_tags' in payload) parts.push(`topics→[${sugTopics.join(', ')}]`)
      if ('technique_tags' in payload) parts.push(`tech→[${sugTech.join(', ')}]`)
      console.log(`  ✓ ${(row.title ?? '').slice(0, 50).padEnd(50)} ${parts.join('  ')}`)
      continue
    }
    const { error: e } = await supabase.from('challenges').update(payload).eq('id', row.id)
    if (e) console.error(`  ✗ ${row.id}: ${e.message}`)
    else wrote++
  }

  console.log(
    `\n${DRY_RUN ? 'Dry run' : 'Done'}: would promote topics on ${promotedTopics} rows, techniques on ${promotedTech} rows. ` +
    `${skipped} already-live/empty skipped.${DRY_RUN ? '' : ` ${wrote} rows updated.`}`
  )
}

main().catch(e => { console.error(e); process.exit(1) })
