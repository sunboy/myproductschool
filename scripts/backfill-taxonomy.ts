#!/usr/bin/env npx tsx
/**
 * Backfill taxonomy suggestions for existing challenges.
 *
 * Writes to STAGING columns only — never touches the live tag columns:
 *   topic_tags_suggested     ← this script writes here
 *   technique_tags_suggested ← this script writes here
 *
 * The live columns (topic_tags, technique_tags, is_real_interview) are
 * only ever written by an admin via the tag editor UI.
 *
 * Algorithm:
 *   1. Concatenate title + scenario_context + scenario_trigger +
 *      scenario_question + metadata.problem_statement_markdown into a
 *      single searchable text blob (lowercased).
 *   2. For each topic in TOPICS[discipline]: check if slug or any word
 *      of the label appears in the blob. Collect matches.
 *   3. Same for TECHNIQUES[discipline].
 *   4. Confidence gate: at least 1 match required to suggest anything.
 *   5. Quick-take heuristic: if company_tags is non-empty AND the blob
 *      contains "interview", suggest is_real_interview = true (logged in
 *      dry-run; written to is_real_interview_suggested column if it exists,
 *      otherwise skipped without error).
 *
 * Flags:
 *   --dry-run        Print suggestions without writing to DB (default: false)
 *   --discipline <d> Filter by challenge_type (e.g. coding, sql, product_sense)
 *   --limit <n>      Process at most n challenges
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-taxonomy.ts --dry-run --limit 10
 *   npx tsx --env-file=.env.local scripts/backfill-taxonomy.ts --discipline coding --limit 50
 *   npx tsx --env-file=.env.local scripts/backfill-taxonomy.ts   # writes ALL
 */

import { createClient } from '@supabase/supabase-js'
import { TOPICS, TECHNIQUES, DISCIPLINES } from '../src/lib/data/taxonomy'
import type { Discipline } from '../src/lib/data/taxonomy'

// ── Supabase client ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const limitIdx   = args.indexOf('--limit')
const LIMIT      = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined
const discIdx    = args.indexOf('--discipline')
const DISCIPLINE = discIdx >= 0 ? args[discIdx + 1] : undefined

if (DISCIPLINE && !(DISCIPLINES as ReadonlyArray<string>).includes(DISCIPLINE)) {
  console.error(`Unknown discipline "${DISCIPLINE}". Valid: ${DISCIPLINES.join(', ')}`)
  process.exit(1)
}

// ── challenge_type → Discipline mapping ───────────────────────────────────────
// The DB challenge_type values don't always match the taxonomy discipline slugs.
// product_sense challenges have challenge_type = 'product_sense' or 'autopsy'.
// coding: 'coding', sql: 'sql', etc.

const TYPE_TO_DISCIPLINE: Record<string, Discipline> = {
  // DB challenge_type values (what's actually in the challenges table):
  algorithm:     'coding',         // algorithmic coding challenges
  sql:           'sql',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  flow:          'product_sense',  // FLOW challenges (Frame/List/Optimize/Win) — product_sense
  autopsy:       'product_sense',  // autopsy variant of product_sense
  // Legacy / alternate spellings — kept for safety:
  coding:        'coding',
  product_sense: 'product_sense',
  ai_engineering:'ai_engineering',
  // quick_take challenges can span disciplines — handled separately below
}

// ── Challenge row shape (columns we select) ───────────────────────────────────

interface ChallengeRow {
  id:               string
  title:            string | null
  challenge_type:   string | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question:string | null
  metadata:         Record<string, unknown> | null
  company_tags:     string[] | null
}

// ── Keyword matching helpers ──────────────────────────────────────────────────

/**
 * Build a set of match tokens from a slug or label:
 *   - The slug itself (e.g. "hash-tables")
 *   - The full label lowercased (e.g. "hash tables")
 *
 * NOTE: We deliberately do NOT split labels into individual words.
 * Single-word tokens are too broad:
 *   - "Taste Frame" → ["taste", "frame"] would match every FLOW challenge
 *     because the word "frame" is structural to FLOW (Frame/List/Optimize/Win)
 *   - "Binary Search" → ["binary", "search"] would match any challenge
 *     mentioning "search" in a broad context
 * Matching only on slug or full phrase keeps precision high.
 */
function tokensFor(slug: string, label: string): string[] {
  return [
    slug.toLowerCase(),
    label.toLowerCase(),
  ]
}

/**
 * Returns true if any token from the entry appears in the blob.
 * Uses word-boundary-aware matching: the token must appear as a distinct
 * word or phrase (not as a substring of another word).
 */
function matchesBlob(tokens: string[], blob: string): boolean {
  for (const token of tokens) {
    // Escape regex special chars in the token
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match as a whole word or bounded phrase
    const re = new RegExp(`(?<![a-z0-9-])${escaped}(?![a-z0-9-])`, 'i')
    if (re.test(blob)) return true
  }
  return false
}

/**
 * Build the searchable text blob for a challenge row.
 * Concatenates all text fields plus metadata.problem_statement_markdown.
 */
function buildBlob(row: ChallengeRow): string {
  const parts: string[] = [
    row.title ?? '',
    row.scenario_context ?? '',
    row.scenario_trigger ?? '',
    row.scenario_question ?? '',
  ]
  const meta = row.metadata ?? {}
  if (typeof meta.problem_statement_markdown === 'string') {
    parts.push(meta.problem_statement_markdown)
  }
  if (typeof meta.scenario_explanation === 'string') {
    parts.push(meta.scenario_explanation)
  }
  return parts.join(' ').toLowerCase()
}

/**
 * Determine which disciplines to search for a given challenge_type.
 * Most challenges map to a single discipline. quick_take challenges are
 * cross-discipline — search all disciplines and take the union.
 */
function disciplinesForType(challengeType: string | null): Discipline[] {
  if (!challengeType) return []
  if (challengeType === 'quick_take') return [...DISCIPLINES]
  const d = TYPE_TO_DISCIPLINE[challengeType]
  return d ? [d] : []
}

// ── Suggestion logic ──────────────────────────────────────────────────────────

interface Suggestions {
  topic_tags_suggested:     string[]
  technique_tags_suggested: string[]
  is_real_interview_suggested: boolean
}

function suggestTags(row: ChallengeRow): Suggestions {
  const blob        = buildBlob(row)
  const disciplines = disciplinesForType(row.challenge_type)

  const topicMatches: string[]     = []
  const techniqueMatches: string[] = []

  for (const disc of disciplines) {
    for (const topic of TOPICS[disc]) {
      const tokens = tokensFor(topic.slug, topic.label)
      if (matchesBlob(tokens, blob)) {
        if (!topicMatches.includes(topic.slug)) topicMatches.push(topic.slug)
      }
    }
    for (const tech of TECHNIQUES[disc]) {
      const tokens = tokensFor(tech.slug, tech.label)
      if (matchesBlob(tokens, blob)) {
        if (!techniqueMatches.includes(tech.slug)) techniqueMatches.push(tech.slug)
      }
    }
  }

  // Quick-take heuristic: non-empty company_tags + "interview" in blob
  const isRealInterviewSuggested =
    (row.company_tags ?? []).length > 0 && /\binterview\b/i.test(blob)

  return {
    topic_tags_suggested:        topicMatches,
    technique_tags_suggested:    techniqueMatches,
    is_real_interview_suggested: isRealInterviewSuggested,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(
    `\n🏷️  Taxonomy backfill${DRY_RUN ? ' [DRY RUN]' : ''}`
    + (DISCIPLINE ? ` — discipline: ${DISCIPLINE}` : '')
    + (LIMIT ? ` — limit: ${LIMIT}` : '')
    + '\n'
  )

  // Build query
  let query = supabase
    .from('challenges')
    .select('id, title, challenge_type, scenario_context, scenario_trigger, scenario_question, metadata, company_tags')
    .eq('is_published', true)

  // Filter by challenge_type if --discipline provided
  // Map discipline back to possible challenge_type values
  if (DISCIPLINE) {
    // Collect all challenge_type values that map to this discipline,
    // but only the canonical DB types (not legacy aliases).
    const DB_TYPES = ['algorithm', 'sql', 'system_design', 'data_modeling', 'flow', 'autopsy', 'quick_take']
    const matchingTypes = DB_TYPES.filter(t => TYPE_TO_DISCIPLINE[t] === DISCIPLINE)
    if (matchingTypes.length === 1) {
      query = query.eq('challenge_type', matchingTypes[0])
    } else if (matchingTypes.length > 1) {
      query = query.in('challenge_type', matchingTypes)
    }
  }

  if (LIMIT) query = query.limit(LIMIT)

  const { data: challenges, error } = await query

  if (error) {
    console.error('Failed to fetch challenges:', error.message)
    process.exit(1)
  }

  if (!challenges || challenges.length === 0) {
    console.log('No challenges found.')
    return
  }

  console.log(`Found ${challenges.length} challenge(s) to process.\n`)

  let updated = 0
  let skipped = 0  // no matches at all

  for (const row of challenges as ChallengeRow[]) {
    const suggestions = suggestTags(row)
    const hasAny =
      suggestions.topic_tags_suggested.length > 0 ||
      suggestions.technique_tags_suggested.length > 0

    if (DRY_RUN) {
      console.log(`── ${row.id}`)
      console.log(`   title:       ${(row.title ?? '').slice(0, 80)}`)
      console.log(`   type:        ${row.challenge_type ?? 'n/a'}`)
      if (hasAny) {
        console.log(`   topics:      ${suggestions.topic_tags_suggested.join(', ') || '(none)'}`)
        console.log(`   techniques:  ${suggestions.technique_tags_suggested.join(', ') || '(none)'}`)
      } else {
        console.log(`   topics:      (no matches)`)
        console.log(`   techniques:  (no matches)`)
      }
      if (suggestions.is_real_interview_suggested) {
        console.log(`   is_real_interview_suggested: true`)
      }
      console.log()
      updated++
      continue
    }

    // Write to DB — staging columns only
    if (!hasAny) {
      skipped++
      continue
    }

    const updatePayload: Record<string, unknown> = {
      topic_tags_suggested:     suggestions.topic_tags_suggested,
      technique_tags_suggested: suggestions.technique_tags_suggested,
    }

    const { error: updateErr } = await supabase
      .from('challenges')
      .update(updatePayload)
      .eq('id', row.id)

    if (updateErr) {
      console.error(`  ✗ ${row.id}: ${updateErr.message}`)
    } else {
      const topicCount = suggestions.topic_tags_suggested.length
      const techCount  = suggestions.technique_tags_suggested.length
      console.log(
        `  ✓ ${row.id.slice(0, 30).padEnd(30)} `
        + `topics:${String(topicCount).padStart(2)} `
        + `techniques:${String(techCount).padStart(2)}`
        + (suggestions.is_real_interview_suggested ? '  [interview?]' : '')
      )
      updated++
    }
  }

  console.log(
    `\n${DRY_RUN ? 'Dry run' : 'Done'}: `
    + `${updated} written, ${skipped} skipped (no matches)\n`
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
