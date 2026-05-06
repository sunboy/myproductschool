import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { applyCoverageCredit, type FlowMove } from '@/lib/live-interview/flow-coverage-credits'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { z, ZodError } from 'zod'

const VALID_FLOW_MOVES = new Set(['frame', 'list', 'optimize', 'win'])
const ROUTE_KEY = 'live_interview_analyze'

const ArtifactSnapshotSchema = z.object({
  type: z.enum(['canvas', 'editor']),
  discipline: z.string().max(100).optional(),
  capturedAt: z.number().finite().nonnegative().optional(),
  elementCount: z.number().int().min(0).max(10000).optional(),
  elementTypes: z.record(z.string(), z.number().int().min(0)).optional(),
  textLabels: z.array(z.string().max(1000)).max(1000).optional(),
  code: z.string().max(200000).optional(),
  language: z.string().max(80).optional(),
  cursorLine: z.number().int().min(0).optional(),
  pasteEvents: z.array(z.object({
    length: z.number().int().min(0),
    percentOfBuffer: z.number().finite().min(0).max(1),
    timestamp: z.number().finite().nonnegative(),
  })).max(100).optional(),
  runResult: z.unknown().optional(),
})

const RequestSchema = z.object({
  content: z.string().max(20000).optional().default(''),
  role: z.string().max(40).optional().default(''),
  artifactSnapshot: ArtifactSnapshotSchema.optional(),
  turnIndex: z.number().int().min(0).optional(),
})

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Hatch ran into a problem. Try again.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { content, role, artifactSnapshot, turnIndex } = body

  if (!content || role !== 'user') {
    // Only analyze user turns for FLOW move detection
    return Response.json({ ok: true, flowMove: null, artifactSignal: null })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('user_id, flow_coverage, flow_coverage_credits, total_turns, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session || session.status !== 'active') {
    return Response.json({ ok: false }, { status: 404 })
  }

  const model = 'claude-haiku-4-5-20251001'
  const sessionUserId = user.id
  const userPlan = await getUserPlanForBudget(sessionUserId)
  const throttle = await rateLimit({
    key: `ai:${sessionUserId}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    return Response.json(
      { error: 'rate_limited', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  const flowMaxTokens = 50
  const flowSystemPrompt = `Classify the following interview response into exactly one FLOW move. Reply with ONLY one word: frame, list, optimize, win, or none.

- frame: identifying the root problem, diagnosing causes, scoping the issue
- list: brainstorming solutions, identifying stakeholders, generating options
- optimize: evaluating tradeoffs, prioritizing, choosing criteria
- win: defining success metrics, making the case, proposing a plan`

  let artifactRequest: { system: string; userContent: string; maxTokens: number } | null = null
  if (artifactSnapshot) {
    const { type, elementCount, code, language, runResult, discipline } = artifactSnapshot
    const disciplineLabel = discipline ?? (type === 'canvas' ? 'system design' : 'coding')
    const artifactUserContent = type === 'canvas'
      ? `Canvas has ${elementCount ?? 0} elements.`
      : `Code (${language ?? 'unknown'}):\n${(code ?? '').slice(0, 800)}${code && code.length > 800 ? '\n...(truncated)' : ''}\nLast run result: ${runResult ? JSON.stringify(runResult).slice(0, 200) : 'not run yet'}`
    const artifactSystemPrompt = `You are watching a candidate's ${type === 'canvas' ? 'whiteboard canvas' : 'code editor'} during a live ${disciplineLabel} interview.
Respond with ONE short observation about what you see (max 12 words).
Focus on: gaps, jumps, missed components, edge cases, or strong moves.
If nothing notable, reply "none".`
    artifactRequest = { system: artifactSystemPrompt, userContent: artifactUserContent, maxTokens: 60 }
  }

  let flowResponse
  let artifactSignal: string | null
  try {
    await assertPlanLimit(sessionUserId, userPlan, 'ai_grading_runs')

    const flowPromise = guardedCachedMessage(flowSystemPrompt, content, {
      model,
      max_tokens: flowMaxTokens,
      budget: { userId: sessionUserId, userPlan, route: 'live_interview_analyze_flow' },
    })

    const artifactPromise: Promise<string | null> = artifactSnapshot
      ? (async () => {
          if (!artifactRequest) return null

          const artifactResponse = await guardedCachedMessage(artifactRequest.system, artifactRequest.userContent, {
            model,
            max_tokens: artifactRequest.maxTokens,
            budget: { userId: sessionUserId, userPlan, route: 'live_interview_analyze_artifact' },
          })

          const raw = artifactResponse.sanitized.trim()
          if (raw && raw.toLowerCase() !== 'none') return raw
          return null
        })()
      : Promise.resolve(null)

    // Run FLOW move classification and artifact analysis in parallel when both are needed.
    ;[flowResponse, artifactSignal] = await Promise.all([flowPromise, artifactPromise])
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return Response.json(
        {
          error: 'limit_reached',
          feature: error.feature,
          used: error.used,
          limit: error.limit,
          windowDays: error.windowDays,
        },
        { status: 402 }
      )
    }

    if (error instanceof AiBudgetExceededError) {
      return Response.json(
        {
          error: 'limit_reached',
          feature: 'hatch_ai_cents',
          used: error.used,
          limit: error.limit,
          windowDays: error.windowDays,
        },
        { status: 402 }
      )
    }
    throw error
  }

  const raw = flowResponse.sanitized.trim().toLowerCase()
  const flowMove = VALID_FLOW_MOVES.has(raw) ? raw : null

  if (flowMove) {
    const result = applyCoverageCredit({
      coverage: session.flow_coverage,
      credits: (session as { flow_coverage_credits?: Record<string, number[]> | null }).flow_coverage_credits,
      move: flowMove as FlowMove,
      turnIndex: typeof turnIndex === 'number' ? turnIndex : null,
    })

    if (result.credited) {
      await adminClient
        .from('live_interview_sessions')
        .update({
          flow_coverage: result.coverage,
          flow_coverage_credits: result.credits,
          total_turns: (session.total_turns ?? 0) + 1,
        })
        .eq('id', id)
    }
  }

  return Response.json({ ok: true, flowMove, artifactSignal })
}
