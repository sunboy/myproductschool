import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { rateLimit } from '@/lib/security/rate-limit'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'

const ROUTE_KEY = 'careerops_resume_tailor'

const RequestSchema = z.object({
  application_id: z.string().uuid().optional(),
  jd_text: z.string().trim().max(20000).optional(),
  label: z.string().trim().max(120).optional(),
})

const SYSTEM_PROMPT = `You are Hatch, a résumé coach for engineers. Tailor a candidate's résumé bullets to a specific job description: sharpen the bullets that matter for this role, surface the keywords an ATS will scan for, and flag gaps.

Voice: direct, confident. Coherent full sentences. Never use em dashes. Never use AI slop (delve, leverage, utilize, holistic, robust, seamlessly, in order to, as well as, navigate, unlock, tailored). Never invent experience the candidate does not have. If the résumé is thin, say what is missing rather than fabricating.

Return VALID JSON ONLY:
{
  "tailored_md": "<the tailored résumé bullets in markdown>",
  "keywords": ["<ats keyword>", "..."],
  "ats_notes": { "missing": ["<keyword the JD wants that the résumé lacks>"], "strong": ["<area that already matches well>"] }
}`

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function parseJson(raw: string): Record<string, unknown> {
  return JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim())
}

export async function POST(req: NextRequest) {
  const gate = assertCareerOpsFeature('resume')
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

  const admin = createAdminClient()

  // Resolve the JD: explicit jd_text, or the linked application's jd_text.
  let jdText = body.jd_text ?? ''
  if (!jdText && body.application_id) {
    const { data: app } = await admin
      .from('job_applications')
      .select('jd_text')
      .eq('id', body.application_id)
      .eq('user_id', user.id)
      .maybeSingle()
    jdText = app?.jd_text ?? ''
  }
  if (jdText.trim().length < 40) {
    return apiError(400, 'jd_required', 'A job description is required to tailor a résumé')
  }

  const { data: profile } = await admin
    .from('career_profiles')
    .select('resume_text, target_role, key_skills')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.resume_text) {
    return apiError(400, 'resume_required', 'Add your résumé to your career profile first')
  }

  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({ key: `ai:${user.id}:${ROUTE_KEY}`, limit: userPlan === 'pro' ? 10 : 3, windowSec: 60 })
  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const res = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    res.headers.set('Retry-After', String(retryAfter))
    return res
  }

  let tailored: { tailored_md: string; keywords: string[]; ats_notes: unknown }
  try {
    await assertPlanLimit(user.id, userPlan, 'careerops_resume_tailors')
    const userContent = [
      `Target role: ${profile.target_role ?? 'unspecified'}`,
      `Current résumé:\n${profile.resume_text.slice(0, 8000)}`,
      ``,
      `Job description:\n${jdText.slice(0, 8000)}`,
    ].join('\n')

    const msg = await guardedCachedMessage(SYSTEM_PROMPT, userContent, {
      model: 'claude-sonnet-4-6',
      max_tokens: 1600,
      budget: { userId: user.id, userPlan, route: ROUTE_KEY },
    })
    const parsed = parseJson(msg.sanitized)
    tailored = {
      tailored_md: typeof parsed.tailored_md === 'string' ? parsed.tailored_md : '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
      ats_notes: parsed.ats_notes ?? null,
    }
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
    console.error('[careerops/resume] tailoring failed:', error)
    return apiError(502, 'tailor_failed', 'Résumé tailoring failed, please try again')
  }

  const { data, error } = await admin
    .from('resume_versions')
    .insert({
      user_id: user.id,
      application_id: body.application_id ?? null,
      label: body.label ?? null,
      tailored_md: tailored.tailored_md,
      keywords: tailored.keywords,
      ats_notes: tailored.ats_notes,
    })
    .select('*')
    .single()

  if (error) return apiError(500, 'resume_save_failed', 'Failed to save tailored résumé')
  return NextResponse.json({ resume: data })
}
