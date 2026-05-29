import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { apiError } from '@/lib/api/error'
import { sendProductFeedbackEmail } from '@/lib/email/transactional'
import { shouldShowNpsPrompt } from '@/lib/feedback/nps'
import { rateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const FEEDBACK_KINDS = ['feedback', 'nps'] as const
const PROMPT_EVENTS = ['shown', 'dismissed'] as const

const MetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

const FeedbackSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS).default('feedback'),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(2000).optional(),
  path: z.string().trim().max(2048).optional(),
  metadata: z.record(z.string(), MetadataValueSchema).optional(),
})

const PromptEventSchema = z.object({
  promptType: z.literal('nps'),
  event: z.enum(PROMPT_EVENTS),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

function normalizePath(value: string | undefined, request: NextRequest) {
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
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

async function throttle(userId: string, action: string, limit: number) {
  const result = await rateLimit({
    key: `feedback:${action}:${userId}`,
    limit,
    windowSec: 60,
  })

  if (result.allowed) return null

  const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
  const response = apiError(429, 'rate_limited', 'Slow down. Try again soon.', { retryAfter })
  response.headers.set('Retry-After', String(retryAfter))
  return response
}

export async function GET() {
  const user = await currentUser()
  if (!user) return apiError(401, 'auth_required', 'Sign in to send feedback.')

  const admin = createAdminClient()
  const [attemptsResult, promptResult] = await Promise.all([
    admin
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
    admin
      .from('feedback_prompt_events')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('prompt_type', 'nps')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (attemptsResult.error || promptResult.error) {
    return apiError(500, 'feedback_status_failed', 'Could not load feedback status.')
  }

  const completedCount = attemptsResult.count ?? 0
  const lastPromptAt = promptResult.data?.created_at ?? null

  return NextResponse.json({
    completedCount,
    lastPromptAt,
    shouldPromptNps: shouldShowNpsPrompt({ completedCount, lastPromptAt }),
  })
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser()
  if (!user) return apiError(401, 'auth_required', 'Sign in to send feedback.')

  const limited = await throttle(user.id, 'prompt-event', 20)
  if (limited) return limited

  let body: z.infer<typeof PromptEventSchema>
  try {
    body = PromptEventSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const { error } = await createAdminClient()
    .from('feedback_prompt_events')
    .insert({
      user_id: user.id,
      prompt_type: body.promptType,
      event: body.event,
    })

  if (error) return apiError(500, 'feedback_prompt_event_failed', 'Could not save feedback prompt state.')

  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const user = await currentUser()
  if (!user) return apiError(401, 'auth_required', 'Sign in to send feedback.')

  const limited = await throttle(user.id, 'submit', 5)
  if (limited) return limited

  let body: z.infer<typeof FeedbackSchema>
  try {
    body = FeedbackSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const admin = createAdminClient()
  const path = normalizePath(body.path, request)
  const { data, error } = await admin
    .from('feedback_submissions')
    .insert({
      user_id: user.id,
      kind: body.kind,
      rating: body.rating,
      message: body.message?.trim() || null,
      path,
      metadata: body.metadata ?? {},
    })
    .select('id, created_at')
    .single()

  if (error) return apiError(500, 'feedback_submit_failed', 'Could not save feedback.')

  if (body.kind === 'nps') {
    await admin.from('feedback_prompt_events').insert({
      user_id: user.id,
      prompt_type: 'nps',
      event: 'submitted',
    })
  }

  await sendProductFeedbackEmail(admin, {
    dedupeKey: `product-feedback:${data.id}`,
    userId: user.id,
    feedbackId: data.id,
    kind: body.kind,
    rating: body.rating,
    message: body.message ?? null,
    path,
  })

  return NextResponse.json(data, { status: 201 })
}
