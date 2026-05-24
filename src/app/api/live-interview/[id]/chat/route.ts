import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildArtifactContextNote,
  type LiveInterviewArtifactSnapshot,
} from '@/lib/live-interview/artifact-context'
import { IS_MOCK } from '@/lib/mock'
import { LiveInterviewArtifactSnapshotSchema } from '@/lib/live-interview/snapshot-schema'
import { normalizeDiscipline } from '@/lib/live-interview/disciplines'
import { buildLiveInterviewContextPack } from '@/lib/live-interview/context-pack'
import { buildDeterministicWorkspaceReply } from '@/lib/live-interview/workspace-adapters'
import { liveInterviewModel } from '@/lib/live-interview/model-policy'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const ROUTE_KEY = 'live_interview_chat'
const FLOW_ORDER = ['frame', 'list', 'optimize', 'win'] as const

const RequestSchema = z.object({
  message: z.string().max(20000).optional(),
  mode: z.enum(['opening', 'reply', 'feeler']).optional(),
  idleSeconds: z.number().int().min(0).max(3600).optional(),
  artifactSnapshot: LiveInterviewArtifactSnapshotSchema.optional(),
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

function providerErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return ''
  const record = error as Record<string, unknown>
  const directMessage = typeof record.message === 'string' ? record.message : ''
  const apiErrorEnvelope = record.error
  const nestedMessage = apiErrorEnvelope && typeof apiErrorEnvelope === 'object'
    ? typeof (apiErrorEnvelope as Record<string, unknown>).message === 'string'
      ? (apiErrorEnvelope as Record<string, unknown>).message as string
      : (() => {
          const nested = (apiErrorEnvelope as Record<string, unknown>).error
          return nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).message === 'string'
            ? (nested as Record<string, unknown>).message as string
            : ''
        })()
    : ''
  return `${directMessage} ${nestedMessage}`.trim()
}

function isProviderUnavailable(error: unknown) {
  const message = providerErrorMessage(error).toLowerCase()
  return (
    message.includes('credit balance') ||
    message.includes('billing') ||
    message.includes('rate limit') ||
    message.includes('overloaded') ||
    message.includes('temporarily unavailable') ||
    message.includes('api key')
  )
}

function shouldUseLocalInterviewFallback() {
  return process.env.NODE_ENV !== 'production' || process.env.LIVE_INTERVIEW_LOCAL_FALLBACK === 'true'
}

function nextFlowMove(flowCoverage: Record<string, number>) {
  return FLOW_ORDER.reduce((lowest, move) => (
    (flowCoverage[move] ?? 0) < (flowCoverage[lowest] ?? 0) ? move : lowest
  ), FLOW_ORDER[0])
}

function localFallbackReply({
  mode,
  message,
  flowCoverage,
}: {
  mode: 'opening' | 'reply' | 'feeler'
  message: string
  flowCoverage: Record<string, number>
}) {
  if (mode === 'opening') {
    return "I’m here in local fallback mode, so I’ll keep this focused. Start by framing the problem: who is the user, what are they trying to do, and what would make this worth solving?"
  }

  if (mode === 'feeler') {
    return "Still with me? Take a minute, then give me the frame before you jump into solutions."
  }

  const move = nextFlowMove(flowCoverage)
  if (move === 'frame') {
    return "Good, but slow down one step. Frame it first: who exactly is the user, what outcome matters, and what constraint would change your answer?"
  }
  if (move === 'list') {
    return "Now list the important pieces before choosing. What users, metrics, constraints, and failure modes would you put on the board?"
  }
  if (move === 'optimize') {
    return "Pick the tradeoff explicitly. What are you optimizing for, what are you willing to sacrifice, and why is that the right call here?"
  }

  const trimmed = message.trim()
  return trimmed
    ? "Bring it home with a crisp recommendation. Name the bet, the first experiment, the success metric, and the risk you would watch."
    : "Give me your recommendation in one clear pass: decision, metric, first step, and risk."
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Mock mode
  if (IS_MOCK) {
    return Response.json({
      reply: "Hold on, you jumped straight to a solution. What's the actual problem here? If I asked the user, what would they say is broken?",
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

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
  const mode = body.mode === 'opening' || body.mode === 'feeler' ? body.mode : 'reply'
  const message = body.message ?? ''
  const idleSeconds = body.idleSeconds ?? 45
  const artifactSnapshot = body.artifactSnapshot
  if (mode === 'reply' && !message.trim()) return apiError(400, 'invalid_request', 'Bad Request')

  const adminClient = createAdminClient()

  // Load session
  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('system_prompt, status, flow_coverage, conversation_memory, started_at, challenge_id, calibration_snapshot')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return apiError(404, 'session_not_found', 'Session not found')
  if (session.status === 'completed') return apiError(410, 'session_ended', 'Session ended')

  // Load existing turns for conversation history
  const { data: turnsData, count, error: turnsError } = await adminClient
    .from('live_interview_turns')
    .select('role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  if (turnsError) return apiError(500, 'live_interview_turns_load_failed', 'Internal Server Error')
  const nextIndex = count ?? 0

  if (mode === 'opening' && (turnsData?.length ?? 0) > 0) {
    const firstHatchTurn = turnsData?.find((turn) => turn.role === 'hatch')
    return Response.json({
      reply: firstHatchTurn?.content ?? null,
      alreadyStarted: true,
    })
  }

  const conversation = mode === 'opening'
    ? 'The live interview has just opened. The candidate has not spoken yet.'
    : mode === 'feeler'
    ? [
        ...(turnsData ?? []).map((t) => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`),
        `[Silence] The candidate has been quiet for about ${idleSeconds} seconds after Hatch's last turn.`,
      ].join('\n\n')
    : [
        ...(turnsData ?? []).map((t) => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`),
        `Candidate: ${message.trim()}`,
      ].join('\n\n')

  const flowCoverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
  const memory = (session.conversation_memory ?? []) as string[]
  const calibrationSnapshot = (session.calibration_snapshot ?? {}) as Record<string, unknown>
  const discipline = normalizeDiscipline(
    artifactSnapshot?.discipline ??
    (calibrationSnapshot.effectiveDiscipline as string | undefined) ??
    null
  )
  const currentArtifactSnapshot =
    artifactSnapshot ?? (calibrationSnapshot._artifactSnapshot as LiveInterviewArtifactSnapshot | undefined)
  const { dynamicContext, workspaceSignal } = buildLiveInterviewContextPack({
    flowCoverage,
    memory,
    artifactSnapshot: currentArtifactSnapshot,
    discipline,
  })
  const artifactContext = buildArtifactContextNote(currentArtifactSnapshot)
  const deterministicReply = mode === 'reply'
    ? buildDeterministicWorkspaceReply(workspaceSignal, message)
    : null

  if (mode === 'opening') {
    dynamicContext.push(`[OPENING TURN]
Make the first move now. Send only Hatch's first spoken turn.
Keep it to 1-2 short sentences. Greet the candidate, optionally include one light personalized signal from the profile/practice context, and invite them into the interview. Do not ask them to type first. Do not present the full case yet unless they already chose to start immediately.`)
  }

  if (mode === 'feeler') {
    dynamicContext.push(`[NATURAL CHECK-IN]
The candidate has been quiet for about ${idleSeconds} seconds. Send exactly one short, humane check-in.
Use the transcript and workspace context to choose the right tone: "Still with me?", "Want a hint?", "Need a minute?", "Want to take a quick break?", or a similarly natural variant.
Do not advance the case, grade them, recap your instructions, or use Markdown.`)
  }

  // Time-based soft closing signal
  if (session.started_at) {
    const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000 / 60
    if (elapsed >= 20) {
      dynamicContext.push(
        `[TIME CHECK] The interview has been going for ${Math.round(elapsed)} minutes. Start looking for a natural closing point when the candidate reaches a good stopping place.`
      )
    }
  }

  const fullSystemPrompt = [
    session.system_prompt ?? '',
    ...dynamicContext,
  ].join('\n\n')

  let reply = ''
  let degraded = false
  if (deterministicReply) {
    reply = deterministicReply
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      return apiError(503, 'hatch_unavailable', 'Hatch ran into a problem. Try again.')
    }

    // Generate Hatch's response - no grading signals, pure conversation
    const model = liveInterviewModel('chat')
    const maxTokens = 600
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

    try {
      await assertPlanLimit(user.id, userPlan, 'live_interview_turns')

      const userContent = [
        `Interview transcript:\n\n${conversation}`,
        artifactContext ? `Candidate workspace snapshot:\n${artifactContext}` : null,
      ].filter(Boolean).join('\n\n')

      const response = await guardedCachedMessage(fullSystemPrompt, userContent, {
        model,
        max_tokens: maxTokens,
        budget: { userId: user.id, userPlan, route: ROUTE_KEY },
      })
      reply = response.sanitized
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

      if (isProviderUnavailable(error) && shouldUseLocalInterviewFallback()) {
        degraded = true
        console.warn('Live interview chat using local fallback because provider is unavailable:', providerErrorMessage(error))
        reply = localFallbackReply({ mode, message, flowCoverage })
      } else {
        console.error('Live interview chat failed:', providerErrorMessage(error) || error)
        return apiError(503, 'hatch_unavailable', 'Hatch is temporarily unavailable. Try again in a moment.')
      }
    }
  }

  // Save turns to DB. Opening/feeler modes only create Hatch turns.
  const turnsToInsert = mode === 'opening' || mode === 'feeler'
    ? [
        {
          session_id: id,
          turn_index: nextIndex,
          role: 'hatch',
          content: reply,
        },
      ]
    : [
        {
          session_id: id,
          turn_index: nextIndex,
          role: 'user',
          content: message.trim(),
        },
        {
          session_id: id,
          turn_index: nextIndex + 1,
          role: 'hatch',
          content: reply,
        },
      ]

  const { error: insertError } = await adminClient.from('live_interview_turns').insert(turnsToInsert)

  if (insertError) {
    console.error('Failed to save turns:', insertError)
    return apiError(500, 'live_interview_turn_save_failed', 'Failed to save turn')
  }

  const sessionUpdate: Record<string, unknown> = {
    total_turns: nextIndex + turnsToInsert.length,
  }
  if (artifactSnapshot) {
    sessionUpdate.calibration_snapshot = {
      ...calibrationSnapshot,
      _artifactSnapshot: artifactSnapshot,
      _workspaceDigest: workspaceSignal.digest,
      _workspaceSummaryVersion: 1,
      _latestWorkspaceEvent: {
        state: workspaceSignal.state,
        type: workspaceSignal.type,
        discipline: workspaceSignal.discipline,
        summary: workspaceSignal.summary,
        capturedAt: Date.now(),
      },
    }
  }

  await adminClient
    .from('live_interview_sessions')
    .update(sessionUpdate)
    .eq('id', id)

  if (mode !== 'reply') {
    return Response.json({ reply, degraded })
  }

  // Fire async grading - non-blocking, don't await
  const recentTurns = [
    // Include last 2 existing turns for context + the new exchange
    ...(turnsData ?? []).slice(-2).map((t) => ({
      role: t.role as 'user' | 'hatch',
      content: t.content,
    })),
    { role: 'user' as const, content: message.trim() },
    { role: 'hatch' as const, content: reply },
  ]

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const gradeBaseUrl = origin ?? (host ? `${forwardedProto ?? 'http'}://${host}` : null)

  if (gradeBaseUrl && !degraded) {
    const gradeHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    const cookie = request.headers.get('cookie')
    const authorization = request.headers.get('authorization')
    if (cookie) gradeHeaders.Cookie = cookie
    if (authorization) gradeHeaders.Authorization = authorization

    fetch(`${gradeBaseUrl}/api/live-interview/${id}/grade-turn`, {
      method: 'POST',
      headers: gradeHeaders,
      body: JSON.stringify({
        recentTurns,
        challengeId: session.challenge_id,
        turnIndex: nextIndex,
        artifactSnapshot: currentArtifactSnapshot,
      }),
    }).then((res) => {
      if (!res.ok) console.error('Async grade-turn failed:', res.status)
    }).catch((err) => {
      console.error('Async grade-turn failed:', err)
    })
  }

  return Response.json({ reply, degraded })
}
