/**
 * Convert freeform challenges → FLOW challenges.
 *
 * Reads authored FLOW JSON files from content/freeform-to-flow/*.json (one per
 * challenge) and applies them onto the EXISTING freeform row: it rewrites the
 * scenario fields, flips challenge_type to 'flow', publishes, and upserts the
 * full FLOW structure (4 steps × 1-2 questions × 4 options). Idempotent — safe
 * to re-run; options are deleted+reinserted per question.
 *
 * The display_number trigger renumbers the row into the 3xxx (PS) band the next
 * time the backfill view is read; existing freeform numbers (4xxx) are left as
 * a harmless historical value on the row until then. To force a clean PS number,
 * pass --renumber to null display_number so a follow-up backfill reassigns it.
 *
 * Run:
 *   npx tsx scripts/convert-freeform-to-flow.ts                  # all JSON files
 *   npx tsx scripts/convert-freeform-to-flow.ts <id> [<id> ...]  # specific ids
 *
 * JSON shape: see content/freeform-to-flow/_SCHEMA.md
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'
import { readdirSync, readFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DIR = resolve(process.cwd(), 'content/freeform-to-flow')
const QUALITY_POINTS: Record<string, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}
const STEP_ORDER: Record<string, number> = { frame: 1, list: 2, optimize: 3, win: 4 }
// The challenges.difficulty CHECK allows easy/medium/hard. Map seed-v2 vocabulary back.
const DIFFICULTY_MAP: Record<string, string> = {
  warmup: 'easy',
  standard: 'medium',
  advanced: 'hard',
  staff_plus: 'hard',
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
}

interface FlowOptionJson {
  option_label: 'A' | 'B' | 'C' | 'D'
  option_text: string
  quality: 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
  competencies?: string[]
  explanation: string
  framework_hint?: string | null
}
interface QuestionJson {
  question_text: string
  question_nudge?: string | null
  sequence: number
  grading_weight_within_step: number
  target_competencies?: string[]
  response_type?: 'pure_mcq' | 'mcq_plus_elaboration' | 'modified_option'
  options: FlowOptionJson[]
}
interface StepJson {
  step: 'frame' | 'list' | 'optimize' | 'win'
  step_nudge?: string | null
  grading_weight: number
  questions: QuestionJson[]
}
interface ConversionJson {
  id: string // the existing freeform challenge id (must already exist)
  title?: string
  scenario_role?: string | null
  scenario_context: string
  scenario_trigger: string
  scenario_question: string
  engineer_standout?: string | null
  paradigm?: string | null
  industry?: string | null
  sub_vertical?: string | null
  difficulty?: string
  estimated_minutes?: number
  primary_competencies?: string[]
  secondary_competencies?: string[]
  topic_tags?: string[]
  technique_tags?: string[]
  move_tags?: string[]
  steps: StepJson[]
}

function validate(c: ConversionJson): string[] {
  const errs: string[] = []
  const steps = c.steps?.map((s) => s.step) ?? []
  for (const required of ['frame', 'list', 'optimize', 'win']) {
    if (!steps.includes(required as StepJson['step'])) errs.push(`missing step: ${required}`)
  }
  const weightSum = (c.steps ?? []).reduce((a, s) => a + s.grading_weight, 0)
  if (Math.abs(weightSum - 1.0) > 0.001) errs.push(`step grading_weight sum=${weightSum} (must be 1.0)`)
  for (const s of c.steps ?? []) {
    const qSum = s.questions.reduce((a, q) => a + q.grading_weight_within_step, 0)
    if (Math.abs(qSum - 1.0) > 0.001) errs.push(`${s.step}: question weight sum=${qSum} (must be 1.0)`)
    for (const q of s.questions) {
      const labels = q.options.map((o) => o.option_label).sort().join('')
      if (labels !== 'ABCD') errs.push(`${s.step} q${q.sequence}: options must be exactly A,B,C,D (got ${labels})`)
      const qualities = q.options.map((o) => o.quality).sort().join(',')
      if (qualities !== 'best,good_but_incomplete,plausible_wrong,surface')
        errs.push(`${s.step} q${q.sequence}: must have one of each quality (got ${qualities})`)
    }
  }
  return errs
}

async function convertOne(c: ConversionJson, renumber: boolean): Promise<boolean> {
  const errs = validate(c)
  if (errs.length) {
    console.error(`  ✗ ${c.id} validation failed:\n    - ${errs.join('\n    - ')}`)
    return false
  }

  // Confirm the row exists and is currently freeform (guard against typos / double-runs).
  const { data: existing } = await supabase
    .from('challenges')
    .select('id, challenge_type')
    .eq('id', c.id)
    .maybeSingle()
  if (!existing) {
    console.error(`  ✗ ${c.id}: no such challenge row`)
    return false
  }

  const update: Record<string, unknown> = {
    challenge_type: 'flow',
    scenario_context: c.scenario_context,
    scenario_trigger: c.scenario_trigger,
    scenario_question: c.scenario_question,
    is_published: true,
  }
  if (c.title) update.title = c.title
  if (c.scenario_role !== undefined) update.scenario_role = c.scenario_role
  if (c.engineer_standout !== undefined) update.engineer_standout = c.engineer_standout
  if (c.paradigm !== undefined) update.paradigm = c.paradigm
  if (c.industry !== undefined) update.industry = c.industry
  if (c.sub_vertical !== undefined) update.sub_vertical = c.sub_vertical
  if (c.difficulty) update.difficulty = DIFFICULTY_MAP[c.difficulty] ?? c.difficulty
  if (c.estimated_minutes) update.estimated_minutes = c.estimated_minutes
  if (c.primary_competencies) update.primary_competencies = c.primary_competencies
  if (c.secondary_competencies) update.secondary_competencies = c.secondary_competencies
  if (c.topic_tags) update.topic_tags = c.topic_tags
  if (c.technique_tags) update.technique_tags = c.technique_tags
  if (c.move_tags) update.move_tags = c.move_tags
  // Reassign into the flow (3xxx) band so the converted challenge reads PS-3xxx
  // instead of keeping its freeform 4xxx number. Take the next number after the
  // current flow max. (The INSERT trigger does not fire on UPDATE, so we do it here.)
  if (renumber) {
    const { data: maxRow } = await supabase
      .from('challenges')
      .select('display_number')
      .eq('challenge_type', 'flow')
      .order('display_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextFlow = (maxRow?.display_number ?? 3000) + 1
    update.display_number = nextFlow
  }

  const { error: chErr } = await supabase.from('challenges').update(update).eq('id', c.id)
  if (chErr) {
    console.error(`  ✗ ${c.id} challenge update: ${chErr.message}`)
    return false
  }

  for (const s of c.steps) {
    const { data: stepRow, error: stepErr } = await supabase
      .from('flow_steps')
      .upsert(
        {
          challenge_id: c.id,
          step: s.step,
          step_nudge: s.step_nudge ?? null,
          grading_weight: s.grading_weight,
          step_order: STEP_ORDER[s.step],
        },
        { onConflict: 'challenge_id,step' },
      )
      .select('id')
      .single()
    if (stepErr || !stepRow) {
      console.error(`  ✗ ${c.id} step ${s.step}: ${stepErr?.message}`)
      return false
    }

    for (const q of s.questions) {
      const { data: qRow, error: qErr } = await supabase
        .from('step_questions')
        .upsert(
          {
            flow_step_id: stepRow.id,
            question_text: q.question_text,
            question_nudge: q.question_nudge ?? null,
            sequence: q.sequence,
            grading_weight_within_step: q.grading_weight_within_step,
            target_competencies: q.target_competencies ?? [],
            response_type: q.response_type ?? 'mcq_plus_elaboration',
          },
          { onConflict: 'flow_step_id,sequence' },
        )
        .select('id')
        .single()
      if (qErr || !qRow) {
        console.error(`  ✗ ${c.id} ${s.step} q${q.sequence}: ${qErr?.message}`)
        return false
      }

      // Idempotent: clear and re-insert options for this question.
      await supabase.from('flow_options').delete().eq('question_id', qRow.id)
      for (const opt of q.options) {
        const { error: optErr } = await supabase.from('flow_options').insert({
          id: randomUUID(),
          question_id: qRow.id,
          option_label: opt.option_label,
          option_text: opt.option_text,
          quality: opt.quality,
          points: QUALITY_POINTS[opt.quality],
          competencies: opt.competencies ?? [],
          explanation: opt.explanation,
          framework_hint: opt.framework_hint ?? null,
        })
        if (optErr) {
          console.error(`  ✗ ${c.id} ${s.step} q${q.sequence} opt ${opt.option_label}: ${optErr.message}`)
          return false
        }
      }
    }
  }

  console.log(`  ✓ ${c.id} (${existing.challenge_type} → flow)`)
  return true
}

async function main() {
  const args = process.argv.slice(2)
  const renumber = args.includes('--renumber')
  const ids = args.filter((a) => !a.startsWith('--'))

  let files = readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  if (ids.length) files = files.filter((f) => ids.includes(f.replace(/\.json$/, '')))

  if (!files.length) {
    console.error(`No JSON files matched in ${DIR}`)
    process.exit(1)
  }

  console.log(`Converting ${files.length} challenge(s)${renumber ? ' (with renumber)' : ''}...\n`)
  let ok = 0
  for (const f of files) {
    const json = JSON.parse(readFileSync(resolve(DIR, f), 'utf8')) as ConversionJson
    if (await convertOne(json, renumber)) ok++
  }
  console.log(`\n✅ Converted ${ok}/${files.length}.`)
  if (ok < files.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
