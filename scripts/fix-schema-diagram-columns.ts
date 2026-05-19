/**
 * Backfill schema_diagram.tables[*].columns for SQL coding challenges where
 * columns were authored as bare strings instead of {name, type, constraints}.
 *
 * Parses setup_script's CREATE TABLE statements to recover types/constraints.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/fix-schema-diagram-columns.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing supabase env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface ParsedColumn {
  name: string
  type: string
  constraints: string[]
}

/**
 * Parse a single CREATE TABLE block and return columns with types + constraints.
 * Handles SQLite-flavored DDL produced by our authoring pipeline.
 */
function parseCreateTable(ddl: string, tableName: string): ParsedColumn[] | null {
  // Find CREATE TABLE block for this specific table (case-insensitive).
  // Match: CREATE TABLE [IF NOT EXISTS] tableName ( ... );
  const re = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?["\`]?${tableName}["\`]?\\s*\\(([\\s\\S]*?)\\)\\s*;`,
    'i'
  )
  const match = ddl.match(re)
  if (!match) return null

  const body = match[1]

  // Split on commas not inside parens (e.g. DECIMAL(10,2) shouldn't split).
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of body) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())

  const cols: ParsedColumn[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    // Skip table-level constraints like PRIMARY KEY (a,b), FOREIGN KEY (...).
    if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(trimmed)) continue

    // First token is the column name (may be quoted).
    const tokenMatch = trimmed.match(/^["`]?(\w+)["`]?\s+(.+)$/)
    if (!tokenMatch) continue
    const name = tokenMatch[1]
    const rest = tokenMatch[2]

    // Type is everything up to the first constraint keyword (or the whole rest).
    const typeMatch = rest.match(/^([A-Z_]+(?:\s*\([^)]*\))?)/i)
    const type = typeMatch ? typeMatch[1].trim() : 'TEXT'
    const after = rest.slice(typeMatch ? typeMatch[0].length : 0)

    const constraints: string[] = []
    if (/PRIMARY\s+KEY/i.test(after)) constraints.push('PK')
    if (/REFERENCES/i.test(after)) {
      const fkMatch = after.match(/REFERENCES\s+["`]?(\w+)["`]?(?:\s*\(\s*["`]?(\w+)["`]?\s*\))?/i)
      if (fkMatch) {
        constraints.push(`FK→${fkMatch[1]}${fkMatch[2] ? `.${fkMatch[2]}` : ''}`)
      } else {
        constraints.push('FK')
      }
    }
    if (/NOT\s+NULL/i.test(after)) constraints.push('NOT NULL')
    if (/UNIQUE/i.test(after)) constraints.push('UNIQUE')

    cols.push({ name, type, constraints })
  }

  return cols.length > 0 ? cols : null
}

interface Challenge {
  id: string
  title: string
  metadata: {
    sql_schema?: {
      setup_script?: string
      schema_diagram?: {
        tables?: Array<{ name: string; columns: unknown[] }>
        relationships?: unknown[]
      }
    }
    [key: string]: unknown
  }
}

async function main() {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, metadata')
    .eq('challenge_type', 'coding')

  if (error) {
    console.error('fetch failed:', error.message)
    process.exit(1)
  }

  const challenges = data as Challenge[]
  let inspected = 0
  let needsFix = 0
  let fixed = 0
  let skipped = 0

  for (const c of challenges) {
    const sqlSchema = c.metadata?.sql_schema
    if (!sqlSchema?.schema_diagram?.tables) continue
    inspected++

    const tables = sqlSchema.schema_diagram.tables
    const hasBareStrings = tables.some((t) => typeof t.columns?.[0] === 'string')
    if (!hasBareStrings) continue
    needsFix++

    const ddl = sqlSchema.setup_script
    if (!ddl) {
      console.warn(`  skip "${c.title}" — no setup_script to parse`)
      skipped++
      continue
    }

    const newTables = tables.map((t) => {
      // Already in object shape? Pass through.
      if (t.columns?.[0] && typeof t.columns[0] === 'object') return t

      const parsed = parseCreateTable(ddl, t.name)
      if (!parsed) {
        // Fallback: upgrade strings to {name, type:'', constraints:[]}.
        const fallback = (t.columns as string[]).map((name) => ({
          name,
          type: '',
          constraints: [],
        }))
        return { ...t, columns: fallback }
      }
      return { ...t, columns: parsed }
    })

    // Write back
    const newMetadata = {
      ...c.metadata,
      sql_schema: {
        ...sqlSchema,
        schema_diagram: {
          ...sqlSchema.schema_diagram,
          tables: newTables,
        },
      },
    }

    const { error: updateError } = await supabase
      .from('challenges')
      .update({ metadata: newMetadata })
      .eq('id', c.id)

    if (updateError) {
      console.error(`  fail "${c.title}":`, updateError.message)
      continue
    }
    fixed++
    const sample = newTables[0]?.columns?.[0]
    console.log(
      `  ✓ "${c.title}" — sample: ${typeof sample === 'object' ? JSON.stringify(sample) : sample}`
    )
  }

  console.log(`\nInspected: ${inspected}`)
  console.log(`Needed fix: ${needsFix}`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Skipped (no setup_script): ${skipped}`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
