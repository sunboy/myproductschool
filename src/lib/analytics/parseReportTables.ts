// lib/analytics/parseReportTables.ts
//
// Pure, dependency-free parser that turns the GitHub-flavored markdown tables an
// analyst writes to /workspace/report.md into structured data the chart layer can
// render. Safe on both server (share page) and client (mirror, ReportCharts), and
// unit-testable in isolation. It never throws — a malformed report yields [].
//
// The agent is never told to emit a special chart format; we read the tables it
// already writes. So the parser must be defensive: skip fenced code blocks (so an
// example table inside ``` isn't charted), tolerate ragged rows, and treat cells
// like "96%", "$13.40", "1,411" as numbers.

export type ChartKind = 'bar' | 'line' | 'none'

export interface ParsedTable {
  /** Header cells, in column order. */
  headers: string[]
  /** Data rows, each padded/truncated to headers.length, cells trimmed. */
  rows: string[][]
  /** Nearest preceding heading / bold line, used as the chart title. */
  caption: string | null
  /** Index of the categorical (x-axis / label) column. */
  categoryColumn: number
  /** Indices of columns that parsed as numeric across most rows (y-series). */
  numericColumns: number[]
  /** Heuristic chart recommendation. 'none' = render an HTML table instead. */
  chartKind: ChartKind
}

// Genuine time axes only. Funnel "step"/"stage" columns are discrete categories,
// not a continuous axis, so they read better as bars (excluded here on purpose).
const TEMPORAL_HEADER_RE = /date|month|week|quarter|year|\btime\b|period|\bday\b|\bhour\b/i

/**
 * Parse a single cell into a number, or null if it isn't numeric. Strips the
 * common decorations an analyst writes: currency, thousands separators, percent,
 * surrounding whitespace. "96%" -> 96, "$13.40" -> 13.4, "1,411" -> 1411,
 * "-3.2" -> -3.2. A cell that's empty or has letters (other than the stripped
 * symbols) returns null.
 */
export function parseNumericCell(raw: string): number | null {
  if (raw == null) return null
  let s = String(raw).trim()
  if (!s) return null
  // Drop currency symbols, thousands separators, percent, and spaces.
  s = s.replace(/[$£€,%\s]/g, '')
  // Parenthesised negatives, e.g. (1,234) -> -1234 (already comma-stripped).
  const paren = /^\((.*)\)$/.exec(s)
  if (paren) s = '-' + paren[1]
  if (s === '' || s === '-' || s === '.') return null
  // Must be a plain decimal number now (optional sign, digits, optional decimal).
  if (!/^[-+]?\d*\.?\d+$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Split a markdown table row on unescaped pipes, trimming edge pipes + cells. */
function splitRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '\\' && line[i + 1] === '|') {
      current += '|'
      i++
      continue
    }
    if (ch === '|') {
      cells.push(current)
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current)
  // Drop the empty leading/trailing cells produced by edge pipes (| a | b |).
  if (cells.length && cells[0].trim() === '') cells.shift()
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop()
  return cells.map((c) => c.trim())
}

/** Is this a GFM table separator row, e.g. `| --- | :--: |`? */
function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('-')) return false
  // Only pipes, dashes, colons, and whitespace.
  if (!/^\|?[\s:|-]+\|?$/.test(trimmed)) return false
  // Each cell must be a run of dashes with optional colons.
  return splitRow(trimmed).every((c) => /^:?-+:?$/.test(c.trim()))
}

function looksLikeTableRow(line: string): boolean {
  return line.includes('|')
}

/** Nearest preceding heading or bold line above the table, else null. */
function captionFor(lines: string[], tableStart: number): string | null {
  for (let i = tableStart - 1; i >= 0 && i >= tableStart - 4; i--) {
    const t = lines[i].trim()
    if (!t) continue
    const heading = /^#{1,6}\s+(.*)$/.exec(t)
    if (heading) return heading[1].trim()
    const bold = /^\*\*(.+)\*\*:?$/.exec(t)
    if (bold) return bold[1].trim()
    // First non-blank line that isn't a heading/bold stops the search.
    return null
  }
  return null
}

function classify(headers: string[], rows: string[][]): Pick<ParsedTable, 'categoryColumn' | 'numericColumns' | 'chartKind'> {
  const colCount = headers.length
  const numericColumns: number[] = []
  for (let c = 0; c < colCount; c++) {
    let parsed = 0
    for (const row of rows) {
      if (parseNumericCell(row[c] ?? '') !== null) parsed++
    }
    // A column is numeric if at least 60% of its cells parse (tolerates a stray N/A).
    if (rows.length > 0 && parsed / rows.length >= 0.6) numericColumns.push(c)
  }

  // Category = first non-numeric column; if every column is numeric, column 0.
  const numericSet = new Set(numericColumns)
  let categoryColumn = 0
  for (let c = 0; c < colCount; c++) {
    if (!numericSet.has(c)) {
      categoryColumn = c
      break
    }
  }
  // The category column should not also be a y-series.
  const series = numericColumns.filter((c) => c !== categoryColumn)

  let chartKind: ChartKind = 'bar'
  if (rows.length < 2 || rows.length > 12 || series.length === 0 || series.length > 4) {
    chartKind = 'none'
  } else {
    const header = headers[categoryColumn] ?? ''
    const categoryCells = rows.map((r) => r[categoryColumn] ?? '')
    const allNumericCategory = categoryCells.every((c) => parseNumericCell(c) !== null)
    const monotonic =
      allNumericCategory &&
      categoryCells
        .map((c) => parseNumericCell(c) as number)
        .every((v, i, arr) => i === 0 || v >= arr[i - 1])
    if (TEMPORAL_HEADER_RE.test(header) || monotonic) chartKind = 'line'
  }

  return { categoryColumn, numericColumns: series, chartKind }
}

/**
 * Parse every GFM pipe table out of a markdown document, in document order.
 * Fenced code blocks are skipped. Returns [] on any failure.
 */
export function parseReportTables(markdown: string): ParsedTable[] {
  if (!markdown || typeof markdown !== 'string') return []
  try {
    const lines = markdown.split(/\r?\n/)
    const tables: ParsedTable[] = []
    let inFence = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const fence = /^\s*(```|~~~)/.test(line)
      if (fence) {
        inFence = !inFence
        continue
      }
      if (inFence) continue

      // A table is a header row, a separator row, then >=1 data row.
      if (
        looksLikeTableRow(line) &&
        i + 1 < lines.length &&
        isSeparatorRow(lines[i + 1])
      ) {
        const headers = splitRow(line)
        if (headers.length === 0) continue

        const rows: string[][] = []
        let j = i + 2
        for (; j < lines.length; j++) {
          const rowLine = lines[j]
          if (!rowLine.trim() || !looksLikeTableRow(rowLine) || /^\s*(```|~~~)/.test(rowLine)) break
          const cells = splitRow(rowLine)
          // Pad / truncate ragged rows to header width.
          const normalized = headers.map((_, c) => (cells[c] ?? '').trim())
          rows.push(normalized)
        }

        const caption = captionFor(lines, i)
        const { categoryColumn, numericColumns, chartKind } = classify(headers, rows)
        tables.push({ headers, rows, caption, categoryColumn, numericColumns, chartKind })

        i = j - 1 // resume after the table
      }
    }

    return tables
  } catch {
    return []
  }
}
