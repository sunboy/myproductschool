/**
 * Import scraped algo + SQL CSVs into seeds/scraped-raw.json.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/import-scraped-banks.ts
 *
 * Input:
 *   /tmp/hp-coding-bank.csv  — 162 algorithmic coding rows (BOM-prefixed)
 *   /tmp/hp-sql-bank.csv     — 112 SQL coding rows (BOM-prefixed)
 *
 * Output:
 *   seeds/scraped-raw.json   — flat array: algo rows first, then SQL rows
 */

import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Robust CSV parser — handles BOM, quoted fields with embedded commas/newlines/quotes
// ---------------------------------------------------------------------------

function parseCSV(filePath: string): Array<Record<string, string>> {
  const raw = fs.readFileSync(filePath, 'utf8')
  // Strip UTF-8 BOM (0xEF 0xBB 0xBF) or Unicode BOM char
  const content = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw

  let i = 0
  const len = content.length

  function parseField(): string {
    if (i < len && content[i] === '"') {
      // Quoted field — may contain commas, newlines, escaped double-quotes
      i++ // skip opening quote
      let field = ''
      while (i < len) {
        if (content[i] === '"' && content[i + 1] === '"') {
          // Escaped double-quote
          field += '"'
          i += 2
        } else if (content[i] === '"') {
          i++ // skip closing quote
          break
        } else {
          field += content[i++]
        }
      }
      return field
    } else {
      // Unquoted field — ends at comma or newline
      let field = ''
      while (i < len && content[i] !== ',' && content[i] !== '\n' && content[i] !== '\r') {
        field += content[i++]
      }
      return field
    }
  }

  function parseRow(): string[] | null {
    if (i >= len) return null
    const fields: string[] = []
    while (i < len && content[i] !== '\n' && content[i] !== '\r') {
      fields.push(parseField())
      // Skip field separator
      if (i < len && content[i] === ',') {
        i++
      } else {
        break
      }
    }
    // Skip \r\n or \n
    if (i < len && content[i] === '\r') i++
    if (i < len && content[i] === '\n') i++
    return fields
  }

  // Parse header row
  const headerFields = parseRow()
  if (!headerFields) return []
  // Strip any trailing \r from header field names
  const headers = headerFields.map((h) => h.trim().replace(/\r$/, ''))

  const rows: Array<Record<string, string>> = []

  while (i < len) {
    const startI = i
    const fields = parseRow()
    if (!fields) break
    // Skip empty rows
    if (fields.length === 1 && fields[0] === '') continue
    // Skip rows that don't match header count (malformed / partial)
    if (fields.length !== headers.length) {
      continue
    }
    const row: Record<string, string> = {}
    headers.forEach((h, j) => {
      row[h] = (fields[j] ?? '').trim()
    })
    rows.push(row)
    // Guard against infinite loop
    if (i === startI) break
  }

  return rows
}

// ---------------------------------------------------------------------------
// Difficulty mapping
// ---------------------------------------------------------------------------

function mapDifficulty(level: string): 'warmup' | 'standard' | 'advanced' {
  const l = level.toLowerCase().trim()
  if (l === 'foundation') return 'warmup'
  if (l === 'intermediate') return 'standard'
  if (l === 'advanced') return 'advanced'
  if (l === 'staff') return 'advanced'
  // Default fallback
  return 'standard'
}

// ---------------------------------------------------------------------------
// Split comma-separated tag strings
// ---------------------------------------------------------------------------

function splitTags(raw: string): string[] {
  if (!raw || raw.trim() === '') return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Parse numeric fields
// ---------------------------------------------------------------------------

function parseIntOrNull(raw: string): number | null {
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}

function parseIntWithDefault(raw: string, fallback: number): number {
  const n = parseInt(raw, 10)
  return isNaN(n) ? fallback : n
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlgoEntry {
  title: string
  challenge_type: 'coding'
  is_sql: false
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_role_levels: string[]
  source_solution_prose: string
  source_approaches: string
  source_complexity: string
  time_min: number
  recency_score: number | null
  difficulty: 'warmup' | 'standard' | 'advanced'
  problem_statement_markdown: string
  metadata: { source: 'notion-scraped'; scraped_at: string }
  approved: false
}

interface SqlEntry {
  title: string
  challenge_type: 'coding'
  is_sql: true
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_role_levels: string[]
  source_solution_prose: string
  source_schema_text: string
  source_hint: string
  source_key_concept: string
  source_followup: string
  time_min: number
  recency_score: number | null
  difficulty: 'warmup' | 'standard' | 'advanced'
  problem_statement_markdown: string
  metadata: { source: 'notion-scraped'; scraped_at: string }
  approved: false
}

type ScrapedEntry = AlgoEntry | SqlEntry

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const scrapedAt = new Date().toISOString()

  // -------------------------------------------------------------------------
  // 1. Parse algo CSV
  // -------------------------------------------------------------------------
  const algoPath = '/tmp/hp-coding-bank.csv'
  const algoRows = parseCSV(algoPath)
  console.log(`Parsed ${algoRows.length} rows from ${algoPath}`)

  // -------------------------------------------------------------------------
  // 2. Parse SQL CSV
  // -------------------------------------------------------------------------
  const sqlPath = '/tmp/hp-sql-bank.csv'
  const sqlRows = parseCSV(sqlPath)
  console.log(`Parsed ${sqlRows.length} rows from ${sqlPath}`)

  // -------------------------------------------------------------------------
  // 3. Convert algo rows
  // -------------------------------------------------------------------------
  const algoEntries: AlgoEntry[] = algoRows.map((row) => ({
    title: row['Title']?.trim() ?? '',
    challenge_type: 'coding' as const,
    is_sql: false as const,
    source_question_id: row['Question ID']?.trim() ?? '',
    source_category: row['Category']?.trim() ?? '',
    source_companies: splitTags(row['Company Tags'] ?? ''),
    source_role_levels: splitTags(row['Role'] ?? ''),
    source_solution_prose: row['Solution']?.trim() ?? '',
    source_approaches: row['Approaches']?.trim() ?? '',
    source_complexity: row['Complexity']?.trim() ?? '',
    time_min: parseIntWithDefault(row['Time (min)'] ?? '', 30),
    recency_score: parseIntOrNull(row['Recency Score'] ?? ''),
    difficulty: mapDifficulty(row['Level'] ?? ''),
    problem_statement_markdown: row['Problem Statement']?.trim() ?? '',
    metadata: { source: 'notion-scraped' as const, scraped_at: scrapedAt },
    approved: false as const,
  }))

  // -------------------------------------------------------------------------
  // 4. Convert SQL rows
  // -------------------------------------------------------------------------
  const sqlEntries: SqlEntry[] = sqlRows.map((row) => ({
    title: row['Title']?.trim() ?? '',
    challenge_type: 'coding' as const,
    is_sql: true as const,
    source_question_id: row['Question ID']?.trim() ?? '',
    source_category: row['Category']?.trim() ?? '',
    source_companies: splitTags(row['Company'] ?? ''),   // singular 'Company' in SQL CSV
    source_role_levels: splitTags(row['Role'] ?? ''),
    source_solution_prose: row['Solution']?.trim() ?? '',
    source_schema_text: row['Schema']?.trim() ?? '',
    source_hint: row['Hint']?.trim() ?? '',
    source_key_concept: row['Key Concept']?.trim() ?? '',
    source_followup: row['Follow-up']?.trim() ?? '',
    time_min: parseIntWithDefault(row['Time (min)'] ?? '', 20),
    recency_score: parseIntOrNull(row['Recency Score'] ?? ''),
    difficulty: mapDifficulty(row['Level'] ?? ''),
    problem_statement_markdown: row['Question']?.trim() ?? '',
    metadata: { source: 'notion-scraped' as const, scraped_at: scrapedAt },
    approved: false as const,
  }))

  // -------------------------------------------------------------------------
  // 5. Dedup by title — keep first occurrence, warn on subsequent
  // -------------------------------------------------------------------------
  const all: ScrapedEntry[] = [...algoEntries, ...sqlEntries]
  const seen = new Map<string, number>() // title -> first index
  const deduped: ScrapedEntry[] = []
  let droppedCount = 0

  for (const entry of all) {
    const key = entry.title.toLowerCase()
    if (seen.has(key)) {
      console.warn(
        `  DEDUP: Dropping duplicate title "${entry.title}" (kept entry at index ${seen.get(key)})`
      )
      droppedCount++
    } else {
      seen.set(key, deduped.length)
      deduped.push(entry)
    }
  }

  // -------------------------------------------------------------------------
  // 6. Write output
  // -------------------------------------------------------------------------
  const outDir = path.join(process.cwd(), 'seeds')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'scraped-raw.json')
  fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2))

  const algoCount = deduped.filter((e) => !e.is_sql).length
  const sqlCount = deduped.filter((e) => e.is_sql).length
  const total = deduped.length

  console.log(
    `Imported ${algoCount} algo + ${sqlCount} SQL = ${total} total. Dropped ${droppedCount} dups. Output: seeds/scraped-raw.json`
  )
}

main()
