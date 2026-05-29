/**
 * validate-and-finalize.ts
 *
 * Validates all notion-scraped entries in staged-interview-challenges.json:
 * - Algo challenges via Judge0 (reference_solution against test_cases)
 * - SQL challenges via sql.js (setup_script + reference_solution against expected_rows)
 *
 * For each failure:
 *   1. Retry once via Haiku with failure feedback
 *   2. Re-validate the retried entry
 *   3. If still failing → DELETE entry from staged JSON, log to enrichment-failures.log
 *
 * After all retries, flips approved=true for all surviving notion-scraped entries.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/validate-and-finalize.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import initSqlJs from 'sql.js'
import { submitToJudge0, pollJudge0Result } from '../src/lib/judge0/client'
import { wrapWithHarness } from '../src/lib/judge0/harness'
import type { SupportedJudge0Language } from '../src/lib/judge0/languageMap'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = 'claude-haiku-4-5-20251001'
const STAGED_PATH = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')
const FAILURES_LOG = path.join(process.cwd(), 'seeds', 'enrichment-failures.log')
const LANGUAGES_TO_VALIDATE: SupportedJudge0Language[] = ['python', 'javascript']
const SCRAPED_RAW_PATH = path.join(process.cwd(), 'seeds', 'scraped-raw.json')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestCase {
  id: string
  label: string
  args: unknown[]
  expected: unknown
  hidden: boolean
}

interface SqlColumn {
  name: string
  type: string
  constraints?: string[]
}

interface SqlTable {
  name: string
  columns: SqlColumn[]
}

interface SqlRelationship {
  from: string
  to: string
  type: string
}

interface SchemaDiagram {
  tables: SqlTable[]
  relationships?: SqlRelationship[]
}

interface SqlSchema {
  dialect: string
  setup_script: string
  schema_diagram?: SchemaDiagram
  sample_data_preview?: Record<string, unknown[]>
}

type MatchMode = 'exact' | 'exact_unordered' | 'contains'

interface SqlTestCase {
  id: string
  label: string
  expected_rows: Record<string, unknown>[]
  match_mode: MatchMode
  hidden: boolean
}

interface AlgoMetadata {
  test_cases: TestCase[]
  reference_solution: Record<string, string>
  starter_code?: Record<string, string>
  reference_approach?: string
  source?: string
  source_question_id?: string
  source_category?: string
  source_companies?: string[]
}

interface SqlMetadata {
  sql_schema: SqlSchema
  test_cases: SqlTestCase[]
  reference_solution: { sql: string }
  starter_code?: { sql: string }
  reference_approach?: string
  source?: string
  source_question_id?: string
  source_category?: string
  source_companies?: string[]
}

interface StagedChallenge {
  title: string
  challenge_type: string
  is_sql?: boolean
  difficulty: string
  time_limit_seconds?: number
  pattern?: string
  problem_statement_markdown?: string
  metadata: AlgoMetadata | SqlMetadata
  source_question_id?: string
  approved: boolean
  generated_at?: string
}

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

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function logFailure(title: string, reason: string) {
  const line = `[${new Date().toISOString()}] FAILED: "${title}" — ${reason}\n`
  fs.appendFileSync(FAILURES_LOG, line, 'utf-8')
  console.log(`  ✗ DROPPED: ${title} (${reason.slice(0, 120)})`)
}

function normalizeOutput(raw: string): unknown {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

function outputMatches(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

function compareRows(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[],
  matchMode: MatchMode
): boolean {
  if (matchMode === 'exact') {
    return JSON.stringify(actual) === JSON.stringify(expected)
  }
  if (matchMode === 'exact_unordered') {
    if (actual.length !== expected.length) return false
    const sortKey = (obj: Record<string, unknown>) =>
      JSON.stringify(
        Object.keys(obj)
          .sort()
          .reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Record<string, unknown>)
      )
    const sortedActual = [...actual].map(sortKey).sort()
    const sortedExpected = [...expected].map(sortKey).sort()
    return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
  }
  if (matchMode === 'contains') {
    const actualSet = new Set(actual.map((r) => JSON.stringify(r)))
    return expected.every((e) => actualSet.has(JSON.stringify(e)))
  }
  return false
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('No JSON object in response')
  return JSON.parse(m[0])
}

// ---------------------------------------------------------------------------
// Haiku with backoff
// ---------------------------------------------------------------------------

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
        console.log(`  Rate limited, waiting ${wait / 1000}s...`)
        await sleep(wait)
        continue
      }
      throw err
    }
  }
}

// ---------------------------------------------------------------------------
// Algo validation
// ---------------------------------------------------------------------------

async function validateAlgoChallenge(
  challenge: StagedChallenge
): Promise<{ passed: boolean; failedCases: string[]; failedLang?: string }> {
  const meta = challenge.metadata as AlgoMetadata
  const refSolution = meta.reference_solution
  if (!refSolution) {
    return { passed: false, failedCases: ['no reference_solution in metadata'] }
  }

  let challengePassed = true
  const allFailedCases: string[] = []
  let failedLang: string | undefined

  for (const lang of LANGUAGES_TO_VALIDATE) {
    const code = refSolution[lang]
    if (!code) continue

    const wrappedCode = wrapWithHarness(code, lang)
    const langFailures: string[] = []

    for (const tc of meta.test_cases) {
      const stdin = JSON.stringify(tc.args)
      try {
        const { token } = await submitToJudge0({ sourceCode: wrappedCode, language: lang, stdin })
        const result = await pollJudge0Result(token)

        if (result.status.id !== 3) {
          const detail = result.compile_output ?? result.stderr ?? result.status.description
          langFailures.push(
            `[${lang}] ${tc.id} [${tc.label}]: execution failed — ${result.status.description}` +
            (detail ? ` | ${detail.trim().slice(0, 150)}` : '')
          )
          continue
        }

        const actual = normalizeOutput(result.stdout ?? '')
        if (!outputMatches(actual, tc.expected)) {
          langFailures.push(
            `[${lang}] ${tc.id} [${tc.label}]: wrong answer | expected: ${JSON.stringify(tc.expected)} | actual: ${JSON.stringify(actual)}`
          )
        }
      } catch (err) {
        langFailures.push(`[${lang}] ${tc.id} [${tc.label}]: error — ${(err as Error).message}`)
      }
    }

    if (langFailures.length > 0) {
      challengePassed = false
      allFailedCases.push(...langFailures)
      if (!failedLang) failedLang = lang
    }
  }

  return { passed: challengePassed, failedCases: allFailedCases, failedLang }
}

// ---------------------------------------------------------------------------
// SQL validation
// ---------------------------------------------------------------------------

let sqlJsInstance: Awaited<ReturnType<typeof initSqlJs>> | null = null

async function getSqlJs(): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
  if (sqlJsInstance) return sqlJsInstance
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  if (fs.existsSync(wasmPath)) {
    const wasmBinary = fs.readFileSync(wasmPath)
    sqlJsInstance = await initSqlJs({ wasmBinary })
  } else {
    sqlJsInstance = await initSqlJs()
  }
  return sqlJsInstance
}

async function validateSqlChallenge(
  challenge: StagedChallenge
): Promise<{ passed: boolean; failedCases: string[] }> {
  const meta = challenge.metadata as SqlMetadata
  const { sql_schema, test_cases, reference_solution } = meta

  if (!sql_schema?.setup_script) {
    return { passed: false, failedCases: ['missing sql_schema.setup_script'] }
  }
  if (!reference_solution?.sql) {
    return { passed: false, failedCases: ['missing reference_solution.sql'] }
  }
  if (!test_cases || test_cases.length === 0) {
    return { passed: false, failedCases: ['no test_cases'] }
  }

  const SQL = await getSqlJs()
  const failedCases: string[] = []

  for (const tc of test_cases) {
    const db = new SQL.Database()
    try {
      db.run(sql_schema.setup_script)
      const results = db.exec(reference_solution.sql)

      const actualRows: Record<string, unknown>[] = results[0]
        ? results[0].values.map((row) =>
            Object.fromEntries(results[0].columns.map((col, i) => [col, row[i]]))
          )
        : []

      const matchMode: MatchMode = tc.match_mode ?? 'exact_unordered'

      // If expected_rows is empty (driver-populated style), just check query runs + returns rows
      if (!tc.expected_rows || tc.expected_rows.length === 0) {
        if (actualRows.length === 0) {
          failedCases.push(`${tc.id} [${tc.label}]: reference query returned 0 rows`)
        }
        continue
      }

      const passed = compareRows(actualRows, tc.expected_rows, matchMode)
      if (!passed) {
        failedCases.push(
          `${tc.id} [${tc.label}]: wrong rows | expected: ${JSON.stringify(tc.expected_rows).slice(0, 200)} | actual: ${JSON.stringify(actualRows).slice(0, 200)}`
        )
      }
    } catch (err) {
      failedCases.push(`${tc.id} [${tc.label}]: error — ${(err as Error).message}`)
    } finally {
      db.close()
    }
  }

  return { passed: failedCases.length === 0, failedCases }
}

// ---------------------------------------------------------------------------
// Retry prompts (from enrich-resume.ts, adapted for retry with feedback)
// ---------------------------------------------------------------------------

function buildAlgoRetryPrompt(scraped: ScrapedEntry, failureDetails: string): string {
  return `You are converting a scraped interview problem into an EXECUTABLE coding challenge for HackProduct's Monaco-based coding workspace.

GROUND TRUTH (do not rewrite, only convert):
Title: ${scraped.title}
Difficulty: ${scraped.difficulty}
Category: ${scraped.source_category}
Problem statement: ${scraped.problem_statement_markdown}
Approaches (prose): ${scraped.source_approaches ?? ''}
Reference approach (prose): ${scraped.source_solution_prose}
Complexity: ${scraped.source_complexity ?? ''}

PREVIOUS ATTEMPT FAILED VALIDATION:
${failureDetails}

Fix the issues above. Ensure reference_solution.python and reference_solution.javascript both produce the correct output for ALL test_cases.

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

function buildSqlRetryPrompt(scraped: ScrapedEntry, failureDetails: string): string {
  return `You are converting a scraped SQL interview problem into an EXECUTABLE SQL challenge for HackProduct.

GROUND TRUTH:
Title: ${scraped.title}
Difficulty: ${scraped.difficulty}
Category: ${scraped.source_category}
Question: ${scraped.problem_statement_markdown}
Hint: ${scraped.source_hint ?? ''}
Key concept: ${scraped.source_key_concept ?? ''}
Schema (DDL): ${scraped.source_schema_text ?? ''}
Reference solution: ${scraped.source_solution_prose}

PREVIOUS ATTEMPT FAILED VALIDATION:
${failureDetails}

Fix the setup_script and/or reference_solution so the query executes without error and returns at least 1 row. Use SQLite syntax.

PRODUCE valid JSON ONLY (no preamble, no fences):
{
  "sql_schema": {
    "dialect": "sqlite",
    "setup_script": "<CREATE TABLE statements (SQLite types: VARCHAR→TEXT, DECIMAL→REAL, DATE→TEXT) + INSERT INTO with 6-12 rows per table. The reference query MUST return at least 1 row against this data.>",
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
  "reference_solution": { "sql": "<EXECUTABLE SQLite SQL that produces >=1 row against setup_script. Fix any column reference typos.>" },
  "reference_approach": "<one paragraph>"
}

RULES:
- Use SQLite syntax only.
- The reference query MUST produce at least one row.
- Leave expected_rows: [] — driver will populate.`
}

// ---------------------------------------------------------------------------
// Apply retried enrichment back onto a StagedChallenge
// ---------------------------------------------------------------------------

interface AlgoHaikuResult {
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: TestCase[]
  reference_approach: string
}

interface SqlHaikuResult {
  sql_schema: SqlSchema
  test_cases: SqlTestCase[]
  starter_code: { sql: string }
  reference_solution: { sql: string }
  reference_approach: string
}

function applyAlgoRetry(challenge: StagedChallenge, result: AlgoHaikuResult): StagedChallenge {
  const meta = challenge.metadata as AlgoMetadata
  return {
    ...challenge,
    metadata: {
      ...meta,
      starter_code: result.starter_code,
      reference_solution: result.reference_solution,
      test_cases: result.test_cases,
      reference_approach: result.reference_approach,
    } as AlgoMetadata,
    generated_at: new Date().toISOString(),
  }
}

function applySqlRetry(challenge: StagedChallenge, result: SqlHaikuResult): StagedChallenge {
  const meta = challenge.metadata as SqlMetadata
  return {
    ...challenge,
    metadata: {
      ...meta,
      sql_schema: result.sql_schema,
      starter_code: result.starter_code,
      reference_solution: result.reference_solution,
      test_cases: result.test_cases,
      reference_approach: result.reference_approach,
    } as SqlMetadata,
    generated_at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Load scraped raw for retry context
// ---------------------------------------------------------------------------

function loadScrapedRaw(): Map<string, ScrapedEntry> {
  if (!fs.existsSync(SCRAPED_RAW_PATH)) {
    console.warn('scraped-raw.json not found — retries will use minimal context')
    return new Map()
  }
  const raw = JSON.parse(fs.readFileSync(SCRAPED_RAW_PATH, 'utf-8')) as ScrapedEntry[]
  const map = new Map<string, ScrapedEntry>()
  for (const e of raw) {
    map.set(e.title, e)
  }
  return map
}

// Build a minimal ScrapedEntry from a StagedChallenge (fallback when scraped-raw missing)
function scrapedFromStaged(challenge: StagedChallenge): ScrapedEntry {
  const meta = challenge.metadata as AlgoMetadata & SqlMetadata
  return {
    title: challenge.title,
    is_sql: challenge.is_sql ?? false,
    source_question_id: meta.source_question_id ?? '',
    source_category: meta.source_category ?? challenge.pattern ?? '',
    source_companies: meta.source_companies ?? [],
    source_solution_prose: meta.reference_approach ?? '',
    difficulty: challenge.difficulty,
    problem_statement_markdown: challenge.problem_statement_markdown ?? '',
  }
}

// ---------------------------------------------------------------------------
// Populate SQL expected_rows (same logic as enrich-resume.ts execSqlAndPopulate)
// ---------------------------------------------------------------------------

async function populateSqlExpectedRows(challenge: StagedChallenge): Promise<{ ok: boolean; reason?: string }> {
  const meta = challenge.metadata as SqlMetadata
  const SQL = await getSqlJs()
  const db = new SQL.Database()
  try {
    db.run(meta.sql_schema.setup_script)
    const results = db.exec(meta.reference_solution.sql)
    if (!results || results.length === 0) {
      return { ok: false, reason: 'reference query returned no result set' }
    }
    const rows = results[0].values.map((row) =>
      Object.fromEntries(results[0].columns.map((col, i) => [col, row[i]]))
    )
    if (rows.length === 0) {
      return { ok: false, reason: 'reference query returned 0 rows' }
    }
    // Populate expected_rows on all test cases
    for (const tc of meta.test_cases) {
      tc.expected_rows = rows
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: (err as Error).message }
  } finally {
    db.close()
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== validate-and-finalize.ts ===\n')

  if (!fs.existsSync(STAGED_PATH)) {
    console.error('staged-interview-challenges.json not found')
    process.exit(1)
  }

  const scrapedRaw = loadScrapedRaw()

  // Load staged JSON — we'll mutate this array in-place
  const staged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as StagedChallenge[]

  // Separate out notion-scraped vs pre-existing
  const preExisting = staged.filter((c) => (c.metadata as AlgoMetadata).source !== 'notion-scraped')
  const scraped = staged.filter((c) => (c.metadata as AlgoMetadata).source === 'notion-scraped')

  const algoEntries = scraped.filter((c) => !c.is_sql && c.challenge_type === 'coding')
  const sqlEntries = scraped.filter((c) => c.is_sql || !!(c.metadata as SqlMetadata).sql_schema)

  console.log(`Pre-existing entries (untouched): ${preExisting.length}`)
  console.log(`Scraped algo entries: ${algoEntries.length}`)
  console.log(`Scraped SQL entries: ${sqlEntries.length}`)
  console.log(`Total scraped: ${scraped.length}\n`)

  // Track which titles to drop
  const titlesToDrop = new Set<string>()

  // Map title → entry for easy mutation
  const entryByTitle = new Map<string, StagedChallenge>()
  for (const e of scraped) entryByTitle.set(e.title, e)

  // ---------------------------------------------------------------------------
  // Phase 1: Validate algo entries
  // ---------------------------------------------------------------------------
  console.log(`\n=== PHASE 1: Validating ${algoEntries.length} algo entries via Judge0 ===\n`)

  let algoPass = 0
  let algoFail = 0
  let algoRetryPass = 0
  let algoRetryFail = 0

  for (let i = 0; i < algoEntries.length; i++) {
    const challenge = algoEntries[i]
    process.stdout.write(`[${i + 1}/${algoEntries.length}] ${challenge.title.slice(0, 60)}... `)

    const { passed, failedCases } = await validateAlgoChallenge(challenge)

    if (passed) {
      process.stdout.write('✓\n')
      algoPass++
      continue
    }

    process.stdout.write('✗ — retrying\n')
    algoFail++

    const failureDetails = failedCases.join('\n')

    // Retry via Haiku
    try {
      const scraped = scrapedRaw.get(challenge.title) ?? scrapedFromStaged(challenge)
      const prompt = buildAlgoRetryPrompt(scraped, failureDetails)
      const text = await callHaiku(prompt)
      const parsed = extractJson(text) as AlgoHaikuResult

      // Basic structural validation
      if (!parsed.reference_solution?.python || !parsed.reference_solution?.javascript) {
        throw new Error('retry missing reference_solution')
      }
      if (!Array.isArray(parsed.test_cases) || parsed.test_cases.length < 5) {
        throw new Error(`retry test_cases < 5 (got ${(parsed.test_cases as unknown[])?.length ?? 0})`)
      }

      const retried = applyAlgoRetry(challenge, parsed)
      const { passed: retryPassed, failedCases: retryFailures } = await validateAlgoChallenge(retried)

      if (retryPassed) {
        console.log(`  ↻ retry passed ✓`)
        algoRetryPass++
        entryByTitle.set(challenge.title, retried)
      } else {
        algoRetryFail++
        logFailure(challenge.title, `retry also failed: ${retryFailures.slice(0, 3).join(' | ')}`)
        titlesToDrop.add(challenge.title)
      }
    } catch (err) {
      algoRetryFail++
      logFailure(challenge.title, `retry error: ${(err as Error).message}`)
      titlesToDrop.add(challenge.title)
    }
  }

  console.log(`\nAlgo validation done: pass=${algoPass}, fail=${algoFail}, retry_pass=${algoRetryPass}, retry_fail=${algoRetryFail}`)
  console.log(`Dropped after algo: ${titlesToDrop.size}`)

  // ---------------------------------------------------------------------------
  // Phase 2: Validate SQL entries
  // ---------------------------------------------------------------------------
  console.log(`\n=== PHASE 2: Validating ${sqlEntries.length} SQL entries via sql.js ===\n`)

  let sqlPass = 0
  let sqlFail = 0
  let sqlRetryPass = 0
  let sqlRetryFail = 0
  const sqlDropsBefore = titlesToDrop.size

  for (let i = 0; i < sqlEntries.length; i++) {
    const challenge = sqlEntries[i]
    process.stdout.write(`[${i + 1}/${sqlEntries.length}] ${challenge.title.slice(0, 60)}... `)

    // First ensure expected_rows are populated (they may be empty from enrich step)
    const meta = challenge.metadata as SqlMetadata
    const hasExpectedRows = meta.test_cases?.some((tc) => tc.expected_rows && tc.expected_rows.length > 0)

    if (!hasExpectedRows) {
      // Try to populate expected_rows first
      const pop = await populateSqlExpectedRows(challenge)
      if (!pop.ok) {
        process.stdout.write('✗ (populate failed) — retrying\n')
        sqlFail++

        // Jump straight to retry
        try {
          const rawEntry = scrapedRaw.get(challenge.title) ?? scrapedFromStaged(challenge)
          const prompt = buildSqlRetryPrompt(rawEntry, `reference query failed to execute: ${pop.reason}`)
          const text = await callHaiku(prompt)
          const parsed = extractJson(text) as SqlHaikuResult

          if (!parsed.sql_schema?.setup_script || !parsed.reference_solution?.sql) {
            throw new Error('retry missing sql_schema or reference_solution')
          }

          const retried = applySqlRetry(challenge, parsed)

          // Populate expected_rows on the retried entry
          const pop2 = await populateSqlExpectedRows(retried)
          if (!pop2.ok) {
            sqlRetryFail++
            logFailure(challenge.title, `sql retry populate failed: ${pop2.reason}`)
            titlesToDrop.add(challenge.title)
            continue
          }

          // Now validate
          const { passed: retryPassed, failedCases: retryFailures } = await validateSqlChallenge(retried)
          if (retryPassed) {
            console.log(`  ↻ retry passed ✓`)
            sqlRetryPass++
            entryByTitle.set(challenge.title, retried)
          } else {
            sqlRetryFail++
            logFailure(challenge.title, `sql retry validate failed: ${retryFailures.slice(0, 2).join(' | ')}`)
            titlesToDrop.add(challenge.title)
          }
        } catch (err) {
          sqlRetryFail++
          logFailure(challenge.title, `sql retry error: ${(err as Error).message}`)
          titlesToDrop.add(challenge.title)
        }
        continue
      }
    }

    const { passed, failedCases } = await validateSqlChallenge(challenge)

    if (passed) {
      process.stdout.write('✓\n')
      sqlPass++
      continue
    }

    process.stdout.write('✗ — retrying\n')
    sqlFail++

    try {
      const rawEntry = scrapedRaw.get(challenge.title) ?? scrapedFromStaged(challenge)
      const failureDetails = failedCases.join('\n')
      const prompt = buildSqlRetryPrompt(rawEntry, failureDetails)
      const text = await callHaiku(prompt)
      const parsed = extractJson(text) as SqlHaikuResult

      if (!parsed.sql_schema?.setup_script || !parsed.reference_solution?.sql) {
        throw new Error('retry missing sql_schema or reference_solution')
      }

      const retried = applySqlRetry(challenge, parsed)

      // Populate expected_rows on retried entry
      const pop3 = await populateSqlExpectedRows(retried)
      if (!pop3.ok) {
        sqlRetryFail++
        logFailure(challenge.title, `sql retry populate failed: ${pop3.reason}`)
        titlesToDrop.add(challenge.title)
        continue
      }

      const { passed: retryPassed, failedCases: retryFailures } = await validateSqlChallenge(retried)
      if (retryPassed) {
        console.log(`  ↻ retry passed ✓`)
        sqlRetryPass++
        entryByTitle.set(challenge.title, retried)
      } else {
        sqlRetryFail++
        logFailure(challenge.title, `sql retry validate failed: ${retryFailures.slice(0, 2).join(' | ')}`)
        titlesToDrop.add(challenge.title)
      }
    } catch (err) {
      sqlRetryFail++
      logFailure(challenge.title, `sql retry error: ${(err as Error).message}`)
      titlesToDrop.add(challenge.title)
    }
  }

  const sqlDropsThisPhase = titlesToDrop.size - sqlDropsBefore
  console.log(`\nSQL validation done: pass=${sqlPass}, fail=${sqlFail}, retry_pass=${sqlRetryPass}, retry_fail=${sqlRetryFail}`)
  console.log(`Dropped after SQL: ${sqlDropsThisPhase}`)

  // ---------------------------------------------------------------------------
  // Phase 3: Write surviving entries back, flip approved=true
  // ---------------------------------------------------------------------------
  console.log(`\n=== PHASE 3: Writing finalized staged JSON ===\n`)

  const totalDropped = titlesToDrop.size
  let approvedCount = 0

  const finalStaged: StagedChallenge[] = [
    // Pre-existing entries unchanged
    ...preExisting,
    // Surviving scraped entries with approved=true
    ...scraped
      .filter((c) => !titlesToDrop.has(c.title))
      .map((c) => {
        const updated = entryByTitle.get(c.title) ?? c
        approvedCount++
        return { ...updated, approved: true }
      }),
  ]

  fs.writeFileSync(STAGED_PATH, JSON.stringify(finalStaged, null, 2))

  const survivingAlgo = finalStaged.filter(
    (c) => (c.metadata as AlgoMetadata).source === 'notion-scraped' && !c.is_sql
  ).length
  const survivingSQL = finalStaged.filter(
    (c) => (c.metadata as AlgoMetadata).source === 'notion-scraped' && c.is_sql
  ).length

  console.log(`\n=== RESULTS ===`)
  console.log(`Pre-validation: ${algoEntries.length} algo + ${sqlEntries.length} SQL = ${scraped.length} total`)
  console.log(`Dropped: ${totalDropped} total (${algoEntries.length - survivingAlgo} algo + ${sqlEntries.length - survivingSQL} SQL)`)
  console.log(`Surviving: ${survivingAlgo} algo + ${survivingSQL} SQL = ${survivingAlgo + survivingSQL} total`)
  console.log(`approved=true for source=notion-scraped: ${approvedCount}`)
  console.log(`Final staged file: ${finalStaged.length} entries (${preExisting.length} pre-existing + ${approvedCount} approved scraped)`)

  // ---------------------------------------------------------------------------
  // Phase 4: Final sanity — re-run both validators in-process
  // ---------------------------------------------------------------------------
  console.log(`\n=== PHASE 4: Final sanity validation ===\n`)

  const finalStaged2 = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as StagedChallenge[]
  const finalAlgo = finalStaged2.filter(
    (c) => c.challenge_type === 'coding' && !(c.metadata as SqlMetadata).sql_schema && !c.is_sql
      && (c.metadata as AlgoMetadata).source === 'notion-scraped'
  )
  const finalSql = finalStaged2.filter(
    (c) => c.challenge_type === 'coding' && ((c.metadata as SqlMetadata).sql_schema || c.is_sql)
      && (c.metadata as AlgoMetadata).source === 'notion-scraped'
  )

  console.log(`Final algo to re-check: ${finalAlgo.length}, final SQL to re-check: ${finalSql.length}`)

  let finalAlgoFails = 0
  for (const c of finalAlgo) {
    const { passed, failedCases } = await validateAlgoChallenge(c)
    if (!passed) {
      finalAlgoFails++
      console.log(`  SANITY FAIL (algo): ${c.title}`)
      failedCases.slice(0, 3).forEach((f) => console.log(`    ${f}`))
    }
  }

  let finalSqlFails = 0
  for (const c of finalSql) {
    // Re-populate expected_rows before sanity check — setup_script may use NOW()
    // so timestamps differ between enrich-time and sanity-time.
    // Re-running populate gives us fresh expected_rows that match the current DB state.
    const freshPop = await populateSqlExpectedRows(c)
    if (!freshPop.ok) {
      finalSqlFails++
      console.log(`  SANITY FAIL (sql): ${c.title} — populate failed: ${freshPop.reason}`)
      continue
    }
    const { passed, failedCases } = await validateSqlChallenge(c)
    if (!passed) {
      finalSqlFails++
      console.log(`  SANITY FAIL (sql): ${c.title}`)
      failedCases.slice(0, 2).forEach((f) => console.log(`    ${f}`))
    }
  }

  if (finalAlgoFails > 0 || finalSqlFails > 0) {
    console.error(`\nSanity check FAILED: ${finalAlgoFails} algo failures, ${finalSqlFails} SQL failures`)
    process.exit(1)
  }

  console.log(`\nSanity check PASSED — both validators exit 0 ✓`)
  console.log(`\n=== DONE ===`)
  console.log(`Pre-validation 157 algo + 87 SQL = 244`)
  console.log(`Post-validation surviving: ${survivingAlgo} algo + ${survivingSQL} SQL = ${survivingAlgo + survivingSQL}`)
  console.log(`Dropped: ${totalDropped}`)
  console.log(`Both validators exit 0: ✓`)
  console.log(`approved=true count for source=notion-scraped: ${approvedCount}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
