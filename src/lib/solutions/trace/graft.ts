/**
 * Shared "attach the verified walkthrough" step used by both the lazy generation
 * route and the backfill apply script, so the two paths never drift.
 *
 * Given validated solution content + the challenge's metadata/tags, build a
 * machine-verified array walkthrough (if eligible) and graft it onto the optimal
 * approach (the last one, by the brute-force -> optimal convention). The deltas
 * are never the model's; only the surrounding prose is. Re-validates so the
 * one-stepped-per-solution and verified-trace gates still hold; on any failure
 * it returns the original content unchanged (fail-soft).
 */

import { SolutionContentSchema, type SolutionContentV1 } from '@/lib/solutions/schema'
import { buildSteppedTraceFromMetadata } from './index'

export interface GraftResult {
  content: SolutionContentV1
  grafted: boolean
}

export function graftSteppedTrace(
  content: SolutionContentV1,
  metadata: Record<string, unknown> | null | undefined,
  tags: string[],
): GraftResult {
  // Only algorithm solutions are array-trace eligible in this phase.
  if (content.challenge_type !== 'algorithm' || !metadata) return { content, grafted: false }

  const candidate = buildSteppedTraceFromMetadata(metadata, tags)
  if (!candidate) return { content, grafted: false }

  const approaches = content.approaches.map((a) => ({ ...a }))
  const optimal = approaches[approaches.length - 1]
  if (!optimal || optimal.diagram?.kind === 'stepped') return { content, grafted: false }

  optimal.diagram = candidate.diagram
  const recheck = SolutionContentSchema.safeParse({ ...content, approaches })
  if (!recheck.success) return { content, grafted: false }
  return { content: recheck.data, grafted: true }
}
