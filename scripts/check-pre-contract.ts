/**
 * Pre-contract compatibility test (R3.D)
 * Verifies all read paths the app depends on work against the live DB.
 * Usage:
 *   SB_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL' .env.local | cut -d= -f2) \
 *   SB_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY' .env.local | cut -d= -f2) \
 *   npx tsx scripts/check-pre-contract.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── env resolution ────────────────────────────────────────────────────────────
function readEnvLocal(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  const out: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes from values
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const envLocal = readEnvLocal()
const SB_URL =
  process.env.SB_URL ??
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  envLocal['NEXT_PUBLIC_SUPABASE_URL'] ??
  envLocal['SUPABASE_URL'] ??
  ''
const SB_KEY =
  process.env.SB_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  envLocal['SUPABASE_SERVICE_ROLE_KEY'] ??
  ''

if (!SB_URL || !SB_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SB_URL, SB_KEY)

// ── check runner ──────────────────────────────────────────────────────────────
type CheckResult = { label: string; passed: boolean; detail: string }

async function runCheck(
  label: string,
  fn: () => Promise<string>,
): Promise<CheckResult> {
  try {
    const detail = await fn()
    console.log(`✓ ${label} (${detail})`)
    return { label, passed: true, detail }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`✗ ${label}: ${msg}`)
    return { label, passed: false, detail: msg }
  }
}

// ── individual checks ─────────────────────────────────────────────────────────

async function checkA(): Promise<string> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, difficulty, challenge_type, topic_tags, technique_tags, industry_tags')
    .eq('is_published', true)
    .neq('challenge_type', 'freeform')
    .limit(20)
  if (error) throw new Error(error.message)
  if (!data) throw new Error('null data returned')
  // Verify shape: each row must have these keys
  const required = ['id', 'title', 'difficulty', 'challenge_type', 'topic_tags', 'technique_tags', 'industry_tags']
  for (const row of data) {
    for (const key of required) {
      if (!(key in row)) throw new Error(`Missing column "${key}" in row ${row.id}`)
    }
  }
  return `${data.length} rows`
}

async function checkB(): Promise<string> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, difficulty')
    .in('difficulty', ['hard', 'advanced', 'staff_plus'])
    .limit(5)
  if (error) throw new Error(error.message)
  if (!data) throw new Error('null data returned')
  // Dual-accept check: query must succeed (data can be empty if none yet seeded)
  return `${data.length} rows`
}

async function checkC(): Promise<string> {
  // Mirrors targetDifficulties logic from dashboard — beginner band for low avgXp
  const difficulties = ['easy', 'warmup', 'beginner', 'foundation', 'entry-point']
  const { data, error } = await supabase
    .from('challenges')
    .select('id, slug, title, difficulty, domain:domains(title)')
    .eq('is_published', true)
    .in('difficulty', difficulties)
    .limit(10)
  if (error) throw new Error(error.message)
  if (!data) throw new Error('null data returned')
  const required = ['id', 'slug', 'title', 'difficulty']
  for (const row of data) {
    for (const key of required) {
      if (!(key in row)) throw new Error(`Missing column "${key}" in row ${(row as { id: string }).id}`)
    }
  }
  return `${data.length} rows`
}

async function checkD(): Promise<string> {
  const [{ data: c, error: ce }, { data: m, error: me }] = await Promise.all([
    supabase
      .from('challenges')
      .select('id, slug, title, difficulty, move_tags, challenge_type')
      .limit(1),
    supabase
      .from('learn_modules')
      .select('id, slug, name, difficulty, level_track')
      .limit(1),
  ])
  if (ce) throw new Error(`challenges: ${ce.message}`)
  if (me) throw new Error(`learn_modules: ${me.message}`)
  const challengeOk = c && c.length > 0
  const moduleOk = m && m.length > 0
  if (!challengeOk && !moduleOk) throw new Error('Both challenges and learn_modules returned empty')
  return `challenge=${challengeOk ? 'ok' : 'empty'}, module=${moduleOk ? 'ok' : 'empty'}`
}

async function checkE(): Promise<string> {
  const { data: plans, error: pe } = await supabase
    .from('study_plans')
    .select('*')
    .eq('is_published', true)
    .limit(1)
  if (pe) throw new Error(`study_plans: ${pe.message}`)
  if (!plans || plans.length === 0) {
    // No published plans is acceptable — check that the table is accessible
    return '0 published plans (table accessible)'
  }
  const plan = plans[0] as { id: string }
  const { data: chapters, error: ce } = await supabase
    .from('study_plan_chapters')
    .select('*')
    .eq('plan_id', plan.id)
  if (ce) throw new Error(`study_plan_chapters: ${ce.message}`)
  return `plan found, ${chapters?.length ?? 0} chapters`
}

async function checkF(): Promise<string> {
  // Mirrors exact column list from admin GET route (route.ts L16-22) AFTER R3.E.1
  // drops the 4 legacy columns. Pre-R3.E.1, this select still succeeds because
  // legacy columns exist; post-drop, only the canonical column list applies.
  const { data, error } = await supabase
    .from('challenges')
    .select([
      'id', 'title', 'paradigm', 'difficulty',
      'estimated_minutes', 'primary_competencies', 'secondary_competencies',
      'relevant_roles', 'company_tags',
      'is_published', 'is_premium', 'is_calibration', 'challenge_type',
      'topic_tags', 'technique_tags', 'industry_tags',
      'topic_tags_suggested', 'technique_tags_suggested',
      'is_real_interview', 'source_url',
    ].join(','))
    .limit(1)
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('No challenges found')
  const row = data[0]
  const required = [
    'id', 'title', 'paradigm', 'difficulty',
    'estimated_minutes', 'primary_competencies', 'secondary_competencies',
    'relevant_roles', 'company_tags',
    'is_published', 'is_premium', 'is_calibration', 'challenge_type',
    'topic_tags', 'technique_tags', 'industry_tags',
    'topic_tags_suggested', 'technique_tags_suggested',
    'is_real_interview', 'source_url',
  ]
  for (const key of required) {
    if (!(key in row)) throw new Error(`Missing admin GET column "${key}"`)
  }
  return `all ${required.length} admin GET columns present`
}

async function checkG(): Promise<string> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, topic_tags, technique_tags, challenge_type, difficulty, relevant_roles')
    .eq('is_published', true)
    .limit(40)
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('No published challenges found')
  const required = ['id', 'title', 'topic_tags', 'technique_tags', 'challenge_type', 'difficulty', 'relevant_roles']
  for (const row of data) {
    for (const key of required) {
      if (!(key in row)) throw new Error(`Missing column "${key}" in row ${(row as { id: string }).id}`)
    }
  }
  return `${data.length} rows`
}

async function checkH(): Promise<string> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('challenge_type', 'quick_take')
    .eq('is_published', true)
    .limit(1)
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('No published quick_take challenges found')
  return `1 quick_take row`
}

async function checkI(): Promise<string> {
  const [{ data: topics, error: te }, { data: techniques, error: tce }] = await Promise.all([
    supabase
      .from('topics')
      .select('slug, title, challenge_count, applies_to_types')
      .eq('is_published', true)
      .limit(5),
    supabase
      .from('techniques')
      .select('slug, label, discipline, challenge_count, applies_to_types')
      .limit(5),
  ])
  if (te) throw new Error(`topics: ${te.message}`)
  if (tce) throw new Error(`techniques: ${tce.message}`)
  const topicsOk = topics !== null
  const techniquesOk = techniques !== null
  if (!topicsOk || !techniquesOk) throw new Error('Null result from topics or techniques')
  // Validate shape for any rows returned
  for (const t of topics ?? []) {
    const r = t as Record<string, unknown>
    for (const key of ['slug', 'title', 'challenge_count', 'applies_to_types']) {
      if (!(key in r)) throw new Error(`topics missing column "${key}"`)
    }
  }
  for (const t of techniques ?? []) {
    const r = t as Record<string, unknown>
    for (const key of ['slug', 'label', 'discipline', 'challenge_count', 'applies_to_types']) {
      if (!(key in r)) throw new Error(`techniques missing column "${key}"`)
    }
  }
  return `topics=${topics?.length ?? 0} rows, techniques=${techniques?.length ?? 0} rows`
}

async function checkJ(): Promise<string> {
  const { count, error } = await supabase
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .gt('industry_tags', '{}')   // Supabase filter: array length > 0
  if (error) throw new Error(error.message)
  if (count === null) throw new Error('count returned null')
  if (count === 0) throw new Error(`industry_tags backfill not found — count is 0 (expected ≥128 from R2)`)
  return `${count} challenges have industry_tags`
}

async function checkK(): Promise<string> {
  const slugs = ['frame-like-a-pm', 'the-list-move', 'optimize-under-pressure', 'win-the-room']
  const { data, error } = await supabase
    .from('study_plans')
    .select('slug, is_published')
    .in('slug', slugs)
  if (error) throw new Error(error.message)
  if (!data) throw new Error('null data')
  const found = new Map((data as { slug: string; is_published: boolean }[]).map(r => [r.slug, r.is_published]))
  const missing: string[] = []
  const published: string[] = []
  for (const slug of slugs) {
    if (!found.has(slug)) missing.push(slug)
    else if (found.get(slug) === true) published.push(slug)
  }
  if (missing.length > 0) throw new Error(`Move-shell plans missing from DB: ${missing.join(', ')}`)
  if (published.length > 0) throw new Error(`Move-shell plans are is_published=true (should be false): ${published.join(', ')}`)
  return `all 4 move-shell plans present and is_published=false`
}

async function checkL(): Promise<string> {
  const { count, error } = await supabase
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .not('technique_tags', 'eq', '{}')
  if (error) throw new Error(error.message)
  if (!count || count < 90) throw new Error(`only ${count ?? 0} rows have technique_tags; R2 framework→technique merge expected ≥90`)
  return `${count} challenges have technique_tags`
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nPre-contract compatibility test — ${new Date().toISOString()}\n`)

  const checks: { id: string; label: string; fn: () => Promise<string> }[] = [
    { id: 'A', label: 'A. Practice list query', fn: checkA },
    { id: 'B', label: 'B. Difficulty filter expansion', fn: checkB },
    { id: 'C', label: 'C. Dashboard recommendation bands', fn: checkC },
    { id: 'D', label: 'D. Hatch chat context', fn: checkD },
    { id: 'E', label: 'E. Study plan render', fn: checkE },
    { id: 'F', label: 'F. Admin GET columns', fn: checkF },
    { id: 'G', label: 'G. Personalized plan generator', fn: checkG },
    { id: 'H', label: 'H. Quick-take read', fn: checkH },
    { id: 'I', label: 'I. Topic + technique vocab presence', fn: checkI },
    { id: 'J', label: 'J. Industry tags populated', fn: checkJ },
    { id: 'K', label: 'K. Move-shells unpublished', fn: checkK },
    { id: 'L', label: 'L. Technique tags populated', fn: checkL },
  ]

  const results: CheckResult[] = []
  for (const check of checks) {
    results.push(await runCheck(check.label, check.fn))
  }

  const passed = results.filter(r => r.passed)
  const failed = results.filter(r => !r.passed)
  const total = results.length

  console.log('')
  if (failed.length === 0) {
    console.log(`PASS: ${passed.length}/${total} checks`)
    process.exit(0)
  } else {
    const failedLabels = failed.map(r => {
      // Extract letter prefix (e.g. "A" from "A. Practice list query")
      const match = r.label.match(/^([A-Z])\./)
      return match ? match[1] : r.label
    })
    console.log(`FAIL: ${failed.length}/${total} checks; failed: [${failedLabels.join(', ')}]`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
