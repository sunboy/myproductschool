import { createClient } from '@/lib/supabase/server'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded } from '@/lib/usage/assert-plan-limit'
import { SYSTEM_DESIGN_GRADING_PROMPT } from './prompts/system-design'
import { DATA_MODELING_GRADING_PROMPT } from './prompts/data-modeling'
import { validateInterviewGrade } from './schemas/feedback-output'
import { summarizeScene, sceneToPrompt } from '@/lib/hatch/canvas-scene'
import type { InterviewGrade, InterviewGradeDimension, ChallengeType } from '@/lib/types'

type AiBudget = { userId: string; userPlan: string; route: string }

function buildCanvasSummary(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) return 'No canvas data — user did not draw anything.'
  const elements = (snapshot.elements as unknown[]) ?? []
  const contextPack =
    typeof snapshot.context_pack === 'string' && snapshot.context_pack.trim()
      ? `\n\nCONTEXT PACK:\n${snapshot.context_pack.trim()}`
      : ''
  return `${sceneToPrompt(summarizeScene(elements))}${contextPack}`
}

export async function gradeInterviewSession(
  attemptId: string,
  challengeType: ChallengeType,
  budget?: AiBudget
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
    const response = await guardedCachedMessage(
      systemPrompt,
      userContent + extraNudge,
      {
        model: 'claude-sonnet-4-6',
        // Bumped from 2000 → 4000: large rubrics (8+ entities) produce 6KB+ JSON
        // and hit the cap mid-array, yielding unterminated JSON.
        max_tokens: 4000,
        budget,
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

  // Up to 3 attempts with progressively stronger JSON-only reinforcement. Most
  // parse failures come from the model hitting max_tokens mid-output or wrapping
  // prose around the JSON. If all attempts fail, fall back to a neutral grade so
  // the user gets a usable result instead of a hard "Grading failed" error.
  const nudges = [
    '',
    '\n\nIMPORTANT: keep the response under 3000 tokens of JSON. Trim verbose evidence/how_to_improve fields if needed. Return ONLY valid JSON, no markdown fences, no prose outside the JSON object.',
    '\n\nCRITICAL: Your previous responses were not valid JSON. Return ONLY a single JSON object that exactly matches the required schema, including a numeric "overall_score". No markdown fences, no prose, no commentary before or after the object.',
  ]
  let lastErr: unknown
  for (let attempt = 0; attempt < nudges.length; attempt++) {
    try {
      return validateInterviewGrade(await callGrader(nudges[attempt]))
    } catch (err) {
      // Budget/plan-limit errors are not model-output failures — let the route
      // surface them as a 402 instead of masking them with a fallback grade.
      if (err instanceof AiBudgetExceededError || err instanceof PlanLimitExceeded) throw err
      lastErr = err
      console.warn(`Interview grader attempt ${attempt + 1} failed:`, err)
    }
  }

  console.error('Interview grader exhausted retries, using neutral fallback:', lastErr)
  return neutralInterviewGradeFallback(challengeType)
}

// Fallback when the AI grader exhausts its retries. There is no objective score
// signal for a canvas/conversation interview, so use a neutral mid score and an
// honest headline. The user can re-submit for a real AI grade.
function neutralInterviewGradeFallback(challengeType: ChallengeType): InterviewGrade {
  const note = "Hatch's detailed review was unavailable this time."
  const dim = (verdict: string): InterviewGradeDimension => ({
    score: 3,
    verdict,
    evidence: note,
    hole_to_poke: 'A full review was not generated for this attempt.',
    how_to_improve: 'Re-submit to get a detailed grade, or ask Hatch about a specific part of your design.',
  })
  const dimensions: Record<string, InterviewGradeDimension> =
    challengeType === 'system_design'
      ? {
          requirements: dim('Could not assess requirements this time.'),
          architecture: dim('Could not assess the architecture this time.'),
          tradeoffs: dim('Could not assess tradeoffs this time.'),
          scalability: dim('Could not assess scalability this time.'),
          communication: dim('Could not assess communication this time.'),
        }
      : {
          entities: dim('Could not assess entities this time.'),
          relationships: dim('Could not assess relationships this time.'),
          normalization: dim('Could not assess normalization this time.'),
          constraints: dim('Could not assess constraints this time.'),
          communication: dim('Could not assess communication this time.'),
        }
  return {
    overall_score: 3,
    headline: note,
    dimensions,
    top_strength: 'Your submission was recorded.',
    top_improvement: 'Re-submit to get a detailed grade from Hatch.',
    canvas_annotations: [],
  }
}
