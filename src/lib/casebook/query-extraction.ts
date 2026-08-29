// Casebook Loop — SQL/query extraction from native Claude Code transcript
// blocks, for chart_specs generation at filing time.
//
// WHY STRUCTURED, NOT REGEX-ON-RENDERED-TEXT
// scripts/casebook/annotate-session.ts's extractQueriesFromText regexes a
// PRE-FLATTENED text blob. That is fine for its input (already-flat authoring
// fixtures) but recreates the exact failure mode that was Phase 1 pipeline bug
// #5: a naive text-only extractor silently misses the MCP tool-call form
// (`tool_use` blocks with `input.query`/`input.sql`) because the text
// rendering step that would make it visible to a regex is itself lossy or
// inconsistent. The failure is quiet — extraction returns fewer results, and
// nothing errors, so a real case with heavy MCP tool use looks like a case
// with barely any activity.
//
// This module extracts directly from the PARSED content-block structure
// (the same NativeEvent shape scripts/casebook/convert-cc-transcript.ts
// parses), before any text flattening happens, and pairs each SQL-bearing
// tool_use with its tool_result BY tool_use_id — never by adjacency. Two
// forms are handled explicitly (ported from convert-cc-transcript.ts's
// verified real-transcript findings, see that file's header comment):
//
//   1. MCP tool-call form: a `tool_use` block whose `input` has a
//      SQL-bearing key (command/query/sql) or a string value that reads as
//      SQL/shell (looksLikeSqlOrShell) — e.g. mcp__bigquery__bq_query with
//      `input.query`, or a `Bash` tool_use with `input.command` running
//      `bq query "SELECT ..."`.
//   2. Legacy CLI-echo form: plain text carrying a `$ bq query` / `$ psql`
//      prefix followed by bare SQL (kept for fixture/back-compat parity with
//      annotate-session.ts's extractQueriesFromText, in case any transcript
//      line ever renders that way).
//
// Both forms are exercised in tests/lib/casebook/query-extraction.test.ts —
// a CLI-only test would pass while reproducing bug #5, so both must be
// present per the project's explicit direction on this scope addition.

export interface NativeContentBlock {
  type?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string | Array<{ type?: string; text?: string }>
  text?: string
  [key: string]: unknown
}

export interface ExtractedQuery {
  /** ISO timestamp of the tool_use call, if known. */
  timestamp: string | null
  sql: string
  /** Rendered text of the paired tool_result (by tool_use_id), or null if none was found. */
  resultText: string | null
  nondeterministicOrder: boolean
}

const SQL_BEARING_INPUT_KEYS = ['command', 'query', 'sql']
const SQL_KEYWORD_TEST = /\b(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i
const ORDER_BY_PATTERN = /\border\s+by\b/i

function looksLikeSqlOrShell(text: string): boolean {
  return SQL_KEYWORD_TEST.test(text) || /^\s*\$/.test(text)
}

/**
 * Strips a leading `$ bq query` / `$ psql` / `$ sqlite3` shell-echo prefix,
 * if present. Handles two real shapes:
 *   1. Prefix on its own line, SQL on the next line(s):
 *        "$ bq query\nSELECT ..."
 *   2. Prefix and SQL on the SAME line, SQL wrapped in quotes (the shape a
 *      Bash tool_use's input.command carries, e.g. `$ bq query "SELECT ...;"`):
 *        '$ bq query "SELECT ...;"'
 *      The wrapping quote (single or double) is stripped along with the
 *      prefix; a trailing matching quote (if present) is stripped by the
 *      caller's statement isolation, since it falls outside the semicolon.
 */
function stripCliEchoPrefix(text: string): string {
  const sameLine = text.replace(/^\$\s*(?:bq|psql|sqlite3)\b[^\n"']*["']/i, '')
  if (sameLine !== text) return sameLine
  return text.replace(/^\$\s*(?:bq|psql|sqlite3)\b[^\n]*\n/i, '')
}

/**
 * Pulls the first SQL statement out of a candidate string, requiring a
 * leading SELECT/WITH/INSERT/UPDATE/DELETE/CREATE TABLE keyword (a leading
 * `--` comment line is tolerated). Returns null if nothing SQL-shaped is found.
 * Mirrors annotate-session.ts's extractQueriesFromText semicolon-split logic,
 * applied here to an already-isolated candidate string rather than a whole
 * rendered blob.
 */
function firstSqlStatement(candidate: string): string | null {
  const body = stripCliEchoPrefix(candidate)
  const KEYWORD = /^(?:--[^\n]*\n\s*)*(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i
  const statements = body
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && KEYWORD.test(s))
  if (statements.length === 0) return null
  return `${statements[0]};`
}

/**
 * Extracts a SQL statement from a tool_use block's input, MCP form. Checks
 * SQL-bearing keys first (command/query/sql), then falls back to scanning
 * every string field for SQL/shell-shaped content — mirrors
 * convert-cc-transcript.ts's renderToolUse verbatim-preservation rule (the
 * matched text itself is never rewritten).
 */
function extractSqlFromToolUse(block: NativeContentBlock): string | null {
  const input = block.input ?? {}
  for (const key of SQL_BEARING_INPUT_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) {
      const sql = firstSqlStatement(value)
      if (sql) return sql
    }
  }
  for (const value of Object.values(input)) {
    if (typeof value === 'string' && looksLikeSqlOrShell(value)) {
      const sql = firstSqlStatement(value)
      if (sql) return sql
    }
  }
  return null
}

function renderToolResultText(block: NativeContentBlock): string | null {
  const raw = block.content
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    const parts = raw.filter((b) => b?.type === 'text' && typeof b.text === 'string').map((b) => b.text as string)
    return parts.length ? parts.join('\n') : null
  }
  return null
}

/**
 * Extracts every SQL query from one native transcript line's content blocks,
 * pairing each tool_use's SQL with its tool_result by tool_use_id (looked up
 * across the WHOLE line list passed in — a tool_result commonly lands in a
 * later line than its tool_use). Also handles the legacy CLI-echo text form
 * for back-compat with fixture-shaped content.
 *
 * `allBlocksWithTimestamp` is the full ordered list of (block, timestamp)
 * pairs across every line of the transcript being scanned — passed in
 * (rather than re-deriving per-line) so tool_use/tool_result pairing can
 * cross line boundaries, which is the normal case in real transcripts.
 */
export function extractQueries(
  allBlocksWithTimestamp: Array<{ block: NativeContentBlock; timestamp: string | null }>,
): ExtractedQuery[] {
  const resultById = new Map<string, string | null>()
  for (const { block } of allBlocksWithTimestamp) {
    if (block.type === 'tool_result' && block.tool_use_id) {
      resultById.set(block.tool_use_id, renderToolResultText(block))
    }
  }

  const out: ExtractedQuery[] = []

  for (const { block, timestamp } of allBlocksWithTimestamp) {
    if (block.type === 'tool_use') {
      const sql = extractSqlFromToolUse(block)
      if (!sql) continue
      const resultText = block.id ? (resultById.get(block.id) ?? null) : null
      out.push({
        timestamp,
        sql,
        resultText,
        nondeterministicOrder: !ORDER_BY_PATTERN.test(sql),
      })
      continue
    }

    // Legacy CLI-echo text form: a plain text block (user/assistant `text`
    // type, or any block carrying a `text` string) that opens with a shell
    // echo prefix like `$ bq query`.
    if (typeof block.text === 'string' && /^\s*\$\s*(?:bq|psql|sqlite3)\b/i.test(block.text)) {
      const sql = firstSqlStatement(block.text)
      if (sql) {
        out.push({
          timestamp,
          sql,
          resultText: null,
          nondeterministicOrder: !ORDER_BY_PATTERN.test(sql),
        })
      }
    }
  }

  return out
}
