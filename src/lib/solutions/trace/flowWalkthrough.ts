/**
 * AUTHORED design-flow harness for the `flow` stepped-diagram base.
 *
 * Unlike the array/pipeline harnesses, the flow base asserts NO computed state:
 * it only labels a request path through named nodes and lights one per step. So
 * this builder does NOT execute anything and the emitted diagram is NOT marked
 * trace_verified (flow is not a VERIFIED_STEPPED_BASE). It is still SERVER-owned:
 * the structure is derived deterministically from the optimal approach's existing
 * `architecture` diagram, never authored free-form by the model. That keeps one
 * consistent path: the stepped diagram is always assembled here, and the model
 * (or the Integrate step) only rewrites the per-step prose over a fixed shape.
 *
 * Determinism: node order is derived from the architecture edges via a stable
 * topological-ish sort that floats client/external roles to the front and
 * store/queue roles to the back, breaking ties by the architecture's own node
 * order. The same architecture always yields the same walkthrough.
 */

import {
  InteractiveStepDiagramSchema,
  type InteractiveStepDiagram,
  type SolutionContentV1,
  type ArchitectureDiagram,
} from '@/lib/solutions/schema'

export interface SteppedFlowResult {
  /** The schema-valid flow walkthrough; prose is a deterministic placeholder. */
  diagram: InteractiveStepDiagram
}

// Flow base limits (mirrors FlowStageSchema in schema.ts).
const MAX_NODES = 8
const MIN_NODES = 2
const FLOW_NODE_ID_MAX = 40
const FLOW_NODE_LABEL_MAX = 60
const STEP_TITLE_MAX = 80
const STEP_EXPLANATION_MAX = 320
const STEP_DECISION_MAX = 120
// The stepped envelope requires at least 3 steps. We emit one step per node, so
// a 2-node flow gets a trailing recap step to clear that floor.
const MIN_STEPS = 3

type ArchNode = ArchitectureDiagram['nodes'][number]
type ArchEdge = ArchitectureDiagram['edges'][number]

/** Roles that belong at the front of a request path (the caller / outside world). */
const HEAD_ROLES = new Set(['client', 'external'])
/** Roles that belong at the tail (where data comes to rest). */
const TAIL_ROLES = new Set(['store', 'queue'])

function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max)
}

/**
 * Find the optimal approach's architecture diagram. The optimal approach is the
 * last one by the brute-force -> optimal convention used across the solutions
 * system. Returns null when that approach carries no architecture diagram.
 */
function optimalArchitecture(content: SolutionContentV1): ArchitectureDiagram | null {
  if (content.approaches.length === 0) return null
  const optimal = content.approaches[content.approaches.length - 1]
  const diagram = optimal.diagram
  if (!diagram || diagram.kind !== 'architecture') return null
  return diagram
}

/**
 * Order the architecture nodes into a single request path.
 *
 * The order is fully determined by the architecture, so it never varies run to
 * run. We start from a role bucket (head roles first, plain service nodes next,
 * tail roles last) and, within that, follow the edge graph: a node is emitted
 * only after the nodes that point INTO it, falling back to the architecture's
 * declared node order whenever the graph is ambiguous or cyclic. The result is a
 * de-duplicated linear walk that visits every node exactly once.
 */
function orderNodes(nodes: ArchNode[], edges: ArchEdge[]): ArchNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const indexOf = new Map(nodes.map((n, i) => [n.id, i]))

  // Incoming-edge count drives the topological preference; tie-break by bucket
  // then by the node's declared position so the sort is total and stable.
  const indegree = new Map<string, number>(nodes.map((n) => [n.id, 0]))
  for (const e of edges) {
    if (byId.has(e.from) && byId.has(e.to) && e.from !== e.to) {
      indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1)
    }
  }

  function bucket(n: ArchNode): number {
    if (HEAD_ROLES.has(n.role ?? '')) return 0
    if (TAIL_ROLES.has(n.role ?? '')) return 2
    return 1
  }

  // Adjacency for the topological walk (forward edges only, no self-loops).
  const out = new Map<string, string[]>(nodes.map((n) => [n.id, []]))
  const liveIndegree = new Map(indegree)
  for (const e of edges) {
    if (byId.has(e.from) && byId.has(e.to) && e.from !== e.to) {
      out.get(e.from)!.push(e.to)
    }
  }

  // A node is "ready" when all its incoming edges have been consumed. Among ready
  // nodes we always pick the smallest bucket, then the earliest declared index,
  // so the choice is deterministic and front-loads clients, back-loads stores.
  const result: ArchNode[] = []
  const placed = new Set<string>()

  function pickReady(): ArchNode | null {
    let best: ArchNode | null = null
    for (const n of nodes) {
      if (placed.has(n.id)) continue
      if ((liveIndegree.get(n.id) ?? 0) > 0) continue
      if (best === null || rank(n) < rank(best)) best = n
    }
    return best
  }

  function rank(n: ArchNode): number {
    // Composite key: bucket dominates, then declared index. Both are bounded.
    return bucket(n) * 1000 + (indexOf.get(n.id) ?? 0)
  }

  while (result.length < nodes.length) {
    let next = pickReady()
    if (!next) {
      // No node has zero remaining indegree (a cycle, or disconnected remainder).
      // Fall back to the lowest-rank unplaced node so we still make progress.
      for (const n of nodes) {
        if (placed.has(n.id)) continue
        if (next === null || rank(n) < rank(next)) next = n
      }
    }
    if (!next) break
    placed.add(next.id)
    result.push(next)
    for (const to of out.get(next.id) ?? []) {
      liveIndegree.set(to, Math.max(0, (liveIndegree.get(to) ?? 0) - 1))
    }
  }

  return result
}

/** Default per-node prose. Coherent sentences, no AI-slop, no em dashes. */
function placeholderExplanation(node: ArchNode, position: number, total: number): string {
  const label = node.label
  const sub = node.sublabel ? ` ${node.sublabel}.` : ''
  if (position === 0) {
    return clamp(`The request starts at ${label}, the entry point for this flow.${sub}`, STEP_EXPLANATION_MAX)
  }
  if (position === total - 1) {
    return clamp(`The path ends at ${label}, where the work for this request settles.${sub}`, STEP_EXPLANATION_MAX)
  }
  return clamp(`The request reaches ${label}, which handles its part of the work before passing control on.${sub}`, STEP_EXPLANATION_MAX)
}

function placeholderDecision(node: ArchNode): string | undefined {
  if (!node.role) return undefined
  const map: Record<string, string> = {
    client: 'Originates the request',
    external: 'Outside dependency in the path',
    service: 'Processes and routes the request',
    store: 'Reads or writes durable state',
    queue: 'Buffers work for async handling',
  }
  const text = map[node.role]
  return text ? clamp(text, STEP_DECISION_MAX) : undefined
}

/**
 * Build an authored flow walkthrough from a system_design/data_modeling
 * solution, or null when one cannot be derived deterministically.
 *
 * Returns null when:
 *  - the optimal approach has no `architecture` diagram, or it has fewer than 2
 *    nodes (nothing to walk), or
 *  - a sensible single-path ordering cannot be produced (no nodes survive the
 *    de-dup / clamp pass).
 *
 * The emitted diagram is schema-valid (validated by the caller and in tests) and
 * carries placeholder prose; it is NOT trace_verified because the flow base
 * asserts no computed state.
 */
export function buildSteppedFlowFromContent(
  content: SolutionContentV1,
  _metadata?: Record<string, unknown> | null,
): SteppedFlowResult | null {
  // Flow walkthroughs are only meaningful for the design challenge types.
  if (content.challenge_type !== 'system_design' && content.challenge_type !== 'data_modeling') {
    return null
  }

  const arch = optimalArchitecture(content)
  if (!arch || arch.nodes.length < MIN_NODES) return null

  const ordered = orderNodes(arch.nodes, arch.edges)

  // Map architecture nodes to flow base nodes, clamping to flow limits and
  // dropping duplicate ids that survive clamping. Cap at MAX_NODES (the schema
  // ceiling); a longer path keeps its head, which is the part learners read.
  const seen = new Set<string>()
  const flowNodes: { id: string; label: string }[] = []
  for (const n of ordered) {
    const id = clamp(n.id, FLOW_NODE_ID_MAX)
    if (seen.has(id)) continue
    seen.add(id)
    flowNodes.push({ id, label: clamp(n.label, FLOW_NODE_LABEL_MAX) })
    if (flowNodes.length >= MAX_NODES) break
  }

  if (flowNodes.length < MIN_NODES) return null

  // One step per node, accumulating the visited path. The active node's id is the
  // clamped id, so it always matches a base node.
  const orderedById = new Map(ordered.map((n) => [clamp(n.id, FLOW_NODE_ID_MAX), n]))
  const total = flowNodes.length
  const visitedSoFar: string[] = []
  const steps = flowNodes.map((fn, i) => {
    const archNode = orderedById.get(fn.id)!
    visitedSoFar.push(fn.id)
    return {
      title: clamp(fn.label, STEP_TITLE_MAX),
      explanation: placeholderExplanation(archNode, i, total),
      decision: placeholderDecision(archNode),
      delta: {
        base: 'flow' as const,
        activeNode: fn.id,
        visited: [...visitedSoFar],
      },
    }
  })

  // Clear the 3-step floor for a 2-node flow with a trailing recap step that
  // re-lights the final node (everything is already visited at that point).
  while (steps.length < MIN_STEPS) {
    const last = flowNodes[flowNodes.length - 1]
    steps.push({
      title: clamp('Request complete', STEP_TITLE_MAX),
      explanation: clamp('The request has traveled the full path and the response can return to the caller.', STEP_EXPLANATION_MAX),
      decision: undefined,
      delta: {
        base: 'flow' as const,
        activeNode: last.id,
        visited: flowNodes.map((n) => n.id),
      },
    })
  }

  const diagram: InteractiveStepDiagram = {
    kind: 'stepped',
    title: arch.title ? clamp(arch.title, 200) : 'Request walkthrough',
    base: { kind: 'flow', nodes: flowNodes },
    autoplay: false,
    steps,
  }

  // Self-validate so a malformed shape never escapes this builder. The caller
  // (Integrate) re-validates too, but failing here keeps the contract local.
  const parsed = InteractiveStepDiagramSchema.safeParse(diagram)
  if (!parsed.success) return null
  return { diagram: parsed.data }
}
