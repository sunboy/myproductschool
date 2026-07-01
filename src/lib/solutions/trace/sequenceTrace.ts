/**
 * Deterministic trace harness for the `sequence` stepped-diagram base.
 *
 * The "wrong animation" risk is closed the same way the array and grid harnesses
 * close it: a sequence walkthrough is never authored by the model. We run a
 * CANONICAL traced implementation of a named shape against the challenge's REAL
 * test-case input, record the cursor and pointer movements as the algorithm
 * executes, and emit the step deltas. The trace is a program output, not a
 * creative artifact.
 *
 * Two shapes ship here, both rendering as a LINEAR row of labeled nodes:
 *   - linked-list reversal: the row is the list in its ORIGINAL order; a curr
 *     cursor walks left to right with prev trailing behind, and the visited prefix
 *     is the part already re-pointed. The answer is the reversed value list.
 *   - BST / binary-tree inorder traversal: the row is the nodes in VISIT order
 *     (the inorder sequence itself); the cursor steps through that order one node
 *     at a time, marking each visited as it is emitted. The answer is the inorder
 *     value list. The tree is parsed from a LeetCode level-order array with nulls.
 *
 * To stay honest about correctness we also return the canonical run's final answer
 * (the emitted value list) so the caller can cross-check it against the
 * challenge's own expected output on the same input. If they disagree, the
 * canonical shape is not what this challenge wants, and the challenge is NOT
 * stepped eligible (it keeps a static diagram). We never show a trace for a
 * problem the traced shape does not genuinely solve.
 *
 * The diagram ships with readable per-step prose derived from the verified frames.
 * The generation route MAY overlay model-authored prose (title/explanation/
 * decision/pills) keyed by step index, but the model can never add, remove, or
 * reorder steps or touch a delta; the overlay is fail-soft and the harness prose
 * stands when it does not apply. See graft.ts and buildSteppedSequenceDiagram().
 */

import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

export type SequencePattern = 'reverse_linked_list' | 'inorder_traversal'

/** One recorded transition of the algorithm over the node row. */
export interface SequenceTraceFrame {
  /** The node the cursor sits on this step (index into the displayed node row). */
  activeIndex: number
  /** Nodes processed so far (cumulative), shown in a settled tone. */
  visited?: number[]
  /** Nodes to emphasize this step (e.g. the pair being re-linked). */
  highlight?: number[]
  /** Named pointers over the row (prev/curr/next), each an index into the row. */
  pointers?: Record<string, number>
  /** Machine note describing the move; the model rewrites this into prose. */
  note: string
}

export interface SequenceTraceResult {
  pattern: SequencePattern
  /** The per-node display labels, in the order they are drawn left to right. */
  labels: string[]
  frames: SequenceTraceFrame[]
  /** Final answer the canonical run produced (a value list), for cross-checking. */
  answer: number[]
}

const MIN_NODES = 2
const MAX_NODES = 12
const MAX_FRAMES = 8

/** A short display token for a node value (kept inside the schema's 8-char label limit). */
function nodeLabel(value: number): string {
  return String(value).slice(0, 8)
}

// ── Linked-list reversal ──────────────────────────────────────────────────────

/**
 * Reverse a singly linked list given as a flat value array (head first). The
 * displayed row keeps the ORIGINAL list order, so every recorded index points at
 * a node the renderer actually draws. A curr cursor walks the list head to tail;
 * prev trails one node behind (or sits off the front before the first node); the
 * visited prefix is the portion whose `next` pointer has already been flipped to
 * point backward. The answer is the reversed value list. Returns null when the
 * walk produces fewer than the schema's minimum meaningful frames.
 */
function traceReverseLinkedList(values: number[]): { frames: SequenceTraceFrame[]; answer: number[]; complete: boolean } {
  const frames: SequenceTraceFrame[] = []
  const n = values.length

  // One frame per node: the cursor advances head -> tail, re-pointing each node's
  // link backward. prev is the node just settled (none before the first node).
  for (let curr = 0; curr < n && frames.length < MAX_FRAMES; curr++) {
    const visited: number[] = []
    for (let k = 0; k < curr; k++) visited.push(k)
    const pointers: Record<string, number> = { curr }
    if (curr > 0) pointers.prev = curr - 1
    if (curr < n - 1) pointers.next = curr + 1
    const highlight = curr > 0 ? [curr - 1, curr] : [curr]
    const note = curr === 0
      ? `head node ${values[curr]}: its next pointer becomes null (it will be the new tail)`
      : `node ${values[curr]}: point its next back to node ${values[curr - 1]}`
    frames.push({ activeIndex: curr, visited, highlight, pointers, note })
  }

  // Final settled frame: every node re-pointed, the last node is the new head.
  if (frames.length) {
    const all: number[] = []
    for (let k = 0; k < n; k++) all.push(k)
    frames.push({
      activeIndex: n - 1,
      visited: all,
      pointers: { head: n - 1 },
      note: `all links flipped: node ${values[n - 1]} is the new head`,
    })
  }

  const answer = [...values].reverse()
  // Complete iff we recorded one frame per node plus the settled frame, rather
  // than the per-node loop stopping early at the frame cap.
  const complete = frames.length === n + 1
  return { frames, answer, complete }
}

// ── Binary tree / BST inorder traversal ───────────────────────────────────────

/** A parsed binary tree node (value plus optional children). */
interface TreeNode {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

/**
 * Parse a LeetCode level-order array (with `null` holes) into a binary tree.
 * Slots are consumed breadth-first: the first entry is the root, then each
 * non-null node claims the next two entries as its left and right children. A
 * `null` entry is a missing node and does NOT claim children. Returns null on an
 * empty input (no tree to traverse) or any non-integer/non-null entry.
 */
function parseLevelOrderTree(arr: unknown[]): TreeNode | null {
  if (arr.length === 0) return null
  // Every entry must be an integer or null; anything else is not this shape.
  for (const x of arr) {
    if (x === null) continue
    if (!Number.isInteger(x)) return null
  }
  if (arr[0] === null) return null // a tree cannot have a null root
  const root: TreeNode = { value: arr[0] as number, left: null, right: null }
  const queue: TreeNode[] = [root]
  let i = 1
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift()!
    // Left child.
    if (i < arr.length) {
      const v = arr[i++]
      if (v !== null) {
        node.left = { value: v as number, left: null, right: null }
        queue.push(node.left)
      }
    }
    // Right child.
    if (i < arr.length) {
      const v = arr[i++]
      if (v !== null) {
        node.right = { value: v as number, left: null, right: null }
        queue.push(node.right)
      }
    }
  }
  return root
}

/** The inorder (left, root, right) value sequence of a binary tree. */
function inorderValues(root: TreeNode | null): number[] {
  const out: number[] = []
  const walk = (node: TreeNode | null) => {
    if (!node) return
    walk(node.left)
    out.push(node.value)
    walk(node.right)
  }
  walk(root)
  return out
}

/**
 * Trace an inorder traversal. The displayed row is the inorder sequence itself
 * (left, root, right), so the row order IS the visit order. The cursor steps
 * through positions 0..n-1, marking each node visited as it is emitted. Every
 * recorded index points at a node the renderer draws. The answer is the inorder
 * value list. Returns null when the sequence is too short or too long to display.
 */
function traceInorder(order: number[]): { frames: SequenceTraceFrame[]; answer: number[]; complete: boolean } {
  const frames: SequenceTraceFrame[] = []
  const n = order.length

  for (let i = 0; i < n && frames.length < MAX_FRAMES; i++) {
    const visited: number[] = []
    for (let k = 0; k <= i; k++) visited.push(k)
    const note = i === 0
      ? `inorder starts at the leftmost node: visit ${order[i]}`
      : `next in order: visit ${order[i]} (right of ${order[i - 1]}, or up to an unvisited parent)`
    frames.push({ activeIndex: i, visited, highlight: [i], pointers: { visit: i }, note })
  }

  // Complete iff every node in the inorder sequence was visited, not the cap.
  const complete = frames.length === n
  return { frames, answer: order, complete }
}

// ── Public runners ────────────────────────────────────────────────────────────

/**
 * Run a canonical sequence pattern over a flat value array.
 *
 * - reverse_linked_list: `input` is the linked list as a head-first value array.
 * - inorder_traversal: `input` is a LeetCode level-order tree array (with nulls);
 *   it is parsed into a tree and the inorder visit sequence becomes the node row.
 *
 * Returns null when the input is unusable for a clean walkthrough (the displayed
 * node row falls outside [2, 12] nodes, the run never reached a terminal state, or
 * it produced fewer than 3 frames). The displayed-node-row bound is what keeps
 * every emitted index in range of what the renderer draws.
 */
export function runSequenceTrace(pattern: SequencePattern, input: unknown[]): SequenceTraceResult | null {
  if (pattern === 'reverse_linked_list') {
    if (!input.every((v) => Number.isInteger(v))) return null
    const values = input as number[]
    if (values.length < MIN_NODES || values.length > MAX_NODES) return null
    const run = traceReverseLinkedList(values)
    if (!run.complete) return null
    if (run.frames.length < 3) return null
    return { pattern, labels: values.map(nodeLabel), frames: run.frames, answer: run.answer }
  }

  // inorder_traversal: parse the tree, then trace its inorder sequence. The row is
  // the visit order, so its length (and the index bounds) come from the traversal.
  const root = parseLevelOrderTree(input)
  if (!root) return null
  const order = inorderValues(root)
  if (order.length < MIN_NODES || order.length > MAX_NODES) return null
  const run = traceInorder(order)
  if (!run.complete) return null
  if (run.frames.length < 3) return null
  return { pattern, labels: order.map(nodeLabel), frames: run.frames, answer: run.answer }
}

/**
 * Compute a pattern's TRUE answer on an input as a value list, uncapped by the
 * display frame limit. The cross-check oracle for the sequence patterns. Returns
 * null on input that cannot be parsed into a node sequence.
 */
export function computeSequenceAnswer(pattern: SequencePattern, input: unknown[]): number[] | null {
  if (pattern === 'reverse_linked_list') {
    if (!input.every((v) => Number.isInteger(v))) return null
    if (input.length < 1) return null
    return [...(input as number[])].reverse()
  }
  const root = parseLevelOrderTree(input)
  if (!root) return null
  return inorderValues(root)
}

/**
 * Readable per-step prose for the sequence walkthrough, derived deterministically
 * from the verified frame. This is the prose the learner reads when the model
 * supplies no overlay (or when its prose fails to match the trace step count): a
 * meaningful title and a full-sentence explanation, never a raw machine note.
 *
 * The generation route MAY replace title/explanation/decision/pills by step index
 * with model-authored prose (see graft.ts); these readable defaults stand whenever
 * that overlay does not apply. The deltas are never touched here.
 */
function sequenceStepProse(
  pattern: SequencePattern,
  frame: SequenceTraceFrame,
  index: number,
  total: number,
): { title: string; explanation: string } {
  const isLast = index === total - 1
  if (pattern === 'reverse_linked_list') {
    if (isLast) {
      return {
        title: 'New head settled',
        explanation: `Every node now points to the one before it instead of the one after. The node that was the tail is the new head, so the list reads in reverse.`,
      }
    }
    if (index === 0) {
      return {
        title: 'Detach the head',
        explanation: `Start at the head and set its next pointer to null. The old head becomes the eventual tail, so its link must terminate the reversed list.`,
      }
    }
    return {
      title: 'Flip the next pointer',
      explanation: `Redirect this node's next pointer to the node just behind it, then advance. Each step re-links one node backward without losing the rest of the list, because the next node was captured before the flip.`,
    }
  }
  // inorder_traversal
  if (index === 0) {
    return {
      title: 'Start at the leftmost node',
      explanation: `Inorder visits the entire left subtree before a node, so the walk dives left as far as it can and emits the leftmost node first.`,
    }
  }
  if (isLast) {
    return {
      title: 'Traversal complete',
      explanation: `Every node has been emitted in left, root, right order. The highlighted row is the full inorder sequence, which for a binary search tree is sorted.`,
    }
  }
  return {
    title: 'Visit the next node',
    explanation: `With a node's left subtree exhausted, emit the node itself, then move into its right subtree. The cursor lands on the next node the left-root-right rule reaches.`,
  }
}

/**
 * Assemble a schema-valid InteractiveStepDiagram from a verified sequence trace.
 * The per-step prose here is a readable deterministic fallback (meaningful titles,
 * full-sentence explanations) derived from the verified frame; the generation
 * route MAY replace title/explanation/decision/pills with model-authored prose
 * keyed to the same step indices (see graft.ts), leaving the deltas (the thing
 * that could be wrong) untouched. When no model prose lands, these defaults stand.
 */
export function buildSteppedSequenceDiagram(
  trace: SequenceTraceResult,
  opts: { title?: string } = {},
): InteractiveStepDiagram {
  const total = trace.frames.length
  const steps = trace.frames.map((frame, i) => {
    const prose = sequenceStepProse(trace.pattern, frame, i, total)
    return {
      title: prose.title,
      explanation: prose.explanation,
      decision: frame.note.includes(':') ? frame.note.split(':').slice(1).join(':').trim() : undefined,
      pills: Object.entries(frame.pointers ?? {}).map(([label, value]) => ({
        label,
        value: trace.labels[value] ?? String(value),
        tone: label === 'curr' || label === 'visit' ? ('active' as const) : ('neutral' as const),
      })),
      delta: {
        base: 'sequence' as const,
        activeIndex: frame.activeIndex,
        visited: frame.visited,
        highlight: frame.highlight,
        pointers: frame.pointers,
      },
    }
  })

  return {
    kind: 'stepped',
    title: opts.title,
    base: {
      kind: 'sequence',
      nodes: trace.labels.map((label, i) => ({ id: `n${i}`, label })),
    },
    trace_verified: true,
    autoplay: false,
    steps,
  }
}

// ── Metadata-driven entry point ───────────────────────────────────────────────

interface VisibleTestCase {
  id?: string
  label?: string
  args?: unknown[]
  input?: unknown
  expected?: unknown
  hidden?: boolean
  is_hidden?: boolean
  input_types?: unknown
}

const SEQUENCE_PATTERN_TAGS: Record<string, SequencePattern> = {
  'reverse-linked-list': 'reverse_linked_list',
  'reverse_linked_list': 'reverse_linked_list',
  'reverse linked list': 'reverse_linked_list',
  'linked-list': 'reverse_linked_list',
  'linked_list': 'reverse_linked_list',
  'linked list': 'reverse_linked_list',
  'inorder': 'inorder_traversal',
  'inorder-traversal': 'inorder_traversal',
  'inorder traversal': 'inorder_traversal',
  'in-order': 'inorder_traversal',
  'bst': 'inorder_traversal',
  'binary-search-tree': 'inorder_traversal',
  'binary search tree': 'inorder_traversal',
  'binary-tree': 'inorder_traversal',
  'binary tree': 'inorder_traversal',
  'tree-traversal': 'inorder_traversal',
  'tree traversal': 'inorder_traversal',
  'traversal': 'inorder_traversal',
}

/**
 * The ONE canonical technique_tag the auto-tagger writes for each sequence pattern
 * it recognizes. Every value re-detects to its key through SEQUENCE_PATTERN_TAGS
 * (write the canonical tag, and detectSequencePattern routes it back to the same
 * pattern), so an eager tagger can emit exactly the tag that makes the walkthrough
 * eligible on the next view.
 */
export const SEQUENCE_PATTERN_TO_CANONICAL_TAG: Record<SequencePattern, string> = {
  reverse_linked_list: 'reverse-linked-list',
  inorder_traversal: 'inorder-traversal',
}

/**
 * Infer the sequence pattern from technique/topic tags. The 'linked-list' family
 * maps to reversal (the one linked-list shape this harness traces); a generic
 * tree/traversal tag maps to inorder. A challenge tagged for a different shape
 * (a list problem that is not a reversal, a preorder/postorder traversal) will
 * fail the cross-check downstream because the emitted answer will not match its
 * expected output, so a misroute is rejected, never animated wrongly.
 */
export function detectSequencePattern(tags: string[]): SequencePattern | null {
  for (const tag of tags) {
    const hit = SEQUENCE_PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) return hit
  }
  return null
}

/**
 * Pull the node-sequence input out of a visible test case. Both shapes take a
 * single array first argument:
 *   - reverse_linked_list: a flat head-first value array, e.g. [1,2,3,4,5].
 *   - inorder_traversal: a LeetCode level-order tree array with nulls, e.g.
 *     [1,null,2,3].
 * Returns null when the first argument is not an array.
 */
function extractSequenceInput(tc: VisibleTestCase): unknown[] | null {
  const args = Array.isArray(tc.args) ? tc.args : (Array.isArray(tc.input) ? (tc.input as unknown[]) : null)
  if (!args || args.length === 0) return null
  const firstArray = args.find((a) => Array.isArray(a)) as unknown[] | undefined
  if (!firstArray) return null
  return firstArray
}

/** Two value lists agree iff they are the same length with the same numbers in order. */
function answersAgree(canonical: number[], expected: unknown): boolean {
  if (!Array.isArray(expected)) return false
  if (canonical.length !== expected.length) return false
  const e = expected.map(Number)
  if (e.some((v) => Number.isNaN(v))) return false
  return canonical.every((v, i) => v === e[i])
}

export interface SteppedSequenceCandidate {
  diagram: InteractiveStepDiagram
  pattern: SequencePattern
}

/**
 * Build a verified stepped-sequence diagram for a linked-list or tree-traversal
 * algorithm challenge, or null if it is not eligible. Pure (no DB): callers pass
 * the metadata + tags they already have.
 *
 * Eligibility mirrors the array and grid harnesses: recognize a supported shape,
 * run its canonical implementation on a real visible test case, and cross-check
 * the emitted value list against EVERY extractable case's `expected`. Any
 * disagreement, missing oracle, or unusable input means no stepped diagram (the
 * solution keeps its static diagram). The model never authors the deltas.
 */
export function buildSteppedSequenceFromMetadata(
  metadata: Record<string, unknown>,
  tags: string[],
): SteppedSequenceCandidate | null {
  const pattern = detectSequencePattern(tags)
  if (!pattern) return null

  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden)

  let diagramTrace: SequenceTraceResult | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const input = extractSequenceInput(tc)
    if (!input) continue // case shape we cannot map to this pattern; ignore it
    if (tc.expected === undefined) return null // an extractable case with no oracle: cannot certify

    const answer = computeSequenceAnswer(pattern, input)
    if (answer === null || !answersAgree(answer, tc.expected)) return null
    certifiedCount++

    if (!diagramTrace) {
      const trace = runSequenceTrace(pattern, input)
      if (trace) diagramTrace = trace
    }
  }

  if (certifiedCount === 0 || !diagramTrace) return null
  return { diagram: buildSteppedSequenceDiagram(diagramTrace), pattern }
}
