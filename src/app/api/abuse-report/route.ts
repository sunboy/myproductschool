import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { apiError } from '@/lib/api/error'
import { sendAbuseReportEmail } from '@/lib/email/transactional'
import { rateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const TARGET_TYPES = ['hatch_response', 'share_scorecard', 'discussion_comment'] as const
const REPORT_CATEGORIES = ['harmful', 'harassment', 'spam', 'broken_incorrect', 'other'] as const

const MetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

const RequestSchema = z.object({
  targetType: z.enum(TARGET_TYPES),
  targetId: z.string().trim().min(1).max(256).optional(),
  targetUrl: z.string().trim().min(1).max(2048).optional(),
  category: z.enum(REPORT_CATEGORIES),
  message: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), MetadataValueSchema).optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function normalizeUrl(value: string | undefined, request: NextRequest) {
  if (!value) return null
  try {
    const url = new URL(value, request.nextUrl.origin)
    const allowedOrigins = new Set([request.nextUrl.origin])
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin)
      } catch {
        // Ignore invalid optional app URL configuration.
      }
    }
    if (!allowedOrigins.has(url.origin)) return null
    return url.toString()
  } catch {
    return null
  }
}

async function mirrorDiscussionReport(
  admin: ReturnType<typeof createAdminClient>,
  input: z.infer<typeof RequestSchema>,
  reporterId: string
) {
  if (input.targetType !== 'discussion_comment' || !input.targetId) return

  const { data: discussion, error: discussionError } = await admin
    .from('challenge_discussions')
    .select('id, hidden_at')
    .eq('id', input.targetId)
    .maybeSingle()

  if (discussionError) {
    throw new Error('discussion lookup failed')
  }
  if (!discussion || discussion.hidden_at) {
    throw new Error('discussion not found')
  }

  const reason = [
    input.category.replace('_', '/'),
    input.message?.trim(),
  ].filter(Boolean).join(': ')

  const { error } = await admin
    .from('discussion_reports')
    .insert({
      discussion_id: input.targetId,
      reporter_id: reporterId,
      reason,
    })

  if (error) throw new Error('discussion report mirror failed')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Sign in to report this.')

  const throttle = await rateLimit({
    key: `abuse-report:${user.id}`,
    limit: 10,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = Math.max(1, Math.ceil((throttle.resetAt.getTime() - Date.now()) / 1000))
    const response = apiError(429, 'rate_limited', 'Slow down. Try again soon.', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const admin = createAdminClient()
  const targetUrl = normalizeUrl(body.targetUrl, request)

  try {
    await mirrorDiscussionReport(admin, body, user.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'report mirror failed'
    if (message === 'discussion not found') {
      return apiError(404, 'target_not_found', 'Reported content was not found.')
    }
    return apiError(500, 'discussion_report_failed', 'Could not save report.')
  }

  const { data, error } = await admin
    .from('abuse_reports')
    .insert({
      reporter_id: user.id,
      target_type: body.targetType,
      target_id: body.targetId ?? null,
      target_url: targetUrl,
      category: body.category,
      message: body.message?.trim() || null,
      metadata: body.metadata ?? {},
    })
    .select('id, status, created_at')
    .single()

  if (error) return apiError(500, 'abuse_report_failed', 'Could not save report.')

  await sendAbuseReportEmail(admin, {
    dedupeKey: `abuse-report:${data.id}`,
    userId: user.id,
    reportId: data.id,
    targetType: body.targetType,
    category: body.category,
    targetUrl,
    message: body.message ?? null,
  })

  return NextResponse.json(data, { status: 201 })
}
