import { createClient } from '@/lib/supabase/server'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { SYSTEM_DESIGN_GRADING_PROMPT } from './prompts/system-design'
import { DATA_MODELING_GRADING_PROMPT } from './prompts/data-modeling'
import { validateInterviewGrade } from './schemas/feedback-output'
import { summarizeScene, sceneToPrompt } from '@/lib/hatch/canvas-scene'
import type { InterviewGrade, ChallengeType } from '@/lib/types'

function buildCanvasSummary(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) return 'No canvas data — user did not draw anything.'
  const elements = (snapshot.elements as unknown[]) ?? []
  return sceneToPrompt(summarizeScene(elements))
}

export async function gradeInterviewSession(
  attemptId: string,
  challengeType: ChallengeType
): Promise<InterviewGrade> {
  const supabase = await createClient()

  // Fetch attempt + canvas snapshot
  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('canvas_final_snapshot, challenge_id, conversation_summary')
    .eq('id', attemptId)
    .single()

  if (!attempt) throw new Error(`Attempt ${attemptId} not found`)

  // Fetch challenge metadata
  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, metadata')
    .eq('id', attempt.challenge_id)
    .single()

  const canvasSummary = buildCanvasSummary(
    attempt.canvas_final_snapshot as Record<string, unknown> | null
  )

  const metadata = (challenge?.metadata ?? {}) as Record<string, unknown>
  const requiredComponents = (metadata.required_components ?? metadata.required_entities ?? []) as string[]

  const systemPrompt =
    challengeType === 'system_design'
      ? SYSTEM_DESIGN_GRADING_PROMPT
      : DATA_MODELING_GRADING_PROMPT

  const userContent = `
CHALLENGE: ${challenge?.title ?? 'Unknown'}

REQUIRED COMPONENTS:
${requiredComponents.map((c) => `- ${c}`).join('\n') || 'Not specified'}

CANVAS STATE:
${canvasSummary}

CONVERSATION HISTORY:
${attempt.conversation_summary ?? 'No conversation recorded.'}

Grade this session according to the rubric.`

  const callGrader = async (extraNudge = '') => {
    const response = await createCachedMessage(
      systemPrompt,
      userContent + extraNudge,
      {
        model: 'claude-sonnet-4-6',
        // Bumped from 2000 → 4000: large rubrics (8+ entities) produce 6KB+ JSON
        // and hit the cap mid-array, yielding unterminated JSON.
        max_tokens: 4000,
      }
    )
    const textBlock = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()
    // Strip markdown fences if the model wrapped the JSON despite instructions
    const cleaned = textBlock
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
    // Greedy match: from the first { to the last } in the response
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object in grading response')
    }
    return JSON.parse(cleaned.slice(start, end + 1))
  }

  let parsed
  try {
    parsed = await callGrader()
  } catch (err) {
    // One retry with explicit reinforcement on conciseness — most parse failures
    // come from the model hitting max_tokens mid-output. Tighten the ask.
    console.warn('Grader first attempt failed, retrying:', err)
    parsed = await callGrader(
      '\n\nIMPORTANT: keep the response under 3000 tokens of JSON. Trim verbose evidence/how_to_improve fields if needed. Return ONLY valid JSON, no markdown fences, no prose outside the JSON object.'
    )
  }
  return validateInterviewGrade(parsed)
}
