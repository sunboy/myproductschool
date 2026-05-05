/**
 * Commit approved interview challenges from seeds/staged-interview-challenges.json
 * to the Supabase challenges table.
 *
 * Run with: npx tsx scripts/commit-interview-seeds.ts
 *
 * Prerequisites:
 *   1. Run seed-interview-challenges.ts to generate seeds/staged-interview-challenges.json
 *   2. Review the file and set approved: true on challenges you want to publish
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Types for the parts schema
// ---------------------------------------------------------------------------

type OptionQuality = 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'

interface PartOption {
  id: string
  option_label: string
  option_text: string
  quality: OptionQuality
  explanation: string
}

interface ChallengePart {
  id: string
  title: string
  prompt_markdown: string
  response_type: 'coding_subtask' | 'pure_mcq'
  weight: number
  test_case_ids?: string[]
  starter_code?: Record<string, string>
  options?: PartOption[]
}

const QUALITY_TO_POINTS: Record<OptionQuality, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function normalizeDifficulty(raw: unknown): string {
  if (raw === 'easy') return 'warmup'
  if (raw === 'hard') return 'advanced'
  if (raw === 'advanced') return 'advanced'
  if (raw === 'warmup') return 'warmup'
  return 'standard'
}

// ---------------------------------------------------------------------------
// Insert flow_steps + step_questions (+ flow_options for pure_mcq) for parts
// ---------------------------------------------------------------------------

async function insertPartsForChallenge(
  challengeId: string,
  parts: ChallengePart[]
): Promise<void> {
  // 1. Insert a single flow_steps row (sentinel step='coding')
  const flowStepId = randomUUID()
  const { error: stepError } = await supabase.from('flow_steps').insert({
    id: flowStepId,
    challenge_id: challengeId,
    step: 'coding',
    step_order: 1,
    grading_weight: 1.0,
  })

  if (stepError) {
    throw new Error(`flow_steps insert failed: ${stepError.message}`)
  }

  // 2. Insert one step_questions row per part
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const questionId = randomUUID()
    const { error: qError } = await supabase.from('step_questions').insert({
      id: questionId,
      flow_step_id: flowStepId,
      sequence: i + 1,
      question_text: part.title,
      response_type: part.response_type,
      grading_weight_within_step: part.weight / 100,
      coding_test_case_ids: part.test_case_ids ?? [],
      coding_starter_code: part.starter_code ?? null,
      coding_subtask_prompt: part.prompt_markdown,
    })

    if (qError) {
      throw new Error(`step_questions insert failed for part "${part.id}": ${qError.message}`)
    }

    // 3. For pure_mcq parts, insert 4 flow_options rows
    if (part.response_type === 'pure_mcq' && part.options) {
      for (const opt of part.options) {
        const { error: optError } = await supabase.from('flow_options').insert({
          id: `${questionId}-${opt.option_label.toLowerCase()}`,
          question_id: questionId,
          option_label: opt.option_label.toUpperCase(),
          option_text: opt.option_text,
          quality: opt.quality,
          points: QUALITY_TO_POINTS[opt.quality],
          explanation: opt.explanation,
        })

        if (optError) {
          throw new Error(
            `flow_options insert failed for part "${part.id}" option "${opt.option_label}": ${optError.message}`
          )
        }
      }
    }
  }
}

async function main() {
  const stagedPath = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')

  if (!fs.existsSync(stagedPath)) {
    console.log('No staged challenges found. Run seed-interview-challenges.ts first.')
    process.exit(1)
  }

  const staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as Array<Record<string, unknown>>
  const approved = staged.filter((c) => c.approved === true)

  if (approved.length === 0) {
    console.log(
      'No approved challenges. Edit seeds/staged-interview-challenges.json and set approved: true.'
    )
    process.exit(0)
  }

  console.log(`Committing ${approved.length} approved challenges...`)

  for (const c of approved) {
    const challengeId = randomUUID()
    const { error } = await supabase.from('challenges').insert({
      id: challengeId,
      title: c.title,
      challenge_type: (c as unknown as { is_sql?: boolean }).is_sql ? 'sql' : 'algorithm',
      difficulty: normalizeDifficulty(c.difficulty),
      estimated_minutes: (c.estimated_minutes as number) ?? 30,
      industry: (c.industry as string) ?? null,
      scenario_context: c.problem_statement_markdown,
      scenario_trigger: 'You have 30 minutes.',
      scenario_question: 'Design your solution on the canvas. Use Hatch for coaching.',
      metadata: (c.metadata as object) ?? {},
      is_published: true,
      paradigm: 'traditional',
    })

    if (error) {
      console.error(`  Failed: ${c.title}: ${error.message}`)
      continue
    }

    console.log(`  Inserted: ${c.title}`)

    // If the entry has a `parts` array, insert flow_steps + step_questions (+ flow_options)
    const parts = c.parts as ChallengePart[] | undefined
    if (parts && parts.length > 0) {
      try {
        await insertPartsForChallenge(challengeId, parts)
        console.log(`    → inserted ${parts.length} part(s) into flow_steps/step_questions`)
      } catch (partsErr) {
        console.error(`    Failed inserting parts for ${c.title}: ${(partsErr as Error).message}`)
      }
    }
  }

  console.log('\nDone. Check /challenges or /explore to see the new challenges.')
}

main().catch(console.error)
