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

export const SolutionDiagramSchema = z.discriminatedUnion('kind', [
  FlowStepsDiagramSchema,
  ArchitectureDiagramSchema,
  ComparisonBarsDiagramSchema,
  ComplexityCurvesDiagramSchema,
  SchemaTablesDiagramSchema,
])

export type SolutionDiagram = z.infer<typeof SolutionDiagramSchema>
export type FlowStepsDiagram = z.infer<typeof FlowStepsDiagramSchema>
export type ArchitectureDiagram = z.infer<typeof ArchitectureDiagramSchema>
export type ComparisonBarsDiagram = z.infer<typeof ComparisonBarsDiagramSchema>
export type ComplexityCurvesDiagram = z.infer<typeof ComplexityCurvesDiagramSchema>
export type SchemaTablesDiagram = z.infer<typeof SchemaTablesDiagramSchema>

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
