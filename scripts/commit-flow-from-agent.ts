#!/usr/bin/env npx tsx
/**
 * Commit FLOW (Frame/List/Optimize/Win) challenges authored by sub-agents into
 * the DB. FLOW challenges cannot go through commit-interview-seeds.ts (that path
 * hardcodes a single 'coding' step), so this script inserts the real 4-step
 * structure: challenges + flow_steps + step_questions + flow_options, mirroring
 * src/lib/content/publisher.ts publishDraft().
 *
 * Sub-agents write one ChallengeJson per keeper into
 * seeds/chillinterview/flow-agent-out/, each with the FlowChallenge shape below.
 * Dedup is by source_url against the DB.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/commit-flow-from-agent.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/commit-flow-from-agent.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

const AGENT_OUT = path.join(process.cwd(), 'seeds', 'chillinterview', 'flow-agent-out')

type FlowStepName = 'frame' | 'list' | 'optimize' | 'win'
type OptionQuality = 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
const STEP_ORDER: Record<FlowStepName, number> = { frame: 1, list: 2, optimize: 3, win: 4 }
const QUALITY_POINTS: Record<OptionQuality, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}

interface FlowOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  quality: OptionQuality
  explanation: string
  competencies?: string[]
}
interface FlowQuestion {
  question_text: string
  question_nudge?: string
  sequence: number
  grading_weight_within_step: number
  target_competencies?: string[]
  options: FlowOption[]
}
interface FlowStep {
  step: FlowStepName
  step_nudge: string
  grading_weight: number
  questions: FlowQuestion[]
}
interface FlowChallenge {
  key: string
  title: string
  scenario_role: string
  scenario_context: string
  scenario_trigger: string
  scenario_question: string
  engineer_standout: string
  difficulty: string
  estimated_minutes: number
  topic_tags: string[]
  technique_tags: string[]
  move_tags?: string[]
  company_tags: string[]
  relevant_roles: string[]
  domain_slug?: string
  source_url: string
  flow_steps: FlowStep[]
}

function kebab(s: string): string {
  return s.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uniqueSlug(title: string): Promise<string> {
  const base = kebab(title).slice(0, 80) || randomUUID().slice(0, 8)
  let c = base
  for (let n = 2; ; n++) {
    const { data } = await supabase.from('challenges').select('id').eq('slug', c).limit(1)
    if (!data || data.length === 0) return c
    c = `${base}-${n}`.slice(0, 90)
  }
}

function validate(f: FlowChallenge): string[] {
  const e: string[] = []
  if (!f.scenario_context || f.scenario_context.length < 80) e.push('scenario_context too short')
  if (!Array.isArray(f.flow_steps) || f.flow_steps.length !== 4)
    e.push('need exactly 4 flow_steps (frame/list/optimize/win)')
  if (!f.topic_tags?.length) e.push('topic_tags required for flow')
  if (!f.technique_tags?.length && !f.move_tags?.length)
    e.push('need >=1 technique_tag or move_tag for flow')
  for (const s of f.flow_steps ?? []) {
    if (!STEP_ORDER[s.step]) e.push(`invalid step ${s.step}`)
    for (const q of s.questions ?? []) {
      if (!q.options || q.options.length !== 4) e.push(`step ${s.step} q${q.sequence} needs 4 options`)
      const qualities = new Set((q.options ?? []).map((o) => o.quality))
      if (qualities.size !== 4) e.push(`step ${s.step} q${q.sequence} needs one of each quality`)
    }
  }
  if (/—/.test(f.scenario_context + f.scenario_trigger + f.scenario_question))
    e.push('em dash in scenario copy (banned)')
  return e
}

async function insertFlow(f: FlowChallenge): Promise<void> {
  const id = randomUUID()
  const slug = await uniqueSlug(f.title)
  const domainId = await resolveDomain(f.domain_slug)

  const { error: cErr } = await supabase.from('challenges').insert({
    id,
    slug,
    title: f.title,
    challenge_type: 'flow',
    scenario_role: f.scenario_role,
    scenario_context: f.scenario_context,
    scenario_trigger: f.scenario_trigger,
    scenario_question: f.scenario_question,
    engineer_standout: f.engineer_standout,
    paradigm: 'traditional',
    difficulty: normalizeDifficulty(f.difficulty),
    estimated_minutes: f.estimated_minutes ?? 12,
    relevant_roles: f.relevant_roles ?? [],
    company_tags: f.company_tags ?? [],
    topic_tags: f.topic_tags ?? [],
    technique_tags: f.technique_tags ?? [],
    move_tags: f.move_tags ?? [],
    domain_id: domainId,
    is_real_interview: true,
    source_url: f.source_url,
    metadata: { source: 'chillinterview', source_fidelity: 'expanded', is_expanded: true },
    is_published: true,
  })
  if (cErr) throw new Error(`challenge insert failed: ${cErr.message}`)

  for (const s of f.flow_steps) {
    const { data: fs2, error: sErr } = await supabase
      .from('flow_steps')
      .insert({
        challenge_id: id,
        step: s.step,
        step_nudge: s.step_nudge,
        grading_weight: s.grading_weight,
        step_order: STEP_ORDER[s.step],
      })
      .select('id')
      .single()
    if (sErr || !fs2) throw new Error(`flow_steps insert failed: ${sErr?.message}`)
    for (const q of s.questions) {
      const { data: sq, error: qErr } = await supabase
        .from('step_questions')
        .insert({
          flow_step_id: fs2.id,
          question_text: q.question_text,
          question_nudge: q.question_nudge ?? null,
          sequence: q.sequence,
          response_type: 'pure_mcq',
          grading_weight_within_step: q.grading_weight_within_step,
          target_competencies: q.target_competencies ?? [],
        })
        .select('id')
        .single()
      if (qErr || !sq) throw new Error(`step_questions insert failed: ${qErr?.message}`)
      const rows = q.options.map((o) => ({
        id: `${id}-${s.step}-Q${q.sequence}-${o.label}`,
        question_id: sq.id,
        option_label: o.label,
        option_text: o.text,
        quality: o.quality,
        points: QUALITY_POINTS[o.quality],
        competencies: o.competencies ?? [],
        explanation: o.explanation,
      }))
      const { error: oErr } = await supabase.from('flow_options').insert(rows)
      if (oErr) throw new Error(`flow_options insert failed: ${oErr.message}`)
    }
  }
}

function normalizeDifficulty(raw: string): string {
  switch (raw) {
    case 'easy':
    case 'warmup':
      return 'easy'
    case 'hard':
    case 'advanced':
    case 'staff_plus':
      return 'hard'
    default:
      return 'medium'
  }
}

async function resolveDomain(slug: string | undefined): Promise<string | null> {
  const s = slug || 'product-strategy'
  const { data } = await supabase.from('domains').select('id').eq('slug', s).maybeSingle()
  return data?.id ?? null
}

async function main() {
  if (!fs.existsSync(AGENT_OUT)) {
    console.error(`Missing ${path.relative(process.cwd(), AGENT_OUT)} — flow agents have not run.`)
    process.exit(1)
  }
  const files = fs.readdirSync(AGENT_OUT).filter((f) => f.endsWith('.json'))
  console.log(`${files.length} flow agent output files`)

  const all = files.map((f) => JSON.parse(fs.readFileSync(path.join(AGENT_OUT, f), 'utf-8')))
  const urls = all.map((f) => f.source_url).filter(Boolean)
  const { data: existing } = await supabase.from('challenges').select('source_url').in('source_url', urls)
  const seen = new Set((existing ?? []).map((r) => r.source_url))

  let inserted = 0
  let invalid = 0
  let dupe = 0
  for (const f of all) {
    if (seen.has(f.source_url)) {
      dupe++
      continue
    }
    const errs = validate(f)
    if (errs.length) {
      console.warn(`  ${f.key} INVALID: ${errs.join('; ')}`)
      invalid++
      continue
    }
    if (DRY_RUN) {
      console.log(`  [dry] ${f.title} (${f.flow_steps.length} steps, companies=${JSON.stringify(f.company_tags)})`)
      continue
    }
    try {
      await insertFlow(f)
      inserted++
      console.log(`  Inserted: ${f.title}`)
    } catch (err) {
      console.error(`  Failed ${f.title}: ${(err as Error).message}`)
    }
  }
  console.log(`\n${DRY_RUN ? 'would insert' : 'inserted'} ${inserted}, ${invalid} invalid, ${dupe} dupes`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
