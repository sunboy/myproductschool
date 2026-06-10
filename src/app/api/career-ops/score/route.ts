import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { rateLimit } from '@/lib/security/rate-limit'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { buildCareerGrounding } from '@/lib/careerops/grounding'
import { NotAJobDescriptionError, scoreJob } from '@/lib/careerops/scorer'
import type { CareerProfile } from '@/lib/careerops/types'

const ROUTE_KEY = 'careerops_score'
const SCORE_XP = 10

const RequestSchema = z.object({
  jd_text: z.string().trim().min(40).max(20000),
  application_id: z.string().uuid().optional(),
  company: z.string().trim().max(160).optional(),
  role_title: z.string().trim().max(200).optional(),
})

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

const EMPTY_PROFILE = (userId: string): CareerProfile => ({
  user_id: userId,
  target_role: null,
  seniority: null,
  locations: [],
  key_skills: [],
  resume_text: null,
  resume_json: null,
  comp_expectation: null,
  notes: null,
})

export async function POST(req: NextRequest) {
  const gate = assertCareerOpsFeature('scorer')
  if (gate) return gate

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })
  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const res = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    res.headers.set('Retry-After', String(retryAfter))
    return res
  }

  const admin = createAdminClient()
  const { data: profileRow } = await admin
    .from('career_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile: CareerProfile = profileRow ?? EMPTY_PROFILE(user.id)

  let evaluation
  try {
    await assertPlanLimit(user.id, userPlan, 'careerops_fit_scores')
    const grounding = await buildCareerGrounding(user.id, admin)
    evaluation = await scoreJob({
      userId: user.id,
      userPlan,
      profile,
      grounding,
      jdText: body.jd_text,
      company: body.company ?? null,
      roleTitle: body.role_title ?? null,
      routingEnabled: isCareerOpsFeatureEnabled('routing'),
      route: ROUTE_KEY,
    })
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: error.feature, used: error.used, limit: error.limit, windowDays: error.windowDays,
      })
    }
    if (error instanceof AiBudgetExceededError) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'hatch_ai_cents', used: error.used, limit: error.limit, windowDays: error.windowDays,
      })
    }
    if (error instanceof NotAJobDescriptionError) {
      return apiError(422, 'not_a_job', 'That text does not read like a job description. Paste the posting itself.')
    }
    console.error('[careerops/score] scoring failed:', error)
    return apiError(502, 'score_failed', 'Scoring failed, please try again')
  }

  // Persist the evaluation history row.
  await admin.from('career_fit_evaluations').insert({
    user_id: user.id,
    application_id: body.application_id ?? null,
    company: body.company ?? null,
    role_title: body.role_title ?? null,
    score: evaluation.score,
    grade: evaluation.grade,
    breakdown: evaluation.breakdown,
    report_md: evaluation.report_md,
    gaps: evaluation.gaps,
    readiness_map: evaluation.readiness_map,
  })

  // Update the linked application's fit fields when given.
  if (body.application_id) {
    await admin
      .from('job_applications')
      .update({
        fit_score: evaluation.score,
        fit_grade: evaluation.grade,
        fit_breakdown: evaluation.breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.application_id)
      .eq('user_id', user.id)
  }

  // Light XP, mirroring quick-take.
  const { data: prof } = await admin.from('profiles').select('xp_total').eq('id', user.id).single()
  if (prof) {
    await admin.from('profiles').update({ xp_total: (prof.xp_total ?? 0) + SCORE_XP }).eq('id', user.id)
  }
  await admin.from('session_events').insert({
    user_id: user.id,
    event_type: 'careerops_score',
    payload: { score: evaluation.score, grade: evaluation.grade, application_id: body.application_id ?? null },
  })
  await admin.rpc('update_user_streak', { p_user_id: user.id }).then(undefined, () => {})

  return NextResponse.json({ evaluation, xp_earned: SCORE_XP })
}
