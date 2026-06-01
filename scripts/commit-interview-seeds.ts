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

// ── CLI args ──────────────────────────────────────────────────────────────────
// --source <name>   Only commit staged entries whose metadata.source matches.
// --dry-run         Print what would be committed, write nothing.
const cliArgs = process.argv.slice(2)
const SOURCE_FILTER = (() => {
  const i = cliArgs.indexOf('--source')
  return i >= 0 ? cliArgs[i + 1] : undefined
})()
const DRY_RUN = cliArgs.includes('--dry-run')

function kebab(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Generate a slug unique against challenges.slug, suffixing on collision. */
async function uniqueSlug(title: string): Promise<string> {
  const base = kebab(title).slice(0, 80) || randomUUID().slice(0, 8)
  let candidate = base
  for (let n = 2; ; n++) {
    const { data } = await supabase.from('challenges').select('id').eq('slug', candidate).limit(1)
    if (!data || data.length === 0) return candidate
    candidate = `${base}-${n}`.slice(0, 90)
  }
}

// The challenges table difficulty CHECK accepts easy | medium | hard
// (practice overhaul migration 20260527000000). Map both the old
// warmup/standard/advanced/staff_plus vocabulary and the new one onto it.
function normalizeDifficulty(raw: unknown): string {
  switch (raw) {
    case 'easy':
    case 'warmup':
      return 'easy'
    case 'hard':
    case 'advanced':
    case 'staff_plus':
      return 'hard'
    case 'medium':
    case 'standard':
    default:
      return 'medium'
  }
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
  let approved = staged.filter((c) => c.approved === true)

  if (SOURCE_FILTER) {
    approved = approved.filter(
      (c) => ((c.metadata as Record<string, unknown> | undefined)?.source as string) === SOURCE_FILTER
    )
    console.log(`--source ${SOURCE_FILTER} → ${approved.length} matching approved entries`)
  }

  if (approved.length === 0) {
    console.log(
      'No approved challenges. Edit seeds/staged-interview-challenges.json and set approved: true.'
    )
    process.exit(0)
  }

  // Dedup against the DB by source_url (stable per source question) so re-runs
  // never insert the same imported challenge twice. Chunk the IN() query — a
  // single .in() with hundreds of long URLs overflows the GET querystring and
  // fails silently, which previously let duplicates through.
  const sourceUrls = approved
    .map((c) => (c.metadata as Record<string, unknown> | undefined)?.source_url as string | undefined)
    .filter(Boolean) as string[]
  if (sourceUrls.length > 0) {
    const seen = new Set<string>()
    const CHUNK = 50
    for (let i = 0; i < sourceUrls.length; i += CHUNK) {
      const chunk = sourceUrls.slice(i, i + CHUNK)
      const { data: existing, error } = await supabase
        .from('challenges')
        .select('source_url')
        .in('source_url', chunk)
      if (error) throw new Error(`dedup query failed: ${error.message}`)
      for (const r of existing ?? []) if (r.source_url) seen.add(r.source_url)
    }
    const before = approved.length
    approved = approved.filter((c) => {
      const u = (c.metadata as Record<string, unknown> | undefined)?.source_url as string | undefined
      return !u || !seen.has(u)
    })
    if (before !== approved.length)
      console.log(`  dedup: ${before - approved.length} already in DB, ${approved.length} new`)
  }

  if (approved.length === 0) {
    console.log('Nothing new to commit — all approved entries already exist in the DB.')
    process.exit(0)
  }

  console.log(`Committing ${approved.length} approved challenges...${DRY_RUN ? ' (DRY RUN)' : ''}`)

  for (const c of approved) {
    const md = (c.metadata as Record<string, unknown>) ?? {}
    const isSql = Boolean((c as { is_sql?: boolean }).is_sql)
    const challengeType = (c.challenge_type as string) ?? (isSql ? 'sql' : 'algorithm')
    const isCoding = challengeType === 'algorithm' || challengeType === 'sql'

    // Explore-surface fields: pulled from metadata so the "Asked at top companies"
    // query (is_published + is_real_interview + company_tags) can see this row.
    const companyTags = Array.isArray(md.company_tags) ? (md.company_tags as string[]) : []
    const topicTags = Array.isArray(md.topic_tags) ? (md.topic_tags as string[]) : []
    const techniqueTags = Array.isArray(md.technique_tags) ? (md.technique_tags as string[]) : []
    const sourceUrl = (md.source_url as string) ?? null
    const isRealInterview = Boolean(md.source) // anything imported from a real source

    // Coding challenges render from a problem statement + metadata, not a canvas.
    const scenarioTrigger = isCoding
      ? 'Solve it in the editor. Run the tests as you go.'
      : 'You have 30 minutes.'
    const scenarioQuestion = isCoding
      ? 'Write a working solution. Use Hatch for coaching.'
      : 'Design your solution on the canvas. Use Hatch for coaching.'

    const challengeId = randomUUID()
    const slug = await uniqueSlug(c.title as string)

    if (DRY_RUN) {
      console.log(
        `  [dry] ${c.title} → type=${challengeType} slug=${slug} companies=${JSON.stringify(companyTags)} real=${isRealInterview}`
      )
      continue
    }

    const { error } = await supabase.from('challenges').insert({
      id: challengeId,
      slug,
      title: c.title,
      challenge_type: challengeType,
      difficulty: normalizeDifficulty(c.difficulty),
      estimated_minutes: (c.estimated_minutes as number) ?? 30,
      scenario_context: c.problem_statement_markdown,
      scenario_trigger: scenarioTrigger,
      scenario_question: scenarioQuestion,
      metadata: md,
      company_tags: companyTags,
      topic_tags: topicTags,
      technique_tags: techniqueTags,
      is_real_interview: isRealInterview,
      source_url: sourceUrl,
      is_published: true,
      paradigm: 'traditional',
    })

    if (error) {
      console.error(`  Failed: ${c.title}: ${error.message}`)
      continue
    }

    console.log(`  Inserted: ${c.title} (${slug})`)

    // Link to company_profiles via challenge_companies, where a profile exists.
    if (companyTags.length > 0) {
      const { data: profiles } = await supabase
        .from('company_profiles')
        .select('id, slug')
        .in('slug', companyTags)
      for (const p of profiles ?? []) {
        await supabase
          .from('challenge_companies')
          .insert({ challenge_id: challengeId, company_id: p.id, relevance: 'asked_in_interview' })
      }
    }

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
