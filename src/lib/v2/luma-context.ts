import {
  getLumaContext as _getLumaContext,
  buildLumaContextString,
} from '@/lib/luma-context'
import type { FlowStep } from '@/lib/types'

/**
 * v2 wrapper — accepts (userId, challengeId, step) and returns a
 * pre-formatted context string suitable for injection into LLM prompts.
 *
 * The underlying getLumaContext only uses userId; challengeId and step
 * are reserved for future per-challenge / per-step filtering but are
 * accepted here so callers don't need to change.
 */
export async function getLumaContext(
  userId: string,
  _challengeId: string,
  _step: FlowStep | string
): Promise<string> {
  const ctx = await _getLumaContext(userId)
  return buildLumaContextString(ctx, 'coaching')
}
