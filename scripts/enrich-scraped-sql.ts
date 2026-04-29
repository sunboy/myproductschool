/**
 * Enrich scraped SQL challenges with Haiku-generated schemas, test cases,
 * and reference solutions. Runs the reference solution through sql.js to
 * populate expected_rows accurately.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/enrich-scraped-sql.ts
 *
 * Dry-run 3 entries:
 *   npx tsx --env-file=.env.local scripts/enrich-scraped-sql.ts --limit 3
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrapedEntry {
  title: string
  challenge_type: string
  is_sql: boolean
  source_question_id?: string
  source_category?: string
  source_companies?: string[]
  source_role_levels?: string[]
  source_solution_prose?: string
  source_schema_text?: string
  source_hint?: string
  source_key_concept?: string
  source_followup?: string
  time_min?: number
  recency_score?: number
  difficulty?: string
  problem_statement_markdown?: string
  metadata?: Record<string, unknown>
  approved?: boolean
}

interface HaikuSqlResult {
  sql_schema: {
    dialect: string
    setup_script: string
    schema_diagram: {
      tables: Array<{
        name: string
        columns: Array<{ name: string; type: string; constraints?: string[] }>
      }>
      relationships?: Array<{ from: string; to: string; type: string }>
    }
    sample_data_preview?: Record<string, unknown[]>
  }
  test_cases: Array<{
    id: string
    label: string
    expected_rows: Record<string, unknown>[]
    match_mode: string
    hidden: boolean
  }>
  starter_code: { sql: string }
  reference_solution: { sql: string }
  reference_approach: string
}

// ---------------------------------------------------------------------------
// Build the Haiku prompt for a single SQL entry
// ---------------------------------------------------------------------------

function buildHaikuPrompt(entry: ScrapedEntry, feedbackPrefix?: string): string {
  const feedbackLine = feedbackPrefix
    ? `NOTE: ${feedbackPrefix}\n\n`
    : ''

  return `${feedbackLine}You are converting a scraped SQL interview problem into an EXECUTABLE SQL challenge for HackProduct.

GROUND TRUTH (the scraped Schema text is the canonical schema — preserve table names and column names; the scraped Solution is the canonical query — fix only obvious typos like literal "http://" prefixes that snuck in from URL autoformatting):
Title: ${entry.title}
Difficulty: ${entry.difficulty ?? 'medium'}
Category: ${entry.source_category ?? ''}
Question: ${entry.problem_statement_markdown ?? ''}
Hint: ${entry.source_hint ?? ''}
Key concept: ${entry.source_key_concept ?? ''}
Schema (DDL): ${entry.source_schema_text ?? ''}
Reference solution: ${entry.source_solution_prose ?? ''}

PRODUCE valid JSON ONLY (no preamble, no fences):
{
  "sql_schema": {
    "dialect": "sqlite",
    "setup_script": "<full CREATE TABLE statements MATCHING the schema above (translate any non-SQLite types to SQLite-compatible: VARCHAR→TEXT, DECIMAL→REAL, DATE→TEXT, etc.) followed by INSERT INTO statements with 5–10 rows per table designed to exercise this category's pattern. Realistic data, no NULL-only columns. Include some edge cases (duplicates, NULLs in nullable cols, boundary dates) where they're relevant to the question.>",
    "schema_diagram": {
      "tables": [
        { "name": "...", "columns": [ { "name": "...", "type": "...", "constraints": ["PK"|"FK"|"NOT NULL"|...] } ] }
      ],
      "relationships": [ { "from": "table.col", "to": "table.col", "type": "many-to-one" } ]
    },
    "sample_data_preview": {
      "tableName1": [ { "col": "value" } ]
    }
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc2", "label": "<short>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": false },
    { "id": "tc3", "label": "<edge case>", "expected_rows": [], "match_mode": "exact_unordered", "hidden": true }
  ],
  "starter_code": { "sql": "-- Write your SQL query here\\n" },
  "reference_solution": {
    "sql": "<EXECUTABLE SQL that runs against setup_script and produces non-trivial output. Fix typos in scraped Solution like 'http://p.name' → 'p.name'. Preserve the algorithmic shape (CTE, window function, etc) exactly.>"
  },
  "reference_approach": "<one paragraph>"
}

NOTES:
- Leave expected_rows: [] — the script will overwrite them by actually executing the query.
- Use SQLite syntax. RANK(), DENSE_RANK(), ROW_NUMBER(), LAG, LEAD, NTILE, CTEs, window functions all work in modern sqlite. Avoid PIVOT, MERGE, T-SQL extensions.
- All 3 test cases run the SAME reference_solution.sql against the SAME setup_script. The point of multiple test cases is rhetorical (visible labels show what the user is being graded on); under the hood they all return the same rows. So expected_rows for all 3 will be identical after the script runs.`
}

// ---------------------------------------------------------------------------
// Call Haiku once and parse JSON response
// ---------------------------------------------------------------------------

async function callHaiku(prompt: string): Promise<HaikuSqlResult | null> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')

    // Extract outermost JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in response')

    const parsed = JSON.parse(jsonMatch[0]) as HaikuSqlResult

    // Basic validation
    if (!parsed.sql_schema?.setup_script) throw new Error('Missing sql_schema.setup_script')
    if (!parsed.reference_solution?.sql) throw new Error('Missing reference_solution.sql')
    if (!Array.isArray(parsed.test_cases) || parsed.test_cases.length === 0) {
      throw new Error('Missing or empty test_cases')
    }

    return parsed
  } catch (err) {
    throw new Error(`Haiku parse failed: ${(err as Error).message}`)
  }
}

// ---------------------------------------------------------------------------
// Run sql.js to populate expected_rows from the actual reference query output
// ---------------------------------------------------------------------------

async function populateExpectedRows(haiku: HaikuSqlResult): Promise<HaikuSqlResult> {
  const initSqlJs = (await import('sql.js')).default
  const wasmBinary = fs.readFileSync(
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  )
  const SQL = await initSqlJs({ wasmBinary })

  const setupScript = haiku.sql_schema.setup_script
  const refQuery = haiku.reference_solution.sql

  // Verify it runs and returns rows
  const verifyDb = new SQL.Database()
  let actualRows: Record<string, unknown>[] = []
  try {
    verifyDb.run(setupScript)
    const results = verifyDb.exec(refQuery)
    if (!results[0]) throw new Error('Reference query returned no result set')
    actualRows = results[0].values.map((row) =>
      Object.fromEntries(results[0].columns.map((c, i) => [c, row[i]]))
    )
    if (actualRows.length === 0) throw new Error('Reference query returned 0 rows')
  } finally {
    verifyDb.close()
  }

  // Overwrite all test_cases[*].expected_rows with the actual output
  const fixedTestCases = haiku.test_cases.map((tc) => ({
    ...tc,
    expected_rows: actualRows,
  }))

  return {
    ...haiku,
    test_cases: fixedTestCases,
  }
}

// ---------------------------------------------------------------------------
// Enrich a single scraped entry: call Haiku, run sql.js, return staged entry
// ---------------------------------------------------------------------------

async function enrichEntry(
  entry: ScrapedEntry,
  failureLogPath: string
): Promise<Record<string, unknown> | null> {
  const maxAttempts = 2
  let lastError = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const feedbackPrefix =
      attempt > 1
        ? `previous setup_script or reference_solution failed to execute: ${lastError}; please regenerate`
        : undefined

    let haiku: HaikuSqlResult | null = null

    try {
      const prompt = buildHaikuPrompt(entry, feedbackPrefix)
      haiku = await callHaiku(prompt)
    } catch (err) {
      lastError = (err as Error).message
      if (attempt === maxAttempts) {
        const line = `${entry.title}\tHaiku parse failed (attempt ${attempt}): ${lastError}\n`
        fs.appendFileSync(failureLogPath, line)
        return null
      }
      continue
    }

    try {
      const populated = await populateExpectedRows(haiku)

      // Build final staged entry
      const staged: Record<string, unknown> = {
        title: entry.title,
        challenge_type: 'coding',
        is_sql: true,
        difficulty: entry.difficulty ?? 'medium',
        time_limit_seconds: (entry.time_min ?? 30) * 60,
        pattern: entry.source_category ?? '',
        problem_statement_markdown: entry.problem_statement_markdown ?? '',
        metadata: {
          sql_schema: populated.sql_schema,
          starter_code: populated.starter_code,
          reference_solution: populated.reference_solution,
          test_cases: populated.test_cases,
          reference_approach: populated.reference_approach,
          source: 'notion-scraped',
          source_question_id: entry.source_question_id ?? '',
          source_category: entry.source_category ?? '',
          source_companies: entry.source_companies ?? [],
        },
        source_question_id: entry.source_question_id ?? '',
        approved: false,
        generated_at: new Date().toISOString(),
      }

      return staged
    } catch (err) {
      lastError = (err as Error).message
      if (attempt === maxAttempts) {
        const line = `${entry.title}\tsql.js execution failed (attempt ${attempt}): ${lastError}\n`
        fs.appendFileSync(failureLogPath, line)
        return null
      }
      // retry with feedback
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Process a batch of entries in parallel
// ---------------------------------------------------------------------------

async function processBatch(
  batch: ScrapedEntry[],
  stagedPath: string,
  failureLogPath: string,
  doneCount: { value: number },
  failCount: { value: number }
): Promise<void> {
  const results = await Promise.allSettled(
    batch.map((entry) => enrichEntry(entry, failureLogPath))
  )

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const entry = batch[i]

    if (result.status === 'fulfilled' && result.value !== null) {
      // Atomically append to staged JSON
      const existing = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as unknown[]
      existing.push(result.value)
      fs.writeFileSync(stagedPath, JSON.stringify(existing, null, 2))
      doneCount.value++
      process.stdout.write(`  ✓ [${doneCount.value}] ${entry.title}\n`)
    } else {
      const reason =
        result.status === 'rejected'
          ? (result.reason as Error).message
          : 'enrichEntry returned null'
      if (result.status === 'rejected') {
        const line = `${entry.title}\tunexpected rejection: ${reason}\n`
        fs.appendFileSync(failureLogPath, line)
      }
      failCount.value++
      process.stdout.write(`  ✗ [${entry.title}]: ${reason}\n`)
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Parse --limit flag for dry-runs
  const limitArg = process.argv.indexOf('--limit')
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : undefined

  const rawPath = path.join(process.cwd(), 'seeds', 'scraped-raw.json')
  const stagedPath = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')
  const failureLogPath = path.join(process.cwd(), 'seeds', 'enrichment-failures.log')

  // Load scraped entries
  const allScraped = JSON.parse(fs.readFileSync(rawPath, 'utf-8')) as ScrapedEntry[]
  const sqlEntries = allScraped.filter((e) => e.is_sql === true)
  console.log(`\nFound ${sqlEntries.length} SQL entries in scraped-raw.json`)

  // Load staged to detect duplicates
  let staged: Array<Record<string, unknown>> = []
  if (fs.existsSync(stagedPath)) {
    staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as Array<Record<string, unknown>>
  }
  const existingTitles = new Set(staged.map((c) => c.title as string))

  // Filter out already-staged entries
  const toProcess = sqlEntries.filter((e) => !existingTitles.has(e.title))
  const dupCount = sqlEntries.length - toProcess.length

  const processing = limit !== undefined ? toProcess.slice(0, limit) : toProcess
  console.log(
    `Skipping ${dupCount} dups. Processing ${processing.length} entries` +
    (limit !== undefined ? ` (--limit ${limit})` : '') +
    '...\n'
  )

  if (processing.length === 0) {
    console.log('Nothing to do.')
    return
  }

  // Clear / init failure log for this run
  if (!fs.existsSync(failureLogPath)) {
    fs.writeFileSync(failureLogPath, '')
  }

  const doneCount = { value: 0 }
  const failCount = { value: 0 }
  const BATCH_SIZE = 3

  for (let i = 0; i < processing.length; i += BATCH_SIZE) {
    const batch = processing.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(processing.length / BATCH_SIZE)
    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} entries)...`)

    await processBatch(batch, stagedPath, failureLogPath, doneCount, failCount)

    const totalDone = doneCount.value + failCount.value
    if (totalDone % 10 === 0 || totalDone === processing.length) {
      console.log(
        `  Progress: ${doneCount.value} succeeded, ${failCount.value} failed of ${processing.length} processed so far`
      )
    }
  }

  console.log(
    `\nEnrichment complete: succeeded ${doneCount.value}/${processing.length}, ` +
    `failed ${failCount.value}, dups ${dupCount}`
  )
  console.log(`Failures log: ${failureLogPath}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
