#!/usr/bin/env npx tsx
/**
 * READ-ONLY analysis. Scans every published challenge_type='algorithm' challenge
 * and reports how many would route to each array trace pattern under the
 * (now-extended) detectPattern, using the SAME inputs the runtime graft uses:
 * metadata + [...topic_tags, ...technique_tags] (see the solution generate route).
 *
 * This produces the candidate list a future backfill would attach verified
 * stepped diagrams to. It writes NOTHING: no DB writes, no graft, no route edits.
 *
 * For honesty it goes one step further than detectPattern alone: it also runs the
 * full buildSteppedTraceFromMetadata (extract input + trace + cross-check the
 * canonical answer against every extractable test case's expected). So the report
 * separates "pattern detected" (routes) from "verified eligible" (a real, schema-
 * valid, cross-checked walkthrough could be built today). The backfill cares about
 * the eligible set; the detected-but-not-eligible set is the work-to-unblock list.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/solutions/detect-array-patterns.ts
 *   npx tsx --env-file=.env.local scripts/solutions/detect-array-patterns.ts --ids
 *   npx tsx --env-file=.env.local scripts/solutions/detect-array-patterns.ts --pattern kadane
 */

import { createClient } from '@supabase/supabase-js'
import { buildSteppedTraceFromMetadata } from '../../src/lib/solutions/trace'
import type { ArrayPattern } from '../../src/lib/solutions/trace/arrayTrace'

const args = process.argv.slice(2)
function flagValue(name: string): string | null {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const PRINT_IDS = args.includes('--ids')
const PATTERN_FILTER = flagValue('--pattern') as ArrayPattern | null

// Mirror of detectPattern's routing surface, kept local so this read-only report
// can label WHY a challenge routed (tag vs reference-code fallback) without
// changing the production detector. The patterns themselves are imported through
// buildSteppedTraceFromMetadata, which is the single source of truth for routing.
const PATTERN_TAGS: Record<string, ArrayPattern> = {
  'binary-search': 'binary_search', 'binary_search': 'binary_search', 'binary search': 'binary_search',
  'two-pointers': 'two_pointers', 'two_pointers': 'two_pointers', 'two pointers': 'two_pointers',
  'sliding-window': 'sliding_window', 'sliding_window': 'sliding_window', 'sliding window': 'sliding_window',
  'fast-slow-pointers': 'fast_slow', 'fast_slow_pointers': 'fast_slow', 'fast slow pointers': 'fast_slow',
  'fast-slow': 'fast_slow', 'cycle-detection': 'fast_slow', 'cycle detection': 'fast_slow', 'floyd': 'fast_slow',
  'kadane': 'kadane', "kadane's-algorithm": 'kadane', 'maximum-subarray': 'kadane',
  'maximum subarray': 'kadane', 'max-subarray': 'kadane',
  'partition': 'partition', 'dutch-national-flag': 'partition', 'dutch national flag': 'partition',
  'three-way-partition': 'partition', 'quickselect': 'partition',
}

const ALL_PATTERNS: ArrayPattern[] = [
  'binary_search', 'two_pointers', 'sliding_window', 'fast_slow', 'partition', 'kadane',
]

interface Row {
  id: string
  title: string
  metadata: Record<string, unknown> | null
  topic_tags: string[] | null
  technique_tags: string[] | null
}

function tagsFor(row: Row): string[] {
  return [...(row.topic_tags ?? []), ...(row.technique_tags ?? [])]
}

function extractRef(metadata: Record<string, unknown> | null): string {
  const reference = metadata?.reference_solution
  if (typeof reference === 'string') return reference
  if (reference && typeof reference === 'object') {
    const r = reference as Record<string, unknown>
    if (typeof r.python === 'string') return r.python
    if (typeof r.py === 'string') return r.py
  }
  return ''
}

/** Label how a row would route, for the report only (production routing is in detectPattern). */
function routeReason(row: Row): { pattern: ArrayPattern | null; via: 'tag' | 'reference' | 'none' } {
  for (const tag of tagsFor(row)) {
    const hit = PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) return { pattern: hit, via: 'tag' }
  }
  const src = extractRef(row.metadata).toLowerCase()
  if (/\bmid\b/.test(src) && /(lo|left|low)\b/.test(src) && /(hi|right|high)\b/.test(src)) return { pattern: 'binary_search', via: 'reference' }
  if (/\bslow\b/.test(src) && /\bfast\b/.test(src)) return { pattern: 'fast_slow', via: 'reference' }
  if (/\bmax_so_far\b/.test(src) || (/\bcur(rent)?_?(sum|max)\b/.test(src) && /\bmax\s*\(/.test(src))) return { pattern: 'kadane', via: 'reference' }
  return { pattern: null, via: 'none' }
}

async function loadRows(): Promise<Row[]> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const rows: Row[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title, metadata, topic_tags, technique_tags')
      .eq('is_published', true)
      .eq('challenge_type', 'algorithm')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) {
      console.error('Query failed:', error.message)
      process.exit(1)
    }
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

interface PatternStat {
  detected: string[]      // routed to this pattern (tag or reference fallback)
  eligible: string[]      // detected AND a verified, cross-checked trace builds today
  detectedViaTag: number
  detectedViaRef: number
}

async function main() {
  const rows = await loadRows()

  const stats = new Map<ArrayPattern, PatternStat>()
  for (const p of ALL_PATTERNS) {
    stats.set(p, { detected: [], eligible: [], detectedViaTag: 0, detectedViaRef: 0 })
  }
  let noPattern = 0

  for (const row of rows) {
    const { pattern, via } = routeReason(row)
    if (!pattern) {
      noPattern++
      continue
    }
    if (PATTERN_FILTER && pattern !== PATTERN_FILTER) continue

    const stat = stats.get(pattern)!
    stat.detected.push(row.id)
    if (via === 'tag') stat.detectedViaTag++
    else if (via === 'reference') stat.detectedViaRef++

    // Verified-eligible check: run the real harness exactly as the runtime would.
    const metadata = row.metadata ?? {}
    const candidate = buildSteppedTraceFromMetadata(metadata, tagsFor(row))
    if (candidate && candidate.pattern === pattern) stat.eligible.push(row.id)
  }

  const considered = PATTERN_FILTER ? rows.length : rows.length

  console.log('')
  console.log('Array pattern detection report (READ-ONLY, no writes)')
  console.log('=====================================================')
  console.log(`Published algorithm challenges scanned: ${rows.length}`)
  console.log('')
  console.log('pattern         detected  (tag/ref)   verified-eligible')
  console.log('-----------------------------------------------------------------')
  let totalDetected = 0
  let totalEligible = 0
  for (const p of ALL_PATTERNS) {
    if (PATTERN_FILTER && p !== PATTERN_FILTER) continue
    const s = stats.get(p)!
    totalDetected += s.detected.length
    totalEligible += s.eligible.length
    const name = p.padEnd(14)
    const det = String(s.detected.length).padStart(8)
    const split = `(${s.detectedViaTag}/${s.detectedViaRef})`.padStart(10)
    const elig = String(s.eligible.length).padStart(17)
    console.log(`${name}${det}  ${split}${elig}`)
  }
  console.log('-----------------------------------------------------------------')
  console.log(`${'TOTAL'.padEnd(14)}${String(totalDetected).padStart(8)}${' '.repeat(12)}${String(totalEligible).padStart(17)}`)
  if (!PATTERN_FILTER) {
    console.log('')
    console.log(`Algorithm challenges with no detectable pattern: ${noPattern}`)
  }
  console.log(`(considered: ${considered}; "detected" = routes to a pattern; "verified-eligible" = a cross-checked trace builds today)`)

  if (PRINT_IDS) {
    console.log('')
    console.log('Per-pattern ids')
    console.log('===============')
    for (const p of ALL_PATTERNS) {
      if (PATTERN_FILTER && p !== PATTERN_FILTER) continue
      const s = stats.get(p)!
      if (s.detected.length === 0) continue
      console.log('')
      console.log(`# ${p} — detected (${s.detected.length}):`)
      for (const id of s.detected) {
        const isEligible = s.eligible.includes(id)
        console.log(`  ${isEligible ? '[eligible]' : '[needs-input]'} ${id}`)
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
