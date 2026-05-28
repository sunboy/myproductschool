import type { ChallengeType } from '@/lib/types'

export type TagAxis = 'topic' | 'technique' | 'move'

export interface TagPolicy {
  topic: 'required' | 'optional' | 'none'
  technique: 'required' | 'optional' | 'none'
  move: 'required' | 'optional' | 'none'
  /** EXACTLY ONE of these axes must be set (non-empty) */
  conditional?: { oneOf: TagAxis[] }
}

export const CHALLENGE_TYPE_POLICY: Record<ChallengeType, TagPolicy> = {
  algorithm:              { topic: 'required', technique: 'required', move: 'none' },
  sql:                    { topic: 'required', technique: 'required', move: 'none' },
  data_modeling:          { topic: 'required', technique: 'required', move: 'none' },
  system_design:          { topic: 'required', technique: 'required', move: 'none' },
  flow:                   { topic: 'required', technique: 'optional', move: 'optional', conditional: { oneOf: ['technique', 'move'] } },
  freeform:               { topic: 'required', technique: 'optional', move: 'optional', conditional: { oneOf: ['technique', 'move'] } },
  quick_take:             { topic: 'none', technique: 'none', move: 'none' },
  claude_code_analytics:  { topic: 'none', technique: 'none', move: 'none' },
}

type TagsInput = {
  topic_tags?: string[] | null
  technique_tags?: string[] | null
  move_tags?: string[] | null
}

function isPopulated(arr: string[] | null | undefined): boolean {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Validates that a challenge's tags satisfy the per-type policy.
 * Pure function — no DB calls.
 *
 * @returns { ok: true } when all policy rules pass, or { ok: false, errors: [...] }
 *          with a human-readable error string for each violation.
 */
export function validateChallengeTags(
  type: ChallengeType,
  tags: TagsInput
): { ok: boolean; errors: string[] } {
  const policy = CHALLENGE_TYPE_POLICY[type]
  const errors: string[] = []

  // --- required checks ---
  if (policy.topic === 'required' && !isPopulated(tags.topic_tags)) {
    errors.push(`type=${type} requires at least one topic_tag`)
  }
  if (policy.technique === 'required' && !isPopulated(tags.technique_tags)) {
    errors.push(`type=${type} requires at least one technique_tag`)
  }
  if (policy.move === 'required' && !isPopulated(tags.move_tags)) {
    errors.push(`type=${type} requires at least one move_tag`)
  }

  // 'none' means no requirement — tags are allowed to be present, just not required.
  // We do NOT error when tags exist on a 'none' axis (quick_take/claude_code_analytics
  // may carry tags silently without violating policy).

  // --- conditional XOR: exactly one of the listed axes must be populated ---
  if (policy.conditional?.oneOf) {
    const axisMap: Record<TagAxis, string[] | null | undefined> = {
      topic:     tags.topic_tags,
      technique: tags.technique_tags,
      move:      tags.move_tags,
    }
    const populatedAxes = policy.conditional.oneOf.filter(axis => isPopulated(axisMap[axis]))

    if (populatedAxes.length === 0) {
      errors.push(
        `type=${type} requires exactly one of [${policy.conditional.oneOf.join(', ')}] to be set, but none are`
      )
    } else if (populatedAxes.length > 1) {
      errors.push(
        `type=${type} requires exactly one of [${policy.conditional.oneOf.join(', ')}] to be set, but multiple are set: [${populatedAxes.join(', ')}]`
      )
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
