import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const VALID_FLOW_MOVES = new Set(['frame', 'list', 'optimize', 'win'])
const VALID_COMPETENCIES = new Set([
  'motivation_theory',
  'cognitive_empathy',
  'taste',
  'strategic_thinking',
  'creative_execution',
  'domain_expertise',
])
const VALID_EMOTIONS = new Set(['neutral', 'intrigued', 'challenging', 'delighted', 'concerned'])
const VALID_PHASES = new Set(['opening', 'middle', 'closing', 'done'])
const VALID_RUBRIC_ALIGNMENTS = new Set(['strong', 'partial', 'surface', 'off_track'])

interface GradingResult {
  flowMove: string | null
  competency: string | null
  signal: string | null
  rubricAlignment: string | null
  emotionalBeat: string
  sessionPhase: string
  memoryItems: string[]
}

/**
 * POST /api/live-interview/[id]/grade-turn
 *
 * Asynchronous post-hoc grading of a conversation turn. Called AFTER the
 * Hatch response has already been returned to the user, so latency here
 * does not affect conversational flow.
 *
 * Uses Claude Haiku for speed and cost — this is pure analytical
 * classification, no personality needed.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const { recentTurns, challengeId } = (await request.json()) as {
    recentTurns: Array<{ role: 'user' | 'hatch'; content: string }>
    challengeId?: string | null
  }

  if (!recentTurns?.length) {
    return Response.json({ error: 'No turns provided' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('flow_coverage, total_turns, status, conversation_memory, calibration_snapshot, scenario_rubric')
    .eq('id', id)
    .single()

  if (!session || session.status !== 'active') {
    return Response.json({ error: 'Session not found or ended' }, { status: 404 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const transcript = recentTurns
    .map((t) => `${t.role === 'hatch' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.content}`)
    .join('\n\n')

  // Build scenario-specific grading context if a challenge is linked
  let scenarioContext = ''
  const rubric = session.scenario_rubric as Record<string, unknown> | null
  if (challengeId && rubric) {
    const steps = rubric.steps as Record<string, { weight: number; nudge: string | null }> | undefined
    const stepLines: string[] = []
    if (steps) {
      for (const [step, data] of Object.entries(steps)) {
        const nudge = data.nudge ? ` — ${data.nudge}` : ''
        stepLines.push(`${step.charAt(0).toUpperCase() + step.slice(1)} (weight: ${data.weight})${nudge}`)
      }
    }
    scenarioContext = `
SCENARIO CONTEXT:
${rubric.scenarioQuestion ?? ''}

RUBRIC — what a strong candidate demonstrates per FLOW move:
${stepLines.join('\n')}

TARGET COMPETENCIES: ${((rubric.primaryCompetencies as string[]) ?? []).join(', ')}

WHAT SEPARATES GREAT FROM GOOD:
${rubric.engineerStandout ?? ''}

`
  }

  const rubricAlignmentField = challengeId
    ? `\n  "rubric_alignment": "strong" | "partial" | "surface" | "off_track" | null,`
    : ''
  const rubricAlignmentGuideline = challengeId
    ? '\n- rubric_alignment: How well the candidate\'s response aligns with the scenario rubric. "strong" if they hit the core insight, "partial" if they\'re on the right track but incomplete, "surface" if they\'re addressing symptoms not root causes, "off_track" if their reasoning contradicts the scenario\'s key insight. null if not enough to judge.'
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `You are an interview analysis engine. Analyze the most recent exchange in a PM interview and return a JSON object. No other text.
${scenarioContext}
Analyze the CANDIDATE's most recent response (not the interviewer's).

Return exactly this JSON shape:
{
  "flow_move": "frame" | "list" | "optimize" | "win" | null,
  "competency": "motivation_theory" | "cognitive_empathy" | "taste" | "strategic_thinking" | "creative_execution" | "domain_expertise" | null,
  "signal": "<1-2 sentence observation about the candidate's reasoning quality>",${rubricAlignmentField}
  "emotional_beat": "neutral" | "intrigued" | "challenging" | "delighted" | "concerned",
  "session_phase": "opening" | "middle" | "closing" | "done",
  "memory_items": ["<salient claim or position the candidate took>", "<contradiction, strong moment, or deflected question>"]
}

Guidelines:
- flow_move: The FLOW move the candidate most recently demonstrated. null if unclear or just small talk.
- competency: The reasoning competency most relevant to what the candidate just said.
- signal: A specific observation, not generic praise. "Identified the causal mechanism behind churn" not "Good analysis."${rubricAlignmentGuideline}
- emotional_beat: How the interviewer should be feeling right now. "intrigued" if the candidate said something unexpected, "challenging" if they gave a weak answer, "delighted" if they nailed something, "concerned" if they're off track.
- session_phase: "opening" if still in warm-up/first few exchanges, "middle" for the bulk, "closing" if the interviewer is wrapping up, "done" if the interviewer has explicitly ended the session.
- memory_items: 0-2 items worth remembering for later reference. Concrete claims, contradictions, strong moments, or dodged questions. Empty array if nothing notable.`,
    messages: [{ role: 'user', content: transcript }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

  let parsed: Record<string, unknown>
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    parsed = JSON.parse(cleaned)
  } catch {
    // Fallback: return neutral defaults
    return Response.json({
      flowMove: null,
      competency: null,
      signal: null,
      rubricAlignment: null,
      emotionalBeat: 'neutral',
      sessionPhase: 'middle',
      memoryItems: [],
    } satisfies GradingResult)
  }

  const flowMove = typeof parsed.flow_move === 'string' && VALID_FLOW_MOVES.has(parsed.flow_move)
    ? parsed.flow_move
    : null

  const competency = typeof parsed.competency === 'string' && VALID_COMPETENCIES.has(parsed.competency)
    ? parsed.competency
    : null

  const signal = typeof parsed.signal === 'string' ? parsed.signal : null

  const emotionalBeat = typeof parsed.emotional_beat === 'string' && VALID_EMOTIONS.has(parsed.emotional_beat)
    ? parsed.emotional_beat
    : 'neutral'

  const sessionPhase = typeof parsed.session_phase === 'string' && VALID_PHASES.has(parsed.session_phase)
    ? parsed.session_phase
    : 'middle'

  const memoryItems = Array.isArray(parsed.memory_items)
    ? (parsed.memory_items as unknown[]).filter((m): m is string => typeof m === 'string').slice(0, 2)
    : []

  const rubricAlignment = typeof parsed.rubric_alignment === 'string' && VALID_RUBRIC_ALIGNMENTS.has(parsed.rubric_alignment)
    ? parsed.rubric_alignment
    : null

  // Consolidate session updates into a single DB call
  const sessionUpdate: Record<string, unknown> = {}

  // Update FLOW coverage
  if (flowMove) {
    const coverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
    const current = coverage[flowMove] ?? 0
    coverage[flowMove] = Math.min(1.0, current + 0.15)
    sessionUpdate.flow_coverage = coverage
  }

  // Append memory items
  if (memoryItems.length > 0) {
    const existing = (session.conversation_memory ?? []) as string[]
    sessionUpdate.conversation_memory = [...existing, ...memoryItems].slice(-12)
  }

  // Store latest grading signals for SSE polling (lightweight JSONB on session row)
  sessionUpdate.calibration_snapshot = {
    ...(typeof session.calibration_snapshot === 'object' && session.calibration_snapshot !== null
      ? session.calibration_snapshot
      : {}),
    _latestGrading: { emotionalBeat, sessionPhase },
  }

  if (Object.keys(sessionUpdate).length > 0) {
    await adminClient
      .from('live_interview_sessions')
      .update(sessionUpdate)
      .eq('id', id)
  }

  // Update the latest hatch turn with grading data
  const { data: latestHatchTurn } = await adminClient
    .from('live_interview_turns')
    .select('id')
    .eq('session_id', id)
    .eq('role', 'hatch')
    .order('turn_index', { ascending: false })
    .limit(1)
    .single()

  if (latestHatchTurn) {
    await adminClient
      .from('live_interview_turns')
      .update({
        flow_move_detected: flowMove,
        competency_signals: competency && signal
          ? { competency, signal }
          : null,
        rubric_alignment: rubricAlignment,
      })
      .eq('id', latestHatchTurn.id)
  }

  const result: GradingResult = {
    flowMove,
    competency,
    signal,
    rubricAlignment,
    emotionalBeat,
    sessionPhase,
    memoryItems,
  }

  return Response.json(result)
}
