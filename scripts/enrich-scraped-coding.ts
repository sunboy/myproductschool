/**
 * Enrich scraped algorithmic coding entries with Haiku-generated code artifacts.
 *
 * Reads seeds/scraped-raw.json, filters is_sql=false (~156 entries).
 * Calls claude-haiku-4-5-20251001 to generate starter_code, reference_solution,
 * test_cases, and reference_approach for each entry.
 * Appends results to seeds/staged-interview-challenges.json (preserves existing entries).
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/enrich-scraped-coding.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'
const BATCH_SIZE = 8
const SEEDS_DIR = path.join(process.cwd(), 'seeds')
const STAGED_PATH = path.join(SEEDS_DIR, 'staged-interview-challenges.json')
const SCRAPED_PATH = path.join(SEEDS_DIR, 'scraped-raw.json')
const FAILURES_LOG = path.join(SEEDS_DIR, 'enrichment-failures.log')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrapedEntry {
  title: string
  challenge_type: string
  is_sql: boolean
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_solution_prose: string
  source_approaches: string
  source_complexity: string
  time_min?: number
  difficulty: string
  problem_statement_markdown: string
  metadata: Record<string, unknown>
}

interface HaikuResult {
  starter_code: {
    python: string
    javascript: string
  }
  reference_solution: {
    python: string
    javascript: string
  }
  test_cases: Array<{
    id: string
    label: string
    args: unknown[]
    expected: unknown
    hidden: boolean
  }>
  reference_approach: string
}

interface StagedEntry {
  title: string
  challenge_type: string
  is_sql: boolean
  difficulty: string
  time_limit_seconds: number
  pattern: string
  problem_statement_markdown: string
  metadata: Record<string, unknown>
  source_question_id: string
  approved: boolean
  generated_at: string
}

// ---------------------------------------------------------------------------
// Build prompt for Haiku
// ---------------------------------------------------------------------------

function buildPrompt(entry: ScrapedEntry): string {
  return `You are converting a scraped interview problem into an EXECUTABLE coding challenge for HackProduct's Monaco-based coding workspace.

GROUND TRUTH (do not rewrite, only convert):
Title: ${entry.title}
Difficulty: ${entry.difficulty}
Category: ${entry.source_category}
Problem statement: ${entry.problem_statement_markdown}
Approaches (prose): ${entry.source_approaches}
Reference approach (prose): ${entry.source_solution_prose}
Complexity: ${entry.source_complexity}

PRODUCE valid JSON ONLY (no preamble, no markdown fences):
{
  "starter_code": {
    "python": "def solution(...):\\n    pass\\n",
    "javascript": "function solution(...) {\\n  \\n}\\n"
  },
  "reference_solution": {
    "python": "<ACTUALLY EXECUTABLE Python that solves the problem>",
    "javascript": "<ACTUALLY EXECUTABLE JS that solves the problem>"
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "args": [<concrete inputs>], "expected": <concrete output>, "hidden": false },
    { "id": "tc2", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc3", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc4", "label": "<edge case>", "args": [...], "expected": ..., "hidden": true },
    { "id": "tc5", "label": "<stress / tricky>", "args": [...], "expected": ..., "hidden": true }
  ],
  "reference_approach": "<one paragraph: optimal approach + complexity>"
}

RULES:
- Both Python and JS solutions must use the same function name \`solution\` and accept the same args in the same order.
- Test case \`args\` is an ARRAY of values that get spread into solution(...args). e.g. for two_sum, args=[ [2,7,11,15], 9 ] means solution([2,7,11,15], 9).
- \`expected\` is the literal return value (number, string, list, dict — concrete, not a description).
- All 5 test cases must produce DETERMINISTIC outputs. If the problem has multiple valid outputs (e.g. "any pair that sums to target"), normalize via sorting or pick a canonical convention and document it in reference_approach.
- DO NOT change the problem statement.`
}

// ---------------------------------------------------------------------------
// Call Haiku for one entry, with one retry on failure
// ---------------------------------------------------------------------------

async function enrichEntry(entry: ScrapedEntry): Promise<HaikuResult | null> {
  const prompt = buildPrompt(entry)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const suffix =
      attempt === 2 ? '\n\nNOTE: the previous response was invalid JSON or missing required fields. Return ONLY valid JSON this time — no preamble, no markdown fences, no trailing text.' : ''

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt + suffix }],
      })

      const text = response.content
        .filter((c) => c.type === 'text')
        .map((c) => (c as { type: 'text'; text: string }).text)
        .join('\n')

      // Extract outermost JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        if (attempt === 2) {
          logFailure(entry.title, 'No JSON object in response after retry')
          return null
        }
        continue
      }

      let parsed: HaikuResult
      try {
        parsed = JSON.parse(jsonMatch[0]) as HaikuResult
      } catch (parseErr) {
        if (attempt === 2) {
          logFailure(entry.title, `JSON parse error: ${(parseErr as Error).message}`)
          return null
        }
        continue
      }

      // Validate required fields
      const errors = validateHaikuResult(parsed)
      if (errors.length > 0) {
        if (attempt === 2) {
          logFailure(entry.title, `Validation failed: ${errors.join('; ')}`)
          return null
        }
        continue
      }

      return parsed
    } catch (err) {
      if (attempt === 2) {
        logFailure(entry.title, `API error: ${(err as Error).message}`)
        return null
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Validate Haiku result shape
// ---------------------------------------------------------------------------

function validateHaikuResult(result: HaikuResult): string[] {
  const errors: string[] = []

  if (!result.starter_code?.python || !result.starter_code?.javascript) {
    errors.push('Missing starter_code.python or starter_code.javascript')
  }
  if (!result.reference_solution?.python || !result.reference_solution?.javascript) {
    errors.push('Missing reference_solution.python or reference_solution.javascript')
  }
  if (!Array.isArray(result.test_cases) || result.test_cases.length < 5) {
    errors.push(`test_cases must have at least 5 items, got ${result.test_cases?.length ?? 0}`)
  } else {
    for (const tc of result.test_cases) {
      if (!tc.id || !tc.label || !Array.isArray(tc.args) || tc.expected === undefined) {
        errors.push(`test_case ${tc.id ?? '?'} missing required fields`)
      }
    }
  }
  if (!result.reference_approach) {
    errors.push('Missing reference_approach')
  }

  return errors
}

// ---------------------------------------------------------------------------
// Log failure to seeds/enrichment-failures.log
// ---------------------------------------------------------------------------

function logFailure(title: string, reason: string) {
  const line = `[${new Date().toISOString()}] FAILED: "${title}" — ${reason}\n`
  fs.appendFileSync(FAILURES_LOG, line, 'utf-8')
}

// ---------------------------------------------------------------------------
// Chunk array into batches of size n
// ---------------------------------------------------------------------------

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// ---------------------------------------------------------------------------
// Build staged entry from scraped + haiku result
// ---------------------------------------------------------------------------

function buildStagedEntry(entry: ScrapedEntry, haiku: HaikuResult): StagedEntry {
  return {
    title: entry.title,
    challenge_type: 'coding',
    is_sql: false,
    difficulty: entry.difficulty,
    time_limit_seconds: (entry.time_min ?? 30) * 60,
    pattern: entry.source_category,
    problem_statement_markdown: entry.problem_statement_markdown,
    metadata: {
      starter_code: haiku.starter_code,
      reference_solution: haiku.reference_solution,
      test_cases: haiku.test_cases,
      reference_approach: haiku.reference_approach,
      source: 'notion-scraped',
      source_question_id: entry.source_question_id,
      source_category: entry.source_category,
      source_companies: entry.source_companies,
    },
    source_question_id: entry.source_question_id,
    approved: false,
    generated_at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Load scraped raw, filter to algo (non-SQL) entries
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedEntry[]
  const algoEntries = scraped.filter((e) => e.is_sql === false)
  const total = algoEntries.length
  console.log(`Loaded ${total} algo (non-SQL) entries from scraped-raw.json`)

  // Load existing staged entries
  let existing: unknown[] = []
  if (fs.existsSync(STAGED_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
    } catch {
      existing = []
    }
  }
  console.log(`Loaded ${existing.length} existing entries from staged-interview-challenges.json`)

  // Build set of existing titles to avoid duplicates
  const existingTitles = new Set(
    existing.map((e) => (e as { title?: string }).title ?? '').filter(Boolean)
  )

  // Filter out entries already in staged
  const toEnrich = algoEntries.filter((e) => !existingTitles.has(e.title))
  const skippedDups = algoEntries.length - toEnrich.length
  console.log(`Skipping ${skippedDups} duplicate titles already in staged file`)
  console.log(`Enriching ${toEnrich.length} entries...\n`)

  // Process in parallel batches of BATCH_SIZE
  // Write to disk after EVERY batch so a crash mid-run loses at most one batch.
  // Re-running the script auto-resumes because completed titles are already in staged.
  const batches = chunk(toEnrich, BATCH_SIZE)
  let succeeded = 0
  let failed = 0
  let done = 0
  let totalAppended = 0

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async (entry) => {
        const haiku = await enrichEntry(entry)
        done++

        if (done % 10 === 0) {
          console.log(`  [${done}/${toEnrich.length}] enriched: ${entry.title}`)
        }

        if (haiku) {
          succeeded++
          return buildStagedEntry(entry, haiku)
        } else {
          failed++
          return null
        }
      })
    )

    const batchSuccesses = results.filter((r): r is StagedEntry => r !== null)

    if (batchSuccesses.length > 0) {
      // Read current staged file fresh (in case another process wrote), append, write back
      let currentStaged: unknown[] = []
      try {
        currentStaged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
      } catch {
        currentStaged = []
      }
      const updated = [...currentStaged, ...batchSuccesses]
      fs.writeFileSync(STAGED_PATH, JSON.stringify(updated, null, 2), 'utf-8')
      totalAppended += batchSuccesses.length
    }
  }

  console.log(`\nEnrichment complete: succeeded ${succeeded}/${toEnrich.length}, failed ${failed}, skipped-as-duplicate ${skippedDups}, appended ${totalAppended}`)
  if (failed > 0) {
    console.log(`Failures logged to: ${FAILURES_LOG}`)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
