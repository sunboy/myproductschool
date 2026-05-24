import { buildSkillContextPrompt } from '@/lib/hatch/skill-context'
import type { FlowStep } from '@/lib/types'

/**
 * v2 wrapper — accepts (userId, challengeId, step) and returns a
 * pre-formatted context string suitable for injection into LLM prompts.
 *
 * The underlying getHatchContext only uses userId; challengeId and step
 * are reserved for future per-challenge / per-step filtering but are
 * accepted here so callers don't need to change.
 */
export async function getHatchContext(
  userId: string,
  _challengeId: string,
  step: FlowStep | string
): Promise<string> {
  return buildSkillContextPrompt(userId, {
    surface: 'coaching',
    challengeType: 'flow',
    challengeTitle: null,
    currentStep: step,
    includePracticeLink: true,
  })
}
