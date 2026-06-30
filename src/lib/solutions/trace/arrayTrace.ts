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
 * The diagram ships with readable per-step prose derived from the verified
 * frames. The generation route MAY overlay model-authored prose
 * (title/explanation/decision/pills) keyed by step index, but the model can
 * never add, remove, or reorder steps or touch a delta; the overlay is fail-soft
 * and the harness prose stands when it does not apply. See graft.ts and
 * buildSteppedArrayDiagram().
 */

import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

export type ArrayPattern =
  | 'binary_search'
  | 'two_pointers'
  | 'sliding_window'
  | 'fast_slow'
  | 'partition'
  | 'kadane'

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
function traceBinarySearch(values: number[], target: number): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
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
  // Complete iff the loop exited by finding the target or exhausting the range,
  // not by hitting the frame cap. lo > hi means the range was fully consumed.
  const complete = answer !== -1 || lo > hi
  return { frames, answer, complete }
}

/**
 * Two pointers converging from both ends toward a target pair sum (the classic
 * sorted-array two-sum / pair shape). Returns the [lo, hi] index pair or [].
 */
function traceTwoPointers(values: number[], target: number): { frames: ArrayTraceFrame[]; answer: number[]; complete: boolean } {
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
  // Complete iff a pair was found or the pointers crossed (lo >= hi), not the cap.
  const complete = answer.length > 0 || lo >= hi
  return { frames, answer, complete }
}

/**
 * Fixed-size sliding window maximum sum of size k. Records the window [l..r] and
 * the running sum. Returns the best sum.
 */
function traceSlidingWindow(values: number[], k: number): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  if (k < 1 || k > values.length) return { frames, answer: 0, complete: false }
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
  // Complete iff every window was visited (the last window ends at the last index)
  // rather than the loop stopping early at the frame cap.
  const complete = frames.length > 0 && (frames[frames.length - 1].pointerAt.r === values.length - 1)
  return { frames, answer: best, complete }
}

/**
 * Floyd's cycle detection on a value-as-index array (the "find the duplicate"
 * shape: an array of n+1 entries each in [0, n-1], so a cycle is guaranteed).
 * slow advances one hop (slow = nums[slow]); fast advances two (fast =
 * nums[nums[fast]]). When they meet, a second walk from index 0 and the meeting
 * point converging at the same speed lands on the cycle entry, which is the
 * duplicated value. Every recorded pointer is an array index, so the displayed
 * positions are always in range. Returns the duplicate value.
 */
function traceFastSlow(values: number[]): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  // Phase 1: find a meeting point inside the cycle.
  let slow = values[0]
  let fast = values[values[0]]
  frames.push({ pointerAt: { slow, fast }, highlight: [slow, fast], note: `slow hops to ${slow}, fast hops to ${fast}` })
  while (slow !== fast && frames.length < MAX_FRAMES) {
    slow = values[slow]
    fast = values[values[fast]]
    const meet = slow === fast
    frames.push({
      pointerAt: { slow, fast },
      highlight: [slow, fast],
      found: meet,
      note: meet ? `slow == fast at index ${slow}: inside the cycle` : `slow hops to ${slow}, fast hops to ${fast}`,
    })
  }
  // If the frame cap broke phase 1 before slow met fast, we never reached a real
  // meeting point. Running phase 2 on those mismatched, offset pointers can spin
  // forever (a pure long cycle never aligns the two lockstep walks). Bail out as
  // an incomplete trace BEFORE phase 2 rather than loop or assert a fake answer.
  if (slow !== fast) return { frames, answer: -1, complete: false }

  // Phase 2 (oracle-only, no extra frames): walk from 0 and from the meeting
  // point one hop at a time; they converge at the cycle entry = the duplicate.
  // Cap the walk at values.length steps: a genuine "find the duplicate" rho
  // converges within that bound, and an adversarial value-as-index array that
  // is not that shape can otherwise loop forever.
  let p1 = 0
  let p2 = slow
  for (let k = 0; k < values.length && p1 !== p2; k++) {
    p1 = values[p1]
    p2 = values[p2]
  }
  // No convergence within the bound means this input is not the rho shape the
  // pattern needs; refuse to certify rather than show a wrong cycle entry.
  if (p1 !== p2) return { frames, answer: -1, complete: false }
  return { frames, answer: p1, complete: true }
}

/** Region counts a 3-way partition produces, an order-sensitive summary of the input. */
export interface PartitionCounts {
  less: number
  equal: number
  greater: number
}

/**
 * Dutch national flag CLASSIFICATION, read-only. The ArrayStage renderer draws the
 * STATIC input cells (it never re-orders them), so a tracer that swapped cells in a
 * copy would describe moves the learner cannot see. Instead we scan the ORIGINAL
 * array left to right and classify each cell into one of three regions relative to
 * the pivot: < pivot, == pivot, > pivot. Every frame describes what the displayed
 * cell at the scan cursor actually shows, so the captions stay faithful to the
 * static array. The scan cursor is `mid`; `low` and `high` mark the running counts
 * of the lows and highs regions over the static array (boundary cursors, not swap
 * targets). The answer is the region COUNTS, a deterministic order-sensitive
 * summary that a fully partitioned `expected` array can be cross-checked against.
 */
function tracePartition(values: number[], pivot: number): { frames: ArrayTraceFrame[]; answer: PartitionCounts; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  const n = values.length
  let less = 0
  let equal = 0
  let greater = 0
  for (let i = 0; i < n && frames.length < MAX_FRAMES; i++) {
    const v = values[i]
    let note: string
    if (v < pivot) {
      less += 1
      note = `cell ${i} = ${v} < ${pivot}: belongs in the lows region`
    } else if (v > pivot) {
      greater += 1
      note = `cell ${i} = ${v} > ${pivot}: belongs in the highs region`
    } else {
      equal += 1
      note = `cell ${i} = ${v} == ${pivot}: belongs in the middle region`
    }
    // low / high are running region SIZES expressed as cursors over the static
    // array: low points at the last lows cell, high at the first highs cell from
    // the right. They never reorder a cell; they summarize the classification so
    // far. Both stay in [0, n-1].
    const lowCursor = less > 0 ? less - 1 : 0
    const highCursor = greater > 0 ? n - greater : n - 1
    frames.push({
      pointerAt: { low: lowCursor, mid: i, high: highCursor },
      highlight: [i],
      note,
    })
  }
  const done = frames.length === n
  if (done && frames.length) {
    frames[frames.length - 1] = {
      ...frames[frames.length - 1],
      found: true,
      note: `classified around ${pivot}: ${less} below, ${equal} equal, ${greater} above`,
    }
  }
  // Complete iff every cell was classified (a full pass), not stopped at the cap.
  return { frames, answer: { less, equal, greater }, complete: done }
}

/**
 * Kadane's running maximum-subarray-sum. A single left-to-right pass keeping the
 * best sum ending at i (running), resetting to a[i] when running goes negative.
 * The scan cursor i is the only pointer; the current best window [bestStart..
 * bestEnd] is highlighted. Returns the best subarray sum.
 */
function traceKadane(values: number[]): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  let running = values[0]
  let best = values[0]
  let curStart = 0
  let bestStart = 0
  let bestEnd = 0
  frames.push({ pointerAt: { i: 0 }, highlight: [0], note: `start: running = best = ${values[0]}` })
  for (let i = 1; i < values.length && frames.length < MAX_FRAMES; i++) {
    if (running + values[i] < values[i]) {
      running = values[i]
      curStart = i
    } else {
      running += values[i]
    }
    let note: string
    if (running > best) {
      best = running
      bestStart = curStart
      bestEnd = i
      note = `i=${i}: running = ${running}, new best window [${bestStart}..${bestEnd}]`
    } else {
      note = `i=${i}: running = ${running}, best stays ${best}`
    }
    frames.push({ pointerAt: { i }, highlight: range(bestStart, bestEnd), note })
  }
  if (frames.length) {
    frames[frames.length - 1] = { ...frames[frames.length - 1], found: true, note: `best subarray sum = ${best} (window [${bestStart}..${bestEnd}])` }
  }
  // Complete iff the scan reached the last index (every element considered),
  // rather than the loop stopping early at the frame cap.
  const complete = frames.length > 0 && frames[frames.length - 1].pointerAt.i === values.length - 1
  return { frames, answer: best, complete }
}

/** Every entry must be a valid index into the array (value-as-index invariant). */
function isValidIndexArray(values: number[]): boolean {
  return values.every((v) => Number.isInteger(v) && v >= 0 && v < values.length)
}

/** A non-decreasing array is required for the sorted-array discard invariants. */
function isNonDecreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) return false
  }
  return true
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
  fast_slow: ['slow', 'fast'],
  partition: ['low', 'mid', 'high'],
  kadane: ['i'],
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

  // binary_search and two_pointers depend on a sorted array for their discard
  // invariants. An unsorted input could coincidentally produce a matching answer
  // while the displayed pointer moves would be nonsense, so reject it.
  if ((pattern === 'binary_search' || pattern === 'two_pointers') && !isNonDecreasing(values)) return null

  // fast_slow walks the array as a function (slow = nums[slow]); every value must
  // be a valid index or the walk leaves the array and the displayed hops lie.
  if (pattern === 'fast_slow' && !isValidIndexArray(values)) return null

  let run: { frames: ArrayTraceFrame[]; answer: unknown; complete: boolean }
  if (pattern === 'binary_search') run = traceBinarySearch(values, param)
  else if (pattern === 'two_pointers') run = traceTwoPointers(values, param)
  else if (pattern === 'sliding_window') run = traceSlidingWindow(values, param)
  else if (pattern === 'fast_slow') run = traceFastSlow(values)
  else if (pattern === 'partition') run = tracePartition(values, param)
  else run = traceKadane(values)

  // Reject a run that stopped at the frame cap before reaching a terminal state:
  // an incomplete trace would assert an answer the walkthrough never reached.
  if (!run.complete) return null
  if (run.frames.length < 3) return null
  return { pattern, pointers: POINTERS[pattern], values, frames: run.frames, answer: run.answer }
}

/**
 * Compute the canonical pattern's TRUE answer on an input, uncapped by the
 * display frame limit. Used by the cross-check so a frame-capped display trace
 * can never weaken the correctness oracle. Returns null on unusable input.
 */
export function computeAnswer(pattern: ArrayPattern, values: number[], param: number): unknown {
  if (values.length < 2) return null
  if (pattern === 'binary_search') {
    if (!isNonDecreasing(values)) return null
    let lo = 0, hi = values.length - 1
    while (lo <= hi) {
      const mid = lo + Math.floor((hi - lo) / 2)
      if (values[mid] === param) return mid
      if (values[mid] < param) lo = mid + 1
      else hi = mid - 1
    }
    return -1
  }
  if (pattern === 'two_pointers') {
    if (!isNonDecreasing(values)) return null
    let lo = 0, hi = values.length - 1
    while (lo < hi) {
      const sum = values[lo] + values[hi]
      if (sum === param) return [lo, hi]
      if (sum < param) lo += 1
      else hi -= 1
    }
    return []
  }
  if (pattern === 'fast_slow') {
    if (!isValidIndexArray(values)) return null
    // Floyd phase 1 then phase 2. Both walks are capped so the oracle can never
    // spin on an adversarial value-as-index permutation that is not the "find the
    // duplicate" rho shape. A genuine rho meets and converges within length steps.
    let slow = values[0]
    let fast = values[values[0]]
    for (let k = 0; k <= values.length && slow !== fast; k++) {
      slow = values[slow]
      fast = values[values[fast]]
    }
    if (slow !== fast) return null
    let p1 = 0
    let p2 = slow
    for (let k = 0; k < values.length && p1 !== p2; k++) {
      p1 = values[p1]
      p2 = values[p2]
    }
    if (p1 !== p2) return null
    return p1
  }
  if (pattern === 'partition') {
    // 3-way partition around the pivot. The answer is the region COUNTS (an
    // order-sensitive summary), matching the read-only classification tracer. The
    // cross-check compares these counts against the region boundaries the
    // challenge's expected partitioned array encodes.
    let less = 0, equal = 0, greater = 0
    for (const v of values) {
      if (v < param) less += 1
      else if (v > param) greater += 1
      else equal += 1
    }
    const counts: PartitionCounts = { less, equal, greater }
    return counts
  }
  if (pattern === 'kadane') {
    // Running max-subarray-sum, uncapped.
    let running = values[0]
    let best = values[0]
    for (let i = 1; i < values.length; i++) {
      running = Math.max(values[i], running + values[i])
      if (running > best) best = running
    }
    return best
  }
  // sliding_window: best fixed-size-k window sum
  const k = param
  if (k < 1 || k > values.length) return null
  let windowSum = 0
  for (let i = 0; i < k; i++) windowSum += values[i]
  let best = windowSum
  for (let r = k; r < values.length; r++) {
    windowSum += values[r] - values[r - k]
    if (windowSum > best) best = windowSum
  }
  return best
}

/**
 * Readable per-step prose for the array walkthrough, derived deterministically
 * from the verified frame. This is the prose the learner reads when the model
 * supplies no overlay (or when its prose fails to match the trace step count):
 * a meaningful title and a full-sentence explanation, never a raw machine note.
 *
 * The generation route MAY replace title/explanation/decision/pills by step
 * index with model-authored prose (see graft.ts); these readable defaults stand
 * whenever that overlay does not apply. The deltas are never touched here.
 */
function arrayStepProse(
  pattern: ArrayPattern,
  frame: ArrayTraceFrame,
  index: number,
): { title: string; explanation: string } {
  const p = frame.pointerAt
  if (pattern === 'binary_search') {
    if (frame.found) {
      return {
        title: 'Found the target',
        explanation: `The midpoint at index ${p.mid} matches the target, so the search returns ${p.mid}.`,
      }
    }
    const wentRight = frame.note.includes('move lo')
    return {
      title: index === 0 ? 'Check the midpoint' : wentRight ? 'Discard the left half' : 'Discard the right half',
      explanation: wentRight
        ? `The value at the midpoint is below the target, so the left half cannot hold it. Move the low bound past the midpoint and keep searching the right side.`
        : `The value at the midpoint is above the target, so the right half cannot hold it. Pull the high bound below the midpoint and keep searching the left side.`,
    }
  }
  if (pattern === 'two_pointers') {
    if (frame.found) {
      return {
        title: 'Pair found',
        explanation: `The values at the two ends now sum to the target, so this pair of indices is the answer.`,
      }
    }
    const movedLo = frame.note.includes('move lo')
    return {
      title: movedLo ? 'Sum too small, widen low' : 'Sum too large, pull high in',
      explanation: movedLo
        ? `The current pair sums below the target. The array is sorted, so the only way to grow the sum is to advance the low pointer to a larger value.`
        : `The current pair sums above the target. The array is sorted, so the only way to shrink the sum is to pull the high pointer to a smaller value.`,
    }
  }
  if (pattern === 'sliding_window') {
    if (index === 0) {
      return {
        title: 'Seed the first window',
        explanation: `Sum the first window of fixed size to establish the running total. Every later step adjusts this total instead of recomputing it.`,
      }
    }
    if (frame.found) {
      return {
        title: 'Best window settled',
        explanation: `Every window has been visited. The highest running sum seen marks the best window, so that sum is the answer.`,
      }
    }
    return {
      title: 'Slide the window',
      explanation: `Add the element entering on the right and drop the one leaving on the left. The running sum updates in constant time as the window moves one step.`,
    }
  }
  if (pattern === 'fast_slow') {
    if (frame.found) {
      return {
        title: 'Pointers meet',
        explanation: `The slow and fast pointers have landed on the same index, which proves they are both inside the cycle. A second walk from the start would converge on the cycle entry.`,
      }
    }
    return {
      title: index === 0 ? 'First hops' : 'Advance both pointers',
      explanation: `The slow pointer follows one link, the fast pointer follows two. Treating each value as the next index, the faster pointer gains a step on the slower one every iteration until they collide.`,
    }
  }
  if (pattern === 'partition') {
    if (frame.found) {
      return {
        title: 'Fully partitioned',
        explanation: `The scan cursor has passed the high boundary, so every element has been placed. The array now reads lows, then equals, then highs around the pivot.`,
      }
    }
    if (frame.note.includes('< ')) {
      return {
        title: 'Swap into the lows',
        explanation: `The inspected value is below the pivot, so it belongs in the low region. Swap it down and advance both the low boundary and the scan cursor.`,
      }
    }
    if (frame.note.includes('> ')) {
      return {
        title: 'Swap into the highs',
        explanation: `The inspected value is above the pivot, so it belongs in the high region. Swap it up and pull the high boundary in, leaving the scan cursor in place to re-check the new value.`,
      }
    }
    return {
      title: 'Leave it in place',
      explanation: `The inspected value equals the pivot, so it is already in the middle band. Advance the scan cursor without moving anything.`,
    }
  }
  // kadane
  if (index === 0) {
    return {
      title: 'Start the running sum',
      explanation: `Seed the running sum and the best sum with the first element. Each later step decides whether extending the run beats starting fresh.`,
    }
  }
  if (frame.found) {
    return {
      title: 'Best subarray settled',
      explanation: `The pass has reached the last element. The largest running sum recorded along the way is the maximum subarray sum, and its window is highlighted.`,
    }
  }
  const newBest = frame.note.includes('new best')
  return {
    title: newBest ? 'New best window' : 'Extend or reset',
    explanation: newBest
      ? `Extending the current run raised the running sum above every total seen so far, so the best window now ends at this index.`
      : `Either extend the current run or restart from this element, whichever sum is larger. The best window seen so far is unchanged.`,
  }
}

/**
 * Assemble a schema-valid InteractiveStepDiagram from a verified trace. The
 * per-step prose here is a readable deterministic fallback (meaningful titles,
 * full-sentence explanations) derived from the verified frame; the generation
 * route MAY replace title/explanation/decision/pills with model-authored prose
 * keyed to the same step indices (see graft.ts), leaving the deltas (the thing
 * that could be wrong) untouched. When no model prose lands, these defaults
 * stand.
 */
export function buildSteppedArrayDiagram(
  trace: ArrayTraceResult,
  opts: { title?: string } = {},
): InteractiveStepDiagram {
  const steps = trace.frames.map((frame, i) => {
    const prose = arrayStepProse(trace.pattern, frame, i)
    return {
      title: prose.title,
      explanation: prose.explanation,
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
    }
  })

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
