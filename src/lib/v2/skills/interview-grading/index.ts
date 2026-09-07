import { createClient } from '@/lib/supabase/server'
import { loadSkillPrompt } from '@/lib/ai/skill-loader'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded } from '@/lib/usage/assert-plan-limit'
import { SYSTEM_DESIGN_GRADING_PROMPT } from './prompts/system-design'
import { DATA_MODELING_GRADING_PROMPT } from './prompts/data-modeling'
import { validateInterviewGrade } from './schemas/feedback-output'
import { retainObservedCanvasDimensions } from './observed-dimensions'
import { summarizeScene, sceneToPrompt } from '@/lib/hatch/canvas-scene'
import { designStepsFor } from '@/components/challenge/design/designSteps'
import type { CanvasChallengeType } from '@/lib/hatch/canvasGuidance'
import type { InterviewGrade, ChallengeType } from '@/lib/types'

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

/**
 * Renders the structured write-up (step_answers persisted inside
 * canvas_final_snapshot by interview-submit) as labeled sections in template
 * order. Returns '' for legacy attempts with no write-up so the prompt shape
 * stays backward-compatible.
 */
function buildWriteUpSummary(
  snapshot: Record<string, unknown> | null,
  challengeType: CanvasChallengeType
): string {
  const raw = snapshot?.step_answers
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ''
  const stepAnswers = raw as Record<string, unknown>
  const blocks: string[] = []
  for (const step of designStepsFor(challengeType)) {
    const answers = stepAnswers[step.id]
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) continue
    for (const section of step.sections) {
      if (section.kind === 'diagram') continue // the diagram is the canvas itself
      const text = (answers as Record<string, unknown>)[section.id]
      if (typeof text !== 'string' || !text.trim()) continue
      blocks.push(`### ${step.label} — ${section.label}\n${text.trim().slice(0, 5000)}`)
    }
  }
  return blocks.join('\n\n')
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

  const snapshot = attempt.canvas_final_snapshot as Record<string, unknown> | null
  const canvasSummary = buildCanvasSummary(snapshot)
  const writeUpSummary = buildWriteUpSummary(
    snapshot,
    challengeType === 'data_modeling' ? 'data_modeling' : 'system_design'
  )

  const metadata = (challenge?.metadata ?? {}) as Record<string, unknown>
  const requiredComponents = (metadata.required_components ?? metadata.required_entities ?? []) as string[]

  const systemPrompt =
    challengeType === 'system_design'
      ? SYSTEM_DESIGN_GRADING_PROMPT
      : DATA_MODELING_GRADING_PROMPT
  // Skill-governed: hackproduct-canvas-grader is the runtime source of truth
  // (shared rules + per-discipline rubric sections); the prompt files remain
  // the fallback. The active-discipline line tells the model which section
  // applies to this session.
  const skillPrompt = loadSkillPrompt('hackproduct-canvas-grader', '')
  const baseSystemPrompt = skillPrompt
    ? `${skillPrompt}\n\n# Active discipline\n${challengeType === 'system_design' ? 'system_design' : 'data_modeling'}`
    : systemPrompt
  const effectiveSystemPrompt = `${baseSystemPrompt}\n\nHatch use is optional. Do not penalize independent work. If no user conversation was recorded, omit hatch_collaboration and renormalize the remaining rubric weights for overall_score. Assess the actual diagram and write-up; do not invent collaboration evidence.`

  const userContent = `
CHALLENGE: ${challenge?.title ?? 'Unknown'}

REQUIRED COMPONENTS:
${requiredComponents.map((c) => `- ${c}`).join('\n') || 'Not specified'}

CANVAS STATE:
${canvasSummary}
${writeUpSummary ? `\nWRITE-UP (the learner's structured notes, by workspace section):\n${writeUpSummary}\n` : ''}
CONVERSATION HISTORY:
${attempt.conversation_summary ?? 'No conversation recorded.'}

Grade this session according to the rubric.`

  const callGrader = async (extraNudge = '') => {
    const response = await guardedCachedMessage(
      effectiveSystemPrompt,
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
  // prose around the JSON. If all attempts fail, keep the saved submission
  // retryable; unavailable feedback must never become an invented score.
  const nudges = [
    '',
    '\n\nIMPORTANT: keep the response under 3000 tokens of JSON. Trim verbose evidence/how_to_improve fields if needed. Return ONLY valid JSON, no markdown fences, no prose outside the JSON object.',
    '\n\nCRITICAL: Your previous responses were not valid JSON. Return ONLY a single JSON object that exactly matches the required schema, including a numeric "overall_score". No markdown fences, no prose, no commentary before or after the object.',
  ]
  let lastErr: unknown
  for (let retry = 0; retry < nudges.length; retry++) {
    try {
      return retainObservedCanvasDimensions(validateInterviewGrade(await callGrader(nudges[retry])), challengeType, attempt.conversation_summary)
    } catch (err) {
      // Budget/plan-limit errors are not model-output failures — let the route
      // surface them as a 402 instead of masking them with a fallback grade.
      if (err instanceof AiBudgetExceededError || err instanceof PlanLimitExceeded) throw err
      lastErr = err
      console.warn(`Interview grader attempt ${retry + 1} failed:`, err)
    }
  }

  console.error('Interview grader exhausted retries:', lastErr)
  throw new Error('Detailed review unavailable')
}
