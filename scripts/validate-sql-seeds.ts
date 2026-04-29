/**
 * Validate SQL coding seeds — run each reference_solution SQL query through
 * sql.js against the challenge's own setup_script and compare to expected_rows.
 *
 * Per spec §12.5.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/validate-sql-seeds.ts
 *
 * Exits 1 if any SQL challenge's reference query fails its own test cases.
 * Algorithmic (non-SQL) challenges are skipped — use validate-coding-seeds.ts.
 */

import * as fs from 'fs'
import * as path from 'path'
import initSqlJs from 'sql.js'

// ---------------------------------------------------------------------------
// Types mirroring the staged JSON shape for SQL challenges
// ---------------------------------------------------------------------------

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

type MatchMode = 'exact' | 'exact_ordered' | 'exact_unordered' | 'contains'

interface SqlTestCase {
  id: string
  label: string
  expected_rows: Record<string, unknown>[]
  match_mode: MatchMode
  hidden: boolean
}

interface SqlMetadata {
  sql_schema: SqlSchema
  test_cases: SqlTestCase[]
  reference_solution: { sql: string }
  starter_code?: { sql: string }
  reference_approach?: string
}

interface StagedChallenge {
  title: string
  challenge_type: string
  is_sql?: boolean
  approved: boolean
  metadata: SqlMetadata
}

// ---------------------------------------------------------------------------
// compareRows — ported from public/workers/sql-worker.js
// ---------------------------------------------------------------------------

function compareRows(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[],
  matchMode: MatchMode
): boolean {
  if (matchMode === 'exact' || matchMode === 'exact_ordered') {
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const stagedPath = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')

  if (!fs.existsSync(stagedPath)) {
    console.error('No staged challenges found. Run seed-interview-challenges.ts first.')
    process.exit(1)
  }

  const allStaged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as StagedChallenge[]

  // Filter to SQL challenges (challenge_type === 'coding' with sql_schema)
  const sqlChallenges = allStaged.filter(
    (c) => c.challenge_type === 'coding' && c.metadata?.sql_schema
  )

  if (sqlChallenges.length === 0) {
    console.log('No SQL challenges found in staged file. Nothing to validate.')
    process.exit(0)
  }

  console.log(`Validating ${sqlChallenges.length} SQL challenge(s) via sql.js...\n`)

  // Initialize sql.js — find the WASM binary from node_modules
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  let SQL: Awaited<ReturnType<typeof initSqlJs>>

  try {
    if (fs.existsSync(wasmPath)) {
      const wasmBinary = fs.readFileSync(wasmPath)
      SQL = await initSqlJs({ wasmBinary })
    } else {
      // Fallback: let sql.js locate WASM itself
      SQL = await initSqlJs()
    }
  } catch (err) {
    console.error('Failed to initialize sql.js:', (err as Error).message)
    process.exit(1)
  }

  let anyFailed = false

  for (const challenge of sqlChallenges) {
    const { sql_schema, test_cases, reference_solution } = challenge.metadata

    if (!sql_schema?.setup_script) {
      console.log(`✗ ${challenge.title} — missing sql_schema.setup_script`)
      anyFailed = true
      continue
    }

    if (!reference_solution?.sql) {
      console.log(`✗ ${challenge.title} — missing reference_solution.sql`)
      anyFailed = true
      continue
    }

    if (!test_cases || test_cases.length === 0) {
      console.log(`✗ ${challenge.title} — no test_cases`)
      anyFailed = true
      continue
    }

    let allTestsPassed = true
    const failedDetails: string[] = []

    for (const tc of test_cases) {
      // Create fresh DB for each test case (isolation)
      const db = new SQL.Database()
      try {
        // Run the setup script (schema + seed data)
        db.run(sql_schema.setup_script)

        // Run the reference query
        const results = db.exec(reference_solution.sql)

        // Convert sql.js results to array of row objects
        const actualRows: Record<string, unknown>[] = results[0]
          ? results[0].values.map((row) =>
              Object.fromEntries(
                results[0].columns.map((col, i) => [col, row[i]])
              )
            )
          : []

        const matchMode: MatchMode = tc.match_mode ?? 'exact_unordered'
        const passed = compareRows(actualRows, tc.expected_rows, matchMode)

        if (!passed) {
          allTestsPassed = false
          failedDetails.push(
            `  ${tc.id} [${tc.label}]: reference query did not produce expected rows\n` +
            `    expected: ${JSON.stringify(tc.expected_rows)}\n` +
            `    actual:   ${JSON.stringify(actualRows)}`
          )
        } else {
          process.stdout.write(`  ✓ ${tc.id} [${tc.label}]\n`)
        }
      } catch (err) {
        allTestsPassed = false
        failedDetails.push(`  ${tc.id} [${tc.label}]: error — ${(err as Error).message}`)
      } finally {
        db.close()
      }
    }

    if (allTestsPassed) {
      console.log(`✓ ${challenge.title}`)
    } else {
      console.log(`✗ ${challenge.title}`)
      failedDetails.forEach((d) => console.log(d))
      anyFailed = true
    }

    console.log()
  }

  if (anyFailed) {
    console.error('Validation FAILED — fix broken SQL challenges before running commit-interview-seeds.ts')
    process.exit(1)
  } else {
    console.log('All SQL challenges passed validation ✓')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
