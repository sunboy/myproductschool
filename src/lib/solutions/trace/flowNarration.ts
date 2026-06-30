/**
 * NARRATION layer for the design-flow stepped walkthrough.
 *
 * The flow STRUCTURE (ordered nodes + the visited path) is built deterministically
 * by `buildSteppedFlowFromContent` in flowWalkthrough.ts and never changes here.
 * This module only produces richer PER-STEP PROSE that gets overlaid onto that fixed
 * structure BY INDEX, the same overlay seam the model-prose path already uses.
 *
 * Why a dedicated narrator: the deterministic placeholder reads like a template
 * ("X handles its part of the work before passing control on"). It says nothing
 * about the actual engineering decision happening at each hop. The narrator binds
 * the prose to the REAL architecture: the node's sublabel, its role, and the real
 * edges into and out of it (the dedup check, the chunked upload, the re-price at
 * checkout, the write-then-emit). The result is grounded, not generic.
 *
 * Two callers share `buildFlowNarrationContext`:
 *   - the LIVE path (graft.ts) via `narrateFlowViaApi`, which calls the model;
 *   - the BACKFILL sub-agent narrator (next phase), which feeds the same prompt
 *     to a CLI sub-agent and parses with `parseFlowNarration`.
 *
 * Fail-soft everywhere: a null return means the caller keeps the deterministic
 * placeholder prose. The narrator can never change structure, deltas, or ordering.
 */

import {
  type SolutionContentV1,
  type ArchitectureDiagram,
} from '@/lib/solutions/schema'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { buildSteppedFlowFromContent } from './flowWalkthrough'

// Field caps mirror InteractiveStepDiagramSchema's step fields, so parsed prose
// always survives the schema re-validation the overlay does downstream.
const TITLE_MAX = 80
const EXPLANATION_MAX = 320
const DECISION_MAX = 120

const DEFAULT_NARRATION_MODEL = 'claude-sonnet-4-6'
const NARRATION_MAX_TOKENS = 1500

/** The per-step prose the narrator returns, index-aligned to the flow nodes. */
export interface StepProse {
  title: string
  explanation: string
  decision?: string
}

/** One node in the request path, paired with its source architecture metadata. */
export interface NarrationNode {
  /** Flow base node id (clamped architecture id). */
  id: string
  /** Flow base node label. */
  label: string
  /** The architecture node's sublabel (the "what it does" line), if present. */
  sublabel?: string
  /** The architecture node's role: client/service/store/queue/external. */
  role?: string
}

/** A real architecture edge in the optimal approach, with its label preserved. */
export interface NarrationEdge {
  from: string
  to: string
  label?: string
}

/**
 * The full context bundle the narrator needs: the ordered node path, the real
 * edges, and the surrounding solution prose. Built once by
 * `buildFlowNarrationContext` and reused by the live + backfill narrators.
 */
export interface FlowNarrationContext {
  /** Ordered request-path nodes, index-aligned to the walkthrough steps. */
  nodes: NarrationNode[]
  /** Every edge from the optimal approach's architecture diagram. */
  edges: NarrationEdge[]
  /** The challenge title (for grounding). */
  challengeTitle?: string
  /** The challenge prompt / scenario, if available. */
  challengePrompt?: string
  /** Solution framing prose. */
  overviewMd: string
  /** The optimal approach's title. */
  optimalTitle: string
  /** The optimal approach's body prose. */
  optimalBodyMd: string
  /** The optimal approach's stated tradeoffs (gain vs cost pairs). */
  tradeoffs: { gain: string; cost: string }[]
}

function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max)
}

/** Strip em dashes (and the spaced variant) to keep the writing-style ban. */
function stripEmDashes(s: string): string {
  return s.replace(/\s*[—–]\s*/g, ', ')
}

function optimalArchitecture(content: SolutionContentV1): ArchitectureDiagram | null {
  if (content.approaches.length === 0) return null
  const optimal = content.approaches[content.approaches.length - 1]
  const diagram = optimal.diagram
  if (!diagram || diagram.kind !== 'architecture') return null
  return diagram
}

/**
 * Extract the ordered-node + edges + solution-context bundle from a solution.
 *
 * The node ORDER must match the walkthrough's step order, so it reuses the exact
 * same deterministic ordering and clamping `buildSteppedFlowFromContent` applies
 * (head roles to the front, store/queue to the back, edge-graph in between, cap at
 * 8 nodes). We import the structure builder rather than re-deriving it, so the two
 * never drift: if the structure changes its order, the narration follows.
 *
 * Returns null when the optimal approach carries no usable architecture (the same
 * cases where the structure builder returns null), so the narrator is skipped.
 */
export function buildFlowNarrationContext(
  content: SolutionContentV1,
  options?: { challengeTitle?: string; challengePrompt?: string },
): FlowNarrationContext | null {
  if (content.challenge_type !== 'system_design' && content.challenge_type !== 'data_modeling') {
    return null
  }

  // flowWalkthrough imports nothing from this module, so the static import is
  // cycle-free. Reuse its structure builder so the node order can never drift.
  const structure = buildSteppedFlowFromContent(content)
  if (!structure) return null

  const arch = optimalArchitecture(content)
  if (!arch) return null

  const archById = new Map(arch.nodes.map((n) => [n.id, n]))
  // The flow base node ids are clamped architecture ids; match them back to the
  // architecture node by trying the exact id, then the clamped lookup.
  const base = structure.diagram.base
  if (base.kind !== 'flow') return null

  const nodes: NarrationNode[] = base.nodes.map((fn) => {
    // Architecture ids are <= 60 chars; flow ids clamp to 40. Find the source
    // node by exact id, else by the architecture id that clamps to this flow id.
    const arched =
      archById.get(fn.id) ??
      arch.nodes.find((n) => n.id.slice(0, fn.id.length) === fn.id)
    return {
      id: fn.id,
      label: fn.label,
      sublabel: arched?.sublabel,
      role: arched?.role,
    }
  })

  const edges: NarrationEdge[] = arch.edges.map((e) => ({
    from: e.from,
    to: e.to,
    label: e.label,
  }))

  const optimal = content.approaches[content.approaches.length - 1]

  return {
    nodes,
    edges,
    challengeTitle: options?.challengeTitle,
    challengePrompt: options?.challengePrompt,
    overviewMd: content.overview_md,
    optimalTitle: optimal.title,
    optimalBodyMd: optimal.body_md,
    tradeoffs: optimal.tradeoffs ?? [],
  }
}

/** Render the edge list as `from->to (label)` lines for the prompt. */
function describeEdges(edges: NarrationEdge[]): string {
  if (edges.length === 0) return '(no edges declared)'
  return edges
    .map((e) => (e.label ? `${e.from}->${e.to} (${e.label})` : `${e.from}->${e.to}`))
    .join('\n')
}

/** Render the ordered node path for the prompt, numbered to match step indices. */
function describeNodes(nodes: NarrationNode[]): string {
  return nodes
    .map((n, i) => {
      const parts = [`${i}. id="${n.id}" label="${n.label}"`]
      if (n.role) parts.push(`role=${n.role}`)
      if (n.sublabel) parts.push(`does: ${n.sublabel}`)
      return parts.join(' | ')
    })
    .join('\n')
}

/**
 * Build the { system, user } prompt for the flow narrator. Pure: no I/O, no model
 * call. The system block carries the role + the writing-style bans + the strict
 * output contract; the user block carries the grounded context for this challenge.
 *
 * The instruction is explicit: narrate the request flow step by step, one step per
 * node IN THE GIVEN ORDER, and at each node name the ACTUAL engineering decision
 * using the real edges + sublabels. Generic "handles its part of the work" is
 * banned. Output is strict JSON with exactly N index-aligned entries.
 */
export function buildFlowNarrationPrompt(args: FlowNarrationContext): {
  system: string
  user: string
} {
  const n = args.nodes.length

  const system = [
    'You narrate a request walkthrough across a real system architecture for engineers studying a solution.',
    'You are given an ordered list of nodes (the request path) and the real edges between them.',
    'Narrate the flow STEP BY STEP, one step per node, in the EXACT order given. Step i describes node i.',
    '',
    'Each step must name the ACTUAL engineering decision happening at that node, grounded in the real edges and the node sublabel.',
    'Use the concrete move at that hop: a dedup-index check, a chunked upload, a pre-signed URL handoff, a re-price at checkout,',
    'an mTLS handshake, an xDS config stream, a write-then-emit-event, a CDN cache miss falling through to origin, a read-replica',
    'fan-out, the consistency choice, the rate-limit decision, or wherever the real bottleneck sits. Read the edge labels and',
    'sublabels and say what THIS node decides or does, not a generic "handles its part of the work before passing control on".',
    '',
    'Per step, return:',
    `- title: a crisp action label, <= ${TITLE_MAX} chars. An action, like "Check the dedup index", not just the node name.`,
    `- explanation: <= ${EXPLANATION_MAX} chars. Name the real decision at this node using the edges + sublabel. Concrete, specific.`,
    `- decision (optional): <= ${DECISION_MAX} chars. The ONE sharp tradeoff or reason this node exists in the path.`,
    '',
    'Writing style (hard rules, enforced):',
    '- No em dashes. Use a comma or a period.',
    '- No AI slop. Never use: delve, leverage, utilize, holistic, robust, seamlessly, ensure, tailored, navigate, unlock,',
    '  landscape, in order to, as well as, cutting-edge, revolutionary, game-changing, it is worth noting.',
    '- Coherent full sentences in explanation. No fragment-style telegraphing.',
    '- Write like an opinionated staff engineer thinking out loud. Direct and specific, not academic or corporate.',
    '- Do not name any AI vendor, model, or assistant. Do not mention Claude, Anthropic, GPT, or similar.',
    '',
    'Output STRICT JSON and nothing else, no prose around it, no code fences:',
    '{ "steps": [ { "title": "...", "explanation": "...", "decision": "..." }, ... ] }',
    `The steps array MUST have EXACTLY ${n} entries, index-aligned to the node order given. decision may be omitted per step.`,
  ].join('\n')

  const userParts: string[] = []
  if (args.challengeTitle) userParts.push(`CHALLENGE: ${args.challengeTitle}`)
  if (args.challengePrompt) userParts.push(`PROMPT:\n${args.challengePrompt}`)
  userParts.push(`WHAT THIS PROBLEM TESTS:\n${args.overviewMd}`)
  userParts.push(`OPTIMAL APPROACH: ${args.optimalTitle}\n${args.optimalBodyMd}`)
  if (args.tradeoffs.length > 0) {
    userParts.push(
      'TRADEOFFS OF THE OPTIMAL APPROACH:\n' +
        args.tradeoffs.map((t) => `- gain: ${t.gain} | cost: ${t.cost}`).join('\n'),
    )
  }
  userParts.push(`REQUEST PATH (${n} nodes, narrate one step each IN THIS ORDER):\n${describeNodes(args.nodes)}`)
  userParts.push(`REAL EDGES (from->to with the real edge label):\n${describeEdges(args.edges)}`)
  userParts.push(
    `Return strict JSON with exactly ${n} steps, index-aligned to the request path above. Ground every explanation in the edges + sublabels.`,
  )

  return { system, user: userParts.join('\n\n') }
}

/**
 * Pull the first JSON object out of a model reply, tolerant of code fences and of
 * leading/trailing prose. Returns the parsed value or null.
 */
function extractJson(text: string): unknown {
  if (!text) return null
  // Strip a leading ```json / ``` fence and a trailing fence if present.
  let body = text.trim()
  const fence = body.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fence) body = fence[1].trim()

  // Try a straight parse first; fall back to slicing the outermost { ... }.
  try {
    return JSON.parse(body)
  } catch {
    const start = body.indexOf('{')
    const end = body.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      return JSON.parse(body.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

/**
 * Validate + normalize a narrator reply into StepProse[].
 *
 * Returns null (fail-soft) on ANY shape mismatch so the caller keeps the
 * deterministic placeholder prose. On success it:
 *  - requires a `steps` array of EXACTLY `expectedCount` entries,
 *  - requires each entry to have a non-empty `title` and `explanation`,
 *  - clamps title/explanation/decision to the schema field caps,
 *  - strips em dashes from every field,
 *  - drops a blank/whitespace-only `decision`.
 */
export function parseFlowNarration(text: string, expectedCount: number): StepProse[] | null {
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object') return null

  const stepsRaw = (parsed as { steps?: unknown }).steps
  if (!Array.isArray(stepsRaw)) return null
  if (stepsRaw.length !== expectedCount) return null

  const out: StepProse[] = []
  for (const entry of stepsRaw) {
    if (!entry || typeof entry !== 'object') return null
    const e = entry as { title?: unknown; explanation?: unknown; decision?: unknown }
    if (typeof e.title !== 'string' || typeof e.explanation !== 'string') return null

    const title = clamp(stripEmDashes(e.title).trim(), TITLE_MAX)
    const explanation = clamp(stripEmDashes(e.explanation).trim(), EXPLANATION_MAX)
    if (title.length === 0 || explanation.length === 0) return null

    const step: StepProse = { title, explanation }
    if (typeof e.decision === 'string') {
      const decision = clamp(stripEmDashes(e.decision).trim(), DECISION_MAX)
      if (decision.length > 0) step.decision = decision
    }
    out.push(step)
  }

  return out
}

/**
 * LIVE-path narrator: build the prompt from the context bundle, call the model,
 * parse, and return StepProse[] index-aligned to the request path, or null on any
 * failure (no context, empty reply, parse mismatch, thrown error). Fail-soft so
 * the caller keeps the deterministic placeholder prose.
 */
export async function narrateFlowViaApi(
  args: FlowNarrationContext,
  options?: { model?: string },
): Promise<StepProse[] | null> {
  if (args.nodes.length === 0) return null
  const { system, user } = buildFlowNarrationPrompt(args)
  try {
    const message = await createCachedMessage(system, user, {
      model: options?.model ?? DEFAULT_NARRATION_MODEL,
      max_tokens: NARRATION_MAX_TOKENS,
    })
    const block = message.content.find((b) => b.type === 'text')
    const text = block && 'text' in block ? block.text : ''
    return parseFlowNarration(text, args.nodes.length)
  } catch {
    return null
  }
}
