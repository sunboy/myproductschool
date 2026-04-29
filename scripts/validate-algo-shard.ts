/**
 * Sharded algo validator. Each shard validates a slice of unapproved scraped algo entries
 * against Judge0, writes results to a per-shard report file. A merge step (validate-merge.ts)
 * aggregates results into the staged file.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/validate-algo-shard.ts --shard 0/4
 *   npx tsx --env-file=.env.local scripts/validate-algo-shard.ts --shard 1/4
 *   ...
 */

import * as fs from 'fs'
import * as path from 'path'
import { submitToJudge0, pollJudge0Result } from '../src/lib/judge0/client'
import { wrapWithHarness } from '../src/lib/judge0/harness'
import type { SupportedJudge0Language } from '../src/lib/judge0/languageMap'
import { compareOutputs } from '../src/lib/coding/compare'

const SEEDS_DIR = path.join(process.cwd(), 'seeds')
const STAGED_PATH = path.join(SEEDS_DIR, 'staged-interview-challenges.json')

interface TestCase {
  id: string
  label: string
  args: unknown[]
  input_types?: string[]
  output_type?: string
  expected: unknown
  compare_mode?: 'exact' | 'set' | 'sorted' | 'sorted_each'
  hidden: boolean
}

interface Entry {
  title: string
  is_sql: boolean
  metadata?: {
    source?: string
    test_cases?: TestCase[]
    reference_solution?: { python?: string; javascript?: string }
  }
  approved: boolean
}

interface Result {
  title: string
  passed: boolean
  failure_summary?: string
}

const LANGS: SupportedJudge0Language[] = ['python', 'javascript']

function parseShard(): { idx: number; total: number } {
  const arg = process.argv.find((a) => a.startsWith('--shard'))
  if (!arg) return { idx: 0, total: 1 }
  const v = arg.includes('=') ? arg.split('=')[1] : process.argv[process.argv.indexOf(arg) + 1]
  const [a, b] = v.split('/')
  return { idx: parseInt(a, 10), total: parseInt(b, 10) }
}

function shardOf<T>(items: T[], idx: number, total: number): T[] {
  return items.filter((_, i) => i % total === idx)
}

function buildStdin(tc: TestCase): string {
  if ((tc.input_types && tc.input_types.length > 0) || tc.output_type) {
    return JSON.stringify({ args: tc.args, input_types: tc.input_types ?? [], output_type: tc.output_type ?? null })
  }
  return JSON.stringify(tc.args)
}

async function runOne(entry: Entry): Promise<Result> {
  const tcs = entry.metadata?.test_cases ?? []
  const ref = entry.metadata?.reference_solution
  if (!ref) return { title: entry.title, passed: false, failure_summary: 'no reference_solution' }

  const failures: string[] = []
  for (const lang of LANGS) {
    const code = ref[lang]
    if (!code) continue
    const wrapped = wrapWithHarness(code, lang)
    for (const tc of tcs) {
      const stdin = buildStdin(tc)
      try {
        const sub = await submitToJudge0({ sourceCode: wrapped, language: lang, stdin })
        const result = await pollJudge0Result(sub.token)
        const statusId = result.status?.id ?? 0
        if (statusId !== 3) {
          failures.push(`[${lang}] ${tc.id}: ${result.status?.description ?? 'unknown'} ${(result.stderr ?? result.compile_output ?? '').slice(0, 100)}`)
          continue
        }
        let actual: unknown
        try {
          actual = JSON.parse((result.stdout ?? '').trim())
        } catch {
          actual = (result.stdout ?? '').trim()
        }
        if (!compareOutputs(actual, tc.expected, tc.compare_mode)) {
          failures.push(`[${lang}] ${tc.id} wrong: ${JSON.stringify(actual).slice(0, 60)} != ${JSON.stringify(tc.expected).slice(0, 60)}`)
        }
      } catch (err) {
        failures.push(`[${lang}] ${tc.id} error: ${(err as Error).message.slice(0, 80)}`)
      }
    }
  }
  return failures.length > 0
    ? { title: entry.title, passed: false, failure_summary: failures.slice(0, 4).join(' | ') }
    : { title: entry.title, passed: true }
}

async function main() {
  const { idx, total } = parseShard()
  const all = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Entry[]
  const targets = all
    .filter((e) => !e.is_sql && !e.approved && e.metadata?.source === 'notion-scraped')
    .sort((a, b) => a.title.localeCompare(b.title))
  const shard = shardOf(targets, idx, total)

  console.log(`Shard ${idx}/${total}: ${shard.length} algo entries`)

  const outPath = path.join(SEEDS_DIR, `validate-shard-${idx}.json`)
  const results: Result[] = []
  let passed = 0
  let failed = 0

  for (const e of shard) {
    const r = await runOne(e)
    results.push(r)
    if (r.passed) passed++
    else failed++
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
    console.log(`  [${results.length}/${shard.length}] ${e.title}: ${r.passed ? '✓' : '✗ ' + r.failure_summary}`)
  }

  console.log(`\nShard ${idx} done: passed=${passed}, failed=${failed}`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
