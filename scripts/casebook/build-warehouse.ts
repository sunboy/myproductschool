#!/usr/bin/env npx tsx
/**
 * Build (or rebuild) the BigQuery warehouse for one Casebook Loop case.
 *
 * Reads `content/casebook/<case-id>/warehouse.sql` (schema + derived views)
 * and every CSV fixture under `content/casebook/<case-id>/fixtures/`, then
 * creates the case's BigQuery dataset and loads each fixture into the table
 * of the same name, and finally runs any `CREATE VIEW` / `CREATE OR REPLACE
 * VIEW` statements from warehouse.sql.
 *
 * Dataset naming: `module_<case_id_with_underscores>`, e.g. case id
 * `tuesday-dip` -> dataset `module_tuesday_dip`, project `hackproduct`.
 * This exact string is what later goes into `cc_cases.warehouse_dataset`.
 *
 * Uses the `bq` CLI via child_process — NOT the `@google-cloud/bigquery` npm
 * package (not a project dependency, and we're not adding it). `bq` is
 * already installed and authenticated on the operator machine; this script
 * only ever runs operator-side, never in CI or in the sandbox runtime.
 *
 * Idempotent: table creation uses `bq mk` with pre-existence checks, and
 * loads use `--replace` per table so re-running is safe. Views are always
 * (re)created with `CREATE OR REPLACE VIEW`. Use --recreate to drop and
 * rebuild the whole dataset from scratch instead.
 *
 * Flags:
 *   --dry-run    Print every bq command that would run, execute nothing.
 *   --recreate   Drop the dataset first (bq rm -r -f -d) and rebuild clean.
 *                Without this flag, an existing dataset/tables are reused
 *                and tables are reloaded with --replace (data refreshed,
 *                nothing destroyed without the flag).
 *
 * Usage:
 *   npx tsx scripts/casebook/build-warehouse.ts tuesday-dip --dry-run
 *   npx tsx scripts/casebook/build-warehouse.ts tuesday-dip
 *   npx tsx scripts/casebook/build-warehouse.ts tuesday-dip --recreate
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const PROJECT = 'hackproduct'

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const positional = args.filter((a) => !a.startsWith('--'))
const DRY_RUN = args.includes('--dry-run')
const RECREATE = args.includes('--recreate')

const caseId = positional[0]
if (!caseId) {
  console.error('Usage: npx tsx scripts/casebook/build-warehouse.ts <case-id> [--dry-run] [--recreate]')
  process.exit(1)
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(caseId)) {
  console.error(`Invalid case id "${caseId}" — expected lowercase-kebab-case (e.g. tuesday-dip)`)
  process.exit(1)
}

// Prefix is `module_`, NOT `casebook_`. The dataset id renders verbatim inside
// expert transcripts (SQL and prose), and those transcripts are projected onto
// the PUBLIC marketing teaser — so the identifier itself must satisfy the
// user-facing vocabulary rule (plan 4.3): never leak the internal codename.
// `module` is also the user-facing word for a case, so the id now matches the
// vocabulary instead of fighting it.
const datasetId = `module_${caseId.replace(/-/g, '_')}`

const caseDir = join(__dirname, '..', '..', 'content', 'casebook', caseId)
const schemaPath = join(caseDir, 'warehouse.sql')
const fixturesDir = join(caseDir, 'fixtures')

if (!existsSync(schemaPath)) {
  console.error(`Missing schema file: ${schemaPath}`)
  process.exit(1)
}
if (!existsSync(fixturesDir)) {
  console.error(`Missing fixtures directory: ${fixturesDir}`)
  process.exit(1)
}

// ── bq command runner ─────────────────────────────────────────────────────────

/** Every bq invocation goes through here so --dry-run prints exactly what would run. */
function runBq(argv: string[], opts: { allowFailure?: boolean } = {}): { ok: boolean; stdout: string } {
  const printable = `bq ${argv.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`
  if (DRY_RUN) {
    console.log(`[dry-run] ${printable}`)
    return { ok: true, stdout: '' }
  }
  console.log(`+ ${printable}`)
  try {
    const stdout = execFileSync('bq', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
    if (stdout.trim()) console.log(stdout.trim())
    return { ok: true, stdout }
  } catch (err) {
    if (opts.allowFailure) return { ok: false, stdout: '' }
    const message = err instanceof Error ? err.message : String(err)
    console.error(`bq command failed: ${printable}\n${message}`)
    process.exit(1)
  }
}

function datasetExists(): boolean {
  if (DRY_RUN) return false // dry-run never inspects live state; always print the full plan
  const result = runBq(['show', '--dataset', `${PROJECT}:${datasetId}`], { allowFailure: true })
  return result.ok
}

// ── parse warehouse.sql ───────────────────────────────────────────────────────

interface ParsedTable {
  name: string
  columns: { name: string; type: string }[]
}

function parseTables(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = []
  const tableRe = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\);/gi
  let match: RegExpExecArray | null
  while ((match = tableRe.exec(sql))) {
    const name = match[1]
    const body = match[2]
    const columns: { name: string; type: string }[] = []
    for (const rawLine of body.split('\n')) {
      const line = rawLine.split('--')[0].trim().replace(/,$/, '')
      if (!line) continue
      const parts = line.split(/\s+/)
      if (parts.length < 2) continue
      columns.push({ name: parts[0], type: parts[1] })
    }
    tables.push({ name, columns })
  }
  return tables
}

interface ParsedView {
  name: string
  /** Full `CREATE OR REPLACE VIEW ... AS ... ;` statement, verbatim. */
  statement: string
}

function parseViews(sql: string): ParsedView [] {
  const views: ParsedView[] = []
  const viewRe = /CREATE (?:OR REPLACE )?VIEW\s+(\w+)\s+AS[\s\S]*?;/gi
  let match: RegExpExecArray | null
  while ((match = viewRe.exec(sql))) {
    views.push({ name: match[1], statement: match[0] })
  }
  return views
}

const sql = readFileSync(schemaPath, 'utf8')
const tables = parseTables(sql)
const views = parseViews(sql)

if (tables.length === 0) {
  console.error(`No "CREATE TABLE IF NOT EXISTS" statements found in ${schemaPath}`)
  process.exit(1)
}

// ── discover fixtures ─────────────────────────────────────────────────────────

const fixtureFiles = readdirSync(fixturesDir).filter((f) => f.endsWith('.csv'))
if (fixtureFiles.length === 0) {
  console.error(`No .csv fixtures found in ${fixturesDir}`)
  process.exit(1)
}

const fixtureByTable = new Map<string, string>()
for (const file of fixtureFiles) {
  const tableName = basename(file, '.csv')
  fixtureByTable.set(tableName, join(fixturesDir, file))
}

const missingFixtures = tables.filter((t) => !fixtureByTable.has(t.name))
if (missingFixtures.length > 0) {
  console.error(
    `Missing CSV fixture(s) for table(s): ${missingFixtures.map((t) => t.name).join(', ')} ` +
      `(expected e.g. fixtures/${missingFixtures[0].name}.csv)`,
  )
  process.exit(1)
}

// ── build plan ─────────────────────────────────────────────────────────────────

console.log(`Case: ${caseId}`)
console.log(`Dataset: ${PROJECT}:${datasetId}`)
console.log(`Tables: ${tables.map((t) => t.name).join(', ')}`)
console.log(`Views: ${views.length > 0 ? views.map((v) => v.name).join(', ') : '(none)'}`)
console.log(`Mode: ${RECREATE ? 'RECREATE (drops dataset first)' : 'idempotent upsert'}${DRY_RUN ? ' — DRY RUN' : ''}`)
console.log('')

if (RECREATE) {
  runBq(['rm', '-r', '-f', '-d', `${PROJECT}:${datasetId}`], { allowFailure: true })
}

const exists = datasetExists()
if (RECREATE || !exists) {
  runBq(['mk', '--dataset', `--location=US`, `${PROJECT}:${datasetId}`])
} else {
  console.log(`Dataset ${PROJECT}:${datasetId} already exists — reusing (pass --recreate to rebuild clean).`)
}

// Load each table from its CSV fixture. --replace makes each load
// idempotent: re-running overwrites the table's rows with the current
// fixture contents rather than appending duplicates.
for (const table of tables) {
  const csvPath = fixtureByTable.get(table.name)!
  const schemaArg = table.columns.map((c) => `${c.name}:${bqType(c.type)}`).join(',')
  runBq([
    'load',
    '--source_format=CSV',
    '--skip_leading_rows=1',
    '--replace',
    `${PROJECT}:${datasetId}.${table.name}`,
    csvPath,
    schemaArg,
  ])
}

// Views: a BigQuery VIEW stores its SQL as a saved definition — unqualified
// table references inside the view body do NOT resolve against a
// `bq query --dataset_id=...` default at creation time the way they would
// for a one-off query. Every table/view reference inside each view's body
// must be fully qualified as `PROJECT.datasetId.table` BEFORE the CREATE OR
// REPLACE VIEW statement is sent, including references to other views
// declared earlier in warehouse.sql (e.g. tuesday_dip_vs_deploys reads
// daily_signups). Qualification runs against the actual table names parsed
// from warehouse.sql plus every view name declared before the current one,
// so it generalizes to any case's schema, not just this one.
// Longest first: if one name is a prefix of another (daily_signups vs
// daily_signups_by_channel), qualifying the longer one first means the shorter
// pattern can no longer match inside it.
const qualifiableNames = [...tables.map((t) => t.name), ...views.map((v) => v.name)]
  .sort((a, b) => b.length - a.length)

function qualifyReferences(statement: string): string {
  let qualified = statement
  for (const name of qualifiableNames) {
    // Only requalify a bare identifier that is not already dot-qualified
    // (preceded by `.`) and not already prefixed with the project id, so
    // re-running this against an already-qualified statement is a no-op.
    // NOTE: `\\w` (escaped) is required here. In a template literal a bare `\w`
    // collapses to the literal char `w`, which silently destroys both word
    // boundaries — `daily_signups` then matches INSIDE `daily_signups_by_channel`
    // and emits mangled SQL like `` `proj.ds.daily_signups`_by_channel ``.
    // Longest-name-first ordering (see qualifiableNames) is a second guard.
    const re = new RegExp(`(?<![.\\w])${name}(?!\\w)`, 'g')
    qualified = qualified.replace(re, (match, offset, full) => {
      const before = full.slice(0, offset)
      if (before.endsWith('.')) return match // already dot-qualified, leave alone
      return `\`${PROJECT}.${datasetId}.${name}\``
    })
  }
  return qualified
}

/** Cheap post-create check: a view that creates but errors on SELECT is a failure, not a success. */
function validateView(viewName: string): void {
  runBq([
    'query',
    '--use_legacy_sql=false',
    `--project_id=${PROJECT}`,
    `SELECT 1 FROM \`${PROJECT}.${datasetId}.${viewName}\` LIMIT 1`,
  ])
}

for (const view of views) {
  const qualifiedStatement = qualifyReferences(view.statement)
  runBq([
    'query',
    '--use_legacy_sql=false',
    `--project_id=${PROJECT}`,
    `--dataset_id=${datasetId}`,
    qualifiedStatement,
  ])
  // Fail loudly and non-zero if the view was created but is unqueryable —
  // a view that creates-but-doesn't-query must be treated as a build
  // failure, not silently left behind for someone else to discover.
  validateView(view.name)
}

console.log('')
console.log(DRY_RUN ? 'Dry run complete — no bq commands were executed.' : `Warehouse build complete: ${PROJECT}:${datasetId}`)

// ── helpers ────────────────────────────────────────────────────────────────────

/** Map the schema.sql column type (Postgres-flavored, as written for readability) to a bq load --schema type. */
function bqType(sqlType: string): string {
  const t = sqlType.toUpperCase()
  if (t.startsWith('STRING')) return 'STRING'
  if (t.startsWith('INT')) return 'INTEGER'
  if (t.startsWith('FLOAT') || t.startsWith('NUMERIC') || t.startsWith('DECIMAL')) return 'FLOAT'
  if (t.startsWith('BOOL')) return 'BOOLEAN'
  if (t.startsWith('TIMESTAMP')) return 'TIMESTAMP'
  if (t.startsWith('DATE')) return 'DATE'
  return 'STRING'
}
