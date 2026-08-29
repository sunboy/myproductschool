// Casebook Loop — deterministic chart_specs generation for a filed Challenge
// attempt's report, from extracted queries + their paired results.
//
// SHAPE ESTABLISHED HERE (nothing in the codebase defines chart_specs yet):
//
//   interface ChartSpec {
//     id: string                          // stable id, 'chart-1', 'chart-2', ...
//     kind: 'bar' | 'line' | 'table'
//     title: string                       // derived from the query's first-line comment, or a generic fallback
//     sql: string                         // the query verbatim, for the report to show its work
//     x_key: string | null                // first column name, used as the category/time axis
//     y_key: string | null                // first NUMERIC column after x_key, used as the value axis
//     rows: Record<string, string | number>[]   // parsed result rows — see SOURCE-OF-TRUTH rule below
//   }
//
// SOURCE-OF-TRUTH RULE (hard requirement, not a style choice): `rows` are
// PARSED DETERMINISTICALLY from the tool_result text paired to each query by
// tool_use_id (see query-extraction.ts). No LLM ever fabricates or edits a
// row here. If a query's result text cannot be parsed into a table (missing
// pair, non-tabular output, empty result), that query is skipped entirely
// rather than guessed at — a chart with fabricated numbers in a user-facing
// report is worse than no chart.
//
// PARSED FORMAT: the BigQuery CLI's pipe-delimited tabular output, e.g.
//   "step_name | sessions\ncart_view | 41200\ncheckout_start | 18900"
// confirmed as the real result shape emitted by bq_query tool results (see
// scripts/casebook/fixtures/sample-raw-session.jsonl, itself modeled on real
// sandbox output). A header row of `key | key | ...` followed by one or more
// `value | value | ...` data rows. Any other shape is treated as unparseable.

import type { ExtractedQuery } from './query-extraction'

export interface ChartSpec {
  id: string
  kind: 'bar' | 'line' | 'table'
  title: string
  sql: string
  x_key: string | null
  y_key: string | null
  rows: Record<string, string | number>[]
}

/** Cap on charts emitted per report — a report with 40 queries should not become 40 charts. */
const MAX_CHARTS = 8

function coerceCell(raw: string): string | number {
  const trimmed = raw.trim()
  if (trimmed === '') return trimmed
  const n = Number(trimmed)
  return Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(trimmed) ? n : trimmed
}

/**
 * Parses a pipe-delimited tabular result blob into rows. Returns null when
 * the text does not look like a header + at least one data row (fewer than 2
 * non-empty lines, or a line whose column count doesn't match the header).
 */
function parsePipeTable(resultText: string): { columns: string[]; rows: Record<string, string | number>[] } | null {
  const lines = resultText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('|'))

  if (lines.length < 2) return null

  const columns = lines[0].split('|').map((c) => c.trim())
  if (columns.length < 2 || columns.some((c) => !c)) return null

  const rows: Record<string, string | number>[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length !== columns.length) continue // malformed row, skip rather than misalign
    const row: Record<string, string | number> = {}
    columns.forEach((col, i) => {
      row[col] = coerceCell(cells[i])
    })
    rows.push(row)
  }

  if (rows.length === 0) return null
  return { columns, rows }
}

/** First `--` line-comment in a SQL string, used as a chart title when present. */
function titleFromSql(sql: string, index: number): string {
  const commentMatch = /^\s*--\s*(.+)$/m.exec(sql)
  if (commentMatch) return commentMatch[1].trim()
  return `Query ${index}`
}

function pickAxisKeys(columns: string[], rows: Record<string, string | number>[]): { x_key: string | null; y_key: string | null } {
  if (columns.length === 0 || rows.length === 0) return { x_key: null, y_key: null }
  const x_key = columns[0]
  const y_key = columns.slice(1).find((col) => rows.some((r) => typeof r[col] === 'number')) ?? null
  return { x_key, y_key }
}

/** A time-shaped or day-of-week-shaped x column suggests a line chart; else bar; a wide table (4+ columns, small row count) suggests a table view. */
function pickChartKind(columns: string[], rowCount: number): ChartSpec['kind'] {
  const xColLower = columns[0]?.toLowerCase() ?? ''
  const looksTemporal = /date|day|time|week|month/.test(xColLower)
  if (columns.length > 4) return 'table'
  if (looksTemporal && rowCount > 2) return 'line'
  return 'bar'
}

/**
 * Builds report.report.chart_specs from a filed attempt's extracted queries.
 * Deterministic and pure — no model call, no I/O. Every row in every emitted
 * spec traces back to real parsed tool_result text; a query whose result
 * cannot be parsed is silently skipped (not a chart with guessed numbers).
 */
export function buildChartSpecs(queries: ExtractedQuery[]): ChartSpec[] {
  const specs: ChartSpec[] = []

  for (const q of queries) {
    if (specs.length >= MAX_CHARTS) break
    if (!q.resultText) continue

    const parsed = parsePipeTable(q.resultText)
    if (!parsed) continue

    const { columns, rows } = parsed
    const { x_key, y_key } = pickAxisKeys(columns, rows)

    specs.push({
      id: `chart-${specs.length + 1}`,
      kind: pickChartKind(columns, rows.length),
      title: titleFromSql(q.sql, specs.length + 1),
      sql: q.sql,
      x_key,
      y_key,
      rows,
    })
  }

  return specs
}
