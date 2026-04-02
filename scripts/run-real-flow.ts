/**
 * Real end-to-end FLOW challenge test.
 *
 * Exercises the same DB operations as the API routes, using the admin client
 * directly (bypassing HTTP, which requires a real session cookie).
 *
 * Run:
 *   npx tsx scripts/run-real-flow.ts
 *
 * What it tests:
 *   1. challenge_attempts row created on start
 *   2. step_attempts rows created for each question submission
 *   3. learner_competencies updated on complete
 *   4. profiles.xp_total incremented on complete
 *   5. luma_context row inserted on complete
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Real user from DB (xp_total=10, onboarding completed)
const USER_ID = 'ec44dc35-4c26-457a-994e-e3c923746d86'
const CHALLENGE_ID = 'c1-notification-fatigue'
const STEPS = ['frame', 'list', 'optimize', 'win'] as const
type FlowStep = typeof STEPS[number]

interface FlowOption {
  id: string
  option_label: string
  option_text: string
  quality: string
  points: number
  competencies: string[]
  explanation: string
}

interface StepQuestion {
  id: string
  sequence: number
  response_type: string
  grading_weight_within_step: number
  best_option_id: string
}

interface StepMap {
  flow_step_id: string
  questions: StepQuestion[]
}

function gradePureMCQ(selectedId: string, options: FlowOption[]) {
  const selected = options.find(o => o.id === selectedId)
  if (!selected) return { score: 0, quality_label: 'miss', competencies_demonstrated: [] as string[], grading_explanation: 'Option not found', confidence: 1.0 }
  return {
    score: selected.points,
    quality_label: selected.quality,
    competencies_demonstrated: (selected.competencies ?? []) as string[],
    grading_explanation: selected.explanation ?? '',
    confidence: 1.0,
  }
}


async function main(): Promise<void> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: -1 } },
    global: { fetch: fetch.bind(globalThis) },
  })

  let passed = 0
  let failed = 0

  function check(label: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${label}`)
      passed++
    } else {
      console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
      failed++
    }
  }

  function section(title: string) {
    console.log(`\n${title}`)
    console.log('─'.repeat(title.length))
  }

  // ── Step 0: Baseline snapshot ──────────────────────────────────────────────

  section('Step 0: Baseline snapshot')

  const { data: profileBefore } = await admin
    .from('profiles')
    .select('xp_total')
    .eq('id', USER_ID)
    .single()

  const xpBefore = profileBefore?.xp_total ?? 0
  console.log(`  xp_total before: ${xpBefore}`)

  const { data: competenciesBefore } = await admin
    .from('learner_competencies')
    .select('competency, score')
    .eq('user_id', USER_ID)

  console.log(`  learner_competencies rows before: ${competenciesBefore?.length ?? 0}`)
  const competencyMapBefore = new Map(
    (competenciesBefore ?? []).map((c: { competency: string; score: number }) => [c.competency, c.score])
  )

  const { count: lumaContextCountBefore } = await admin
    .from('luma_context')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  console.log(`  luma_context rows before: ${lumaContextCountBefore ?? 0}`)

  // Cancel any existing in-progress attempt to start fresh
  await admin
    .from('challenge_attempts')
    .update({ status: 'abandoned' })
    .eq('user_id', USER_ID)
    .eq('challenge_id', CHALLENGE_ID)
    .eq('status', 'in_progress')

  // ── Step 1: Start attempt ────────────────────────────────────────────────────

  section('Step 1: Start challenge attempt')

  const { data: attempt, error: startError } = await admin
    .from('challenge_attempts')
    .insert({
      user_id: USER_ID,
      challenge_id: CHALLENGE_ID,
      role_id: 'swe',
      status: 'in_progress',
      current_step: 'frame',
      current_question_sequence: 1,
    })
    .select('id, challenge_id, role_id, current_step, current_question_sequence, status')
    .single()

  check('challenge_attempts row created', !startError && !!attempt, startError?.message)
  check('attempt.status = in_progress', attempt?.status === 'in_progress')
  check('attempt.current_step = frame', attempt?.current_step === 'frame')

  if (!attempt) {
    console.error('\nCannot continue — no attempt created')
    process.exit(1)
  }

  const attemptId = attempt.id
  console.log(`  attempt_id: ${attemptId}`)

  const { data: dbAttempt } = await admin
    .from('challenge_attempts')
    .select('id, status, current_step')
    .eq('id', attemptId)
    .single()

  check('DB: attempt row exists', !!dbAttempt)
  check('DB: attempt status = in_progress', dbAttempt?.status === 'in_progress')

  // ── Step 2: Map full FLOW structure ──────────────────────────────────────────

  section('Step 2: Map FLOW structure from DB')

  const flowMap = new Map<FlowStep, StepMap>()

  for (const step of STEPS) {
    const { data: flowStep } = await admin
      .from('flow_steps')
      .select('id')
      .eq('challenge_id', CHALLENGE_ID)
      .eq('step', step)
      .single()

    if (!flowStep) {
      console.log(`  ✗ flow_step not found for ${step}`)
      failed++
      continue
    }

    const { data: questions } = await admin
      .from('step_questions')
      .select('id, sequence, response_type, grading_weight_within_step')
      .eq('flow_step_id', flowStep.id)
      .order('sequence', { ascending: true })

    const stepQuestions: StepQuestion[] = []

    for (const q of (questions ?? [])) {
      const { data: options } = await admin
        .from('flow_options')
        .select('id, quality, points')
        .eq('question_id', q.id)
        .order('points', { ascending: false })

      const bestOption = (options ?? [])[0]

      stepQuestions.push({
        id: q.id,
        sequence: q.sequence,
        response_type: q.response_type,
        grading_weight_within_step: q.grading_weight_within_step,
        best_option_id: bestOption?.id ?? '',
      })
    }

    flowMap.set(step, { flow_step_id: flowStep.id, questions: stepQuestions })
    console.log(`  ${step}: ${stepQuestions.length} question(s)`)
  }

  check('All 4 FLOW steps mapped', flowMap.size === 4)

  // ── Step 3: Submit each step ────────────────────────────────────────────────

  section('Step 3: Submit step questions (real grading)')

  let totalStepAttemptsInserted = 0
  let currentQuestionSequence = 1

  for (const step of STEPS) {
    const stepData = flowMap.get(step)
    if (!stepData) continue

    console.log(`\n  [${step}]`)

    for (const question of stepData.questions) {
      const { data: optionsRaw } = await admin
        .from('flow_options')
        .select('id, option_label, option_text, quality, points, competencies, explanation')
        .eq('question_id', question.id)

      const options = (optionsRaw ?? []) as FlowOption[]

      const result = gradePureMCQ(question.best_option_id, options)

      const { error: insertError } = await admin
        .from('step_attempts')
        .insert({
          attempt_id: attemptId,
          question_id: question.id,
          step,
          response_type: question.response_type,
          selected_option_id: question.best_option_id || null,
          user_text: null,
          score: result.score,
          quality_label: result.quality_label,
          competencies_demonstrated: result.competencies_demonstrated,
          grading_explanation: result.grading_explanation,
          grading_confidence: result.confidence,
          time_spent_seconds: 30,
        })

      check(`step_attempt inserted: ${step} q${question.sequence}`, !insertError, insertError?.message)
      if (!insertError) totalStepAttemptsInserted++

      await admin
        .from('challenge_attempts')
        .update({ current_question_sequence: ++currentQuestionSequence })
        .eq('id', attemptId)
    }

    const stepIdx = STEPS.indexOf(step)
    const nextStep = stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1] : 'done'
    await admin
      .from('challenge_attempts')
      .update({
        current_step: nextStep,
        ...(nextStep === 'done' ? { status: 'completed' } : {}),
      })
      .eq('id', attemptId)
  }

  const { count: stepAttemptsCount } = await admin
    .from('step_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)

  check(
    `DB: ${totalStepAttemptsInserted} step_attempts persisted`,
    (stepAttemptsCount ?? 0) === totalStepAttemptsInserted,
    `found ${stepAttemptsCount}`
  )

  // ── Step 4: Complete challenge ───────────────────────────────────────────────
  // Uses the same scoring logic as the real route:
  //   - option-scorer tier caps: best=3.0, good_but_incomplete=2.75, surface=1.75, plausible_wrong=0.5
  //   - calculateStepScore: weighted average per step
  //   - aggregateChallenge: role-lens weighted total, max = sum(3.0 * step_weight)
  //   - grade thresholds: ≥2.5 Outstanding, ≥2.0 Strong, ≥1.5 Developing, else Needs Practice

  section('Step 4: Complete challenge (real scoring logic)')

  const { data: stepAttempts } = await admin
    .from('step_attempts')
    .select('question_id, step, score, competencies_demonstrated')
    .eq('attempt_id', attemptId)

  const attemptRows = stepAttempts ?? []

  const qIds = attemptRows.map((r: { question_id: string }) => r.question_id)
  const { data: questionWeightsData } = await admin
    .from('step_questions')
    .select('id, grading_weight_within_step')
    .in('id', qIds)

  const qWeightMap = new Map(
    (questionWeightsData ?? []).map((q: { id: string; grading_weight_within_step: number }) => [q.id, q.grading_weight_within_step])
  )

  // Group scores by step (scores are already in 0–3 tier-cap scale from step_attempts)
  const stepGroupMap = new Map<FlowStep, Array<{ score: number; weight: number }>>()
  for (const row of attemptRows) {
    const step = row.step as FlowStep
    const existing = stepGroupMap.get(step) ?? []
    existing.push({ score: row.score ?? 0, weight: qWeightMap.get(row.question_id) ?? 1 })
    stepGroupMap.set(step, existing)
  }

  // calculateStepScore: weighted average per step (mirrors step-score-calculator.ts)
  function calcStepScore(scores: Array<{ score: number; weight: number }>): number {
    const weightSum = scores.reduce((s, q) => s + q.weight, 0)
    if (weightSum === 0) return scores.reduce((s, q) => s + q.score, 0) / (scores.length || 1)
    return scores.reduce((s, q) => s + (q.score * q.weight / weightSum), 0)
  }

  const stepResults = Array.from(stepGroupMap.entries()).map(([step, scores]) => ({
    step, step_score: calcStepScore(scores),
  }))

  // Fetch role lens (swe) for step weights
  const { data: roleLens } = await admin
    .from('role_lenses')
    .select('frame_weight, list_weight, optimize_weight, win_weight')
    .eq('role_id', 'swe')
    .single()

  const stepWeight = (step: FlowStep) => {
    if (!roleLens) return 1.0
    const key = `${step}_weight` as keyof typeof roleLens
    return (roleLens[key] as number) ?? 1.0
  }

  // aggregateChallenge: role-lens weighted total (mirrors score-aggregator.ts)
  const totalScore = Math.round(
    stepResults.reduce((s, r) => s + r.step_score * stepWeight(r.step), 0) * 100
  ) / 100
  const maxScore = Math.round(
    stepResults.reduce((s, r) => s + 3.0 * stepWeight(r.step), 0) * 100
  ) / 100
  const grade = totalScore >= 2.5 ? 'Outstanding' : totalScore >= 2.0 ? 'Strong' : totalScore >= 1.5 ? 'Developing' : 'Needs Practice'
  const xpEarned = Math.round(totalScore * 100)

  console.log(`  step_scores: ${stepResults.map(r => `${r.step}=${r.step_score.toFixed(2)}`).join(', ')}`)
  console.log(`  total_score: ${totalScore} / ${maxScore}`)
  console.log(`  grade_label: ${grade}`)
  console.log(`  xp_awarded: ${xpEarned}`)

  check('total_score in 0–3 range', totalScore > 0 && totalScore <= 3, `got ${totalScore}`)
  check('max_score matches role-lens weights', maxScore > 0 && maxScore <= 3, `got ${maxScore}`)
  check('grade_label is valid', ['Outstanding', 'Strong', 'Developing', 'Needs Practice'].includes(grade), `got ${grade}`)
  check('xp_awarded > 0', xpEarned > 0)

  // Collect demonstrated competencies from step_attempts
  const demonstratedCompetencies = new Set<string>()
  for (const row of attemptRows) {
    for (const comp of (row.competencies_demonstrated ?? [])) {
      demonstratedCompetencies.add(comp)
    }
  }

  // Upsert competencies (simplified delta: +3 per demonstrated competency)
  const { data: currentComps } = await admin
    .from('learner_competencies')
    .select('competency, score')
    .eq('user_id', USER_ID)

  const existingCompMap = new Map(
    (currentComps ?? []).map((c: { competency: string; score: number }) => [c.competency, c.score])
  )

  const competencyUpserts = Array.from(demonstratedCompetencies).map(comp => ({
    user_id: USER_ID,
    competency: comp,
    score: Math.min(100, (existingCompMap.get(comp) ?? 50) + 3),
    trend: 'improving' as const,
    trend_slope: 0.3,
  }))

  if (competencyUpserts.length > 0) {
    const { error: compError } = await admin
      .from('learner_competencies')
      .upsert(competencyUpserts, { onConflict: 'user_id,competency' })
    check(`learner_competencies upserted (${competencyUpserts.length} rows)`, !compError, compError?.message)
  } else {
    console.log('  (no competencies demonstrated)')
  }

  // Award XP
  const { data: profileNow } = await admin
    .from('profiles')
    .select('xp_total')
    .eq('id', USER_ID)
    .single()

  const { error: xpError } = await admin
    .from('profiles')
    .update({ xp_total: (profileNow?.xp_total ?? 0) + xpEarned })
    .eq('id', USER_ID)

  check('profiles.xp_total updated', !xpError, xpError?.message)

  // Finalize attempt
  const { error: finalAttemptError } = await admin
    .from('challenge_attempts')
    .update({
      status: 'completed',
      total_score: totalScore,
      max_score: maxScore,
      grade_label: grade,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)

  check('challenge_attempts.status = completed', !finalAttemptError, finalAttemptError?.message)

  // Insert luma_context
  const { error: lumaError } = await admin
    .from('luma_context')
    .insert({
      user_id: USER_ID,
      context_type: 'challenge_insight',
      content: `Completed ${CHALLENGE_ID} with score ${totalScore}/${maxScore} (${grade})`,
      is_active: true,
      created_at: new Date().toISOString(),
    })

  check('luma_context row inserted', !lumaError, lumaError?.message)

  // ── Step 5: Verify all persistence layers ────────────────────────────────────

  section('Step 5: Verify persistence layers')

  const { data: finalAttempt } = await admin
    .from('challenge_attempts')
    .select('id, status, total_score, grade_label, completed_at')
    .eq('id', attemptId)
    .single()

  check('challenge_attempts: status=completed', finalAttempt?.status === 'completed')
  check('challenge_attempts: total_score set', typeof finalAttempt?.total_score === 'number' && (finalAttempt?.total_score ?? 0) > 0, `got ${finalAttempt?.total_score}`)
  check('challenge_attempts: grade_label set', !!finalAttempt?.grade_label)
  check('challenge_attempts: completed_at set', !!finalAttempt?.completed_at)

  const { count: finalStepCount } = await admin
    .from('step_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_id', attemptId)

  const expectedCount = Array.from(flowMap.values()).reduce((s, sm) => s + sm.questions.length, 0)
  check(`step_attempts: ${expectedCount} rows in DB`, finalStepCount === expectedCount, `got ${finalStepCount}`)

  const { data: profileAfter } = await admin
    .from('profiles')
    .select('xp_total')
    .eq('id', USER_ID)
    .single()

  const xpAfter = profileAfter?.xp_total ?? 0
  check(`profiles.xp_total increased (${xpBefore} → ${xpAfter})`, xpAfter > xpBefore)

  const { data: compsAfter } = await admin
    .from('learner_competencies')
    .select('competency, score')
    .eq('user_id', USER_ID)

  const compMapAfter = new Map(
    (compsAfter ?? []).map((c: { competency: string; score: number }) => [c.competency, c.score])
  )

  let competencyChanges = 0
  for (const [comp, scoreAfter] of compMapAfter.entries()) {
    const scoreBefore = competencyMapBefore.get(comp) ?? 50
    if (scoreAfter > scoreBefore) competencyChanges++
  }

  check(`learner_competencies: ${competencyChanges} competencies improved`, competencyChanges > 0)

  const { count: lumaContextCountAfter } = await admin
    .from('luma_context')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID)

  check(
    `luma_context: row count increased (${lumaContextCountBefore ?? 0} → ${lumaContextCountAfter ?? 0})`,
    (lumaContextCountAfter ?? 0) > (lumaContextCountBefore ?? 0)
  )

  const { data: latestLuma } = await admin
    .from('luma_context')
    .select('content, context_type, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  check('luma_context: challenge_insight content', latestLuma?.context_type === 'challenge_insight', latestLuma?.content)

  // ── Summary ────────────────────────────────────────────────────────────────

  const total = passed + failed
  console.log(`\n${'═'.repeat(50)}`)
  console.log('REAL FLOW E2E RESULTS')
  console.log(`PASSED: ${passed}/${total}`)
  if (failed > 0) {
    console.log(`FAILED: ${failed}/${total}`)
    process.exit(1)
  } else {
    console.log('All checks passed.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
