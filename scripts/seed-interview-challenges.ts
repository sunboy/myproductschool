/**
 * Generate interview challenges using Claude Haiku.
 * Supports system_design, data_modeling, and coding (algorithmic + SQL) types.
 * Writes staged output to seeds/staged-interview-challenges.json with approved: false.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed-interview-challenges.ts
 *   npx tsx --env-file=.env.local scripts/seed-interview-challenges.ts --type coding --count 4 --difficulty "easy:1,medium:2,hard:1"
 *   npx tsx --env-file=.env.local scripts/seed-interview-challenges.ts --type coding --count 2 --sql --difficulty "easy:1,medium:1"
 *
 * After reviewing, set approved: true on the challenges you want to publish,
 * then run: npx tsx scripts/commit-interview-seeds.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

// ---------------------------------------------------------------------------
// Canvas prompts (system_design + data_modeling — unchanged)
// ---------------------------------------------------------------------------

const SYSTEM_DESIGN_PROMPT = (alreadyCovered: string[], difficulty: string) => `
You are generating an original system design interview question for HackProduct.

RESEARCH PHASE: Survey common system design interview topics for difficulty: ${difficulty}.
Domains: URL shorteners, chat apps, social feeds, rate limiters, notification systems,
video streaming, ride-sharing, payment processing, search engines, caching layers,
leaderboards, ticket booking, file storage, recommendation engines.
Already covered in this batch: ${alreadyCovered.join(', ') || 'none'}.
Pick a domain NOT already covered.

GENERATION: Write an ORIGINAL problem brief. Domain can be familiar, scenario must be fresh.

REQUIREMENTS:
- Problem statement: 150-300 words
- Clear functional requirements (what users do)
- Scale assumptions (users, QPS, data size)
- 5-10 required components for a strong answer
- 3-5 scalability considerations

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "Design a Rate Limiter",
  "difficulty": "standard",
  "estimated_minutes": 45,
  "industry": "infrastructure",
  "problem_statement_markdown": "...",
  "metadata": {
    "requirements": ["...", "..."],
    "required_components": ["API Gateway", "Redis cluster", "Token bucket algorithm", "..."],
    "scalability_signals": ["horizontal scaling", "distributed rate tracking", "..."],
    "reference_diagram_description": "Clients hit an API Gateway..."
  }
}
`

const DATA_MODELING_PROMPT = (alreadyCovered: string[], difficulty: string) => `
You are generating an original data modeling interview question for HackProduct.

RESEARCH PHASE: Survey common data modeling scenarios for difficulty: ${difficulty}.
Domains: e-commerce, social graphs, booking/scheduling, content platforms,
finance, healthcare, multi-tenant SaaS, inventory, event ticketing.
Already covered: ${alreadyCovered.join(', ') || 'none'}.
Pick a domain NOT already covered.

GENERATION: Write an ORIGINAL prompt. Include at least one non-trivial modeling challenge
(temporal validity, soft deletes, M:M with attributes, polymorphic relationships, multi-tenancy).

REQUIREMENTS:
- Problem statement: 100-250 words
- 5-10 business requirements
- 4-8 core entities
- Relationships and constraints to model

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "Design an Event Ticketing Schema",
  "difficulty": "standard",
  "estimated_minutes": 30,
  "industry": "events",
  "problem_statement_markdown": "...",
  "metadata": {
    "requirements": ["...", "..."],
    "required_entities": ["Event", "Venue", "Ticket", "Order", "User"],
    "modeling_signals": ["soft delete via deleted_at", "M:M with price attributes", "..."],
    "reference_schema_description": "..."
  }
}
`

// ---------------------------------------------------------------------------
// §12.3 — Coding (algorithmic) generation prompt
// ---------------------------------------------------------------------------

const CODING_GENERATION_PROMPT = (alreadyCovered: string[], difficulty: string, timeLimitSeconds: number) => `
You are generating an original coding interview question for HackProduct.
Produce ONE high-quality coding challenge.

RESEARCH PHASE (use web_search):
Survey common coding interview patterns at difficulty: ${difficulty}.
Look at real questions from LeetCode, HackerRank, StrataScratch,
Glassdoor company-specific banks, Reddit r/cscareerquestions threads.
Pick a pattern category: hash_map, two_pointer, sliding_window, stack,
binary_search, dp, graph, recursion, etc.
Already covered in this batch: ${alreadyCovered.join(', ') || 'none'}.
Pick a pattern NOT yet covered.

GENERATION:
Write an ORIGINAL problem statement INSPIRED by patterns you researched,
but do not copy wording from any source. The concept can be classic
(e.g. two-pointer); the framing must be novel — different scenario,
different variable names, different surface details.

Quality bar:
- Problem statement: 100-200 words, clear and unambiguous
- 1-2 worked examples embedded in the statement
- Solvable in under ${timeLimitSeconds / 60} minutes by a competent candidate
- Reference solution in BOTH Python and JavaScript that actually works
- 3 visible test cases + 2 hidden test cases
- At least one edge case (empty, single element, bounds, duplicates)

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "...",
  "challenge_type": "coding",
  "difficulty": "${difficulty}",
  "time_limit_seconds": ${timeLimitSeconds},
  "pattern": "hash_map",
  "problem_statement_markdown": "...",
  "metadata": {
    "test_cases": [
      { "id": "tc1", "label": "...", "args": [], "expected": null, "hidden": false },
      { "id": "tc2", "label": "...", "args": [], "expected": null, "hidden": false },
      { "id": "tc3", "label": "...", "args": [], "expected": null, "hidden": false },
      { "id": "tc4", "label": "hidden edge case", "args": [], "expected": null, "hidden": true },
      { "id": "tc5", "label": "hidden stress", "args": [], "expected": null, "hidden": true }
    ],
    "starter_code": {
      "python": "def solution(...):\\n    pass",
      "javascript": "function solution(...) {\\n  \\n}"
    },
    "reference_solution": {
      "python": "def solution(...):\\n    ...",
      "javascript": "function solution(...) { ... }"
    },
    "reference_approach": "One paragraph: optimal approach + complexity analysis"
  }
}
`

// ---------------------------------------------------------------------------
// §12.4 — SQL generation prompt
// ---------------------------------------------------------------------------

const SQL_GENERATION_PROMPT = (alreadyCovered: string[], difficulty: string, timeLimitSeconds: number) => `
You are generating an original SQL interview question for HackProduct.
Produce ONE high-quality SQL challenge.

RESEARCH PHASE (use web_search):
Survey common SQL interview patterns at difficulty: ${difficulty}.
Real questions come from StrataScratch, DataLemur, LeetCode SQL,
Mode Analytics, company-specific banks (Meta, Amazon, Stripe).
Pattern categories: aggregation, JOIN (inner/left/self), GROUP BY,
window functions, CTEs, subqueries, HAVING, date manipulation.
Already covered: ${alreadyCovered.join(', ') || 'none'}.
Pick a pattern NOT yet covered.

GENERATION:
Write an ORIGINAL problem statement with an ORIGINAL schema. Domain can
be familiar (e-commerce, social, HR, content) but the specific table
structure and column names must be your own.

Quality bar:
- Problem statement: 80-150 words
- 2-4 tables with realistic columns and FKs
- Sample data: at least 5-10 rows per table, designed to expose
  common pitfalls (NULLs, duplicates, edge cases)
- 2 visible test cases + 1 hidden test case (with expected_rows)
- Reference query that actually works against the schema
- The query should be solvable in under ${timeLimitSeconds / 60} minutes

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "...",
  "challenge_type": "coding",
  "difficulty": "${difficulty}",
  "time_limit_seconds": ${timeLimitSeconds},
  "pattern": "aggregation",
  "problem_statement_markdown": "...",
  "metadata": {
    "sql_schema": {
      "dialect": "sqlite",
      "setup_script": "CREATE TABLE ...; INSERT INTO ... VALUES ...",
      "schema_diagram": {
        "tables": [
          {
            "name": "users",
            "columns": [
              { "name": "id", "type": "INTEGER", "constraints": ["PK"] }
            ]
          }
        ],
        "relationships": [
          { "from": "orders.user_id", "to": "users.id", "type": "many-to-one" }
        ]
      },
      "sample_data_preview": {
        "users": [{"id": 1, "name": "Alice"}]
      }
    },
    "test_cases": [
      {
        "id": "tc1",
        "label": "...",
        "expected_rows": [],
        "match_mode": "exact_unordered",
        "hidden": false
      },
      {
        "id": "tc2",
        "label": "...",
        "expected_rows": [],
        "match_mode": "exact_unordered",
        "hidden": false
      },
      {
        "id": "tc3",
        "label": "hidden edge case",
        "expected_rows": [],
        "match_mode": "exact_unordered",
        "hidden": true
      }
    ],
    "starter_code": {
      "sql": "-- Write your SQL query here\\n"
    },
    "reference_solution": {
      "sql": "SELECT ..."
    },
    "reference_approach": "One paragraph explaining the approach + any tradeoffs"
  }
}
`

// ---------------------------------------------------------------------------
// SQL self-correction: run reference query and overwrite expected_rows
// ---------------------------------------------------------------------------

/**
 * After Haiku generates a SQL challenge, the expected_rows are often
 * inconsistent with the actual SQL output.  This function runs the
 * reference_solution against the setup_script using sql.js and
 * overwrites each test case's expected_rows with the real results.
 *
 * This guarantees the validator passes for the reference solution.
 * A human reviewer still checks whether the expected rows make
 * educational sense before flipping approved:true.
 */
async function fixSqlExpectedRows(
  challenge: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const initSqlJs = (await import('sql.js')).default
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

  let SQL: Awaited<ReturnType<typeof initSqlJs>>
  try {
    if (fs.existsSync(wasmPath)) {
      const wasmBinary = fs.readFileSync(wasmPath)
      SQL = await initSqlJs({ wasmBinary })
    } else {
      SQL = await initSqlJs()
    }
  } catch (err) {
    console.warn(`  sql.js init failed, skipping expected_rows fix: ${(err as Error).message}`)
    return challenge
  }

  const meta = challenge.metadata as Record<string, unknown>
  const sqlSchema = meta.sql_schema as Record<string, unknown>
  const testCases = meta.test_cases as Array<Record<string, unknown>>
  const refSolution = meta.reference_solution as Record<string, unknown>

  if (!sqlSchema?.setup_script || !refSolution?.sql || !testCases?.length) {
    return challenge
  }

  const setupScript = sqlSchema.setup_script as string
  const refQuery = refSolution.sql as string

  const fixedTestCases = testCases.map((tc) => {
    const db = new SQL.Database()
    try {
      db.run(setupScript)
      const results = db.exec(refQuery)
      const actualRows = results[0]
        ? results[0].values.map((row) =>
            Object.fromEntries(results[0].columns.map((col, i) => [col, row[i]]))
          )
        : []
      console.log(`    Fixed expected_rows for ${tc.id as string}: ${actualRows.length} rows`)
      return { ...tc, expected_rows: actualRows }
    } catch (err) {
      console.warn(`    Could not run reference query for ${tc.id as string}: ${(err as Error).message}`)
      return tc
    } finally {
      db.close()
    }
  })

  return {
    ...challenge,
    metadata: {
      ...meta,
      test_cases: fixedTestCases,
    },
  }
}

// ---------------------------------------------------------------------------
// Generation helpers
// ---------------------------------------------------------------------------

async function generateCanvasChallenge(
  category: 'system_design' | 'data_modeling',
  alreadyCovered: string[],
  difficulty: string
): Promise<Record<string, unknown> | null> {
  const prompt =
    category === 'system_design'
      ? SYSTEM_DESIGN_PROMPT(alreadyCovered, difficulty)
      : DATA_MODELING_PROMPT(alreadyCovered, difficulty)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error(`  Error generating ${category}: ${(err as Error).message}`)
    return null
  }
}

async function generateCodingChallenge(
  isSql: boolean,
  alreadyCovered: string[],
  difficulty: string
): Promise<Record<string, unknown> | null> {
  // Determine a sensible time limit based on difficulty
  const timeLimitMap: Record<string, number> = {
    easy: 1800,
    medium: 2400,
    hard: 3600,
    standard: 2400,
    advanced: 3600,
    warmup: 1200,
  }
  const timeLimitSeconds = timeLimitMap[difficulty] ?? 1800

  const prompt = isSql
    ? SQL_GENERATION_PROMPT(alreadyCovered, difficulty, timeLimitSeconds)
    : CODING_GENERATION_PROMPT(alreadyCovered, difficulty, timeLimitSeconds)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')

    // Extract outermost JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>

    // Validate required fields
    if (!parsed.title || !parsed.metadata) {
      throw new Error('Missing required fields: title or metadata')
    }
    if (!isSql && !(parsed.metadata as Record<string, unknown>).reference_solution) {
      throw new Error('Missing reference_solution in coding challenge')
    }
    if (isSql && !(parsed.metadata as Record<string, unknown>).sql_schema) {
      throw new Error('Missing sql_schema in SQL challenge')
    }

    // For SQL: run the reference query and overwrite expected_rows with actual results.
    // This prevents the most common Haiku authoring bug (wrong expected_rows).
    if (isSql) {
      console.log('    Fixing expected_rows by running reference query...')
      return await fixSqlExpectedRows(parsed)
    }

    return parsed
  } catch (err) {
    console.error(`  Error generating ${isSql ? 'SQL' : 'coding'} challenge: ${(err as Error).message}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  type: 'canvas' | 'coding'
  sql: boolean
  count: number
  difficulties: string[]  // e.g. ['easy', 'medium', 'medium', 'hard']
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)

  let type: 'canvas' | 'coding' = 'canvas'
  let sql = false
  let count = 5
  let difficultySpec = ''

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      const t = args[++i]
      if (t === 'coding') type = 'coding'
      else type = 'canvas'
    } else if (args[i] === '--sql') {
      sql = true
    } else if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[++i], 10)
    } else if (args[i] === '--difficulty' && args[i + 1]) {
      difficultySpec = args[++i]
    }
  }

  // Parse --difficulty "easy:1,medium:2,hard:1" → ['easy', 'medium', 'medium', 'hard']
  let difficulties: string[] = []
  if (difficultySpec) {
    const parts = difficultySpec.split(',')
    for (const part of parts) {
      const [level, nStr] = part.split(':')
      const n = parseInt(nStr ?? '1', 10)
      for (let i = 0; i < n; i++) difficulties.push(level.trim())
    }
    // Adjust count to match specified difficulties
    if (difficulties.length > 0) count = difficulties.length
  }

  // If no difficulty spec, fill with defaults per type
  if (difficulties.length === 0) {
    if (type === 'coding') {
      difficulties = Array(count).fill('medium')
    } else {
      difficulties = ['standard', 'standard', 'advanced', 'standard', 'advanced'].slice(0, count)
    }
  }

  return { type, sql, count, difficulties }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cli = parseArgs()

  const outDir = path.join(process.cwd(), 'seeds')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'staged-interview-challenges.json')

  // Load existing staged challenges so we append rather than overwrite
  let existing: unknown[] = []
  if (fs.existsSync(outPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outPath, 'utf-8')) as unknown[]
    } catch {
      existing = []
    }
  }

  const newChallenges: unknown[] = []

  if (cli.type === 'coding') {
    // --type coding
    const label = cli.sql ? 'SQL' : 'algorithmic coding'
    console.log(`\nGenerating ${cli.count} ${label} challenges (difficulties: ${cli.difficulties.join(', ')})...`)
    const covered: string[] = []

    for (let i = 0; i < cli.difficulties.length; i++) {
      const diff = cli.difficulties[i]
      console.log(`  [${i + 1}/${cli.difficulties.length}] difficulty: ${diff}...`)

      let challenge: Record<string, unknown> | null = null
      const MAX_RETRIES = 3
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        challenge = await generateCodingChallenge(cli.sql, covered, diff)
        if (challenge) break
        console.warn(`  Retry ${attempt}/${MAX_RETRIES}...`)
      }

      if (challenge) {
        covered.push((challenge.pattern as string) ?? (challenge.title as string) ?? '')
        newChallenges.push({
          ...challenge,
          challenge_type: 'coding',
          is_sql: cli.sql,
          approved: false,
          generated_at: new Date().toISOString(),
        })
        console.log(`  Generated: "${challenge.title}"`)
      } else {
        console.warn(`  Failed after ${MAX_RETRIES} retries — skipped`)
      }
    }
  } else {
    // --type canvas (default, backward-compatible)
    const difficulties = {
      system_design: cli.difficulties.length > 0 ? cli.difficulties : ['standard', 'standard', 'advanced', 'standard', 'advanced'],
      data_modeling: cli.difficulties.length > 0 ? cli.difficulties : ['standard', 'standard', 'advanced', 'standard', 'advanced'],
    }

    for (const category of ['system_design', 'data_modeling'] as const) {
      console.log(`\nGenerating ${category} challenges...`)
      const covered: string[] = []
      const diffs = difficulties[category]

      for (let i = 0; i < diffs.length; i++) {
        console.log(`  [${i + 1}/${diffs.length}] difficulty: ${diffs[i]}...`)
        const challenge = await generateCanvasChallenge(category, covered, diffs[i])
        if (challenge) {
          covered.push((challenge.title as string) ?? '')
          newChallenges.push({
            ...challenge,
            challenge_type: category,
            approved: false,
            generated_at: new Date().toISOString(),
          })
          console.log(`  Generated: "${challenge.title}"`)
        } else {
          console.log(`  Skipped`)
        }
      }
    }
  }

  // Append new challenges to existing staged file
  const allChallenges = [...existing, ...newChallenges]
  fs.writeFileSync(outPath, JSON.stringify(allChallenges, null, 2))
  console.log(`\n${newChallenges.length} new challenges staged (${allChallenges.length} total) -> ${outPath}`)
  console.log('Review each, set approved: true, then run: npx tsx scripts/commit-interview-seeds.ts')
}

main().catch(console.error)
