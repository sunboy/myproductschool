import { z } from 'zod'

/**
 * Canonical schema for challenge solution content (challenge_solutions.content).
 *
 * Version 1. The blob is validated with these schemas at every boundary:
 * lazy generation (API route), backfill validation script, and apply script.
 * Diagram specs never carry coordinates; layout is computed by the renderers
 * in src/components/solutions/diagrams/.
 */

// ── Diagrams ────────────────────────────────────────────────────────────────

const DiagramColorSchema = z.enum(['primary', 'secondary', 'tertiary'])

export const FlowStepsDiagramSchema = z.object({
  kind: z.literal('flow_steps'),
  title: z.string().max(200).optional(),
  steps: z.array(z.object({
    label: z.string().min(1).max(80),
    detail: z.string().max(200).optional(),
    emphasis: z.boolean().optional(),
  })).min(2).max(7),
})

export const ArchitectureDiagramSchema = z.object({
  kind: z.literal('architecture'),
  title: z.string().max(200).optional(),
  lanes: z.array(z.string().min(1).max(60)).min(1).max(4),
  nodes: z.array(z.object({
    id: z.string().min(1).max(60),
    label: z.string().min(1).max(80),
    sublabel: z.string().max(120).optional(),
    lane: z.number().int().min(0).max(3),
    role: z.enum(['client', 'service', 'store', 'queue', 'external']).optional(),
  })).min(2).max(10),
  edges: z.array(z.object({
    from: z.string().min(1).max(60),
    to: z.string().min(1).max(60),
    label: z.string().max(80).optional(),
    animated: z.boolean().optional(),
  })).max(14),
}).superRefine((diagram, ctx) => {
  const ids = new Set(diagram.nodes.map((n) => n.id))
  if (ids.size !== diagram.nodes.length) {
    ctx.addIssue({ code: 'custom', message: 'architecture node ids must be unique' })
  }
  for (const node of diagram.nodes) {
    if (node.lane >= diagram.lanes.length) {
      ctx.addIssue({ code: 'custom', message: `node "${node.id}" references lane ${node.lane} but only ${diagram.lanes.length} lanes exist` })
    }
  }
  for (const edge of diagram.edges) {
    if (!ids.has(edge.from)) ctx.addIssue({ code: 'custom', message: `edge references unknown node "${edge.from}"` })
    if (!ids.has(edge.to)) ctx.addIssue({ code: 'custom', message: `edge references unknown node "${edge.to}"` })
  }
})

export const ComparisonBarsDiagramSchema = z.object({
  kind: z.literal('comparison_bars'),
  title: z.string().max(200).optional(),
  unit: z.string().max(40).optional(),
  bars: z.array(z.object({
    label: z.string().min(1).max(80),
    value: z.number().min(0).max(100),
    color: DiagramColorSchema.optional(),
    annotation: z.string().max(120).optional(),
  })).min(2).max(6),
})

export const ComplexityCurvesDiagramSchema = z.object({
  kind: z.literal('complexity_curves'),
  title: z.string().max(200).optional(),
  xLabel: z.string().max(60).optional(),
  yLabel: z.string().max(60).optional(),
  curves: z.array(z.object({
    label: z.string().min(1).max(80),
    shape: z.enum(['constant', 'log', 'linear', 'linearithmic', 'quadratic', 'exponential']),
    color: DiagramColorSchema.optional(),
  })).min(1).max(4),
})

export const SchemaTablesDiagramSchema = z.object({
  kind: z.literal('schema_tables'),
  title: z.string().max(200).optional(),
  tables: z.array(z.object({
    name: z.string().min(1).max(60),
    columns: z.array(z.object({
      name: z.string().min(1).max(60),
      badges: z.array(z.enum(['PK', 'FK', 'UQ', 'IDX'])).max(4).optional(),
    })).min(1).max(12),
  })).min(1).max(6),
  relations: z.array(z.object({
    from: z.string().min(1).max(60),
    to: z.string().min(1).max(60),
    cardinality: z.enum(['1:1', '1:N', 'N:M']).optional(),
  })).max(10),
})

// ── Stepped (interactive, manually-navigable) diagram ─────────────────────────
//
// Unlike the five static kinds above, a stepped diagram carries a base structure
// plus an ordered array of step deltas the learner walks through (prev/next/play)
// in lockstep with an explanation, a stated decision, and metadata pills. The
// renderer resolves each step purely from base + steps[i].delta (no accumulation),
// so jumping to step N is identical to stepping there.
//
// One envelope kind ('stepped') with an inner discriminated union on `base`, so
// future bases (grid/tree/heap) are purely additive. Bases that assert COMPUTED
// state (array indices, pipeline result rows) are listed in VERIFIED_STEPPED_BASES
// and MUST be produced by the deterministic trace harness, never authored by the
// model. Bases that only label a flow may be authored.

/** Bases whose deltas assert computed state, so their trace must be machine-generated. */
export const VERIFIED_STEPPED_BASES = ['array', 'pipeline'] as const
export type VerifiedSteppedBase = (typeof VERIFIED_STEPPED_BASES)[number]

/** Tiny key/value chip shown in the step's explanation card (e.g. "target=21", "mid=4"). */
const StepPillSchema = z.object({
  label: z.string().min(1).max(24),
  value: z.string().min(1).max(24),
  tone: z.enum(['neutral', 'good', 'warn', 'active']).optional(),
})

// Base: array (binary search, two pointers, sliding window). Cells carry display
// tokens only; pointer positions live in each step's delta, never in the base.
const ArrayStageSchema = z.object({
  kind: z.literal('array'),
  cells: z.array(z.object({
    value: z.string().min(1).max(8),
  })).min(2).max(16),
  pointers: z.array(z.string().min(1).max(12)).min(1).max(4),
  rangeTrack: z.boolean().optional(),
})
const ArrayDeltaSchema = z.object({
  base: z.literal('array'),
  pointerAt: z.record(z.string(), z.number().int().min(0)),
  discarded: z.array(z.number().int().min(0)).max(16).optional(),
  highlight: z.array(z.number().int().min(0)).max(16).optional(),
  found: z.boolean().optional(),
})

// Base: pipeline (SQL CTE chains, ETL). Each step lights one stage and reveals a
// small intermediate result table produced by executing that stage.
const PipelineStageSchema = z.object({
  kind: z.literal('pipeline'),
  stages: z.array(z.string().min(1).max(40)).min(2).max(6),
})
const PipelineDeltaSchema = z.object({
  base: z.literal('pipeline'),
  activeStage: z.number().int().min(0),
  table: z.object({
    columns: z.array(z.string().max(24)).min(1).max(5),
    rows: z.array(z.array(z.string().max(24)).max(5)).max(5),
  }).optional(),
})

// Base: flow (request-flow walkthrough for design types). Labels a stage sequence;
// asserts no computed state, so it may be authored. Not in VERIFIED_STEPPED_BASES.
const FlowStageSchema = z.object({
  kind: z.literal('flow'),
  nodes: z.array(z.object({
    id: z.string().min(1).max(40),
    label: z.string().min(1).max(60),
  })).min(2).max(8),
})
const FlowDeltaSchema = z.object({
  base: z.literal('flow'),
  activeNode: z.string().min(1).max(40),
  visited: z.array(z.string().min(1).max(40)).max(8).optional(),
})

const SteppedBaseSchema = z.discriminatedUnion('kind', [
  ArrayStageSchema,
  PipelineStageSchema,
  FlowStageSchema,
])
const SteppedDeltaSchema = z.discriminatedUnion('base', [
  ArrayDeltaSchema,
  PipelineDeltaSchema,
  FlowDeltaSchema,
])

export const InteractiveStepDiagramSchema = z.object({
  kind: z.literal('stepped'),
  title: z.string().max(200).optional(),
  base: SteppedBaseSchema,
  /** Hint only; the renderer still gates autoplay on prefers-reduced-motion. */
  autoplay: z.boolean().optional(),
  /**
   * True when the trace was produced by the deterministic harness from the
   * reference solution. Required for verified bases (array/pipeline); validation
   * rejects a verified-base diagram without it.
   */
  trace_verified: z.boolean().optional(),
  steps: z.array(z.object({
    title: z.string().min(1).max(80),
    explanation: z.string().min(1).max(320),
    decision: z.string().max(120).optional(),
    pills: z.array(StepPillSchema).max(5).optional(),
    delta: SteppedDeltaSchema,
  })).min(3).max(8),
}).superRefine((diagram, ctx) => {
  const baseKind = diagram.base.kind
  const pointerNames = baseKind === 'array' ? new Set(diagram.base.pointers) : null
  const cellCount = baseKind === 'array' ? diagram.base.cells.length : 0
  const stageCount = baseKind === 'pipeline' ? diagram.base.stages.length : 0
  const nodeIds = baseKind === 'flow' ? new Set(diagram.base.nodes.map((n) => n.id)) : null

  diagram.steps.forEach((step, i) => {
    if (step.delta.base !== baseKind) {
      ctx.addIssue({ code: 'custom', message: `step ${i} delta.base "${step.delta.base}" must match base.kind "${baseKind}"` })
      return
    }
    if (step.delta.base === 'array') {
      for (const [name, idx] of Object.entries(step.delta.pointerAt)) {
        if (!pointerNames!.has(name)) ctx.addIssue({ code: 'custom', message: `step ${i} sets unknown pointer "${name}"` })
        if (idx >= cellCount) ctx.addIssue({ code: 'custom', message: `step ${i} pointer "${name}" index ${idx} out of range (${cellCount} cells)` })
      }
      for (const idx of [...(step.delta.discarded ?? []), ...(step.delta.highlight ?? [])]) {
        if (idx >= cellCount) ctx.addIssue({ code: 'custom', message: `step ${i} references cell index ${idx} out of range (${cellCount} cells)` })
      }
    } else if (step.delta.base === 'pipeline') {
      if (step.delta.activeStage >= stageCount) ctx.addIssue({ code: 'custom', message: `step ${i} activeStage ${step.delta.activeStage} out of range (${stageCount} stages)` })
    } else if (step.delta.base === 'flow') {
      if (!nodeIds!.has(step.delta.activeNode)) ctx.addIssue({ code: 'custom', message: `step ${i} activeNode "${step.delta.activeNode}" is not a base node` })
      for (const v of step.delta.visited ?? []) {
        if (!nodeIds!.has(v)) ctx.addIssue({ code: 'custom', message: `step ${i} visited "${v}" is not a base node` })
      }
    }
  })

  if ((VERIFIED_STEPPED_BASES as readonly string[]).includes(baseKind) && diagram.trace_verified !== true) {
    ctx.addIssue({ code: 'custom', message: `stepped diagram on verified base "${baseKind}" requires a machine-generated trace (trace_verified: true)` })
  }
})

export const SolutionDiagramSchema = z.discriminatedUnion('kind', [
  FlowStepsDiagramSchema,
  ArchitectureDiagramSchema,
  ComparisonBarsDiagramSchema,
  ComplexityCurvesDiagramSchema,
  SchemaTablesDiagramSchema,
  InteractiveStepDiagramSchema,
])

export type SolutionDiagram = z.infer<typeof SolutionDiagramSchema>
export type FlowStepsDiagram = z.infer<typeof FlowStepsDiagramSchema>
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>
export type ComparisonBarsDiagram = z.infer<typeof ComparisonBarsDiagramSchema>
export type ComplexityCurvesDiagram = z.infer<typeof ComplexityCurvesDiagramSchema>
export type SchemaTablesDiagram = z.infer<typeof SchemaTablesDiagramSchema>
export type InteractiveStepDiagram = z.infer<typeof InteractiveStepDiagramSchema>
export type SteppedBase = z.infer<typeof SteppedBaseSchema>
export type SteppedDelta = z.infer<typeof SteppedDeltaSchema>
export type StepPill = z.infer<typeof StepPillSchema>

// ── Solution content ────────────────────────────────────────────────────────

export const SolutionApproachSchema = z.object({
  /** Stable slug, e.g. 'hash-map-single-pass'. Used for Hatch context + analytics. */
  id: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'approach id must be a lowercase slug'),
  title: z.string().min(1).max(120),
  /** One line; shown in the approach selector and sent to Hatch as context. */
  tagline: z.string().min(1).max(200),
  body_md: z.string().min(1).max(20000),
  code: z.object({
    language: z.string().min(1).max(40),
    source: z.string().min(1).max(20000),
  }).optional(),
  complexity: z.object({
    time: z.string().min(1).max(60),
    space: z.string().min(1).max(60),
    note: z.string().max(300).optional(),
  }).optional(),
  diagram: SolutionDiagramSchema.optional(),
  tradeoffs: z.array(z.object({
    gain: z.string().min(1).max(300),
    cost: z.string().min(1).max(300),
  })).max(5).optional(),
})

export const AiCollaborationSchema = z.object({
  /** How to think and work with an AI assistant on this specific problem. */
  body_md: z.string().min(1).max(12000),
  prompts: z.array(z.object({
    title: z.string().min(1).max(120),
    prompt: z.string().min(1).max(2000),
    why: z.string().min(1).max(500),
  })).min(1).max(5),
  pitfalls: z.array(z.string().min(1).max(500)).min(1).max(6),
})

export const CHALLENGE_TYPES_WITH_SOLUTIONS = [
  'flow', 'freeform', 'quick_take', 'system_design', 'data_modeling', 'sql', 'algorithm',
] as const

/**
 * Challenge types whose solution may carry a stepped (interactive) diagram.
 * algorithm/sql use verified bases (array/pipeline) driven by the trace harness;
 * system_design/data_modeling may use the authored flow base for a request walkthrough.
 * Product-reasoning types (flow/freeform/quick_take) are excluded by design.
 */
export const STEPPED_ELIGIBLE_TYPES = new Set<string>([
  'algorithm', 'sql', 'system_design', 'data_modeling',
])

export const SolutionContentSchema = z.object({
  version: z.literal(1),
  challenge_type: z.enum(CHALLENGE_TYPES_WITH_SOLUTIONS),
  /** Framing: what this problem is really testing. */
  overview_md: z.string().min(1).max(8000),
  approaches: z.array(SolutionApproachSchema).min(1).max(4),
  ai_collaboration: AiCollaborationSchema,
  key_takeaways: z.array(z.string().min(1).max(400)).max(6).optional(),
}).superRefine((content, ctx) => {
  const ids = new Set(content.approaches.map((a) => a.id))
  if (ids.size !== content.approaches.length) {
    ctx.addIssue({ code: 'custom', message: 'approach ids must be unique' })
  }

  // "Not excessive" gate: at most one stepped (interactive) diagram per solution.
  // A solution that animates every approach is noise; the walkthrough earns its
  // place once, on the approach where the mechanism is the lesson.
  const steppedCount = content.approaches.filter((a) => a.diagram?.kind === 'stepped').length
  if (steppedCount > 1) {
    ctx.addIssue({ code: 'custom', message: `a solution may contain at most one stepped diagram (found ${steppedCount})` })
  }

  // Stepped diagrams only belong on challenge types whose answer is a mechanism
  // that transitions through real states. Product-reasoning types get flow_steps.
  if (steppedCount > 0 && !STEPPED_ELIGIBLE_TYPES.has(content.challenge_type)) {
    ctx.addIssue({ code: 'custom', message: `stepped diagrams are not allowed on ${content.challenge_type} solutions` })
  }
})

export type SolutionApproach = z.infer<typeof SolutionApproachSchema>
export type SolutionContentV1 = z.infer<typeof SolutionContentSchema>
export type SolutionChallengeType = (typeof CHALLENGE_TYPES_WITH_SOLUTIONS)[number]

// ── DB row + API response types ─────────────────────────────────────────────

export interface ChallengeSolutionRow {
  challenge_id: string
  schema_version: number
  content: SolutionContentV1 | null
  generation_status: 'pending' | 'generating' | 'ready' | 'failed'
  generation_started_at: string | null
  generation_error: string | null
  generated_by: 'backfill' | 'lazy' | null
  model: string | null
  created_at: string
  updated_at: string
}

export type SolutionTabResponse =
  | { locked: true; unlock: { needs_attempt: boolean; pro_available: boolean } }
  | { locked: false; status: 'ready'; content: SolutionContentV1 }
  | { locked: false; status: 'none' | 'generating' | 'failed' }

/** Per-type structural expectations, surfaced as validator warnings (not Zod errors). */
export function solutionStructureWarnings(content: SolutionContentV1): string[] {
  const warnings: string[] = []
  const type = content.challenge_type

  if (type === 'algorithm' || type === 'sql') {
    if (content.approaches.length < 2) {
      warnings.push(`${type} solutions should present at least 2 approaches (e.g. brute force then optimal)`)
    }
    for (const approach of content.approaches) {
      if (!approach.code) warnings.push(`approach "${approach.id}" is missing code for a ${type} challenge`)
      if (type === 'algorithm' && !approach.complexity) {
        warnings.push(`approach "${approach.id}" is missing complexity for an algorithm challenge`)
      }
    }
  }

  if (type === 'system_design' || type === 'data_modeling') {
    if (content.approaches.length < 2) {
      warnings.push(`${type} solutions should present at least 2 architecture alternatives`)
    }
    for (const approach of content.approaches) {
      if (!approach.diagram) warnings.push(`approach "${approach.id}" is missing a diagram for a ${type} challenge`)
      if (!approach.tradeoffs || approach.tradeoffs.length === 0) {
        warnings.push(`approach "${approach.id}" is missing tradeoffs for a ${type} challenge`)
      }
      if (approach.code) warnings.push(`approach "${approach.id}" has code on a ${type} challenge; expected architecture prose`)
    }
  }

  if (type === 'flow' || type === 'freeform' || type === 'quick_take') {
    if (!content.approaches.some((a) => a.diagram?.kind === 'flow_steps')) {
      warnings.push(`${type} solutions should include a flow_steps diagram for the reasoning walkthrough`)
    }
    for (const approach of content.approaches) {
      if (approach.code) warnings.push(`approach "${approach.id}" has code on a ${type} challenge`)
    }
  }

  return warnings
}
