import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import {
  CalibrationSubmitSchema,
  buildCalibrationPersistencePayload,
  computePersonalisedPlanSlug,
  type CalibrationMove,
  type CalibrationScores,
} from '@/lib/onboarding/calibration-submit'
import { scoreMove, deriveArchetype, observationFor } from '@/lib/calibration/deriveArchetype'
import { embedAndStoreContext } from '@/lib/notes/embeddings'
import { z, ZodError } from 'zod'

const RequestSchema = CalibrationSubmitSchema

async function computeRealPercentile(adminClient: ReturnType<typeof createAdminClient>, userAvg: number): Promise<number> {
  const { data: attempts } = await adminClient
    .from('calibration_attempts')
    .select('scores_json')
    .eq('status', 'complete')

  if (!attempts || attempts.length === 0) return 50

  const avgs = attempts.map(a => {
    const s = a.scores_json as Record<string, number>
    return ((s.frame ?? 0) + (s.list ?? 0) + (s.optimize ?? 0) + (s.win ?? 0)) / 4
  })

  const belowOrEqual = avgs.filter(avg => avg <= userAvg).length
  const percentile = Math.round((belowOrEqual / avgs.length) * 100)
  return Math.max(1, Math.min(99, percentile))
}

function scoreToLevel(score: number): number {
  if (score >= 75) return 3
  if (score >= 50) return 2
  return 1
}

function weakestMove(scores: CalibrationScores): CalibrationMove {
  return (Object.entries(scores).sort(([, a], [, b]) => a - b)[0][0]) as CalibrationMove
}

function firstSupabaseError(results: unknown[]) {
  for (const result of results) {
    if (!result || typeof result !== 'object' || !('error' in result)) continue
    const error = (result as { error?: { message: string } | null }).error
    if (error) return error
  }

  return null
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

// answers: { frame: 'A', list: 'C', optimize: 'B', win: 'A' }
export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({
      attempt_id: 'mock-calibration-1',
      scores: { frame: 72, list: 65, optimize: 58, win: 81 },
      percentile: 78,
      archetype: 'The Strategist',
      archetype_description: 'You frame problems sharply and land recommendations with conviction.',
      weakness_move: 'optimize',
      onboarding_completed_at: new Date().toISOString(),
      starting_levels: { frame: 3, list: 2, optimize: 2, win: 3 },
      hatch_observation: "You think in narratives and outcomes first. That's rare.",
      personalised_plan_slug: 'staff-engineer-path' as string | null,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'answers object with frame/list/optimize/win is required',
          issues: validationIssues(error),
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { answers, role, primary_goal, prep_timeline, target_company, interview_date } = body

  const scores: CalibrationScores = {
    frame:    scoreMove('frame',    answers.frame    ?? ''),
    list:     scoreMove('list',     answers.list     ?? ''),
    optimize: scoreMove('optimize', answers.optimize ?? ''),
    win:      scoreMove('win',      answers.win      ?? ''),
  }

  const avg = (scores.frame + scores.list + scores.optimize + scores.win) / 4
  const archetypeResult = deriveArchetype(scores)
  const observation = observationFor(archetypeResult.name)
  const weak = weakestMove(scores)
  const now = new Date().toISOString()

  const adminClient = createAdminClient()

  // Insert attempt first so it's counted in percentile
  const [attemptRes, percentile] = await Promise.all([
    adminClient
      .from('calibration_attempts')
      .insert({
        user_id: user.id,
        responses_json: answers,
        status: 'complete',
        scores_json: scores,
        percentile: 50, // placeholder, updated below
      })
      .select('id')
      .single(),
    computeRealPercentile(adminClient, avg),
  ])

  if (attemptRes.error) {
    return NextResponse.json({ error: attemptRes.error.message }, { status: 500 })
  }

  const persistencePayload = buildCalibrationPersistencePayload({
    userId: user.id,
    role,
    answers,
    archetype: archetypeResult.name,
    archetypeDescription: archetypeResult.description,
    weaknessMove: weak,
    scores,
    now,
  })

  // Update percentile + remaining writes in parallel
  const [
    percentileUpdateResult,
    profileUpdateResult,
    onboardingResponseResult,
    onboardingStateDeleteResult,
    moveLevelsResult,
    learnerCompetenciesResult,
    hatchContextResult,
  ] = await Promise.all([
    // Update the attempt with real percentile
    attemptRes.data?.id
      ? adminClient.from('calibration_attempts').update({ percentile }).eq('id', attemptRes.data.id)
      : Promise.resolve(),

    adminClient
      .from('profiles')
      .update(persistencePayload.profileUpdate)
      .eq('id', user.id),

    adminClient
      .from('onboarding_responses')
      .upsert(persistencePayload.onboardingResponseUpsert, { onConflict: 'user_id' }),

    adminClient
      .from('onboarding_state')
      .delete()
      .eq('user_id', user.id),

    adminClient
      .from('move_levels')
      .upsert(
        (['frame', 'list', 'optimize', 'win'] as const).map(m => ({
          user_id: user.id,
          move: m,
          level: scoreToLevel(scores[m]),
          progress_pct: 0,
          xp: 0,
        })),
        { onConflict: 'user_id,move' }
      ),

    adminClient
      .from('learner_competencies')
      .upsert(
        ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise'].map(comp => ({
          user_id: user.id,
          competency: comp,
          score: 50,
          total_attempts: 0,
          trend: 'steady',
          trend_slope: 0,
          last_updated: now,
        })),
        { onConflict: 'user_id,competency' }
      ),

    observation
      ? adminClient.from('hatch_context').insert({
          user_id: user.id,
          context_type: 'calibration',
          content: observation,
          is_active: true,
          created_at: now,
        })
      : Promise.resolve(),
  ])

  const writeError = firstSupabaseError([
    percentileUpdateResult,
    profileUpdateResult,
    onboardingResponseResult,
    onboardingStateDeleteResult,
    moveLevelsResult,
    learnerCompetenciesResult,
    hatchContextResult,
  ])
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })

  // Compute personalised plan slug from role + goal + timeline, then verify it
  // points at a published plan so the results CTA can never land on a 404.
  let personalisedPlanSlug = computePersonalisedPlanSlug({
    role: role ?? null,
    primaryGoal: primary_goal ?? null,
    prepTimeline: prep_timeline ?? null,
  })
  if (personalisedPlanSlug) {
    const { data: planRow } = await adminClient
      .from('study_plans')
      .select('slug')
      .eq('slug', personalisedPlanSlug)
      .eq('is_published', true)
      .maybeSingle()
    if (!planRow) personalisedPlanSlug = null
  }

  // Durable write of preferred_move (and any new personalization fields) into
  // profiles.interview_meta. Failure here doesn't fail the calibration response
  // (the user already passed onboarding), but we log it.
  try {
    const { data: profileRow } = await adminClient
      .from('profiles')
      .select('interview_meta')
      .eq('id', user.id)
      .single()
    const current = (profileRow?.interview_meta as Record<string, unknown>) ?? {}
    const metaUpdate: Record<string, unknown> = { ...current, preferred_move: weak }
    if (target_company) metaUpdate.target_company = target_company

    const { error: metaErr } = await adminClient
      .from('profiles')
      .update({ interview_meta: metaUpdate })
      .eq('id', user.id)
    if (metaErr) console.error('[calibration] interview_meta write failed:', metaErr.message)
  } catch (e) {
    console.error('[calibration] interview_meta write threw:', e)
  }

  // Embed interview_date and target_company into Hatch context (non-critical).
  // Fire-and-forget: the embeddings provider can be slow, and awaiting it here
  // would block the calibration response and hang the "Calibrating..." screen.
  // The embedding completing slightly after the response is fine.
  if (interview_date) {
    const daysUntil = Math.max(
      0,
      Math.ceil((new Date(interview_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
    const companyPart = target_company ? ` at ${target_company}` : ''
    const content = daysUntil > 0
      ? `You're preparing for an interview${companyPart} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`
      : `Your interview${companyPart} is today. Good luck.`
    void embedAndStoreContext(
      user.id,
      'interview_date',
      content,
      'profile',
      { interview_date, days_until: daysUntil, company: target_company }
    ).catch(() => {})
  } else if (target_company) {
    // No interview date but company was provided - store company context alone
    void embedAndStoreContext(
      user.id,
      'target_company',
      `You are targeting ${target_company}.`,
      'profile',
      { company: target_company }
    ).catch(() => {})
  }

  return NextResponse.json({
    attempt_id: attemptRes.data?.id ?? 'scored',
    scores,
    percentile,
    archetype: archetypeResult.name,
    archetype_description: archetypeResult.description,
    weakness_move: weak,
    onboarding_completed_at: persistencePayload.onboardingCompletedAt,
    starting_levels: {
      frame: scoreToLevel(scores.frame),
      list: scoreToLevel(scores.list),
      optimize: scoreToLevel(scores.optimize),
      win: scoreToLevel(scores.win),
    },
    hatch_observation: observation,
    personalised_plan_slug: personalisedPlanSlug,
  })
}
