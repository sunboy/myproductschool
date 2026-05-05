import { createAdminClient } from '@/lib/supabase/admin'
import { applyCoverageCredit, type FlowMove } from '@/lib/live-interview/flow-coverage-credits'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'

const VALID_FLOW_MOVES = new Set(['frame', 'list', 'optimize', 'win'])

interface ArtifactSnapshot {
  type: 'canvas' | 'editor'
  elementCount?: number
  code?: string
  language?: string
  runResult?: unknown
  discipline?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Hatch ran into a problem. Try again.' }, { status: 503 })
  }

  const { content, role, artifactSnapshot, turnIndex } = await request.json() as {
    content: string
    role: string
    artifactSnapshot?: ArtifactSnapshot
    turnIndex?: number
  }

  if (!content || role !== 'user') {
    // Only analyze user turns for FLOW move detection
    return Response.json({ ok: true, flowMove: null, artifactSignal: null })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('user_id, flow_coverage, flow_coverage_credits, total_turns, status')
    .eq('id', id)
    .single()

  if (!session || session.status !== 'active') {
    return Response.json({ ok: false }, { status: 404 })
  }

  const model = 'claude-haiku-4-5-20251001'
  const sessionUserId = session.user_id as string
  const userPlan = await getUserPlanForBudget(sessionUserId)
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

  // Run FLOW move classification and artifact analysis in parallel when both are needed
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

  let flowResponse
  let artifactSignal: string | null
  try {
    ;[flowResponse, artifactSignal] = await Promise.all([flowPromise, artifactPromise])
  } catch (error) {
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
