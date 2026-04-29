/**
 * Resumable enrichment driver — picks up where dev2/dev3 left off.
 *
 * Reads seeds/scraped-raw.json, identifies entries NOT yet in staged-interview-challenges.json,
 * processes them with strict 429 handling (exponential backoff, low concurrency, sequential SQL).
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/enrich-resume.ts [--algo|--sql|--all]
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'
const SEEDS_DIR = path.join(process.cwd(), 'seeds')
const STAGED_PATH = path.join(SEEDS_DIR, 'staged-interview-challenges.json')
const SCRAPED_PATH = path.join(SEEDS_DIR, 'scraped-raw.json')
const FAILURES_LOG = path.join(SEEDS_DIR, 'enrichment-failures.log')

// Conservative concurrency to stay under 10K output tokens/min
const ALGO_CONCURRENCY = 2
const SQL_CONCURRENCY = 2
// Pace: roughly one request every PACE_MS per worker → 4 req/sec total
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
  source_schema_text?: string
  source_hint?: string
  source_key_concept?: string
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
  const line = `[${new Date().toISOString()}] FAILED: "${title}" — ${reason}\n`
  fs.appendFileSync(FAILURES_LOG, line, 'utf-8')
}

function appendStaged(entries: StagedEntry[]) {
  if (entries.length === 0) return
  const existing = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
  const titles = new Set(existing.map((e) => (e as { title?: string }).title ?? ''))
  const toAdd = entries.filter((e) => !titles.has(e.title))
  fs.writeFileSync(STAGED_PATH, JSON.stringify([...existing, ...toAdd], null, 2))
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
      const text = response.content
        .filter((c) => c.type === 'text')
        .map((c) => (c as { type: 'text'; text: string }).text)
        .join('\n')
      return text
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string; headers?: Record<string, string> }
      const isRate = e.status === 429 || (e.message ?? '').includes('429') || (e.message ?? '').includes('rate_limit')
      if (isRate && attempt < 6) {
        // Exponential backoff: 5, 10, 20, 40, 80 sec
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

// ---------------------------------------------------------------------------
// ALGO enrichment
// ---------------------------------------------------------------------------

function buildAlgoPrompt(e: ScrapedEntry): string {
  return `You are converting a scraped interview problem into an EXECUTABLE coding challenge for HackProduct's Monaco-based coding workspace.

GROUND TRUTH (do not rewrite, only convert):
Title: ${e.title}
Difficulty: ${e.difficulty}
Category: ${e.source_category}
Problem statement: ${e.problem_statement_markdown}
Approaches (prose): ${e.source_approaches ?? ''}
Reference approach (prose): ${e.source_solution_prose}
Complexity: ${e.source_complexity ?? ''}

PRODUCE valid JSON ONLY (no preamble, no markdown fences):
{
  "starter_code": {
    "python": "def solution(...):\\n    pass\\n",
    "javascript": "function solution(...) {\\n  \\n}\\n"
  },
  "reference_solution": {
    "python": "<ACTUALLY EXECUTABLE Python>",
    "javascript": "<ACTUALLY EXECUTABLE JS>"
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "args": [<concrete inputs>], "expected": <concrete output>, "hidden": false },
    { "id": "tc2", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc3", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc4", "label": "<edge case>", "args": [...], "expected": ..., "hidden": true },
    { "id": "tc5", "label": "<stress / tricky>", "args": [...], "expected": ..., "hidden": true }
  ],
  "reference_approach": "<one paragraph>"
}

RULES:
- Both Python and JS solutions must use the same function name 'solution' and accept the same args in the same order.
- Test case 'args' is an ARRAY of values that get spread into solution(...args).
- 'expected' is the literal return value (concrete, not a description).
- Outputs must be DETERMINISTIC. If multiple valid outputs exist, normalize via sorting.`
}

interface AlgoHaiku {
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: Array<{ id: string; label: string; args: unknown[]; expected: unknown; hidden: boolean }>
  reference_approach: string
}

function validateAlgo(r: AlgoHaiku): string[] {
  const errs: string[] = []
  if (!r.starter_code?.python || !r.starter_code?.javascript) errs.push('missing starter_code')
  if (!r.reference_solution?.python || !r.reference_solution?.javascript) errs.push('missing reference_solution')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 5) errs.push(`test_cases<5 (${r.test_cases?.length ?? 0})`)
  for (const tc of r.test_cases ?? []) {
    if (!tc.id || !Array.isArray(tc.args) || tc.expected === undefined) {
      errs.push(`bad tc ${tc.id ?? '?'}`)
    }
  }
  if (!r.reference_approach) errs.push('missing reference_approach')
  return errs
}

async function enrichAlgoOne(e: ScrapedEntry): Promise<StagedEntry | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await callHaiku(buildAlgoPrompt(e))
      const parsed = extractJson(text) as AlgoHaiku
      const errs = validateAlgo(parsed)
      if (errs.length > 0) {
        if (attempt === 2) {
          logFailure(e.title, `validation: ${errs.join(', ')}`)
          return null
        }
        continue
      }
      return {
        title: e.title,
        challenge_type: 'coding',
        is_sql: false,
        difficulty: e.difficulty,
        time_limit_seconds: (e.time_min ?? 30) * 60,
        pattern: e.source_category,
        problem_statement_markdown: e.problem_statement_markdown,
        metadata: {
          starter_code: parsed.starter_code,
          reference_solution: parsed.reference_solution,
          test_cases: parsed.test_cases,
          reference_approach: parsed.reference_approach,
          source: 'notion-scraped',
          source_question_id: e.source_question_id,
          source_category: e.source_category,
          source_companies: e.source_companies,
        },
        source_question_id: e.source_question_id,
        approved: false,
        generated_at: new Date().toISOString(),
      }
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

// ---------------------------------------------------------------------------
// SQL enrichment
// ---------------------------------------------------------------------------

function buildSqlPrompt(e: ScrapedEntry, feedback?: string): string {
  return `You are converting a scraped SQL interview problem into an EXECUTABLE SQL challenge for HackProduct.

GROUND TRUTH:
Title: ${e.title}
Difficulty: ${e.difficulty}
Category: ${e.source_category}
Question: ${e.problem_statement_markdown}
Hint: ${e.source_hint ?? ''}
Key concept: ${e.source_key_concept ?? ''}
Schema (DDL): ${e.source_schema_text ?? ''}
Reference solution: ${e.source_solution_prose}
${feedback ? `\nPREVIOUS ATTEMPT FEEDBACK: ${feedback}\n` : ''}
PRODUCE valid JSON ONLY (no preamble, no fences):
{
  "sql_schema": {
    "dialect": "sqlite",
    "setup_script": "<CREATE TABLE statements (translate types to SQLite: VARCHAR→TEXT, DECIMAL→REAL, DATE→TEXT) + INSERT INTO with 6-12 rows per table designed to exercise this category. Realistic data, edge cases where relevant. The reference query MUST return at least 1 row against this data.>",
    "schema_diagram": {
      "tables": [{ "name": "...", "columns": [{ "name": "...", "type": "...", "constraints": [] }] }],
      "relationships": [{ "from": "table.col", "to": "table.col", "type": "many-to-one" }]
    },
    "sample_data_preview": { "tableName": [ {"col": "value"} ] }
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc2", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc3", "label": "<edge>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": true }
  ],
  "starter_code": { "sql": "-- Write your SQL query here\\n" },
  "reference_solution": { "sql": "<EXECUTABLE SQL that runs against setup_script and produces >=1 row. Fix typos in scraped Solution like 'http://p.name' → 'p.name'. Use SQLite syntax.>" },
  "reference_approach": "<one paragraph>"
}

RULES:
- Use SQLite syntax. RANK/DENSE_RANK/ROW_NUMBER/LAG/LEAD/CTEs/window functions all supported.
- The reference query MUST produce at least one row against the seeded data.
- Leave expected_rows: [] — driver will populate.`
}

interface SqlHaiku {
  sql_schema: {
    dialect: string
    setup_script: string
    schema_diagram?: unknown
    sample_data_preview?: unknown
  }
  test_cases: Array<{ id: string; label: string; expected_rows: unknown[]; match_mode: string; hidden: boolean }>
  starter_code: { sql: string }
  reference_solution: { sql: string }
  reference_approach: string
}

function validateSql(r: SqlHaiku): string[] {
  const errs: string[] = []
  if (!r.sql_schema?.setup_script) errs.push('missing setup_script')
  if (!r.reference_solution?.sql) errs.push('missing reference_solution.sql')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 2) errs.push('test_cases<2')
  return errs
}

async function execSqlAndPopulate(haiku: SqlHaiku): Promise<{ ok: boolean; reason?: string }> {
  const initSqlJs = (await import('sql.js')).default
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  const wasmBinary = fs.readFileSync(wasmPath)
  const SQL = await initSqlJs({ wasmBinary })

  const db = new SQL.Database()
  try {
    db.run(haiku.sql_schema.setup_script)
    const results = db.exec(haiku.reference_solution.sql)
    if (!results || results.length === 0) {
      return { ok: false, reason: 'reference query returned no result set' }
    }
    const rows = results[0].values.map((row) =>
      Object.fromEntries(results[0].columns.map((col, i) => [col, row[i]]))
    )
    if (rows.length === 0) {
      return { ok: false, reason: 'reference query returned 0 rows' }
    }
    for (const tc of haiku.test_cases) {
      tc.expected_rows = rows
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: (err as Error).message }
  } finally {
    db.close()
  }
}

async function enrichSqlOne(e: ScrapedEntry): Promise<StagedEntry | null> {
  let feedback: string | undefined
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text = await callHaiku(buildSqlPrompt(e, feedback))
      const parsed = extractJson(text) as SqlHaiku
      const errs = validateSql(parsed)
      if (errs.length > 0) {
        if (attempt === 2) {
          logFailure(e.title, `sql validation: ${errs.join(', ')}`)
          return null
        }
        feedback = `previous attempt invalid: ${errs.join(', ')}`
        continue
      }
      const exec = await execSqlAndPopulate(parsed)
      if (!exec.ok) {
        if (attempt === 2) {
          logFailure(e.title, `sql.js: ${exec.reason}`)
          return null
        }
        feedback = `previous setup_script + reference_solution failed to execute: ${exec.reason}; please regenerate with realistic seeded rows that exercise the query`
        continue
      }
      return {
        title: e.title,
        challenge_type: 'coding',
        is_sql: true,
        difficulty: e.difficulty,
        time_limit_seconds: (e.time_min ?? 30) * 60,
        pattern: e.source_category,
        problem_statement_markdown: e.problem_statement_markdown,
        metadata: {
          sql_schema: parsed.sql_schema,
          starter_code: parsed.starter_code,
          reference_solution: parsed.reference_solution,
          test_cases: parsed.test_cases,
          reference_approach: parsed.reference_approach,
          source: 'notion-scraped',
          source_question_id: e.source_question_id,
          source_category: e.source_category,
          source_companies: e.source_companies,
        },
        source_question_id: e.source_question_id,
        approved: false,
        generated_at: new Date().toISOString(),
      }
    } catch (err) {
      if (attempt === 2) {
        logFailure(e.title, `api: ${(err as Error).message}`)
        return null
      }
      feedback = `previous attempt threw: ${(err as Error).message}`
      await sleep(2000)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Concurrency-limited runner
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, idx: number) => Promise<StagedEntry | null>,
  label: string
): Promise<{ succeeded: number; failed: number; entries: StagedEntry[] }> {
  let succeeded = 0
  let failed = 0
  const entries: StagedEntry[] = []
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
            const res = await worker(items[i], i)
            if (res) {
              succeeded++
              entries.push(res)
              // Append immediately so partial progress is durable
              appendStaged([res])
            } else {
              failed++
            }
          } catch (err) {
            failed++
            logFailure((items[i] as { title?: string }).title ?? '?', `unhandled: ${(err as Error).message}`)
          }
          if ((succeeded + failed) % 5 === 0) {
            console.log(`  [${succeeded + failed}/${items.length}] ${label} succeeded=${succeeded} failed=${failed}`)
          }
          // Pace: ensure each worker takes at least PACE_MS per item
          const elapsed = Date.now() - start
          if (elapsed < PACE_MS) await sleep(PACE_MS - elapsed)
        }
      })()
    )
  }

  await Promise.all(workers)
  return { succeeded, failed, entries }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const mode = process.argv.includes('--sql') ? 'sql' : process.argv.includes('--algo') ? 'algo' : 'all'

  if (!fs.existsSync(STAGED_PATH)) {
    console.error('staged-interview-challenges.json missing')
    process.exit(1)
  }
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedEntry[]
  const staged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Array<{ title: string }>
  const stagedTitles = new Set(staged.map((e) => e.title))

  const algo = scraped.filter((e) => !e.is_sql && !stagedTitles.has(e.title))
  const sql = scraped.filter((e) => e.is_sql && !stagedTitles.has(e.title))

  console.log(`Resumable enrichment: mode=${mode}`)
  console.log(`Staged baseline: ${staged.length}`)
  console.log(`Algo to enrich: ${algo.length} (already in staged: ${scraped.filter((e) => !e.is_sql).length - algo.length})`)
  console.log(`SQL to enrich:  ${sql.length} (already in staged: ${scraped.filter((e) => e.is_sql).length - sql.length})`)
  console.log(`Algo concurrency=${ALGO_CONCURRENCY}, SQL concurrency=${SQL_CONCURRENCY}, pace=${PACE_MS}ms\n`)

  let totalSucceeded = 0
  let totalFailed = 0

  if (mode === 'algo' || mode === 'all') {
    console.log(`\n=== ALGO (${algo.length}) ===`)
    const r = await runWithConcurrency(algo, ALGO_CONCURRENCY, enrichAlgoOne, 'algo')
    totalSucceeded += r.succeeded
    totalFailed += r.failed
    console.log(`Algo done: succeeded=${r.succeeded}, failed=${r.failed}`)
  }

  if (mode === 'sql' || mode === 'all') {
    console.log(`\n=== SQL (${sql.length}) ===`)
    const r = await runWithConcurrency(sql, SQL_CONCURRENCY, enrichSqlOne, 'sql')
    totalSucceeded += r.succeeded
    totalFailed += r.failed
    console.log(`SQL done: succeeded=${r.succeeded}, failed=${r.failed}`)
  }

  console.log(`\nGrand total: succeeded=${totalSucceeded}, failed=${totalFailed}`)
  console.log(`Failures log: ${FAILURES_LOG}`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
