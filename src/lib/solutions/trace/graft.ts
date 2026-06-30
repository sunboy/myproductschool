/**
 * Shared "attach the verified walkthrough" step used by both the lazy generation
 * route and the backfill apply script, so the two paths never drift.
 *
 * Given validated solution content + the challenge's metadata/tags, build the
 * server-owned interactive walkthrough that fits the challenge type and write it
 * to the TOP-LEVEL `content.walkthrough` field, where the solution UI surfaces it
 * as its own "Visual" tab (not inline on an approach). The walkthrough is chosen
 * by challenge_type:
 *   - algorithm      -> verified array trace, else verified grid (DP) trace,
 *                       else verified sequence (linked-list / tree) trace
 *   - sql            -> verified pipeline (CTE chain) trace (now 2-step-capable)
 *   - system_design  -> authored request-flow walkthrough (derived from the
 *   - data_modeling     architecture diagram on the optimal approach)
 *
 * This runs IN PLACE on existing stored content WITHOUT regenerating prose: it
 * only moves/strips the stepped diagram. Any model-authored stepped diagram is
 * stripped from every approach (the server is the sole source of stepped diagrams),
 * and a prior approach-level stepped diagram is migrated up to .walkthrough.
 *
 * For the verified bases (array / grid / sequence / pipeline) the deltas are
 * computed by executing the real reference, never by the model; the flow base
 * asserts no computed state, so it is derived deterministically from the optimal
 * approach's architecture diagram (still server-owned, never free-authored by
 * the model).
 *
 * PROSE OVERLAY (the only thing the model contributes to a stepped diagram):
 * the deltas, base, and trace_verified marker come ONLY from the harness. The
 * model may author per-step title/explanation/decision/pills, which we copy onto
 * the harness steps BY INDEX. We capture the model's stepped diagram from the
 * optimal approach BEFORE stripping, use only its text fields, and discard
 * everything else it carried (its base, its deltas, its self-claimed
 * trace_verified). The overlay is fail-soft: it applies only when the captured
 * diagram has the SAME base.kind and the SAME number of steps as the harness;
 * otherwise the harness placeholder prose stands. The model can never add,
 * remove, or reorder steps, and never touch a delta. We re-validate with the
 * schema after the overlay, and revert to harness prose if validation fails.
 *
 * Async because the SQL pipeline harness boots sql.js asynchronously; the array,
 * grid, and flow paths are themselves sync but are awaited through one seam.
 */

import {
  SolutionContentSchema,
  InteractiveStepDiagramSchema,
  type SolutionContentV1,
  type InteractiveStepDiagram,
} from '@/lib/solutions/schema'
import { buildSteppedTraceFromMetadata } from './index'
import { buildSteppedGridFromMetadata } from './gridTrace'
import { buildSteppedSequenceFromMetadata } from './sequenceTrace'
import { buildSteppedPipelineFromMetadata } from './pipelineTrace'
import { buildSteppedFlowFromContent } from './flowWalkthrough'
import {
  buildFlowNarrationContext,
  narrateFlowViaApi,
  type StepProse as FlowStepProse,
} from './flowNarration'

export interface GraftResult {
  content: SolutionContentV1
  grafted: boolean
}

/** Only these text fields may be borrowed from the model, keyed by step index. */
type StepProse = Pick<
  InteractiveStepDiagram['steps'][number],
  'title' | 'explanation' | 'decision' | 'pills'
>

/**
 * Pick the server-owned stepped diagram for a solution by its challenge type, or
 * null when none is eligible. Verified bases run their harness against the real
 * reference + test cases; the flow base reads the optimal approach's architecture.
 */
async function buildWalkthrough(
  content: SolutionContentV1,
  metadata: Record<string, unknown> | null | undefined,
  tags: string[],
): Promise<InteractiveStepDiagram | null> {
  switch (content.challenge_type) {
    case 'algorithm': {
      if (!metadata) return null
      // Try each verified algorithm harness in order, first non-null wins:
      //   array (incl. string + two-pointer-area/water variants)
      //   -> grid (DP families: LCS/edit-distance/knapsack/coin-change/paths)
      //   -> sequence (linked-list reverse + ordered tree traversal).
      // Each harness only fires when it both recognizes the pattern AND its
      // uncapped oracle agrees with every extractable test case's expected; a
      // pattern it does not actually solve returns null rather than animating
      // a misleading trace, so the next harness (or no walkthrough) is used.
      const array = buildSteppedTraceFromMetadata(metadata, tags)
      if (array) return array.diagram
      const grid = buildSteppedGridFromMetadata(metadata, tags)
      if (grid) return grid.diagram
      const sequence = buildSteppedSequenceFromMetadata(metadata, tags)
      return sequence ? sequence.diagram : null
    }
    case 'sql': {
      if (!metadata) return null
      const pipeline = await buildSteppedPipelineFromMetadata(metadata, tags)
      return pipeline ? pipeline.diagram : null
    }
    case 'system_design':
    case 'data_modeling': {
      // The flow walkthrough is derived from the optimal approach's architecture
      // diagram (already in `content`), not from metadata or tags.
      const flow = buildSteppedFlowFromContent(content, metadata ?? null)
      return flow ? flow.diagram : null
    }
    default:
      return null
  }
}

/**
 * Overlay the model's per-step prose onto the harness diagram BY INDEX, keeping
 * every delta, the base, and trace_verified exactly as the harness produced them.
 *
 * Applies only when the captured model diagram matches the harness on base.kind
 * AND step count (so step i in the prose lines up with step i in the trace). On
 * any mismatch, returns the harness diagram unchanged so its readable placeholder
 * prose stands. The model never supplies deltas; only title/explanation/decision/
 * pills are copied, and only onto steps the harness already verified.
 */
function overlayModelProse(
  harness: InteractiveStepDiagram,
  modelProse: StepProse[] | null,
): InteractiveStepDiagram {
  if (!modelProse) return harness
  if (modelProse.length !== harness.steps.length) return harness

  const steps = harness.steps.map((step, i) => {
    const prose = modelProse[i]
    return {
      ...step,
      title: prose.title,
      explanation: prose.explanation,
      // decision/pills are optional; only override when the model supplied them,
      // otherwise keep the harness fallback for that field.
      ...(prose.decision !== undefined ? { decision: prose.decision } : {}),
      ...(prose.pills !== undefined ? { pills: prose.pills } : {}),
    }
  })

  return { ...harness, steps }
}

export async function graftSteppedTrace(
  content: SolutionContentV1,
  metadata: Record<string, unknown> | null | undefined,
  tags: string[],
): Promise<GraftResult> {
  // The model is NEVER allowed to author a stepped diagram's structure or deltas
  // (trace_verified lives in the same untrusted envelope, so a marker the model
  // set cannot be trusted). It MAY author per-step prose, which we copy by index
  // onto the harness steps below. Capture any existing stepped diagram BEFORE
  // stripping so we can borrow only its text fields. We accept either a prior
  // top-level walkthrough (the new home) or a legacy stepped diagram on the
  // optimal approach (the old home), preferring the top-level one. Then strip
  // every model-supplied stepped diagram from every approach AND clear any prior
  // top-level walkthrough. The server is the single source of stepped diagrams.
  const optimalIndex = content.approaches.length - 1
  const capturedOptimal = content.approaches[optimalIndex]?.diagram
  const capturedApproachStepped =
    capturedOptimal?.kind === 'stepped' ? capturedOptimal : null
  const modelStepped = content.walkthrough ?? capturedApproachStepped

  const stripped = content.approaches.map((a) =>
    a.diagram?.kind === 'stepped' ? { ...a, diagram: undefined } : a,
  )
  // Clear any prior walkthrough as well — it is rebuilt below (migrate-up case).
  const base = { ...content, approaches: stripped, walkthrough: undefined }

  // Build the type-appropriate walkthrough against the STRIPPED content so the
  // flow harness reads the real (model-authored) architecture diagram, never a
  // stale stepped one.
  const candidate = await buildWalkthrough(base, metadata, tags)
  if (!candidate) {
    const recheck = SolutionContentSchema.safeParse(base)
    return { content: recheck.success ? recheck.data : content, grafted: false }
  }

  // FLOW NARRATION (system_design / data_modeling only): the deterministic
  // placeholder prose is generic. For the flow base we ask the narrator to write
  // grounded per-step prose bound to the REAL architecture edges + sublabels, then
  // overlay it by index over the fixed structure. This takes priority over the
  // legacy model-prose overlay below because it is grounded in the real path, not
  // borrowed from an untrusted stepped diagram. Fail-soft: a null narration leaves
  // the deterministic placeholder in place, and the verified bases are untouched.
  let narratedProse: FlowStepProse[] | null = null
  if (candidate.base.kind === 'flow') {
    const narrationCtx = buildFlowNarrationContext(base)
    if (narrationCtx && narrationCtx.nodes.length === candidate.steps.length) {
      narratedProse = await narrateFlowViaApi(narrationCtx)
    }
  }

  // Overlay the model's prose by index, but ONLY when its base.kind and step
  // count match the harness (fail-soft otherwise). The harness owns base/deltas/
  // trace_verified; the model contributes only title/explanation/decision/pills.
  // For the flow base, grounded narration (when present) wins over borrowed prose.
  const modelProse =
    narratedProse
      ? narratedProse.map((s) => ({
          title: s.title,
          explanation: s.explanation,
          decision: s.decision,
        }))
      : modelStepped && modelStepped.base.kind === candidate.base.kind
        ? modelStepped.steps.map((s) => ({
            title: s.title,
            explanation: s.explanation,
            decision: s.decision,
            pills: s.pills,
          }))
        : null
  let diagram = overlayModelProse(candidate, modelProse)

  // Re-validate the diagram on its own first: a borrowed-prose field could break
  // a constraint (e.g. an over-length title). If the overlaid diagram fails,
  // fall back to the untouched harness diagram (which already validated).
  if (modelProse) {
    const diagramCheck = InteractiveStepDiagramSchema.safeParse(diagram)
    if (!diagramCheck.success) diagram = candidate
  }

  // Write the verified walkthrough to the TOP-LEVEL field (not onto an approach),
  // keeping every approach's stepped diagram stripped. Re-validate; on failure
  // fall back to the stripped base (no walkthrough) rather than shipping invalid.
  const recheck = SolutionContentSchema.safeParse({ ...base, walkthrough: diagram })
  if (!recheck.success) {
    const fallback = SolutionContentSchema.safeParse(base)
    return { content: fallback.success ? fallback.data : content, grafted: false }
  }
  return { content: recheck.data, grafted: true }
}
