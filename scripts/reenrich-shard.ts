/**
 * Re-enrich algorithmic coding entries with the new harness contract.
 *
 * Shard-aware so multiple workers can run in parallel:
 *   npx tsx --env-file=.env.local scripts/reenrich-shard.ts --shard 0/4
 *   npx tsx --env-file=.env.local scripts/reenrich-shard.ts --shard 1/4
 *   ...
 *
 * Each worker:
 * - Loads the staged file once at start, picks its shard of notion-scraped algo entries.
 * - For each entry, calls Haiku with the new contract (input_types, output_type, compare_mode).
 * - Replaces the entry in the staged file (atomic read-merge-write keyed by title).
 * - Other workers see the latest file on each write — no shared state contention beyond fs.
 *
 * SQL entries are NOT touched here.
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'
const STAGED_PATH = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')
const SCRAPED_RAW_PATH = path.join(process.cwd(), 'seeds', 'scraped-raw.json')
const FAILURES_LOG = path.join(process.cwd(), 'seeds', 'reenrichment-failures.log')

const PER_WORKER_CONCURRENCY = 2
const PACE_MS = 500

interface ScrapedEntry {
  title: string
  is_sql: boolean
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_solution_prose: string
  source_approaches?: string
  source_complexity?: string
  time_min?: number
  difficulty: string
  problem_statement_markdown: string
}

interface StagedEntry {
  title: string
  challenge_type: 'coding'
  is_sql: boolean
  difficulty: string
  time_limit_seconds: number
  pattern: string
  problem_statement_markdown: string
  metadata: Record<string, unknown>
  source_question_id: string
  approved: boolean
  generated_at: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function logFailure(title: string, reason: string) {
  fs.appendFileSync(FAILURES_LOG, `[${new Date().toISOString()}] FAILED: "${title}" — ${reason}\n`, 'utf-8')
}

function parseShard(): { idx: number; total: number } {
  const arg = process.argv.find((a) => a.startsWith('--shard'))
  if (!arg) return { idx: 0, total: 1 }
  const v = arg.includes('=') ? arg.split('=')[1] : process.argv[process.argv.indexOf(arg) + 1]
  const [idxStr, totalStr] = v.split('/')
  return { idx: parseInt(idxStr, 10), total: parseInt(totalStr, 10) }
}

function shardOf<T>(items: T[], idx: number, total: number): T[] {
  return items.filter((_, i) => i % total === idx)
}

async function callHaiku(prompt: string, maxTokens = 4096): Promise<string> {
  let attempt = 0
  while (true) {
    attempt++
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      })
      return response.content
        .filter((c) => c.type === 'text')
        .map((c) => (c as { type: 'text'; text: string }).text)
        .join('\n')
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      const isRate = e.status === 429 || (e.message ?? '').includes('429') || (e.message ?? '').includes('rate_limit')
      if (isRate && attempt < 6) {
        const wait = 5000 * Math.pow(2, attempt - 1)
        await sleep(wait)
        continue
      }
      throw err
    }
  }
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('No JSON in response')
  return JSON.parse(m[0])
}

function buildPrompt(e: ScrapedEntry): string {
  return `You are converting a scraped interview problem into an EXECUTABLE coding challenge.

GROUND TRUTH:
Title: ${e.title}
Difficulty: ${e.difficulty}
Category: ${e.source_category}
Problem statement: ${e.problem_statement_markdown}
Approaches: ${e.source_approaches ?? ''}
Reference approach prose: ${e.source_solution_prose}
Complexity: ${e.source_complexity ?? ''}

EXECUTION CONTRACT (READ CAREFULLY):
Our test harness automatically deserializes structured inputs before calling your solution function.
For each test case, you will declare 'input_types' aligned positionally with 'args'. Supported types:
- "tree" — args[i] is a level-order array like [1, null, 2, 3]; the harness builds a TreeNode (val, left, right) and passes the ROOT to solution. Your solution must work on the TreeNode object directly. Use root.val, root.left, root.right.
- "linked_list" — args[i] is a plain array like [1,2,3]; harness builds a ListNode chain (val, next). Solution receives the head ListNode.
- "graph" — args[i] is an adjacency list (1-indexed, LeetCode 133 convention). Harness builds GraphNode objects. Solution receives the start node.
- "matrix" / "int" / "string" / "array" / omitted — passed through as raw JSON.

Likewise 'output_type' lets your solution RETURN a TreeNode/ListNode/GraphNode and the harness serializes it back to array form for comparison.

For NON-DETERMINISTIC outputs (multiple valid answers), declare 'compare_mode':
- "exact" (default) — strict JSON equality
- "set" — top-level array compared as unordered set, e.g. for "find any pair summing to target": expected=[0,1] but [3,5] would also match if both index-pairs sum correctly. ONLY use this if EVERY arrangement of correct elements is acceptable.
- "sorted" — sort numerically before compare. For numeric outputs where order is irrelevant.
- "sorted_each" — sort each subarray, then sort the outer array. For 3Sum / Group Anagrams style.

Note: 'set' / 'sorted' / 'sorted_each' affect only the EXPECTED output. The harness sorts BOTH actual and expected the same way, so you can pick any canonical answer for "expected" and it will match any valid actual answer in the same equivalence class.

PRODUCE valid JSON ONLY (no preamble, no fences):
{
  "starter_code": {
    "python": "def solution(...):\\n    pass\\n",
    "javascript": "function solution(...) {\\n  \\n}\\n"
  },
  "reference_solution": {
    "python": "<EXECUTABLE Python; assume tree/linked_list args ARE TreeNode/ListNode objects>",
    "javascript": "<EXECUTABLE JS>"
  },
  "test_cases": [
    {
      "id": "tc1", "label": "<short>",
      "args": [<concrete inputs in array form for trees/lists>],
      "input_types": ["<type per arg>", ...],
      "output_type": "<type or omit>",
      "expected": <concrete output>,
      "compare_mode": "<exact|set|sorted|sorted_each, omit for exact>",
      "hidden": false
    },
    { ... 4 more, last 2 hidden:true ... }
  ],
  "reference_approach": "<one paragraph: optimal approach + complexity>"
}

RULES:
- Function name 'solution' for both Python and JS, same signature.
- For tree problems, write your solution against TreeNode/ListNode objects. Do NOT write a manual array-decoder.
- 5 test cases total: 3 visible + 2 hidden.
- Use 'compare_mode' liberally for problems where order or specific element choice doesn't matter.
- For trees: a return of TreeNode needs output_type='tree'. For raw values (counts, sums, max), no output_type.
- 'expected' for a tree-returning solution is a level-order array like [3,9,20,null,null,15,7].`
}

interface HaikuResult {
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: Array<{
    id: string
    label: string
    args: unknown[]
    input_types?: string[]
    output_type?: string
    expected: unknown
    compare_mode?: string
    hidden: boolean
  }>
  reference_approach: string
}

function validateHaiku(r: HaikuResult): string[] {
  const errs: string[] = []
  if (!r.starter_code?.python || !r.starter_code?.javascript) errs.push('starter_code missing')
  if (!r.reference_solution?.python || !r.reference_solution?.javascript) errs.push('reference_solution missing')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 3) errs.push(`test_cases<3 (${r.test_cases?.length})`)
  for (const tc of r.test_cases ?? []) {
    if (!tc.id || !Array.isArray(tc.args) || tc.expected === undefined) errs.push(`bad tc ${tc.id ?? '?'}`)
  }
  if (!r.reference_approach) errs.push('missing reference_approach')
  return errs
}

async function enrichOne(e: ScrapedEntry): Promise<HaikuResult | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await callHaiku(buildPrompt(e))
      const parsed = extractJson(text) as HaikuResult
      const errs = validateHaiku(parsed)
      if (errs.length > 0) {
        if (attempt === 2) {
          logFailure(e.title, `validation: ${errs.join(', ')}`)
          return null
        }
        continue
      }
      return parsed
    } catch (err) {
      if (attempt === 2) {
        logFailure(e.title, `api: ${(err as Error).message}`)
        return null
      }
      await sleep(2000)
    }
  }
  return null
}

function buildStagedEntry(e: ScrapedEntry, h: HaikuResult): StagedEntry {
  return {
    title: e.title,
    challenge_type: 'coding',
    is_sql: false,
    difficulty: e.difficulty,
    time_limit_seconds: (e.time_min ?? 30) * 60,
    pattern: e.source_category,
    problem_statement_markdown: e.problem_statement_markdown,
    metadata: {
      starter_code: h.starter_code,
      reference_solution: h.reference_solution,
      test_cases: h.test_cases,
      reference_approach: h.reference_approach,
      source: 'notion-scraped',
      source_question_id: e.source_question_id,
      source_category: e.source_category,
      source_companies: e.source_companies,
      reenriched_v2: true,
    },
    source_question_id: e.source_question_id,
    approved: false,
    generated_at: new Date().toISOString(),
  }
}

// Per-shard output file. Avoids racing on the staged file.
// A merge step combines all shard outputs into staged at the end.
function shardOutPath(shardIdx: number): string {
  return path.join(process.cwd(), 'seeds', `reenrich-shard-${shardIdx}.json`)
}

function appendToShardFile(shardIdx: number, entry: StagedEntry) {
  const p = shardOutPath(shardIdx)
  let arr: StagedEntry[] = []
  if (fs.existsSync(p)) {
    try {
      arr = JSON.parse(fs.readFileSync(p, 'utf-8')) as StagedEntry[]
    } catch {
      arr = []
    }
  }
  // Replace by title within this shard (in case of retries within same shard)
  const idx = arr.findIndex((e) => e.title === entry.title)
  if (idx >= 0) arr[idx] = entry
  else arr.push(entry)
  fs.writeFileSync(p, JSON.stringify(arr, null, 2))
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<StagedEntry | null>,
  label: string,
  shardIdx: number
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0
  let failed = 0
  let cursor = 0
  const workers: Promise<void>[] = []

  for (let w = 0; w < concurrency; w++) {
    workers.push(
      (async () => {
        while (true) {
          const i = cursor++
          if (i >= items.length) break
          const start = Date.now()
          try {
            const res = await worker(items[i])
            if (res) {
              succeeded++
              appendToShardFile(shardIdx, res)
            } else {
              failed++
            }
          } catch (err) {
            failed++
            logFailure((items[i] as { title?: string }).title ?? '?', `unhandled: ${(err as Error).message}`)
          }
          if ((succeeded + failed) % 5 === 0) {
            console.log(`  [${succeeded + failed}/${items.length}] ${label} ok=${succeeded} fail=${failed}`)
          }
          const elapsed = Date.now() - start
          if (elapsed < PACE_MS) await sleep(PACE_MS - elapsed)
        }
      })()
    )
  }

  await Promise.all(workers)
  return { succeeded, failed }
}

async function main() {
  const { idx, total } = parseShard()

  const scraped = JSON.parse(fs.readFileSync(SCRAPED_RAW_PATH, 'utf-8')) as ScrapedEntry[]
  const algoAll = scraped.filter((e) => !e.is_sql).sort((a, b) => a.title.localeCompare(b.title))
  const myShard = shardOf(algoAll, idx, total)

  console.log(`Worker shard ${idx}/${total}: ${myShard.length} entries (of ${algoAll.length} total algo)`)

  const r = await runWithConcurrency(
    myShard,
    PER_WORKER_CONCURRENCY,
    async (e) => {
      const haiku = await enrichOne(e)
      return haiku ? buildStagedEntry(e, haiku) : null
    },
    `shard${idx}`,
    idx
  )

  console.log(`\nShard ${idx} done: succeeded=${r.succeeded}, failed=${r.failed}`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
