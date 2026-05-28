#!/usr/bin/env npx tsx
/**
 * Suggest a canonical Easy/Medium/Hard difficulty for existing challenges.
 *
 * Writes to the STAGING column only — never touches the live `difficulty`:
 *   difficulty_suggested  ← this script writes here
 *
 * The live `difficulty` column is only ever promoted by an admin after spot-check.
 *
 * This is a DETERMINISTIC heuristic, NOT an AI call. Per the repo's CLAUDE.md,
 * bulk content work must not bill the Anthropic API unless the user explicitly
 * asks. The heuristic scores each challenge on a handful of signals (estimated
 * minutes, step/question count, scenario length, presence of advanced technique
 * tags) and buckets the score into easy/medium/hard. A human reviews and promotes.
 *
 * SAFETY GATE — disagreement halt:
 *   For each challenge_type, we compare the suggestion against the current live
 *   `difficulty`. If suggestions disagree with the live value for MORE THAN 25%
 *   of rows within ANY single type, the script ABORTS without writing anything,
 *   and prints the disagreement table. The user spot-checks before re-running
 *   with --force to accept the disagreement and write suggestions.
 *
 * Flags:
 *   --dry-run        Print suggestions, never write (default behaviour is dry-run
 *                    UNLESS --write is passed).
 *   --write          Actually write difficulty_suggested. Without this, dry-run.
 *   --force          Write even if a type exceeds the 25% disagreement threshold.
 *   --discipline <t> Filter by challenge_type.
 *   --limit <n>      Process at most n challenges.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-difficulty.ts            # dry-run, all
 *   npx tsx --env-file=.env.local scripts/backfill-difficulty.ts --limit 20 # dry-run sample
 *   npx tsx --env-file=.env.local scripts/backfill-difficulty.ts --write    # write (gated)
 *   npx tsx --env-file=.env.local scripts/backfill-difficulty.ts --write --force
 */

import { createClient } from '@supabase/supabase-js'
import { coerceDifficulty, type PracticeDifficulty } from '../src/lib/practice/difficulty'

// ── Supabase client ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const DRY_RUN = !WRITE || args.includes('--dry-run')
const FORCE = args.includes('--force')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined
const discIdx = args.indexOf('--discipline')
const DISCIPLINE = discIdx >= 0 ? args[discIdx + 1] : undefined

const DISAGREEMENT_THRESHOLD = 0.25

// ── Heuristic ─────────────────────────────────────────────────────────────────

interface ChallengeRow {
  id: string
  challenge_type: string | null
  difficulty: string | null
  estimated_minutes: number | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  technique_tags: string[] | null
  metadata: Record<string, unknown> | null
}

// Technique slugs that signal genuine senior-level depth.
const ADVANCED_TECHNIQUES = new Set([
  'distributed-systems', 'sharding', 'consensus', 'cap-theorem',
  'query-optimization', 'window-functions', 'recursive-cte',
  'dynamic-programming', 'graph-algorithms', 'concurrency',
  'event-sourcing', 'cqrs', 'rate-limiting', 'consistency-models',
])

function difficultyScore(row: ChallengeRow): number {
  let score = 0

  const mins = row.estimated_minutes ?? 0
  if (mins >= 45) score += 3
  else if (mins >= 25) score += 2
  else if (mins >= 12) score += 1

  // Scenario richness — longer, more constraint-laden prompts skew harder.
  const proseLen =
    (row.scenario_context?.length ?? 0) +
    (row.scenario_trigger?.length ?? 0) +
    (row.scenario_question?.length ?? 0)
  if (proseLen >= 1200) score += 2
  else if (proseLen >= 500) score += 1

  // FLOW step / question density (from metadata, if present).
  const meta = row.metadata ?? {}
  const stepCount = Array.isArray((meta as { flow_steps?: unknown[] }).flow_steps)
    ? ((meta as { flow_steps?: unknown[] }).flow_steps as unknown[]).length
    : 0
  if (stepCount >= 4) score += 1

  // Advanced technique tags.
  const techniques = row.technique_tags ?? []
  if (techniques.some(t => ADVANCED_TECHNIQUES.has(t))) score += 2

  return score
}

function scoreToDifficulty(score: number): PracticeDifficulty {
  if (score >= 5) return 'hard'
  if (score >= 2) return 'medium'
  return 'easy'
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  let query = supabase
    .from('challenges')
    .select('id, challenge_type, difficulty, estimated_minutes, scenario_context, scenario_trigger, scenario_question, technique_tags, metadata')
    .eq('is_published', true)

  if (DISCIPLINE) query = query.eq('challenge_type', DISCIPLINE)
  if (LIMIT) query = query.limit(LIMIT)

  const { data: rows, error } = await query
  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }
  if (!rows || rows.length === 0) {
    console.log('No published challenges matched.')
    return
  }

  // Compute suggestions and per-type disagreement.
  interface Computed { id: string; type: string; live: PracticeDifficulty | null; suggested: PracticeDifficulty }
  const computed: Computed[] = (rows as ChallengeRow[]).map(row => ({
    id: row.id,
    type: row.challenge_type ?? 'unknown',
    live: row.difficulty ? (coerceDifficulty(row.difficulty) ?? null) : null,
    suggested: scoreToDifficulty(difficultyScore(row)),
  }))

  // Per-type disagreement tally.
  const byType = new Map<string, { total: number; disagree: number }>()
  for (const c of computed) {
    const t = byType.get(c.type) ?? { total: 0, disagree: 0 }
    t.total++
    if (c.live && c.live !== c.suggested) t.disagree++
    byType.set(c.type, t)
  }

  console.log('\nDisagreement vs live difficulty, by type:')
  let breached = false
  for (const [type, { total, disagree }] of Array.from(byType.entries())) {
    const pct = total > 0 ? disagree / total : 0
    const flag = pct > DISAGREEMENT_THRESHOLD ? '  ⚠ OVER 25%' : ''
    if (pct > DISAGREEMENT_THRESHOLD) breached = true
    console.log(`  ${type.padEnd(24)} ${disagree}/${total} (${(pct * 100).toFixed(0)}%)${flag}`)
  }

  if (breached && !FORCE) {
    console.error(
      '\nABORT: at least one type exceeds the 25% disagreement threshold.\n'
      + 'Spot-check the suggestions above. Re-run with --force to write anyway.\n'
    )
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log(`\nDry run: ${computed.length} suggestions computed, nothing written.`)
    console.log('Pass --write to persist difficulty_suggested.\n')
    return
  }

  // Write suggestions.
  let updated = 0
  for (const c of computed) {
    const { error: updateErr } = await supabase
      .from('challenges')
      .update({ difficulty_suggested: c.suggested })
      .eq('id', c.id)
    if (updateErr) console.error(`  ✗ ${c.id}: ${updateErr.message}`)
    else updated++
  }

  console.log(`\nDone: ${updated} difficulty_suggested values written.\n`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
