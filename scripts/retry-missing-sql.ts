/**
 * Retry enrichment for 25 SQL entries that failed during T3.
 *
 * Most failures were: reference query returned 0 rows against seeded data.
 * Some failures were: JSON parse errors (response truncated at max_tokens).
 *
 * Key improvements over T3:
 * 1. Up-front warning to Haiku: seed data MUST satisfy every filter/join/aggregate
 * 2. Explicit row counts: 10-15 rows per table
 * 3. At least 3 rows match primary filter; 5+ for top-N/ranking queries
 * 4. Up to 3 retries (not 2) with progressively stronger feedback
 * 5. Max tokens bumped to 6000 to avoid truncation-related JSON parse errors
 * 6. Concurrency = 2 (sql.js is sync-heavy; algo re-enrichment already running)
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/retry-missing-sql.ts
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

const SQL_CONCURRENCY = 1
const PACE_MS = 1500

// The 25 titles that failed in T3
const MISSING_TITLES = [
  'Airbnb: Premium City Listings',
  'Amazon: High-Revenue Categories',
  'DoorDash: Popular Restaurant Categories',
  'Drivers With No Tips Despite High Rides',
  'Fast-Growing New Stores',
  'GitHub: Active Multi-Repo Contributors',
  'GitHub: High PR Merge Rate',
  'GitHub: Popular Languages',
  'Instacart: High-Demand Departments',
  'Instacart: Out-of-Stock Rate',
  'Instacart: Shopper Efficiency Rank',
  'LinkedIn: Application-to-Interview Rate',
  'Lyft: Busy Drivers With No Tips',
  'Netflix: High-Demand Genres',
  'Salesforce: Q4 Top Closers',
  'Shopify: Fast-Growing New Stores',
  'Slack: Active Enterprise Workspaces',
  'Slack: DAU by Plan with Rolling Average',
  'Slack: Top 5 Channels per Workspace',
  'Snowflake: High-Credit Accounts',
  'Snowflake: Hourly Credit Burn by Warehouse Size',
  'Spotify: High-Volume Genres',
  'Spotify: Weekly Stream Trend vs Prior Week',
  'Uber: Active Drivers With No Tips',
  'Uber: High-Volume Cities',
]

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function logFailure(title: string, reason: string) {
  const line = `[${new Date().toISOString()}] FAILED (retry-T3b): "${title}" — ${reason}\n`
  fs.appendFileSync(FAILURES_LOG, line, 'utf-8')
  console.log(`  FAILED: ${title} — ${reason}`)
}

// Use a per-task output file to avoid racing with parallel reenrichment shards.
// The merge step (scripts/reenrich-merge.ts) folds these into staged at the end.
const SQL_RETRY_OUT = path.join(SEEDS_DIR, 'reenrich-shard-sql-retry.json')

async function appendStaged(entries: StagedEntry[]) {
  if (entries.length === 0) return
  let existing: StagedEntry[] = []
  if (fs.existsSync(SQL_RETRY_OUT)) {
    try {
      existing = JSON.parse(fs.readFileSync(SQL_RETRY_OUT, 'utf-8')) as StagedEntry[]
    } catch {
      existing = []
    }
  }
  const titles = new Set(existing.map((e) => e.title))
  const toAdd = entries.filter((e) => !titles.has(e.title))
  if (toAdd.length === 0) return
  fs.writeFileSync(SQL_RETRY_OUT, JSON.stringify([...existing, ...toAdd], null, 2))
}

async function callHaiku(prompt: string, maxTokens = 6000): Promise<string> {
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
      const e = err as { status?: number; message?: string }
      const isRate =
        e.status === 429 ||
        (e.message ?? '').includes('429') ||
        (e.message ?? '').includes('rate_limit') ||
        (e.message ?? '').includes('concurrent')
      if (isRate && attempt < 8) {
        // Exponential backoff starting at 15s: 15, 30, 60, 120, 240, 480 sec
        const wait = 15000 * Math.pow(2, attempt - 1)
        const capWait = Math.min(wait, 300000) // cap at 5 min
        console.log(`  [rate-limit] backing off ${capWait / 1000}s (attempt ${attempt})`)
        await sleep(capWait)
        continue
      }
      throw err
    }
  }
}

function extractJson(text: string): unknown {
  // Try to find the outermost { ... } block
  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON in response')
  // Walk forward to find matching brace
  let depth = 0
  let end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) throw new Error('Unterminated JSON object in response')
  return JSON.parse(text.slice(start, end + 1))
}

function buildSqlPrompt(e: ScrapedEntry, attempt: number, feedback?: string): string {
  const isTopN = /top.?\d|rank|most|highest|best|popular|leading/i.test(e.problem_statement_markdown + e.title)
  const hasHaving = /having|group by.*count|aggregate/i.test(e.source_solution_prose)
  const hasWindow = /rank\s*\(|row_number\s*\(|dense_rank\s*\(|lag\s*\(|lead\s*\(|partition by/i.test(e.source_solution_prose)
  const hasDateFilter = /date|month|year|week|quarter|period|recent|last \d/i.test(e.source_solution_prose + e.problem_statement_markdown)

  const hintLines: string[] = []
  if (isTopN) hintLines.push('- This is a TOP-N or ranking query: seed AT LEAST 8 distinct entities so the top 3-5 are clearly differentiated.')
  if (hasHaving) hintLines.push('- Query uses HAVING or GROUP BY with aggregates: seed AT LEAST 5 groups where 3+ satisfy the HAVING threshold.')
  if (hasWindow) hintLines.push('- Query uses window functions (RANK/ROW_NUMBER/DENSE_RANK/LAG/LEAD): seed at least 10 rows per partition so ranking is non-trivial.')
  if (hasDateFilter) hintLines.push('- Query filters by date/time: ALL seeded dates MUST fall WITHIN the filter range (e.g. if filtering for 2023, use dates like 2023-01-15, not 2022-xx-xx).')

  const attemptHint =
    attempt === 1
      ? 'CRITICAL: A previous attempt generated data where the reference query returned 0 rows. You MUST fix this.'
      : attempt === 2
        ? 'CRITICAL SECOND RETRY: Previous seeds still produced 0 rows or a SQL error. Triple-check every JOIN condition, WHERE clause, and HAVING threshold in the reference solution, then create seed rows that explicitly satisfy each one.'
        : 'CRITICAL THIRD RETRY: Two previous attempts failed. Be extremely explicit: trace through the reference SQL step by step, list what values each table must contain to produce results, then INSERT exactly those values. Do not guess.'

  return `You are converting a scraped SQL interview problem into an EXECUTABLE SQL challenge for HackProduct.

${attemptHint}

GROUND TRUTH:
Title: ${e.title}
Difficulty: ${e.difficulty}
Category: ${e.source_category}
Question: ${e.problem_statement_markdown}
Hint: ${e.source_hint ?? ''}
Key concept: ${e.source_key_concept ?? ''}
Schema (DDL): ${e.source_schema_text ?? ''}
Reference solution (scraped — may have production-scale thresholds that need adjustment): ${e.source_solution_prose}
${feedback ? `\nPREVIOUS FAILURE REASON: ${feedback}\n` : ''}
SEED DATA REQUIREMENTS (mandatory):
- Insert 10-15 rows per table
- The reference query MUST return AT LEAST 3 rows (5+ preferred)
- At least 3 rows must satisfy every WHERE/HAVING/JOIN condition
${hintLines.join('\n')}
- Use SQLite-compatible syntax ONLY: TEXT (not VARCHAR), REAL (not DECIMAL/NUMERIC), INTEGER (not BIGINT). Do NOT use ILIKE, ::cast, or PostgreSQL-specific syntax.
- If the reference solution has a typo like "p.name" preceded by "http://", fix it — use the correct column reference.

IMPORTANT — THRESHOLD ADJUSTMENT:
The scraped reference solution may use production-scale HAVING thresholds (e.g. HAVING COUNT(*) > 500, HAVING SUM(...) > 50000) that are impossible to satisfy with 10-15 rows of seed data. You MUST scale these thresholds down to match your seed data. Examples:
- HAVING COUNT(*) > 500 → lower to HAVING COUNT(*) >= 3 (or whatever your seed data supports, ensuring >=3 groups qualify)
- HAVING SUM(revenue) > 50000 → lower to HAVING SUM(revenue) > 1000 (and seed revenue values accordingly)
- HAVING COUNT(*) > 50 → lower to HAVING COUNT(*) >= 3
The reference_solution in your JSON must use the ADJUSTED threshold, not the scraped one. The problem statement (problem_statement_markdown) stays as-is — only the SQL changes.

PRODUCE valid JSON ONLY (no preamble, no markdown fences, no trailing commas):
{
  "sql_schema": {
    "dialect": "sqlite",
    "setup_script": "<CREATE TABLE statements using SQLite types + INSERT INTO with 10-15 rows per table. Seed data MUST satisfy every filter, join, and aggregation in the reference query so it returns >=3 rows.>",
    "schema_diagram": {
      "tables": [{ "name": "...", "columns": [{ "name": "...", "type": "...", "constraints": [] }] }],
      "relationships": [{ "from": "table.col", "to": "table.col", "type": "many-to-one" }]
    },
    "sample_data_preview": { "tableName": [ {"col": "value"} ] }
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc2", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc3", "label": "<edge case>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": true }
  ],
  "starter_code": { "sql": "-- Write your SQL query here\\n" },
  "reference_solution": { "sql": "<EXECUTABLE SQLite SQL with ADJUSTED thresholds that produces >=3 rows against the seeded data above>" },
  "reference_approach": "<one paragraph>"
}

RULES:
- Use SQLite syntax. RANK/DENSE_RANK/ROW_NUMBER/LAG/LEAD/CTEs/window functions all supported.
- Leave expected_rows: [] — driver will populate.
- The JSON must be complete and valid — no truncation.`
}

function validateSql(r: SqlHaiku): string[] {
  const errs: string[] = []
  if (!r.sql_schema?.setup_script) errs.push('missing setup_script')
  if (!r.reference_solution?.sql) errs.push('missing reference_solution.sql')
  if (!Array.isArray(r.test_cases) || r.test_cases.length < 2) errs.push('test_cases<2')
  return errs
}

async function execSqlAndPopulate(haiku: SqlHaiku): Promise<{ ok: boolean; reason?: string; rowCount?: number }> {
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
    if (rows.length < 3) {
      return { ok: false, reason: `reference query returned only ${rows.length} row(s), need >=3` }
    }
    for (const tc of haiku.test_cases) {
      tc.expected_rows = rows
    }
    return { ok: true, rowCount: rows.length }
  } catch (err) {
    return { ok: false, reason: (err as Error).message }
  } finally {
    db.close()
  }
}

async function enrichSqlOne(e: ScrapedEntry): Promise<StagedEntry | null> {
  let feedback: string | undefined
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  [${e.title}] attempt ${attempt}/${maxAttempts}`)
      const text = await callHaiku(buildSqlPrompt(e, attempt, feedback))

      let parsed: SqlHaiku
      try {
        parsed = extractJson(text) as SqlHaiku
      } catch (parseErr) {
        const reason = `JSON parse error: ${(parseErr as Error).message}`
        if (attempt === maxAttempts) {
          logFailure(e.title, reason)
          return null
        }
        feedback = `previous response had invalid JSON: ${(parseErr as Error).message}. Ensure the JSON is complete and valid with no trailing commas.`
        await sleep(1000)
        continue
      }

      const errs = validateSql(parsed)
      if (errs.length > 0) {
        if (attempt === maxAttempts) {
          logFailure(e.title, `sql validation: ${errs.join(', ')}`)
          return null
        }
        feedback = `previous attempt was structurally invalid: ${errs.join(', ')}`
        continue
      }

      const exec = await execSqlAndPopulate(parsed)
      if (!exec.ok) {
        if (attempt === maxAttempts) {
          logFailure(e.title, `sql.js: ${exec.reason}`)
          return null
        }
        feedback = `previous setup_script + reference_solution failed: ${exec.reason}. Re-examine every WHERE clause, JOIN condition, and HAVING threshold in the reference SQL and ensure the seeded data satisfies each one explicitly.`
        continue
      }

      console.log(`  [${e.title}] OK — ${exec.rowCount} rows returned`)
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
      if (attempt === maxAttempts) {
        logFailure(e.title, `api: ${(err as Error).message}`)
        return null
      }
      feedback = `previous attempt threw an error: ${(err as Error).message}`
      await sleep(3000)
    }
  }
  return null
}

async function runWithConcurrency(
  items: ScrapedEntry[],
  concurrency: number
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
            const res = await enrichSqlOne(items[i])
            if (res) {
              succeeded++
              await appendStaged([res])
            } else {
              failed++
            }
          } catch (err) {
            failed++
            logFailure(items[i].title, `unhandled: ${(err as Error).message}`)
          }
          console.log(`[progress] ${succeeded + failed}/${items.length} — succeeded=${succeeded} failed=${failed}`)
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
  if (!fs.existsSync(STAGED_PATH)) {
    console.error('staged-interview-challenges.json missing')
    process.exit(1)
  }

  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedEntry[]
  const staged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Array<{ title: string }>
  const stagedTitles = new Set(staged.map((e) => e.title))

  // Filter to the 25 missing titles, only those that exist in scraped-raw.json and not yet staged
  const targets = scraped.filter((e) => MISSING_TITLES.includes(e.title) && !stagedTitles.has(e.title))

  const alreadyDone = MISSING_TITLES.filter((t) => stagedTitles.has(t))
  const notInScraped = MISSING_TITLES.filter((t) => !scraped.find((e) => e.title === t))

  console.log('=== T3b SQL Retry ===')
  console.log(`Staged baseline: ${staged.length} total, ${staged.filter((e) => (e as unknown as {is_sql?: boolean}).is_sql).length} SQL`)
  console.log(`Targets to retry: ${targets.length}`)
  if (alreadyDone.length) console.log(`Already in staged (skip): ${alreadyDone.join(', ')}`)
  if (notInScraped.length) console.log(`Not found in scraped-raw.json (skip): ${notInScraped.join(', ')}`)
  console.log(`Concurrency: ${SQL_CONCURRENCY}, pace: ${PACE_MS}ms\n`)

  if (targets.length === 0) {
    console.log('Nothing to do — all 25 are already in staged or not in scraped-raw.json.')
    return
  }

  const { succeeded, failed } = await runWithConcurrency(targets, SQL_CONCURRENCY)

  // Merge shard into staged-interview-challenges.json
  if (fs.existsSync(SQL_RETRY_OUT) && succeeded > 0) {
    const shard = JSON.parse(fs.readFileSync(SQL_RETRY_OUT, 'utf-8')) as StagedEntry[]
    const mainStaged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
    const mainTitles = new Set(mainStaged.map((e) => (e as { title?: string }).title ?? ''))
    const toMerge = shard.filter((e) => !mainTitles.has(e.title))
    if (toMerge.length > 0) {
      fs.writeFileSync(STAGED_PATH, JSON.stringify([...mainStaged, ...toMerge], null, 2))
      console.log(`Merged ${toMerge.length} entries from shard into staged-interview-challenges.json`)
    }
  }

  // Final count
  const finalStaged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Array<{ is_sql?: boolean; metadata?: { source?: string } }>
  const finalSqlCount = finalStaged.filter((e) => e.is_sql && e.metadata?.source === 'notion-scraped').length

  console.log('\n=== T3b DONE ===')
  console.log(`Recovered: ${succeeded}/${targets.length}`)
  console.log(`Still failed: ${failed}`)
  console.log(`Total notion-scraped SQL in staged: ${finalSqlCount} (was 87, target ≥100)`)
  console.log(`Failures log: ${FAILURES_LOG}`)
  console.log(`Shard file: ${SQL_RETRY_OUT}`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
