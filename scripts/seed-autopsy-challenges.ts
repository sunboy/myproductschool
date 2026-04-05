/**
 * Seed autopsy decisions as real v2 challenge rows.
 *
 * Run with: npx tsx scripts/seed-autopsy-challenges.ts
 *
 * What this does:
 * 1. For each Notion autopsy decision, creates rows in:
 *    - challenges (v2 schema) — id is TEXT (manually set)
 *    - flow_steps (4 steps: frame, list, optimize, win) — id is UUID (auto)
 *    - step_questions (1 per step) — id is UUID (auto)
 *    - flow_options (4 per question) — id is TEXT (manually set), question_id is UUID
 * 2. Updates autopsy_challenges with the resulting challenge_id
 *
 * After seeding, ShowcaseDetailClient can use mode="api" with the real challenge IDs.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const STEP_NUDGES: Record<string, string> = {
  frame:
    "Start with what actually happened — not why. Describe the decision as if explaining it to a teammate who doesn't use the product.",
  list:
    'Who benefits from this decision? Who loses? Think beyond the obvious user — consider competitors, adjacent teams, the business model.',
  optimize:
    'Surface-level reasoning is usually wrong. Ask: what would they have had to believe to make this choice?',
  win:
    'Pick the explanation that generalizes — the one that would help you make a better decision in a different product context.',
}

const STEP_COMPETENCIES: Record<string, string[]> = {
  frame: ['motivation_theory', 'cognitive_empathy'],
  list: ['cognitive_empathy', 'creative_execution'],
  optimize: ['taste', 'strategic_thinking'],
  win: ['strategic_thinking', 'domain_expertise', 'motivation_theory', 'cognitive_empathy'],
}

const STEP_ORDERS: Record<string, number> = {
  frame: 1,
  list: 2,
  optimize: 3,
  win: 4,
}

const STEP_GRADING_WEIGHTS: Record<string, number> = {
  frame: 0.2,
  list: 0.2,
  optimize: 0.2,
  win: 0.4,
}

const QUALITY_TO_POINTS: Record<string, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}

const OPTION_LABELS: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
}

interface DecisionInput {
  id: string
  title: string
  area: string
  difficulty: string
  what_they_did: string
  real_reasoning: string
  challenge_question: string
  challenge: {
    id: string
    context: string
    insight: string
    options: Array<{
      id: string
      text: string
      quality: string
      explanation: string
    }>
  }
}

async function seedDecision(decision: DecisionInput) {
  console.log(`\n=== Seeding: ${decision.title} ===`)

  // Generate a stable challenge ID based on the decision ID
  const challengeId = `AUTOPSY-NOTION-${decision.id.toUpperCase()}`

  // 1. Check if challenge already exists
  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .eq('id', challengeId)
    .single()

  if (existing) {
    console.log(`  Challenge already exists: ${challengeId}`)
    await updateAutopsyChallenge(decision.challenge.id, challengeId)
    return challengeId
  }

  // 2. Create the v2 challenge
  const { error: challengeError } = await supabase
    .from('challenges')
    .insert({
      id: challengeId,
      title: decision.title,
      scenario_role: decision.area,
      scenario_context: decision.what_they_did,
      scenario_trigger: decision.challenge.context,
      scenario_question: decision.challenge_question,
      engineer_standout: null,
      paradigm: null,
      industry: 'Technology',
      sub_vertical: null,
      difficulty: decision.difficulty === 'warmup' ? 'warmup' : decision.difficulty === 'advanced' ? 'advanced' : 'standard',
      estimated_minutes: 5,
      primary_competencies: STEP_COMPETENCIES.win,
      secondary_competencies: ['motivation_theory', 'cognitive_empathy'],
      frameworks: [],
      relevant_roles: ['swe', 'em', 'tech_lead', 'pm'],
      company_tags: ['Notion'],
      tags: ['product-strategy', 'autopsy'],
      is_published: true,
      is_calibration: false,
      is_premium: false,
    })

  if (challengeError) {
    throw new Error(`Failed to create challenge: ${JSON.stringify(challengeError)}`)
  }

  console.log(`  Created challenge: ${challengeId}`)

  // 3. Create flow_steps for each step
  const steps = ['frame', 'list', 'optimize', 'win'] as const

  for (const step of steps) {
    const { data: flowStep, error: stepError } = await supabase
      .from('flow_steps')
      .insert({
        challenge_id: challengeId,
        step,
        step_nudge: STEP_NUDGES[step],
        grading_weight: STEP_GRADING_WEIGHTS[step],
        step_order: STEP_ORDERS[step],
      })
      .select('id')
      .single()

    if (stepError) throw new Error(`Failed to create flow_step ${step}: ${JSON.stringify(stepError)}`)
    console.log(`  Created flow_step ${step}: ${flowStep.id}`)

    // 4. Create step_question for this step
    const questionText =
      step === 'frame'
        ? 'In your own words, describe the decision above in one sentence — as if explaining it to a teammate who has never used this product.'
        : step === 'list'
        ? decision.challenge.context
        : step === 'optimize'
        ? decision.real_reasoning
        : decision.challenge_question

    const { data: question, error: questionError } = await supabase
      .from('step_questions')
      .insert({
        flow_step_id: flowStep.id,
        question_text: questionText,
        question_nudge: null,
        sequence: 1,
        grading_weight_within_step: 1.0,
        target_competencies: STEP_COMPETENCIES[step],
        response_type: 'mcq_plus_elaboration',
      })
      .select('id')
      .single()

    if (questionError) throw new Error(`Failed to create step_question for ${step}: ${JSON.stringify(questionError)}`)
    console.log(`  Created step_question for ${step}: ${question.id}`)

    // 5. Create flow_options for this question (all 4 options for every step)
    for (const opt of decision.challenge.options) {
      const optLabel = OPTION_LABELS[opt.id]
      if (!optLabel) {
        console.warn(`  Skipping unknown option id: ${opt.id}`)
        continue
      }
      const points = QUALITY_TO_POINTS[opt.quality] ?? 0
      // Stable ID: challengeId + step + optionId
      const optionId = `${challengeId}-${step}-${opt.id}`

      const { error: optionError } = await supabase
        .from('flow_options')
        .insert({
          id: optionId,
          question_id: question.id,
          option_label: optLabel,
          option_text: opt.text,
          quality: opt.quality,
          points,
          competencies: STEP_COMPETENCIES[step],
          explanation: opt.explanation,
          framework_hint: null,
        })

      if (optionError) throw new Error(`Failed to create flow_option ${opt.id} for ${step}: ${JSON.stringify(optionError)}`)
    }
    console.log(`  Created ${decision.challenge.options.length} flow_options for ${step}`)
  }

  // 6. Update autopsy_challenges with the challenge_id
  await updateAutopsyChallenge(decision.challenge.id, challengeId)

  return challengeId
}

async function updateAutopsyChallenge(autopsyChallengeId: string, challengeId: string) {
  const { error } = await supabase
    .from('autopsy_challenges')
    .update({ challenge_id: challengeId })
    .eq('id', autopsyChallengeId)

  if (error) {
    console.error(`  Failed to update autopsy_challenge ${autopsyChallengeId}: ${JSON.stringify(error)}`)
  } else {
    console.log(`  Updated autopsy_challenge ${autopsyChallengeId} → challenge_id: ${challengeId}`)
  }
}

async function main() {
  // Fetch all Notion decisions with their challenges from DB
  const { data: product } = await supabase
    .from('autopsy_products')
    .select('id')
    .eq('slug', 'notion')
    .single()

  if (!product) {
    console.error('Notion product not found in DB')
    process.exit(1)
  }

  const { data: decisions, error: decisionsError } = await supabase
    .from('autopsy_decisions')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  if (decisionsError || !decisions || decisions.length === 0) {
    console.error('No decisions found:', decisionsError)
    process.exit(1)
  }

  const decisionIds = decisions.map((d: { id: string }) => d.id)

  const { data: challenges, error: challengesError } = await supabase
    .from('autopsy_challenges')
    .select('*')
    .in('decision_id', decisionIds)

  if (challengesError) {
    console.error('Failed to fetch challenges:', challengesError)
    process.exit(1)
  }

  const challengeMap: Record<string, typeof challenges[0]> = {}
  for (const c of (challenges ?? [])) {
    challengeMap[c.decision_id] = c
  }

  console.log(`Found ${decisions.length} decisions for Notion`)

  // Seed each decision
  for (const decision of decisions) {
    const challenge = challengeMap[decision.id]
    if (!challenge) {
      console.warn(`No challenge found for decision ${decision.id}, skipping`)
      continue
    }

    await seedDecision({
      id: decision.id,
      title: decision.title,
      area: decision.area,
      difficulty: decision.difficulty,
      what_they_did: decision.what_they_did,
      real_reasoning: decision.real_reasoning,
      challenge_question: decision.challenge_question,
      challenge: {
        id: challenge.id,
        context: challenge.context,
        insight: challenge.insight,
        options: challenge.options,
      },
    })
  }

  console.log('\n=== Seeding complete! ===')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
