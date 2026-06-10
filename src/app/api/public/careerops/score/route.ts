// Public anonymous scoring endpoint for the /job-fit tool. One free full run
// per visitor (claim + used cookies, IP backstop, burst limit, global daily
// cap), Turnstile-verified. Signed-in users are pointed at the plan-limited
// /api/career-ops/score route instead.

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp, retryAfterSeconds } from '@/lib/auth/rate-limit'
import { isHoneypotFilled, verifyTurnstileToken, turnstileErrorMessage } from '@/lib/security/turnstile'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'
import { NotAJobDescriptionError, scoreJob } from '@/lib/careerops/scorer'
import { NotAResumeError, roastResume } from '@/lib/careerops/public/roast'
import { ANON_GROUNDING, anonProfile } from '@/lib/careerops/public/anon-grounding'
import { createShareId } from '@/lib/careerops/public/share'
import { FIT_CLAIM_COOKIE, hashClaimToken } from '@/lib/careerops/public/claim'
import { FIT_USED_COOKIE, PUBLIC_FIT_LIMITS, decidePublicRun, hashIp } from '@/lib/careerops/public/limits'
import type { SharedFitReport } from '@/lib/careerops/public/types'
import { EVENT_FIT_RUN_COMPLETED } from '@/lib/posthog/events'
import { captureServerImmediate } from '@/lib/posthog/server'

const ROUTE_KEY = 'public_careerops_score'

const RequestSchema = z
  .object({
    mode: z.enum(['job_fit', 'resume_roast']),
    jd_text: z.string().trim().max(20000).optional(),
    resume_text: z.string().trim().max(20000).optional(),
    company: z.string().trim().max(160).optional(),
    role_title: z.string().trim().max(200).optional(),
    turnstileToken: z.string().max(2048).optional(),
    website: z.string().max(200).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.mode === 'job_fit' && (body.jd_text?.length ?? 0) < 40) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['jd_text'], message: 'Paste the job description (at least 40 characters).' })
    }
    if (body.mode === 'resume_roast' && (body.resume_text?.length ?? 0) < 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['resume_text'], message: 'Paste the resume text (at least 100 characters).' })
    }
  })

export async function POST(req: NextRequest) {
  const gate = assertCareerOpsFeature('public_score')
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

  if (isHoneypotFilled(body.website)) {
    return apiError(400, 'invalid_request', 'Invalid request')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return apiError(403, 'signed_in', 'Use the CareerOps scorer in the app.')
  }

  const ip = getClientIp(req)
  const turnstile = await verifyTurnstileToken({ token: body.turnstileToken, remoteIp: ip })
  if (!turnstile.ok) {
    return apiError(400, 'turnstile_failed', turnstileErrorMessage(turnstile))
  }

  const ipKey = hashIp(ip)
  const [burstResult, ipResult, globalResult] = await Promise.all([
    rateLimit({ key: `public-fit:burst:${ipKey}`, ...PUBLIC_FIT_LIMITS.burst }),
    rateLimit({ key: `public-fit:ip:${ipKey}`, ...PUBLIC_FIT_LIMITS.ip }),
    rateLimit({ key: 'public-fit:global', ...PUBLIC_FIT_LIMITS.global }),
  ])

  const decision = decidePublicRun({
    hasUsedCookie: req.cookies.get(FIT_USED_COOKIE)?.value === '1',
    burstResult,
    ipResult,
    globalResult,
  })

  if (!decision.allowed) {
    if (decision.reason === 'free_run_used') {
      return apiError(403, 'free_run_used', 'The free run is used. Sign up to keep scoring.')
    }
    if (decision.reason === 'capacity') {
      return apiError(429, 'capacity', 'The tool is at capacity for today. Try again tomorrow or sign up.')
    }
    return apiError(429, 'rate_limited', 'Too many attempts. Wait a moment and try again.', {
      retryAfter: retryAfterSeconds(burstResult.resetAt),
    })
  }

  // A job_fit run with no background gets a demands analysis, not a personal
  // score: a confident number with nothing behind it would be a lie.
  const hasBackground = Boolean(body.resume_text?.trim())

  const admin = createAdminClient()
  const shareId = createShareId()
  const claimToken = crypto.randomUUID()

  let report: SharedFitReport
  try {
    if (body.mode === 'job_fit') {
      const evaluation = await scoreJob({
        profile: anonProfile(body.resume_text),
        grounding: ANON_GROUNDING,
        jdText: body.jd_text ?? '',
        company: body.company ?? null,
        roleTitle: body.role_title ?? null,
        routingEnabled: false,
        route: ROUTE_KEY,
      })
      report = {
        shareId,
        mode: 'job_fit',
        company: body.company ?? null,
        roleTitle: body.role_title ?? null,
        score: hasBackground ? evaluation.score : null,
        grade: hasBackground ? evaluation.grade : null,
        breakdown: hasBackground ? evaluation.breakdown : [],
        gaps: evaluation.gaps,
        readinessMap: evaluation.readiness_map,
        reportMd: evaluation.report_md,
        roast: null,
        includeScore: hasBackground,
        isClaimed: false,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      }
    } else {
      const roast = await roastResume({
        resumeText: body.resume_text ?? '',
        jdText: body.jd_text ?? null,
        route: ROUTE_KEY,
      })
      report = {
        shareId,
        mode: 'resume_roast',
        company: body.company ?? null,
        roleTitle: body.role_title ?? null,
        score: roast.score,
        grade: roast.grade,
        breakdown: roast.breakdown,
        gaps: [],
        readinessMap: [],
        reportMd: roast.report_md,
        roast: { verdict_line: roast.verdict_line, sections: roast.sections, strengths: roast.strengths },
        includeScore: true,
        isClaimed: false,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    if (error instanceof NotAJobDescriptionError) {
      return apiError(422, 'not_a_job', 'That text does not read like a job description. Paste the posting itself.')
    }
    if (error instanceof NotAResumeError) {
      return apiError(422, 'not_a_resume', 'That text does not read like a resume. Paste the resume itself.')
    }
    console.error('[public/careerops/score] run failed:', error)
    return apiError(502, 'score_failed', 'Scoring failed, please try again')
  }

  const { error: insertError } = await admin.from('public_fit_reports').insert({
    share_id: shareId,
    claim_token_hash: hashClaimToken(claimToken),
    mode: report.mode,
    company: report.company,
    role_title: report.roleTitle,
    jd_text: body.jd_text ?? null,
    resume_text: body.resume_text ?? null,
    score: report.score,
    grade: report.grade,
    breakdown: report.breakdown,
    gaps: report.gaps,
    readiness_map: report.readinessMap,
    report_md: report.reportMd,
    roast: report.roast,
    include_score: report.includeScore,
    ip_hash: ipKey,
  })
  if (insertError) {
    console.error('[public/careerops/score] insert failed:', insertError.message)
    return apiError(502, 'score_failed', 'Scoring failed, please try again')
  }

  await captureServerImmediate({
    distinctId: shareId,
    event: EVENT_FIT_RUN_COMPLETED,
    properties: { mode: report.mode, score: report.score, grade: report.grade, anonymous: true },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.com'
  const response = NextResponse.json({ report, share_url: `${appUrl}/job-fit/r/${shareId}` })
  const yearSec = 365 * 24 * 3600
  response.cookies.set(FIT_USED_COOKIE, '1', { httpOnly: true, sameSite: 'lax', maxAge: yearSec, path: '/' })
  response.cookies.set(FIT_CLAIM_COOKIE, claimToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600, path: '/' })
  return response
}
