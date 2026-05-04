/**
 * ingest-challenge-folder.ts
 *
 * Drop raw JSON files into ingest/{coding,sql,system_design,data_modeling}/
 * then run this script. Each file may be a single object or array.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/ingest-challenge-folder.ts
 *   npx tsx --env-file=.env.local scripts/ingest-challenge-folder.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/ingest-challenge-folder.ts --folder ./my-drop-folder
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const folderArgIndex = args.indexOf('--folder')
const folderArg = args.find(a => a.startsWith('--folder='))?.split('=')[1]
  ?? (folderArgIndex !== -1 ? args[folderArgIndex + 1] : undefined)
const INGEST_DIR = path.resolve(folderArg ?? 'ingest')
const STAGED_FILE = path.resolve('seeds/staged-interview-challenges.json')
const REPORT_FILE = path.join(INGEST_DIR, 'ingest-report.json')

type ChallengeType = 'algorithm' | 'sql' | 'system_design' | 'data_modeling'

const SUBFOLDER_TO_TYPE: Record<string, ChallengeType> = {
  coding: 'algorithm',
  algorithm: 'algorithm',
  sql: 'sql',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'warmup', foundation: 'warmup', beginner: 'warmup', warmup: 'warmup',
  medium: 'standard', intermediate: 'standard', standard: 'standard',
  hard: 'advanced', advanced: 'advanced',
  'very hard': 'staff_plus', staff_plus: 'staff_plus', 'staff+': 'staff_plus',
}

// ── Load / save staged file ───────────────────────────────────────────────────
function loadStaged(): any[] {
  if (!fs.existsSync(STAGED_FILE)) return []
  return JSON.parse(fs.readFileSync(STAGED_FILE, 'utf8'))
}

function saveStaged(entries: any[]): void {
  if (DRY_RUN) return
  fs.writeFileSync(STAGED_FILE, JSON.stringify(entries, null, 2))
}

// ── Normalise raw input to base shape ────────────────────────────────────────
function normalise(raw: any, type: ChallengeType): any {
  const rawDifficulty = (raw.difficulty ?? raw.level ?? 'medium').toLowerCase()
  const difficulty = DIFFICULTY_MAP[rawDifficulty] ?? 'standard'
  const estimatedMinutes: Record<string, number> = {
    warmup: 20, standard: 30, advanced: 45, staff_plus: 60,
  }
  return {
    title: raw.title ?? raw.name ?? 'Untitled',
    difficulty,
    estimated_minutes: raw.estimated_minutes ?? raw.time_min ?? estimatedMinutes[difficulty],
    industry: raw.industry ?? inferIndustry(raw.source_companies ?? raw.company ?? ''),
    challenge_type: type,
    is_sql: type === 'sql',
    problem_statement_markdown: raw.problem_statement_markdown ?? raw.problem_statement ?? raw.question ?? '',
    metadata: {
      source: raw.metadata?.source ?? 'ingest-folder',
      ...(raw.source_question_id || raw.question_id
        ? { source_question_id: raw.source_question_id ?? raw.question_id }
        : {}),
      source_companies: normaliseCompanies(raw.source_companies ?? raw.company ?? ''),
      ...(raw.source_category || raw.category
        ? { source_category: raw.source_category ?? raw.category }
        : {}),
      ...(raw.key_concept ? { key_concept: raw.key_concept } : {}),
      ...(raw.hint ? { hint: raw.hint } : {}),
      time_limit_seconds: raw.metadata?.time_limit_seconds ?? defaultTimeLimit(type, difficulty),
      ...(raw.metadata ?? {}),
    },
    ...(raw.starter_code ? { starter_code: raw.starter_code } : {}),
    ...(raw.reference_solution ? { reference_solution: raw.reference_solution } : {}),
    ...(raw.test_cases ? { test_cases: raw.test_cases } : {}),
    ...(raw.sql_schema ? { sql_schema: raw.sql_schema } : {}),
    ...(raw.setup_script ? { setup_script: raw.setup_script } : {}),
    ...(raw.parts ? { parts: raw.parts } : {}),
  }
}

function inferIndustry(companies: string | string[]): string {
  const tags = Array.isArray(companies) ? companies.join(' ') : String(companies)
  const t = tags.toLowerCase()
  if (/amazon|walmart|shopify|ebay/.test(t)) return 'e-commerce'
  if (/uber|lyft|doordash/.test(t)) return 'transportation'
  if (/meta|twitter|snapchat|instagram|tiktok/.test(t)) return 'social'
  if (/stripe|paypal|plaid|square/.test(t)) return 'fintech'
  if (/google|microsoft|apple/.test(t)) return 'productivity'
  return 'general'
}

function normaliseCompanies(input: string | string[]): string[] {
  if (Array.isArray(input)) return input.filter(Boolean)
  return input.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
}

function defaultTimeLimit(type: ChallengeType, difficulty: string): number {
  const map: Record<ChallengeType, Record<string, number>> = {
    algorithm: { warmup: 1200, standard: 1800, advanced: 2700, staff_plus: 3600 },
    sql: { warmup: 900, standard: 1200, advanced: 1800, staff_plus: 2400 },
    system_design: { warmup: 1500, standard: 2700, advanced: 3600, staff_plus: 5400 },
    data_modeling: { warmup: 1200, standard: 1800, advanced: 2700, staff_plus: 3600 },
  }
  return map[type]?.[difficulty] ?? 1800
}

// ── Extract JSON from model response ─────────────────────────────────────────
function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try {
    return JSON.parse(match[0])
  } catch {
    return {}
  }
}

// ── Enrich functions (one per challenge type) ─────────────────────────────────
async function enrich(entry: any): Promise<any> {
  const type: ChallengeType = entry.challenge_type
  if (type === 'system_design') return enrichSystemDesign(entry)
  if (type === 'data_modeling') return enrichDataModeling(entry)
  if (type === 'sql') return enrichSql(entry)
  return enrichCoding(entry)
}

async function enrichCoding(entry: any): Promise<any> {
  if (entry.starter_code && entry.reference_solution && entry.test_cases?.length >= 2) return entry
  const prompt = `Given this coding challenge, generate the missing fields as JSON.

Title: ${entry.title}
Difficulty: ${entry.difficulty}
Problem: ${entry.problem_statement_markdown}

Return ONLY valid JSON with these fields (omit any already present in the input):
{
  "starter_code": { "python": "...", "javascript": "..." },
  "reference_solution": { "python": "...", "javascript": "..." },
  "reference_approach": "2-3 sentence explanation of algorithm and complexity",
  "test_cases": [
    { "input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]", "is_hidden": false },
    { "input": "...", "expected_output": "...", "is_hidden": false },
    { "input": "...", "expected_output": "...", "is_hidden": true }
  ],
  "parts": [
    {
      "step": "frame", "step_order": 0, "grading_weight": 0.2, "response_type": "pure_mcq",
      "question_text": "...",
      "options": [
        { "label": "A", "text": "...", "quality": "best", "points": 3, "explanation": "..." },
        { "label": "B", "text": "...", "quality": "good_but_incomplete", "points": 2, "explanation": "..." },
        { "label": "C", "text": "...", "quality": "surface", "points": 1, "explanation": "..." },
        { "label": "D", "text": "...", "quality": "plausible_wrong", "points": 0, "explanation": "..." }
      ]
    }
  ]
}

Parts array must have 4 entries: frame (step_order 0), list (step_order 1), optimize (step_order 2), win (step_order 3, grading_weight 0.4).
No em dashes. No role framing. No AI slop words.`

  const resp = await client.messages.create({
    model: MODEL, max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })
  const json = extractJson((resp.content[0] as any).text)
  return { ...entry, ...json }
}

async function enrichSql(entry: any): Promise<any> {
  if (entry.setup_script && entry.reference_solution && entry.test_cases?.length >= 2) return entry
  const prompt = `Given this SQL challenge, generate the missing fields as JSON.

Title: ${entry.title}
Difficulty: ${entry.difficulty}
Problem: ${entry.problem_statement_markdown}
Schema hint: ${entry.sql_schema ?? entry.metadata?.sql_schema ?? 'infer from problem'}
Reference SQL: ${entry.reference_solution?.sql ?? 'generate'}

Return ONLY valid JSON:
{
  "sql_schema": "CREATE TABLE ... (DDL only, no INSERT)",
  "setup_script": "CREATE TABLE ...; INSERT INTO ... VALUES (...); -- 6-10 realistic rows",
  "reference_solution": { "sql": "SELECT ..." },
  "reference_approach": "2-3 sentences on SQL technique and why it handles edge cases",
  "test_cases": [
    { "description": "Standard case", "expected_rows": [[...]], "is_hidden": false },
    { "description": "Edge case", "expected_rows": [[...]], "is_hidden": false },
    { "description": "Hidden edge", "expected_rows": [[...]], "is_hidden": true }
  ],
  "parts": [
    {
      "step": "frame", "step_order": 0, "grading_weight": 0.2, "response_type": "pure_mcq",
      "question_text": "...",
      "options": [
        { "label": "A", "text": "...", "quality": "best", "points": 3, "explanation": "..." },
        { "label": "B", "text": "...", "quality": "good_but_incomplete", "points": 2, "explanation": "..." },
        { "label": "C", "text": "...", "quality": "surface", "points": 1, "explanation": "..." },
        { "label": "D", "text": "...", "quality": "plausible_wrong", "points": 0, "explanation": "..." }
      ]
    }
  ]
}

Parts array must have 4 entries: frame (0), list (1), optimize (2), win (3, weight 0.4).
No em dashes. No role framing. No AI slop words.`

  const resp = await client.messages.create({
    model: MODEL, max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })
  const json = extractJson((resp.content[0] as any).text)
  return { ...entry, ...json }
}

async function enrichSystemDesign(entry: any): Promise<any> {
  if (entry.metadata?.required_components?.length >= 5) return entry
  const prompt = `Given this system design topic, generate a complete challenge entry as JSON.

Title: ${entry.title}
Difficulty: ${entry.difficulty}
Topic hint: ${entry.problem_statement_markdown || entry.title}

Return ONLY valid JSON:
{
  "problem_statement_markdown": "## Problem\\n\\n[2-3 sentences, no role framing, specific scale numbers]\\n\\n## Functional Requirements\\n\\n- ...\\n\\n## Non-Functional Requirements\\n\\n- [specific QPS/DAU/latency numbers]\\n\\n## Out of Scope\\n\\n- ...",
  "metadata": {
    "requirements": ["5-8 user-visible behavior strings"],
    "required_components": ["5-10 named components with descriptions, use real tech names like Redis, Kafka, Cassandra"],
    "scalability_signals": ["3-5 strings: observation and design implication"],
    "reference_diagram_description": "1 paragraph prose describing the architecture"
  }
}

No em dashes. No role framing. Scale numbers must be specific (not vague). Component names must be real tech (Redis, Kafka, Cassandra).`

  const resp = await client.messages.create({
    model: MODEL, max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })
  const json = extractJson((resp.content[0] as any).text)
  const merged = { ...entry, ...json }
  if (json.metadata) merged.metadata = { ...entry.metadata, ...json.metadata }
  return merged
}

async function enrichDataModeling(entry: any): Promise<any> {
  if (entry.metadata?.required_entities?.length >= 4) return entry
  const prompt = `Given this data modeling scenario, generate a complete challenge entry as JSON.

Title: ${entry.title}
Difficulty: ${entry.difficulty}
Scenario: ${entry.problem_statement_markdown || entry.title}

Return ONLY valid JSON:
{
  "problem_statement_markdown": "## Problem\\n\\n[2-3 sentences, no role framing]\\n\\n## Requirements\\n\\n- ...\\n\\n## Constraints\\n\\n- ...\\n\\n## Out of Scope\\n\\n- ...",
  "metadata": {
    "requirements": ["5-8 data relationship or business rule strings"],
    "required_entities": ["4-10 entity names, join tables named with key columns in parens"],
    "modeling_signals": ["3-5 strings naming specific schema anti-patterns and correct approach"],
    "reference_schema_description": "1 paragraph naming entities, key columns, cardinalities"
  }
}

No em dashes. No role framing. Modeling signals must name specific anti-patterns.`

  const resp = await client.messages.create({
    model: MODEL, max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })
  const json = extractJson((resp.content[0] as any).text)
  const merged = { ...entry, ...json }
  if (json.metadata) merged.metadata = { ...entry.metadata, ...json.metadata }
  return merged
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(INGEST_DIR)) {
    console.error(`Ingest folder not found: ${INGEST_DIR}`)
    console.error('Create it with subfolders: coding/, sql/, system_design/, data_modeling/')
    process.exit(1)
  }

  const staged = loadStaged()
  const existingTitles = new Set(staged.map((e: any) => (e.title ?? '').toLowerCase()))
  const report: Record<string, { added: string[]; skipped: string[]; failed: string[] }> = {}

  const subfolders = fs.readdirSync(INGEST_DIR).filter(f => {
    const fullPath = path.join(INGEST_DIR, f)
    return fs.statSync(fullPath).isDirectory()
  })

  for (const subfolder of subfolders) {
    const type = SUBFOLDER_TO_TYPE[subfolder.toLowerCase()]
    if (!type) {
      console.warn(`Unknown subfolder: ${subfolder} — skipping (valid names: coding, sql, system_design, data_modeling)`)
      continue
    }

    const subdir = path.join(INGEST_DIR, subfolder)
    const files = fs.readdirSync(subdir).filter(f => f.endsWith('.json'))
    report[subfolder] = { added: [], skipped: [], failed: [] }

    console.log(`\n[${subfolder}] ${files.length} file(s) → challenge_type: ${type}`)

    for (const file of files) {
      const filePath = path.join(subdir, file)
      let raw: any
      try {
        raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      } catch {
        console.error(`  PARSE ERROR: ${file}`)
        report[subfolder].failed.push(file)
        continue
      }

      const items: any[] = Array.isArray(raw) ? raw : [raw]

      for (const item of items) {
        const title = item.title ?? item.name ?? 'Untitled'
        if (existingTitles.has(title.toLowerCase())) {
          console.log(`  SKIP (duplicate): ${title}`)
          report[subfolder].skipped.push(title)
          continue
        }

        console.log(`  Processing: ${title}`)
        try {
          const normalised = normalise(item, type)
          const enriched = await enrich(normalised)
          const final = {
            ...enriched,
            approved: false,
            generated_at: new Date().toISOString(),
          }
          staged.push(final)
          existingTitles.add(title.toLowerCase())
          saveStaged(staged)
          report[subfolder].added.push(title)
          console.log(`  ADDED: ${title}`)
        } catch (e: any) {
          console.error(`  FAILED: ${title} — ${e.message}`)
          report[subfolder].failed.push(title)
        }
      }
    }
  }

  if (!DRY_RUN) {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))
  }

  console.log('\n── Ingest Summary ──────────────────────────────────')
  let totalAdded = 0, totalSkipped = 0, totalFailed = 0
  for (const [folder, r] of Object.entries(report)) {
    console.log(`${folder}: +${r.added.length} added, ${r.skipped.length} skipped, ${r.failed.length} failed`)
    totalAdded += r.added.length
    totalSkipped += r.skipped.length
    totalFailed += r.failed.length
  }
  console.log(`Total: +${totalAdded} added, ${totalSkipped} skipped, ${totalFailed} failed`)
  if (DRY_RUN) {
    console.log('(DRY RUN — no files written)')
  } else {
    console.log(`\nReport: ${REPORT_FILE}`)
  }
  console.log('\nNext: review seeds/staged-interview-challenges.json, set approved: true, then run:')
  console.log('  npx tsx scripts/commit-interview-seeds.ts')
}

main().catch(e => { console.error(e); process.exit(1) })
