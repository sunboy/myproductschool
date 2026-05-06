import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { createClient } from '@/lib/supabase/server'
import { sceneToPrompt } from '@/lib/hatch/canvas-scene'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'

const NUDGE_GATE_MS = 30_000
const MAX_ELEMENT_COUNT_FOR_NUDGE = 40 // skip if canvas is large; user is mid-deep-work
const ROUTE_KEY = 'hatch_canvas_nudge'

const NUDGE_SYSTEM_PROMPT = `You are Hatch, a system design / data modeling interview coach.
The user just added something to their canvas. You may interject with ONE short observation if it's worth saying.

When to nudge (respond with a single sentence):
- Multiple entities present but ZERO connections between them (e.g. {Web, API, DB} with no arrows — the user almost certainly forgot to wire them up)
- Missing critical component (auth, rate limit, monitoring, junction table, primary key)
- Suspicious topology (cache on write path, no replication on the DB the system depends on, polymorphic relation without discriminator)
- An element placed without a clear role
- A connection that introduces a cycle or consistency risk

When to STAY SILENT (respond with null):
- The user just renamed something, dragged something, or made a trivial edit
- The canvas has only 1 entity (too early to comment)
- You said something similar recently
- Generic praise or vague concerns are NOT nudges — only fire if you can name the specific element or gap

Output schema (return ONLY this JSON, no markdown):
{
  "nudge": "Single sentence under 25 words, references an element by label." | null
}

Voice: direct, slightly opinionated, no em dashes, no AI slop ("delve", "leverage", "robust", "seamlessly"), never write "you are a [role]".`

const SceneColumnSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().max(200).optional(),
  constraints: z.array(z.enum(['PK', 'FK', 'UNIQUE', 'NOT NULL', 'INDEX'])).max(10),
  foreignKey: z.object({
    table: z.string().min(1).max(200),
    column: z.string().min(1).max(200),
  }).optional(),
  raw: z.string().max(1000),
})

const CanvasSceneSchema = z.object({
  elementCount: z.number().int().min(0).max(5000),
  entities: z.array(z.object({
    id: z.string().min(1).max(200),
    label: z.string().min(1).max(500),
    type: z.string().min(1).max(100),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite(),
    height: z.number().finite(),
    columns: z.array(SceneColumnSchema).max(200),
  })).max(1000),
  connections: z.array(z.object({
    from: z.string().min(1).max(500),
    to: z.string().min(1).max(500),
    label: z.string().max(500).optional(),
  })).max(2000),
  groups: z.array(z.object({
    label: z.string().min(1).max(500),
    members: z.array(z.string().min(1).max(500)).max(1000),
  })).max(1000),
  freeText: z.array(z.string().max(5000)).max(1000),
  foreignKeys: z.array(z.object({
    from: z.string().min(1).max(200),
    fromColumn: z.string().min(1).max(200),
    toTable: z.string().min(1).max(200),
    toColumn: z.string().min(1).max(200),
  })).max(1000),
})

const RequestSchema = z.object({
  scene: CanvasSceneSchema,
  recentDelta: z.object({
    added: z.number().int().min(0).max(1000),
  }).optional(),
  challengeId: z.string().max(200).optional(),
  challengeType: z.string().max(100).optional(),
  attemptId: z.string().uuid(),
  lastNudgeAt: z.number().finite().nonnegative().optional(),
  nudgeCount: z.number().int().min(0).max(1000).optional(),
})

const MAX_NUDGES_PER_ATTEMPT = 5

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }
  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  // Gate 1: rate limit (30s since last nudge)
  if (body.lastNudgeAt && Date.now() - body.lastNudgeAt < NUDGE_GATE_MS) {
    return NextResponse.json({ nudge: null, reason: 'rate_limited' })
  }

  // Gate 2: per-attempt cap
  if ((body.nudgeCount ?? 0) >= MAX_NUDGES_PER_ATTEMPT) {
    return NextResponse.json({ nudge: null, reason: 'cap_reached' })
  }

  // Gate 3: trivial change (no elements added since last nudge)
  if (!body.recentDelta || body.recentDelta.added < 1) {
    return NextResponse.json({ nudge: null, reason: 'no_meaningful_change' })
  }

  // Gate 4: scene too large to nudge meaningfully (user is deep in work)
  if (body.scene.elementCount > MAX_ELEMENT_COUNT_FOR_NUDGE) {
    return NextResponse.json({ nudge: null, reason: 'canvas_too_large' })
  }

  // Gate 5: empty / near-empty canvas (nothing useful to say yet)
  if (body.scene.elementCount < 2) {
    return NextResponse.json({ nudge: null, reason: 'canvas_too_small' })
  }

  const userContent = [
    `Challenge type: ${body.challengeType ?? 'system_design'}`,
    `# Canvas state\n${sceneToPrompt(body.scene)}`,
    `# Recent change\nUser just added ${body.recentDelta.added} element(s).`,
    `Decide: nudge or stay silent. Respond with the JSON schema.`,
  ].join('\n\n')

  try {
    await assertPlanLimit(user.id, userPlan, 'hatch_nudges')

    const response = await guardedCachedMessage(NUDGE_SYSTEM_PROMPT, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      budget: { userId: user.id, userPlan, route: ROUTE_KEY },
    })
    if (!response.sanitized) {
      return NextResponse.json({ nudge: null })
    }
    const cleaned = response.sanitized
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
    const parsed = JSON.parse(cleaned) as { nudge?: string | null }
    const nudge =
      typeof parsed.nudge === 'string' && parsed.nudge.trim().length > 0
        ? parsed.nudge.trim()
        : null
    return NextResponse.json({ nudge })
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: error.feature,
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    if (error instanceof AiBudgetExceededError) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'hatch_ai_cents',
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    console.error('Nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
