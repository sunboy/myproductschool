#!/usr/bin/env npx tsx
/**
 * Backfill topic/technique tag SUGGESTIONS for SQL and coding challenges using
 * the structured metadata they already carry — NOT prose keyword matching.
 *
 * Why this exists: the prose-based scripts/backfill-taxonomy.ts gets 0 matches
 * on SQL because SQL titles describe the business question ("Top 3 per Category")
 * while the technique lives in the solution. But these challenges store rich
 * structured metadata:
 *   - metadata.source_category    e.g. "Window Functions", "Trees & Graphs"  (gold signal)
 *   - metadata.reference_solution { sql | python }                           (deterministic parse)
 *   - metadata.reference_approach prose naming the technique                 (fallback)
 *
 * This maps source_category → canonical taxonomy slug, and disambiguates the
 * few generic categories by scanning the solution code. Writes ONLY to the
 * staging columns (topic_tags_suggested / technique_tags_suggested). Promotion
 * to live columns is a separate, gated step (scripts/promote-tag-suggestions.ts).
 *
 * Flags:
 *   --dry-run          Print, do not write (default behaviour unless --write).
 *   --write            Persist suggestions to staging columns.
 *   --discipline <t>   'sql' | 'algorithm' (challenge_type). Omit = both.
 *   --limit <n>        Cap rows.
 *   --only-empty       Only process rows whose topic_tags_suggested is empty.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-tags-from-metadata.ts --discipline sql
 *   npx tsx --env-file=.env.local scripts/backfill-tags-from-metadata.ts --write
 */

import { createClient } from '@supabase/supabase-js'
import { TOPICS, TECHNIQUES } from '../src/lib/data/taxonomy'

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
const ONLY_EMPTY = args.includes('--only-empty')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined
const discIdx = args.indexOf('--discipline')
const DISCIPLINE = discIdx >= 0 ? args[discIdx + 1] : undefined

// ── Valid-slug guards (never emit a slug outside the taxonomy) ─────────────────
const SQL_TOPIC_SLUGS = new Set(TOPICS.sql.map(t => t.slug))
const CODING_TOPIC_SLUGS = new Set(TOPICS.coding.map(t => t.slug))
const CODING_TECH_SLUGS = new Set(TECHNIQUES.coding.map(t => t.slug))

// ── SQL: source_category → topic slug ─────────────────────────────────────────
// SQL taxonomy topics: joins, aggregations, window-functions, ctes, subqueries,
// set-operations, indexes, query-optimization.
const SQL_CATEGORY_MAP: Record<string, string> = {
  'Window Functions': 'window-functions',
  'TOP N & Ranking': 'window-functions',
  'GROUP BY & HAVING': 'aggregations',
  'Percentage & CASE WHEN': 'aggregations',
  'Promotion & Campaign Analysis': 'aggregations',
  'JOINs': 'joins',
  // ambiguous → resolved by solution scan: 'Customer Behavior', 'Date & Time'
}

// ── Coding: source_category → { topic?, technique? } ──────────────────────────
// Coding taxonomy is split: TOPICS.coding (data structures / problem areas) and
// TECHNIQUES.coding (algorithmic moves). Read taxonomy.ts for the real slugs;
// this map only references slugs guarded by the Sets above (unknowns dropped).
// Real TOPICS.coding slugs: arrays, strings, hash-tables, linked-lists, trees,
// graphs, heap, stack-queue, dynamic-programming, greedy, math, bit-manipulation,
// two-pointers, intervals. (two-pointers is BOTH a topic and a technique slug.)
const CODING_CATEGORY_MAP: Record<string, { topic?: string; technique?: string }> = {
  'Trees & Graphs': { topic: 'graphs' },
  'Trees/BST': { topic: 'trees' },
  'Advanced Graphs (BFS)': { topic: 'graphs', technique: 'bfs' },
  "Advanced Graphs (Eulerian Path / Hierholzer's Algorithm)": { topic: 'graphs' },
  'Arrays & Strings': { topic: 'arrays' },
  'Strings': { topic: 'strings' },
  'Dynamic Programming': { topic: 'dynamic-programming' },
  'Heaps & Priority Queues': { topic: 'heap' },
  'Hashmaps & Sets': { topic: 'hash-tables' },
  'Recursion & Backtracking': { topic: 'dynamic-programming' },
  'Backtracking': { topic: 'dynamic-programming' },
  'Binary Search': { topic: 'arrays', technique: 'binary-search' },
  'Stack': { topic: 'stack-queue', technique: 'monotonic-stack' },
  'Intervals': { topic: 'intervals' },
  'Bit Manipulation': { topic: 'bit-manipulation' },
  'Linked List': { topic: 'linked-lists' },
  'Linked Lists': { topic: 'linked-lists' },
  'Sliding Window': { topic: 'arrays', technique: 'sliding-window' },
  'Two Pointers': { topic: 'two-pointers', technique: 'two-pointers' },
  'Trie': { topic: 'trees', technique: 'trie' },
  'System-Flavored Coding': {}, // resolved by solution scan
  'Math / Advanced': { topic: 'math' },
}

// ── Solution-text disambiguation for SQL ──────────────────────────────────────
function sqlTopicsFromSolution(sqlText: string): string[] {
  const s = sqlText.toLowerCase()
  const out = new Set<string>()
  if (/\bover\s*\(/.test(s) || /\b(rank|row_number|dense_rank|lag|lead|ntile)\s*\(/.test(s)) out.add('window-functions')
  if (/\bwith\b[\s\S]*\bas\s*\(/.test(s)) out.add('ctes')
  if (/\bjoin\b/.test(s)) out.add('joins')
  if (/\bgroup\s+by\b/.test(s) || /\b(sum|count|avg|min|max)\s*\(/.test(s)) out.add('aggregations')
  if (/\(\s*select\b/.test(s)) out.add('subqueries')
  if (/\b(union|intersect|except)\b/.test(s)) out.add('set-operations')
  return Array.from(out).filter(x => SQL_TOPIC_SLUGS.has(x))
}

function getSolutionText(meta: Record<string, unknown>): string {
  const rs = meta.reference_solution
  if (rs && typeof rs === 'object') {
    const o = rs as Record<string, unknown>
    return [o.sql, o.python, o.javascript, o.code].filter(v => typeof v === 'string').join('\n')
  }
  if (typeof rs === 'string') return rs
  return ''
}

interface Row {
  id: string
  title: string | null
  challenge_type: string | null
  metadata: Record<string, unknown> | null
  topic_tags: string[] | null
  topic_tags_suggested: string[] | null
}

function suggestForRow(row: Row): { topics: string[]; techniques: string[] } {
  const meta = row.metadata ?? {}
  const cat = typeof meta.source_category === 'string' ? meta.source_category : ''
  const solution = getSolutionText(meta)
  const topics = new Set<string>()
  const techniques = new Set<string>()

  if (row.challenge_type === 'sql') {
    const mapped = SQL_CATEGORY_MAP[cat]
    if (mapped) topics.add(mapped)
    // Always enrich from the solution — picks up secondary topics (a TOP-N query
    // that also JOINs and GROUP BYs) and resolves ambiguous categories.
    for (const t of sqlTopicsFromSolution(solution)) topics.add(t)
    // Primary stays first: prefer the category mapping at index 0.
    const ordered = mapped ? [mapped, ...Array.from(topics).filter(t => t !== mapped)] : Array.from(topics)
    return { topics: ordered.filter(t => SQL_TOPIC_SLUGS.has(t)), techniques: [] }
  }

  if (row.challenge_type === 'algorithm') {
    const code = solution.toLowerCase()
    const approach = (typeof meta.reference_approach === 'string' ? meta.reference_approach : '').toLowerCase()
    const both = code + ' ' + approach

    const mapped = CODING_CATEGORY_MAP[cat]
    let primaryTopic = mapped?.topic && CODING_TOPIC_SLUGS.has(mapped.topic) ? mapped.topic : undefined
    if (mapped?.technique && CODING_TECH_SLUGS.has(mapped.technique)) techniques.add(mapped.technique)

    // Disambiguate the "Trees & Graphs" bucket from the solution/approach.
    if (cat === 'Trees & Graphs') {
      const graphy = /\b(graph|adjacency|topolog|dijkstra|bfs|dag|edges?\b)/.test(both)
      const treey = /\b(tree|\broot\b|left\b|right\b|inorder|preorder|postorder|bst|binary tree)/.test(both)
      primaryTopic = graphy && !treey ? 'graphs' : treey ? 'trees' : primaryTopic
    }

    // Topic fallback by scanning approach prose (System-Flavored / no-category).
    if (!primaryTopic) {
      const topicSignals: Array<[RegExp, string]> = [
        [/\b(trie)\b/, 'trees'],
        [/\b(heap|priority queue)\b/, 'heap'],
        [/\b(deque|queue|ring buffer|circular buffer|stack)\b/, 'stack-queue'],
        [/\b(hash ?map|hash ?set|hashmap|dictionary|defaultdict|ordereddict|set\b)/, 'hash-tables'],
        [/\b(graph|adjacency|dag|topolog)/, 'graphs'],
        [/\b(linked list|listnode)\b/, 'linked-lists'],
        [/\btwo[\s-]?pointer/, 'two-pointers'],
        [/\bbinary search\b/, 'arrays'],
        [/\binterval/, 'intervals'],
        [/\bgreedy\b/, 'greedy'],
      ]
      for (const [re, slug] of topicSignals) {
        if (re.test(both) && CODING_TOPIC_SLUGS.has(slug)) { primaryTopic = slug; break }
      }
    }
    if (primaryTopic) topics.add(primaryTopic)

    const techSignals: Array<[RegExp, string]> = [
      [/two[\s-]?pointer/, 'two-pointers'],
      [/sliding[\s-]?window/, 'sliding-window'],
      [/\bbfs\b|breadth[\s-]?first|deque\(\)/, 'bfs'],
      [/\bdfs\b|depth[\s-]?first/, 'dfs'],
      [/dijkstra/, 'dijkstra'],
      [/binary[\s-]?search|bisect/, 'binary-search'],
      [/monotonic/, 'monotonic-stack'],
      [/union[\s-]?find|disjoint set/, 'union-find'],
      [/\btrie\b/, 'trie'],
      [/segment[\s-]?tree/, 'segment-tree'],
    ]
    for (const [re, slug] of techSignals) {
      if (re.test(both) && CODING_TECH_SLUGS.has(slug)) techniques.add(slug)
    }
    return { topics: Array.from(topics).filter(t => CODING_TOPIC_SLUGS.has(t)), techniques: Array.from(techniques) }
  }

  return { topics: [], techniques: [] }
}

async function main() {
  console.log(`\nMetadata tag backfill${DRY_RUN ? ' [DRY RUN]' : ' [WRITE]'}${DISCIPLINE ? ` — ${DISCIPLINE}` : ''}\n`)

  let query = supabase
    .from('challenges')
    .select('id, title, challenge_type, metadata, topic_tags, topic_tags_suggested')
    .eq('is_published', true)

  if (DISCIPLINE) query = query.eq('challenge_type', DISCIPLINE)
  else query = query.in('challenge_type', ['sql', 'algorithm'])
  if (LIMIT) query = query.limit(LIMIT)

  const { data, error } = await query
  if (error) { console.error('Query failed:', error.message); process.exit(1) }
  if (!data || data.length === 0) { console.log('No rows.'); return }

  let matched = 0
  let empty = 0
  let wrote = 0
  const catMisses = new Map<string, number>()

  for (const row of data as Row[]) {
    if (ONLY_EMPTY && (row.topic_tags_suggested ?? []).length > 0) continue
    const { topics, techniques } = suggestForRow(row)
    if (topics.length === 0 && techniques.length === 0) {
      empty++
      const cat = typeof row.metadata?.source_category === 'string' ? row.metadata.source_category : '(no category)'
      catMisses.set(cat, (catMisses.get(cat) ?? 0) + 1)
      if (DRY_RUN) console.log(`  ∅  ${(row.title ?? '').slice(0, 60).padEnd(60)} cat="${cat}"`)
      continue
    }
    matched++
    if (DRY_RUN) {
      console.log(`  ✓  ${(row.title ?? '').slice(0, 50).padEnd(50)} topics=[${topics.join(', ')}]${techniques.length ? ` tech=[${techniques.join(', ')}]` : ''}`)
      continue
    }
    const payload: Record<string, unknown> = { topic_tags_suggested: topics }
    if (techniques.length) payload.technique_tags_suggested = techniques
    const { error: e } = await supabase.from('challenges').update(payload).eq('id', row.id)
    if (e) console.error(`  ✗ ${row.id}: ${e.message}`)
    else wrote++
  }

  console.log(`\n${DRY_RUN ? 'Dry run' : 'Done'}: ${matched} matched, ${empty} no-match${DRY_RUN ? '' : `, ${wrote} written`}.`)
  if (catMisses.size > 0) {
    console.log('\nUnmapped/ambiguous categories (need a mapping or sub-agent):')
    for (const [c, n] of Array.from(catMisses.entries()).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${c}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
