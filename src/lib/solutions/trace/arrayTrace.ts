/**
 * Deterministic trace harness for the `array` stepped-diagram base.
 *
 * The "wrong animation" risk is closed here: an array walkthrough is never
 * authored by the model. We run a CANONICAL traced implementation of a named
 * pattern (binary search, two pointers, sliding window) against the challenge's
 * REAL test-case input, record the pointer movements as the algorithm executes,
 * and emit the step deltas. The trace is a program output, not a creative artifact.
 *
 * To stay honest about correctness we also return the canonical run's final
 * answer so the caller can cross-check it against the challenge's reference
 * solution output on the same input. If they disagree, the canonical pattern is
 * not what this challenge actually wants, and the challenge is NOT stepped
 * eligible (it keeps a static diagram). We never show a trace for a problem the
 * traced pattern does not genuinely solve.
 *
 * The model later writes only per-step prose (title/explanation/decision/pills)
 * keyed to a step index it cannot invent. See buildSteppedArrayDiagram().
 */

import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

export type ArrayPattern = 'binary_search' | 'two_pointers' | 'sliding_window'

/** One recorded transition of the algorithm over the array. */
export interface ArrayTraceFrame {
  pointerAt: Record<string, number>
  discarded?: number[]
  highlight?: number[]
  found?: boolean
  /** Machine note describing the move; the model rewrites this into prose. */
  note: string
}

export interface ArrayTraceResult {
  pattern: ArrayPattern
  pointers: string[]
  /** The numeric array the trace ran on (display tokens are derived from this). */
  values: number[]
  frames: ArrayTraceFrame[]
  /** Final answer the canonical run produced, for cross-checking vs the reference. */
  answer: unknown
}

const MAX_CELLS = 16
const MAX_FRAMES = 8

function tooBig(values: number[]): boolean {
  return values.length < 2 || values.length > MAX_CELLS
}

/**
 * Binary search. Records lo/mid/hi each iteration, the discarded half, and the
 * compared cell. Returns the found index or -1.
 */
function traceBinarySearch(values: number[], target: number): { frames: ArrayTraceFrame[]; answer: number } {
  const frames: ArrayTraceFrame[] = []
  let lo = 0
  let hi = values.length - 1
  let answer = -1
  while (lo <= hi && frames.length < MAX_FRAMES) {
    const mid = lo + Math.floor((hi - lo) / 2)
    const discarded: number[] = []
    for (let i = 0; i < lo; i++) discarded.push(i)
    for (let i = hi + 1; i < values.length; i++) discarded.push(i)
    if (values[mid] === target) {
      frames.push({ pointerAt: { lo, mid, hi }, discarded, highlight: [mid], found: true, note: `nums[${mid}] == ${target}: return ${mid}` })
      answer = mid
      break
    }
    if (values[mid] < target) {
      frames.push({ pointerAt: { lo, mid, hi }, discarded, highlight: [mid], note: `nums[${mid}] < ${target}: move lo to mid+1` })
      lo = mid + 1
    } else {
      frames.push({ pointerAt: { lo, mid, hi }, discarded, highlight: [mid], note: `nums[${mid}] > ${target}: move hi to mid-1` })
      hi = mid - 1
    }
  }
  return { frames, answer }
}

/**
 * Two pointers converging from both ends toward a target pair sum (the classic
 * sorted-array two-sum / pair shape). Returns the [lo, hi] index pair or [].
 */
function traceTwoPointers(values: number[], target: number): { frames: ArrayTraceFrame[]; answer: number[] } {
  const frames: ArrayTraceFrame[] = []
  let lo = 0
  let hi = values.length - 1
  let answer: number[] = []
  while (lo < hi && frames.length < MAX_FRAMES) {
    const sum = values[lo] + values[hi]
    if (sum === target) {
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], found: true, note: `nums[${lo}] + nums[${hi}] == ${target}: pair found` })
      answer = [lo, hi]
      break
    }
    if (sum < target) {
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note: `sum ${sum} < ${target}: move lo right` })
      lo += 1
    } else {
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note: `sum ${sum} > ${target}: move hi left` })
      hi -= 1
    }
  }
  return { frames, answer }
}

/**
 * Fixed-size sliding window maximum sum of size k. Records the window [l..r] and
 * the running sum. Returns the best sum.
 */
function traceSlidingWindow(values: number[], k: number): { frames: ArrayTraceFrame[]; answer: number } {
  const frames: ArrayTraceFrame[] = []
  if (k < 1 || k > values.length) return { frames, answer: 0 }
  let windowSum = 0
  for (let i = 0; i < k; i++) windowSum += values[i]
  let best = windowSum
  let bestL = 0
  frames.push({ pointerAt: { l: 0, r: k - 1 }, highlight: range(0, k - 1), note: `first window sum = ${windowSum}` })
  for (let r = k; r < values.length && frames.length < MAX_FRAMES; r++) {
    const l = r - k + 1
    windowSum += values[r] - values[r - k]
    if (windowSum > best) {
      best = windowSum
      bestL = l
    }
    frames.push({ pointerAt: { l, r }, highlight: range(l, r), note: `slide to [${l}..${r}], sum = ${windowSum}` })
  }
  // mark the best window on the final frame
  if (frames.length) {
    frames[frames.length - 1] = { ...frames[frames.length - 1], found: true, note: `best window starts at ${bestL}, sum = ${best}` }
  }
  return { frames, answer: best }
}

function range(a: number, b: number): number[] {
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

const POINTERS: Record<ArrayPattern, string[]> = {
  binary_search: ['lo', 'mid', 'hi'],
  two_pointers: ['lo', 'hi'],
  sliding_window: ['l', 'r'],
}

/**
 * Run the canonical pattern on a numeric array + scalar parameter (target or k).
 * Returns null when the input is unusable for a clean walkthrough (too small,
 * too large, or the run produced fewer than 3 meaningful frames — the schema
 * floor for a stepped diagram).
 */
export function runArrayTrace(
  pattern: ArrayPattern,
  values: number[],
  param: number,
): ArrayTraceResult | null {
  if (tooBig(values)) return null

  let run: { frames: ArrayTraceFrame[]; answer: unknown }
  if (pattern === 'binary_search') run = traceBinarySearch(values, param)
  else if (pattern === 'two_pointers') run = traceTwoPointers(values, param)
  else run = traceSlidingWindow(values, param)

  if (run.frames.length < 3) return null
  return { pattern, pointers: POINTERS[pattern], values, frames: run.frames, answer: run.answer }
}

/**
 * Assemble a schema-valid InteractiveStepDiagram from a verified trace. The
 * per-step prose here is a deterministic fallback derived from the machine
 * notes; the generation route replaces title/explanation/decision/pills with
 * model-authored prose keyed to the same step indices, leaving the deltas (the
 * thing that could be wrong) untouched.
 */
export function buildSteppedArrayDiagram(
  trace: ArrayTraceResult,
  opts: { title?: string } = {},
): InteractiveStepDiagram {
  const steps = trace.frames.map((frame, i) => ({
    title: `Step ${i + 1}`,
    explanation: frame.note,
    decision: frame.note.includes(':') ? frame.note.split(':').slice(1).join(':').trim() : undefined,
    pills: Object.entries(frame.pointerAt).map(([label, value]) => ({
      label,
      value: String(value),
      tone: label === 'mid' ? ('active' as const) : ('neutral' as const),
    })),
    delta: {
      base: 'array' as const,
      pointerAt: frame.pointerAt,
      discarded: frame.discarded,
      highlight: frame.highlight,
      found: frame.found,
    },
  }))

  return {
    kind: 'stepped',
    title: opts.title,
    base: {
      kind: 'array',
      cells: trace.values.map((v) => ({ value: String(v) })),
      pointers: trace.pointers,
      rangeTrack: trace.pattern === 'binary_search',
    },
    trace_verified: true,
    autoplay: false,
    steps,
  }
}
