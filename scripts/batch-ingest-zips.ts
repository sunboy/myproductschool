/**
 * batch-ingest-zips.ts
 *
 * Ingests 400 interview questions from the two zip banks directly into Supabase.
 * No Anthropic API calls — all taxonomy mapping is hardcoded.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/batch-ingest-zips.ts
 *   npx tsx --env-file=.env.local scripts/batch-ingest-zips.ts --dry-run
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { execSync } from 'child_process'

const isDryRun = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ---------------------------------------------------------------------------
// Taxonomy mapping tables
// ---------------------------------------------------------------------------

const SQL_CATEGORY_TO_TOPICS: Record<string, string[]> = {
  'GROUP BY & HAVING': ['aggregations'],
  'Window Functions': ['window-functions'],
  'CTEs': ['ctes'],
  'JOINs': ['joins'],
  'JOINs Intro': ['joins'],
  'Subqueries': ['subqueries'],
  'Correlated Subqueries': ['subqueries'],
  'Set Operations': ['set-operations'],
  'Basic SELECT / WHERE / ORDER BY': ['aggregations'],
  'Basic Aggregations with Conditions': ['aggregations'],
  'CASE WHEN': ['aggregations'],
  'Top-N Per Group': ['window-functions', 'aggregations'],
  'User Retention / Cohort Analysis': ['aggregations', 'ctes'],
  'Funnel Analysis': ['aggregations', 'ctes'],
  'Session Analysis': ['aggregations', 'window-functions'],
  'Query Optimization': ['indexes', 'query-optimization'],
  'Graph Traversal in SQL': ['ctes', 'subqueries'],
}

const SQL_CATEGORY_TO_TECHNIQUES: Record<string, string[]> = {
  'Window Functions': ['analytic-functions', 'lag-lead'],
  'CTEs': ['recursive-cte'],
  'User Retention / Cohort Analysis': ['rolling-aggregation', 'percentile'],
  'Funnel Analysis': ['analytic-functions', 'anti-join'],
  'Session Analysis': ['lag-lead'],
  'Top-N Per Group': ['analytic-functions'],
  'Graph Traversal in SQL': ['recursive-cte'],
  'Query Optimization': [],
}

const CODING_CATEGORY_TO_TOPICS: Record<string, string[]> = {
  'Arrays': ['arrays'],
  'Strings': ['strings'],
  'Linked Lists': ['linked-lists'],
  'Trees/BST': ['trees'],
  'Advanced Trees': ['trees'],
  'Graphs — BFS/DFS': ['graphs'],
  'Graphs BFS/DFS': ['graphs'],
  'Complex Graph': ['graphs'],
  'Advanced Graphs (Topological Sort)': ['graphs'],
  'Advanced Graphs (Dijkstra)': ['graphs'],
  "Advanced Graphs (Dijkstra's Algorithm)": ['graphs'],
  'Advanced Graphs (BFS)': ['graphs'],
  'Advanced Graphs (SCC / Bridge Finding)': ['graphs'],
  'Advanced Graphs (Eulerian Path / Hierholzer\'s Algorithm)': ['graphs'],
  'Two Pointers': ['arrays'],
  'Hard Two Pointers / Sliding Window': ['arrays'],
  'Sliding Window': ['arrays'],
  'Dynamic Programming': ['dynamic-programming'],
  'Advanced DP': ['dynamic-programming'],
  'Advanced DP (Interval DP)': ['dynamic-programming'],
  'Advanced DP (State Compression / Bitmask DP)': ['dynamic-programming'],
  'Advanced DP (State Compression / Greedy + Heap)': ['dynamic-programming', 'greedy', 'heap'],
  'Backtracking': ['dynamic-programming'],
  'Binary Search': ['arrays'],
  'Binary Search on Answer': ['arrays'],
  'Heap': ['heap'],
  'Stack': ['stack-queue'],
  'Hashmaps': ['hash-tables'],
  'Intervals': ['intervals'],
  'Math / Advanced': ['math'],
  'System-Flavored Coding': ['graphs', 'hash-tables'],
}

const CODING_CATEGORY_TO_TECHNIQUES: Record<string, string[]> = {
  'Arrays': ['two-pointers'],
  'Two Pointers': ['two-pointers'],
  'Hard Two Pointers / Sliding Window': ['two-pointers', 'sliding-window'],
  'Sliding Window': ['sliding-window'],
  'Graphs — BFS/DFS': ['bfs', 'dfs'],
  'Graphs BFS/DFS': ['bfs', 'dfs'],
  'Complex Graph': ['bfs', 'dfs'],
  'Trees/BST': ['dfs'],
  'Advanced Trees': ['dfs'],
  'Binary Search': ['binary-search'],
  'Binary Search on Answer': ['binary-search'],
  'Advanced Graphs (Topological Sort)': ['topological-sort'],
  'Advanced Graphs (Dijkstra)': ['dijkstra'],
  "Advanced Graphs (Dijkstra's Algorithm)": ['dijkstra'],
  'Advanced Graphs (BFS)': ['bfs'],
  'Advanced DP': ['dp-on-trees'],
  'Heap': [],
  'Stack': ['monotonic-stack'],
  'Hashmaps': [],
  'Backtracking': [],
  'Dynamic Programming': [],
  'Advanced DP (Interval DP)': [],
  'System-Flavored Coding': [],
}

const SD_DOMAIN_TO_TOPICS: Record<string, string[]> = {
  'Core Infrastructure': ['caching', 'load-balancing', 'sharding'],
  'Data-Intensive Systems': ['storage', 'queues', 'consistency'],
  'Platform & API Design': ['load-balancing', 'rate-limiting', 'security'],
  'Real-time & Messaging': ['realtime', 'queues'],
  'Real-Time & Streaming': ['realtime', 'queues'],
  'Social & Content': ['caching', 'sharding', 'cdn'],
  'AI Systems': ['rag', 'agents', 'embeddings'],
  'Machine Learning Systems': ['rag', 'embeddings'],
  'Emerging Paradigms': ['agents', 'rag'],
  'Streaming & Media': ['cdn', 'realtime'],
  'Storage & File Systems': ['storage', 'sharding'],
  'Search & Discovery': ['search'],
  'Trust & Safety': ['queues', 'consistency'],
  'Marketplace & Booking': ['consistency', 'queues'],
  'Location & Navigation': ['realtime', 'caching'],
  'UX Product Thinking': ['load-balancing'],
  'Pricing & Monetization': ['consistency', 'queues'],
}

const DM_CATEGORY_TO_TOPICS: Record<string, string[]> = {
  'Relational/OLTP': ['oltp', 'normalization'],
  'Dimensional/OLAP': ['olap', 'dimensional-modeling'],
  'NoSQL/Document': ['document-stores'],
  'Graph Models': ['graph-data'],
  'Time-series': ['time-series'],
  'ML Data Infrastructure': ['olap', 'event-sourcing'],
  'Advanced Patterns': ['normalization', 'denormalization', 'event-sourcing'],
}

// Company name → DB slug (using aliases from taxonomy)
const COMPANY_NAME_TO_SLUG: Record<string, string> = {
  'Google': 'google',
  'Alphabet': 'google',
  'Meta': 'meta',
  'Facebook': 'meta',
  'Amazon': 'amazon',
  'AWS': 'amazon',
  'Apple': 'apple',
  'Microsoft': 'microsoft',
  'Netflix': 'netflix',
  'Stripe': 'stripe',
  'Airbnb': 'airbnb',
  'Uber': 'uber',
  'Lyft': 'lyft',
  'Notion': 'notion',
  'Figma': 'figma',
  'Anthropic': 'anthropic',
  'OpenAI': 'openai',
  'Databricks': 'databricks',
  'Shopify': 'shopify',
  'GitHub': 'github',
  'GitLab': 'gitlab',
  'Slack': 'slack',
  'Zoom': 'zoom',
  'LinkedIn': 'linkedin',
  'Spotify': 'spotify',
  'DoorDash': 'doordash',
  'Instacart': 'instacart',
  'Robinhood': 'robinhood',
  'Coinbase': 'coinbase',
  'Plaid': 'plaid',
  'Datadog': 'datadog',
  'Snowflake': 'snowflake',
  'MongoDB': 'mongodb',
  // Map common ones not in DB to closest slug
  'Twitter': 'twitter',
  'X (Twitter)': 'twitter',
  'Adobe': 'adobe',
  'eBay': 'ebay',
  'Oracle': 'oracle',
  'Salesforce': 'salesforce',
  'Square': 'stripe',
}

// ---------------------------------------------------------------------------
// Difficulty mapping
// ---------------------------------------------------------------------------

function mapDifficulty(raw: string): string {
  const d = (raw ?? '').toLowerCase().trim()
  if (['easy', 'foundation', 'beginner', 'warmup'].includes(d)) return 'warmup'
  if (['medium', 'intermediate', 'standard'].includes(d)) return 'standard'
  if (['hard', 'advanced'].includes(d)) return 'advanced'
  if (['very hard', 'very_hard', 'staff+', 'staff_plus'].includes(d)) return 'staff_plus'
  return 'standard'
}

function mapCompanies(companies: string[] | undefined): string[] {
  if (!companies) return []
  return companies.map(c => COMPANY_NAME_TO_SLUG[c] ?? c.toLowerCase().replace(/\s+/g, '-'))
}

function calcTimeLimitSeconds(type: string, difficulty: string): number {
  const tl: Record<string, Record<string, number>> = {
    algorithm: { warmup: 1200, standard: 1800, advanced: 2700, staff_plus: 3600 },
    sql:       { warmup: 900,  standard: 1200, advanced: 1800, staff_plus: 2400 },
    system_design: { warmup: 1500, standard: 2700, advanced: 3600, staff_plus: 5400 },
    data_modeling: { warmup: 1200, standard: 1800, advanced: 2700, staff_plus: 3600 },
  }
  return tl[type]?.[difficulty] ?? 1800
}

// ---------------------------------------------------------------------------
// Prompt text builders
// ---------------------------------------------------------------------------

function buildAlgoPrompt(raw: any): string {
  const lines: string[] = [`# ${raw.title}`, '']
  if (raw.description) lines.push(raw.description, '')
  if (raw.examples?.length) {
    lines.push('## Examples', '')
    for (const ex of raw.examples) {
      lines.push(`**Input:** ${ex.input}`)
      lines.push(`**Output:** ${ex.output}`)
      if (ex.explanation) lines.push(`**Explanation:** ${ex.explanation}`)
      lines.push('')
    }
  }
  if (raw.constraints?.length) {
    lines.push('## Constraints', '')
    for (const c of raw.constraints) lines.push(`- ${c}`)
    lines.push('')
  }
  return lines.join('\n')
}

function buildSqlPrompt(raw: any): string {
  const lines: string[] = [`# ${raw.title}`, '']
  if (raw.description) lines.push(raw.description, '')
  if (raw.schema?.setup_sql) {
    lines.push('## Schema', '', '```sql', raw.schema.setup_sql, '```', '')
  }
  if (raw.examples?.length) {
    lines.push('## Examples', '')
    for (const ex of raw.examples) {
      if (ex.input) lines.push(`**Input:** ${ex.input}`)
      if (ex.output) lines.push(`**Output:** ${ex.output}`)
      if (ex.explanation) lines.push(`**Explanation:** ${ex.explanation}`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

function buildSdPrompt(raw: any): string {
  const lp = raw.learner_prompt ?? {}
  const lines: string[] = [`# ${raw.title}`, '']
  if (lp.scenario) lines.push(lp.scenario, '')
  if (lp.mission) lines.push(`**Mission:** ${lp.mission}`, '')
  if (lp.functional_requirements?.length) {
    lines.push('## Functional Requirements', '')
    for (const r of lp.functional_requirements) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.non_functional_requirements?.length) {
    lines.push('## Non-Functional Requirements', '')
    for (const r of lp.non_functional_requirements) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.scale_assumptions?.length) {
    lines.push('## Scale Assumptions', '')
    for (const r of lp.scale_assumptions) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.deliverables?.length) {
    lines.push('## Deliverables', '')
    for (const r of lp.deliverables) lines.push(`- ${r}`)
    lines.push('')
  }
  return lines.join('\n')
}

function buildDmPrompt(raw: any): string {
  const lp = raw.learner_prompt ?? {}
  const lines: string[] = [`# ${raw.title}`, '']
  if (lp.scenario) lines.push(lp.scenario, '')
  if (lp.requirements?.length) {
    lines.push('## Requirements', '')
    for (const r of lp.requirements) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.access_patterns?.length) {
    lines.push('## Access Patterns', '')
    for (const r of lp.access_patterns) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.constraints?.length) {
    lines.push('## Constraints', '')
    for (const r of lp.constraints) lines.push(`- ${r}`)
    lines.push('')
  }
  if (lp.deliverables?.length) {
    lines.push('## Deliverables', '')
    for (const r of lp.deliverables) lines.push(`- ${r}`)
    lines.push('')
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Test case transformers
// ---------------------------------------------------------------------------

function transformAlgoTestCases(testCases: any[]): any[] {
  return (testCases ?? []).map(tc => ({
    id: tc.id ?? randomUUID(),
    label: tc.description ?? tc.id,
    args: tc.input ? Object.values(tc.input) : [],
    expected: tc.expected_output,
    hidden: tc.is_edge_case === true,
    input_types: [],
    output_type: 'array',
    compare_mode: 'set' as const,
  }))
}

function transformSqlTestCases(testCases: any[]): any[] {
  return (testCases ?? []).map(tc => ({
    id: tc.id ?? randomUUID(),
    label: tc.description ?? tc.id,
    setup_override: tc.setup_override ?? null,
    expected_rows: tc.expected_output ?? [],
    is_hidden: tc.edge_case_type === 'hidden' || false,
  }))
}

// ---------------------------------------------------------------------------
// Challenge row builders
// ---------------------------------------------------------------------------

function buildAlgoRow(raw: any): any {
  const difficulty = mapDifficulty(raw.difficulty)
  const category = raw.category ?? ''
  return {
    id: `algo-${raw.id}`,
    title: raw.title,
    challenge_type: 'algorithm',
    difficulty,
    estimated_minutes: raw.time_estimate_minutes ?? 30,
    scenario_context: raw.description ?? raw.title,
    scenario_trigger: raw.description ?? raw.title,
    scenario_question: raw.description ?? raw.title,
    prompt_text: buildAlgoPrompt(raw),
    topic_tags: CODING_CATEGORY_TO_TOPICS[category] ?? [],
    technique_tags: CODING_CATEGORY_TO_TECHNIQUES[category] ?? [],
    company_tags: mapCompanies(raw.companies),
    tags: [],
    primary_competencies: [],
    secondary_competencies: [],
    frameworks: [],
    relevant_roles: ['swe', 'tech_lead', 'em'],
    is_published: true,
    is_premium: false,
    is_calibration: false,
    metadata: {
      test_cases: transformAlgoTestCases(raw.test_cases ?? []),
      source: 'sql-coding-bank',
      source_question_id: raw.id,
      source_companies: raw.companies ?? [],
      source_category: category,
      hint: raw.solution?.intuition ?? raw.solution?.quick_hack ?? '',
      key_concept: category,
      time_limit_seconds: calcTimeLimitSeconds('algorithm', difficulty),
      reference_solution: raw.solution?.python_code ?? '',
      reference_approach: raw.solution?.approach ?? raw.solution?.intuition ?? '',
    },
  }
}

function buildSqlRow(raw: any): any {
  const difficulty = mapDifficulty(raw.difficulty)
  const category = raw.category ?? ''
  return {
    id: `sql-${raw.id}`,
    title: raw.title,
    challenge_type: 'sql',
    difficulty,
    estimated_minutes: raw.time_estimate_minutes ?? 15,
    scenario_context: raw.description ?? raw.title,
    scenario_trigger: raw.description ?? raw.title,
    scenario_question: raw.description ?? raw.title,
    prompt_text: buildSqlPrompt(raw),
    topic_tags: SQL_CATEGORY_TO_TOPICS[category] ?? ['aggregations'],
    technique_tags: SQL_CATEGORY_TO_TECHNIQUES[category] ?? [],
    company_tags: mapCompanies(raw.companies),
    tags: [],
    primary_competencies: [],
    secondary_competencies: [],
    frameworks: [],
    relevant_roles: ['swe', 'data_eng', 'tech_lead'],
    is_published: true,
    is_premium: false,
    is_calibration: false,
    metadata: {
      sql_schema: raw.schema?.setup_sql ?? '',
      test_cases: transformSqlTestCases(raw.test_cases ?? []),
      source: 'sql-coding-bank',
      source_question_id: raw.id,
      source_companies: raw.companies ?? [],
      source_category: category,
      hint: raw.solution?.quick_hack ?? raw.solution?.intuition ?? '',
      key_concept: category,
      time_limit_seconds: calcTimeLimitSeconds('sql', difficulty),
      reference_solution: raw.solution?.sql_query ?? raw.validation_query ?? '',
      reference_approach: raw.solution?.intuition ?? '',
    },
  }
}

function buildSdRow(raw: any): any {
  const difficulty = mapDifficulty(raw.difficulty)
  const domain = raw.domain ?? raw.category ?? ''
  const hints = (raw.hints ?? []).map((h: any) => ({
    level: h.level,
    title: h.title,
    hint: h.hint,
  }))
  return {
    id: `sd-${raw.id}`,
    title: raw.title,
    challenge_type: 'system_design',
    difficulty,
    estimated_minutes: raw.estimated_time_minutes ?? 35,
    scenario_context: raw.learner_prompt?.scenario ?? raw.title,
    scenario_trigger: raw.learner_prompt?.mission ?? raw.title,
    scenario_question: raw.learner_prompt?.scenario ?? raw.title,
    prompt_text: buildSdPrompt(raw),
    topic_tags: SD_DOMAIN_TO_TOPICS[domain] ?? [],
    technique_tags: [],
    company_tags: mapCompanies(raw.companies),
    tags: raw.tags ?? [],
    primary_competencies: [],
    secondary_competencies: [],
    frameworks: [],
    relevant_roles: ['swe', 'tech_lead', 'em', 'founding_eng'],
    is_published: true,
    is_premium: false,
    is_calibration: false,
    metadata: {
      source: 'sd-dm-bank',
      source_question_id: raw.id,
      source_companies: raw.companies ?? [],
      source_category: domain,
      hints,
      required_components: raw.evaluation?.expected_components ?? [],
      scalability_signals: raw.evaluation?.strong_signals ?? [],
      evaluation_rubric: raw.evaluation?.rubric ?? {},
      scoring_bands: raw.evaluation?.scoring_bands ?? [],
      common_mistakes: raw.evaluation?.common_mistakes ?? [],
      interviewer_followups: raw.evaluation?.interviewer_followups ?? [],
      canvas_prompt: raw.canvas?.renderer_prompt ?? '',
    },
  }
}

function buildDmRow(raw: any): any {
  const difficulty = mapDifficulty(raw.difficulty)
  const category = raw.category ?? ''
  const hints = (raw.hints ?? []).map((h: any) => ({
    level: h.level,
    title: h.title,
    hint: h.hint,
  }))
  return {
    id: `dm-${raw.id}`,
    title: raw.title,
    challenge_type: 'data_modeling',
    difficulty,
    estimated_minutes: raw.estimated_time_minutes ?? 25,
    scenario_context: raw.learner_prompt?.scenario ?? raw.title,
    scenario_trigger: raw.learner_prompt?.scenario ?? raw.title,
    scenario_question: raw.learner_prompt?.scenario ?? raw.title,
    prompt_text: buildDmPrompt(raw),
    topic_tags: DM_CATEGORY_TO_TOPICS[category] ?? ['oltp'],
    technique_tags: [],
    company_tags: mapCompanies(raw.companies),
    tags: raw.tags ?? [],
    primary_competencies: [],
    secondary_competencies: [],
    frameworks: [],
    relevant_roles: ['swe', 'data_eng', 'ml_eng', 'tech_lead'],
    is_published: true,
    is_premium: false,
    is_calibration: false,
    metadata: {
      source: 'sd-dm-bank',
      source_question_id: raw.id,
      source_companies: raw.companies ?? [],
      source_category: category,
      hints,
      required_entities: raw.evaluation?.expected_concepts ?? [],
      modeling_signals: raw.evaluation?.expected_concepts ?? [],
      evaluation_rubric: raw.evaluation?.rubric ?? {},
      scoring_bands: raw.evaluation?.scoring_bands ?? [],
      common_mistakes: raw.evaluation?.common_mistakes ?? [],
      interviewer_followups: raw.evaluation?.interviewer_followups ?? [],
      canvas_prompt: raw.canvas?.renderer_prompt ?? raw.canvas?.prompt ?? '',
    },
  }
}

// ---------------------------------------------------------------------------
// Load files from a directory
// ---------------------------------------------------------------------------

function loadJsonFiles(dir: string): any[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
      } catch {
        console.warn(`  Failed to parse ${f}`)
        return null
      }
    })
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Idempotency: fetch existing source_question_ids
// ---------------------------------------------------------------------------

async function getExistingSourceIds(): Promise<Set<string>> {
  const existing = new Set<string>()
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('challenges')
      .select('metadata')
      .not('metadata->>source_question_id', 'is', null)
      .range(from, from + batchSize - 1)
    if (error || !data?.length) break
    for (const row of data) {
      const sqid = (row.metadata as any)?.source_question_id
      if (sqid) existing.add(sqid)
    }
    from += batchSize
    if (data.length < batchSize) break
  }
  return existing
}

// ---------------------------------------------------------------------------
// Insert in batches
// ---------------------------------------------------------------------------

async function insertBatch(rows: any[], label: string): Promise<{ inserted: number; skipped: number; failed: number }> {
  let inserted = 0
  let skipped = 0
  let failed = 0
  const BATCH = 50

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('challenges').upsert(batch, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    if (error) {
      console.error(`  [${label}] batch ${i / BATCH + 1} error: ${error.message}`)
      failed += batch.length
    } else {
      inserted += batch.length
    }
    process.stdout.write(`\r  [${label}] ${inserted + failed} / ${rows.length}`)
  }
  console.log()
  return { inserted, skipped, failed }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const INGEST_BASE = '/tmp/ingest-zips'

async function main() {
  console.log(`\n=== Batch Ingest Zips ${isDryRun ? '(DRY RUN)' : ''} ===\n`)

  // Check files are extracted
  const dirs = ['coding', 'sql', 'system_design', 'data_modeling']
  for (const d of dirs) {
    const p = path.join(INGEST_BASE, d)
    if (!fs.existsSync(p) || fs.readdirSync(p).length === 0) {
      console.error(`Missing or empty dir: ${p}`)
      console.error('Run: unzip -j /Users/sandeep/Downloads/sql-coding.zip "sql/questions/*.json" -d /tmp/ingest-zips/sql/ etc.')
      process.exit(1)
    }
  }

  console.log('Loading existing source IDs for idempotency...')
  const existingIds = isDryRun ? new Set<string>() : await getExistingSourceIds()
  console.log(`  Found ${existingIds.size} already-ingested questions\n`)

  const stats: Record<string, { total: number; inserted: number; skipped: number; failed: number }> = {}

  // --- Algorithm (coding) ---
  {
    console.log('Processing coding/algorithm questions...')
    const raw = loadJsonFiles(path.join(INGEST_BASE, 'coding'))
    const rows = raw
      .map(buildAlgoRow)
      .filter(r => {
        if (existingIds.has(r.metadata.source_question_id)) {
          return false
        }
        return true
      })
    const skipped = raw.length - rows.length
    console.log(`  ${raw.length} files, ${skipped} already ingested, ${rows.length} to insert`)
    if (!isDryRun && rows.length > 0) {
      const result = await insertBatch(rows, 'algorithm')
      stats.algorithm = { total: raw.length, inserted: result.inserted, skipped, failed: result.failed }
    } else {
      stats.algorithm = { total: raw.length, inserted: 0, skipped, failed: 0 }
      if (isDryRun) console.log(`  [DRY RUN] Would insert ${rows.length} rows`)
    }
    console.log()
  }

  // --- SQL ---
  {
    console.log('Processing SQL questions...')
    const raw = loadJsonFiles(path.join(INGEST_BASE, 'sql'))
    const rows = raw
      .map(buildSqlRow)
      .filter(r => !existingIds.has(r.metadata.source_question_id))
    const skipped = raw.length - rows.length
    console.log(`  ${raw.length} files, ${skipped} already ingested, ${rows.length} to insert`)
    if (!isDryRun && rows.length > 0) {
      const result = await insertBatch(rows, 'sql')
      stats.sql = { total: raw.length, inserted: result.inserted, skipped, failed: result.failed }
    } else {
      stats.sql = { total: raw.length, inserted: 0, skipped, failed: 0 }
      if (isDryRun) console.log(`  [DRY RUN] Would insert ${rows.length} rows`)
    }
    console.log()
  }

  // --- System Design ---
  {
    console.log('Processing system design questions...')
    const raw = loadJsonFiles(path.join(INGEST_BASE, 'system_design'))
    const rows = raw
      .map(buildSdRow)
      .filter(r => !existingIds.has(r.metadata.source_question_id))
    const skipped = raw.length - rows.length
    console.log(`  ${raw.length} files, ${skipped} already ingested, ${rows.length} to insert`)
    if (!isDryRun && rows.length > 0) {
      const result = await insertBatch(rows, 'system_design')
      stats.system_design = { total: raw.length, inserted: result.inserted, skipped, failed: result.failed }
    } else {
      stats.system_design = { total: raw.length, inserted: 0, skipped, failed: 0 }
      if (isDryRun) console.log(`  [DRY RUN] Would insert ${rows.length} rows`)
    }
    console.log()
  }

  // --- Data Modeling ---
  {
    console.log('Processing data modeling questions...')
    const raw = loadJsonFiles(path.join(INGEST_BASE, 'data_modeling'))
    const rows = raw
      .map(buildDmRow)
      .filter(r => !existingIds.has(r.metadata.source_question_id))
    const skipped = raw.length - rows.length
    console.log(`  ${raw.length} files, ${skipped} already ingested, ${rows.length} to insert`)
    if (!isDryRun && rows.length > 0) {
      const result = await insertBatch(rows, 'data_modeling')
      stats.data_modeling = { total: raw.length, inserted: result.inserted, skipped, failed: result.failed }
    } else {
      stats.data_modeling = { total: raw.length, inserted: 0, skipped, failed: 0 }
      if (isDryRun) console.log(`  [DRY RUN] Would insert ${rows.length} rows`)
    }
    console.log()
  }

  // --- Summary ---
  console.log('=== Summary ===')
  let totalInserted = 0
  let totalFailed = 0
  for (const [type, s] of Object.entries(stats)) {
    console.log(`  ${type.padEnd(16)} total=${s.total}  inserted=${s.inserted}  skipped=${s.skipped}  failed=${s.failed}`)
    totalInserted += s.inserted
    totalFailed += s.failed
  }
  console.log(`\n  Total inserted: ${totalInserted}`)
  if (totalFailed > 0) {
    console.log(`  Total failed: ${totalFailed} — check logs above`)
  }

  if (!isDryRun && totalInserted > 0) {
    console.log('\nVerifying insertion...')
    const { data: counts } = await supabase
      .from('challenges')
      .select('challenge_type')
      .in('challenge_type', ['algorithm', 'sql', 'system_design', 'data_modeling'])
      .not('metadata->>source', 'is', null)

    const typeCounts: Record<string, number> = {}
    for (const row of counts ?? []) {
      typeCounts[row.challenge_type] = (typeCounts[row.challenge_type] ?? 0) + 1
    }
    console.log('\nTotal in DB by type (from these banks):')
    for (const [t, c] of Object.entries(typeCounts)) {
      console.log(`  ${t.padEnd(16)} ${c}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
