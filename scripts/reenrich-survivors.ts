/**
 * reenrich-survivors.ts
 *
 * Re-enriches the 89 algo entries that validated successfully in the main run
 * but were lost due to two concurrent processes overwriting staged-interview-challenges.json.
 *
 * Reads titles from /tmp/all-algo-survivors.txt, enriches each via Haiku,
 * validates via Judge0, and appends approved=true entries to the staged file.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/reenrich-survivors.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { submitToJudge0, pollJudge0Result } from '../src/lib/judge0/client'
import type { SupportedJudge0Language } from '../src/lib/judge0/languageMap'

// ---------------------------------------------------------------------------
// Simple harness wrappers (original shape — no tree/linked list boilerplate).
// The 89 survivor algo entries are all flat-function problems; they do NOT
// need the extended TreeNode/ListNode helpers added in T4a.
// Using the simple wrappers avoids the NZEC errors caused by the extended
// JS_DESERIALIZER_PROLOGUE that the current wrapWithHarness() injects.
// ---------------------------------------------------------------------------

function wrapSimplePython(userCode: string): string {
  return `import sys, json
${userCode}
_args = json.loads(sys.stdin.read())
_result = solution(*_args)
print(json.dumps(_result))
`
}

function wrapSimpleJavaScript(userCode: string): string {
  return `${userCode}
const _args = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'))
const _result = solution(..._args)
console.log(JSON.stringify(_result))
`
}

function wrapSimple(code: string, lang: SupportedJudge0Language): string {
  if (lang === 'python') return wrapSimplePython(code)
  if (lang === 'javascript') return wrapSimpleJavaScript(code)
  throw new Error(`Unsupported lang: ${lang}`)
}

const MODEL = 'claude-haiku-4-5-20251001'
const STAGED_PATH = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')
const SCRAPED_PATH = path.join(process.cwd(), 'seeds', 'scraped-raw.json')
const FAILURES_LOG = path.join(process.cwd(), 'seeds', 'enrichment-failures.log')
const SURVIVORS_FILE = '/tmp/all-algo-survivors.txt'
const CONCURRENCY = 1  // serial to avoid race condition on staged JSON file writes
const PACE_MS = 200

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function logFailure(title: string, reason: string) {
  const line = `[${new Date().toISOString()}] REENRICH-FAILED: "${title}" — ${reason}\n`
  fs.appendFileSync(FAILURES_LOG, line, 'utf-8')
  console.log(`  ✗ DROPPED: ${title} (${reason.slice(0, 100)})`)
}

interface ScrapedEntry {
  title: string
  is_sql: boolean
  source_question_id: string
  source_category: string
  source_companies: string[]
  source_solution_prose: string
  source_approaches?: string
  source_complexity?: string
  time_min?: number
  difficulty: string
  problem_statement_markdown: string
}

interface TestCase {
  id: string
  label: string
  args: unknown[]
  expected: unknown
  hidden: boolean
}

interface AlgoHaiku {
  starter_code: { python: string; javascript: string }
  reference_solution: { python: string; javascript: string }
  test_cases: TestCase[]
  reference_approach: string
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('No JSON in response')
  return JSON.parse(m[0])
}

async function callHaiku(prompt: string): Promise<string> {
  let attempt = 0
  while (true) {
    attempt++
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      return response.content
        .filter((c) => c.type === 'text')
        .map((c) => (c as { type: 'text'; text: string }).text)
        .join('\n')
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      const isRate = e.status === 429 || (e.message ?? '').includes('429') || (e.message ?? '').includes('rate_limit')
      if (isRate && attempt < 6) {
        const wait = 5000 * Math.pow(2, attempt - 1)
        await sleep(wait)
        continue
      }
      throw err
    }
  }
}

function buildAlgoPrompt(e: ScrapedEntry, feedback?: string): string {
  return `You are converting a scraped interview problem into an EXECUTABLE coding challenge for HackProduct's Monaco-based coding workspace.

GROUND TRUTH (do not rewrite, only convert):
Title: ${e.title}
Difficulty: ${e.difficulty}
Category: ${e.source_category}
Problem statement: ${e.problem_statement_markdown}
Approaches (prose): ${e.source_approaches ?? ''}
Reference approach (prose): ${e.source_solution_prose}
Complexity: ${e.source_complexity ?? ''}
${feedback ? `\nPREVIOUS ATTEMPT FAILED VALIDATION: ${feedback}\n` : ''}
PRODUCE valid JSON ONLY (no preamble, no markdown fences):
{
  "starter_code": {
    "python": "def solution(...):\\n    pass\\n",
    "javascript": "function solution(...) {\\n  \\n}\\n"
  },
  "reference_solution": {
    "python": "<ACTUALLY EXECUTABLE Python>",
    "javascript": "<ACTUALLY EXECUTABLE JS>"
  },
  "test_cases": [
    { "id": "tc1", "label": "<short>", "args": [<concrete inputs>], "expected": <concrete output>, "hidden": false },
    { "id": "tc2", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc3", "label": "<short>", "args": [...], "expected": ..., "hidden": false },
    { "id": "tc4", "label": "<edge case>", "args": [...], "expected": ..., "hidden": true },
    { "id": "tc5", "label": "<stress / tricky>", "args": [...], "expected": ..., "hidden": true }
  ],
  "reference_approach": "<one paragraph>"
}

RULES:
- Both Python and JS solutions must use the same function name 'solution' and accept the same args in the same order.
- Test case 'args' is an ARRAY of values that get spread into solution(...args).
- 'expected' is the literal return value (concrete, not a description).
- Outputs must be DETERMINISTIC. If multiple valid outputs exist, normalize via sorting.`
}

function normalizeOutput(raw: string): unknown {
  const trimmed = raw.trim()
  try { return JSON.parse(trimmed) } catch { return trimmed }
}
function outputMatches(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

async function validateAlgo(haiku: AlgoHaiku): Promise<{ passed: boolean; failedCases: string[] }> {
  const langs: SupportedJudge0Language[] = ['python', 'javascript']
  const allFailed: string[] = []

  for (const lang of langs) {
    const code = haiku.reference_solution[lang]
    if (!code) continue
    const wrapped = wrapSimple(code, lang)

    for (const tc of haiku.test_cases) {
      try {
        const { token } = await submitToJudge0({ sourceCode: wrapped, language: lang, stdin: JSON.stringify(tc.args) })
        const result = await pollJudge0Result(token)
        if (result.status.id !== 3) {
          const detail = result.compile_output ?? result.stderr ?? result.status.description
          allFailed.push(`[${lang}] ${tc.id}: execution failed — ${result.status.description} | ${(detail ?? '').trim().slice(0, 100)}`)
          continue
        }
        const actual = normalizeOutput(result.stdout ?? '')
        if (!outputMatches(actual, tc.expected)) {
          allFailed.push(`[${lang}] ${tc.id}: wrong answer | expected: ${JSON.stringify(tc.expected)} | actual: ${JSON.stringify(actual)}`)
        }
      } catch (err) {
        allFailed.push(`[${lang}] ${tc.id}: error — ${(err as Error).message}`)
      }
    }
  }

  return { passed: allFailed.length === 0, failedCases: allFailed }
}

function appendToStaged(entry: object) {
  const existing = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
  const titles = new Set(existing.map((e) => (e as { title?: string }).title ?? ''))
  const t = (entry as { title?: string }).title ?? ''
  if (titles.has(t)) return // already present
  fs.writeFileSync(STAGED_PATH, JSON.stringify([...existing, entry], null, 2))
}

async function processEntry(e: ScrapedEntry, idx: number, total: number): Promise<boolean> {
  process.stdout.write(`[${idx + 1}/${total}] ${e.title.slice(0, 60)}... `)

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const feedback = attempt === 2 ? 'previous attempt failed Judge0 validation' : undefined
      const text = await callHaiku(buildAlgoPrompt(e, feedback))
      const parsed = extractJson(text) as AlgoHaiku

      if (!parsed.reference_solution?.python || !parsed.reference_solution?.javascript) {
        if (attempt === 2) { logFailure(e.title, 'missing reference_solution'); return false }
        continue
      }
      if (!Array.isArray(parsed.test_cases) || parsed.test_cases.length < 5) {
        if (attempt === 2) { logFailure(e.title, `test_cases<5`); return false }
        continue
      }

      const { passed, failedCases } = await validateAlgo(parsed)

      if (passed) {
        process.stdout.write(attempt === 1 ? '✓\n' : '↻ ✓\n')
        const staged = {
          title: e.title,
          challenge_type: 'coding',
          is_sql: false,
          difficulty: e.difficulty,
          time_limit_seconds: (e.time_min ?? 30) * 60,
          pattern: e.source_category,
          problem_statement_markdown: e.problem_statement_markdown,
          metadata: {
            starter_code: parsed.starter_code,
            reference_solution: parsed.reference_solution,
            test_cases: parsed.test_cases,
            reference_approach: parsed.reference_approach,
            source: 'notion-scraped',
            source_question_id: e.source_question_id,
            source_category: e.source_category,
            source_companies: e.source_companies,
          },
          source_question_id: e.source_question_id,
          approved: true,
          generated_at: new Date().toISOString(),
        }
        appendToStaged(staged)
        return true
      }

      if (attempt === 2) {
        process.stdout.write('✗\n')
        logFailure(e.title, failedCases.slice(0, 2).join(' | '))
        return false
      }
      // attempt 1 failed — loop to attempt 2
    } catch (err) {
      if (attempt === 2) {
        process.stdout.write('✗\n')
        logFailure(e.title, `error: ${(err as Error).message}`)
        return false
      }
      await sleep(2000)
    }
  }
  return false
}

async function main() {
  console.log('=== reenrich-survivors.ts ===\n')

  if (!fs.existsSync(SURVIVORS_FILE)) {
    console.error(`${SURVIVORS_FILE} not found`)
    process.exit(1)
  }

  const survivorTitles = new Set(
    fs.readFileSync(SURVIVORS_FILE, 'utf-8').split('\n').map(t => t.trim()).filter(Boolean)
  )
  console.log(`Survivor titles to re-enrich: ${survivorTitles.size}`)

  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedEntry[]
  const toProcess = scraped.filter(e => !e.is_sql && survivorTitles.has(e.title))
  console.log(`Found in scraped-raw: ${toProcess.length}`)

  // Skip titles already approved in staged (not just present — avoids skipping failed entries)
  const existing = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Array<{ title?: string; approved?: boolean }>
  const approvedTitles = new Set(existing.filter(e => e.approved === true).map(e => e.title ?? ''))
  const todo = toProcess.filter(e => !approvedTitles.has(e.title))
  console.log(`Already approved in staged: ${toProcess.length - todo.length}`)
  console.log(`Need to enrich: ${todo.length}\n`)

  if (todo.length === 0) {
    console.log('Nothing to do.')
    process.exit(0)
  }

  let succeeded = 0
  let failed = 0
  let cursor = 0
  const workers: Promise<void>[] = []

  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push((async () => {
      while (true) {
        const i = cursor++
        if (i >= todo.length) break
        const start = Date.now()
        const ok = await processEntry(todo[i], i, todo.length)
        if (ok) succeeded++; else failed++
        if ((succeeded + failed) % 10 === 0) {
          console.log(`  Progress: ${succeeded + failed}/${todo.length} done (✓${succeeded} ✗${failed})`)
        }
        const elapsed = Date.now() - start
        if (elapsed < PACE_MS) await sleep(PACE_MS - elapsed)
      }
    })())
  }

  await Promise.all(workers)

  console.log(`\n=== Done ===`)
  console.log(`Succeeded: ${succeeded}, Failed: ${failed}`)

  const final = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as unknown[]
  const approvedScraped = (final as Array<{ metadata?: { source?: string }; approved?: boolean }>)
    .filter(e => e.metadata?.source === 'notion-scraped' && e.approved === true)
  console.log(`Staged total: ${final.length}`)
  console.log(`approved notion-scraped: ${approvedScraped.length}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
