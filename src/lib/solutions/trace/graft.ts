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
  // The model is NEVER allowed to author a stepped diagram (trace_verified lives
  // in the same untrusted envelope, so a marker the model set cannot be trusted).
  // Strip any model-supplied stepped diagram from every approach up front, then
  // attach only the harness-built one. This is the single source of stepped diagrams.
  const stripped = content.approaches.map((a) =>
    a.diagram?.kind === 'stepped' ? { ...a, diagram: undefined } : a,
  )
  const base = { ...content, approaches: stripped }

  // Only algorithm solutions are array-trace eligible in this phase.
  if (content.challenge_type !== 'algorithm' || !metadata) {
    const recheck = SolutionContentSchema.safeParse(base)
    return { content: recheck.success ? recheck.data : content, grafted: false }
  }

  const candidate = buildSteppedTraceFromMetadata(metadata, tags)
  if (!candidate) {
    const recheck = SolutionContentSchema.safeParse(base)
    return { content: recheck.success ? recheck.data : content, grafted: false }
  }

  const approaches = stripped.map((a) => ({ ...a }))
  const optimal = approaches[approaches.length - 1]
  if (!optimal) {
    const recheck = SolutionContentSchema.safeParse(base)
    return { content: recheck.success ? recheck.data : content, grafted: false }
  }

  optimal.diagram = candidate.diagram
  const recheck = SolutionContentSchema.safeParse({ ...content, approaches })
  if (!recheck.success) {
    const fallback = SolutionContentSchema.safeParse(base)
    return { content: fallback.success ? fallback.data : content, grafted: false }
  }
  return { content: recheck.data, grafted: true }
}
