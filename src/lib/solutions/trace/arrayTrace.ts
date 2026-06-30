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
  | 'two_pointers_area'
  | 'two_pointers_water'
  | 'sliding_window'
  | 'fast_slow'
  | 'partition'
  | 'kadane'
  | 'longest_substring'
  | 'valid_palindrome'

/** Patterns whose input is a STRING (cells display characters, not numbers). */
export const STRING_PATTERNS: ReadonlySet<ArrayPattern> = new Set<ArrayPattern>([
  'longest_substring',
  'valid_palindrome',
])

export function isStringPattern(pattern: ArrayPattern): boolean {
  return STRING_PATTERNS.has(pattern)
}

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
  /**
   * Display tokens for the cells, used by string patterns so each cell shows a
   * character (or escaped whitespace) instead of a number. When absent, the
   * renderer derives tokens from `values`. Length always matches `values`.
   */
  cells?: string[]
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
 * Two pointers for the MAX-AREA family (Container With Most Water). The pointers
 * lo/hi start at the two ends and converge. At each step the container they form
 * holds min(height[lo], height[hi]) * (hi - lo); we keep the best area seen. The
 * pointer on the SHORTER wall moves inward, because moving the taller one can only
 * shrink the width without ever raising the limiting height, so it cannot improve
 * the area. This is a different objective from the pair-sum tracer: the answer is
 * a scalar area, not an index pair, and the move rule reads heights, not a target.
 * The array is NOT required to be sorted (heights are arbitrary). Returns the best
 * area. Every recorded pointer is an index into the displayed array, so the cells
 * the captions reference are exactly what the renderer draws.
 */
function traceTwoPointersArea(values: number[]): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  let lo = 0
  let hi = values.length - 1
  let best = 0
  while (lo < hi && frames.length < MAX_FRAMES) {
    const h = Math.min(values[lo], values[hi])
    const width = hi - lo
    const area = h * width
    if (area > best) best = area
    // Move the shorter wall inward; ties move the high pointer (deterministic).
    const moveLo = values[lo] < values[hi]
    const note = moveLo
      ? `area min(${values[lo]},${values[hi]})*${width} = ${area}, best ${best}: left wall shorter, move lo right`
      : `area min(${values[lo]},${values[hi]})*${width} = ${area}, best ${best}: right wall not taller, move hi left`
    frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note })
    if (moveLo) lo += 1
    else hi -= 1
  }
  // Mark the terminal frame so the renderer lands on a found state showing the answer.
  if (frames.length) {
    frames[frames.length - 1] = {
      ...frames[frames.length - 1],
      found: true,
      note: `pointers met: largest container area = ${best}`,
    }
  }
  // Complete iff the pointers met (lo >= hi) rather than the loop stopping at the cap.
  const complete = lo >= hi
  return { frames, answer: best, complete }
}

/**
 * Two pointers for the TRAPPED-WATER family (Trapping Rain Water). The pointers
 * lo/hi converge while tracking the tallest wall seen from each side (leftMax,
 * rightMax). Water above a cell is bounded by the smaller of the two side maxima;
 * the side with the smaller current height is the binding constraint, so we advance
 * it and, when its wall does not raise that side's running max, accumulate the
 * difference as trapped water. This is a distinct algorithm from both pair-sum and
 * the max-area tracer: the answer is total trapped water, and the move rule compares
 * the two current heights. The array is NOT required to be sorted. Every pointer is
 * an index into the displayed array. Returns the total trapped water.
 */
function traceTwoPointersWater(values: number[]): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  let lo = 0
  let hi = values.length - 1
  let leftMax = 0
  let rightMax = 0
  let water = 0
  while (lo < hi && frames.length < MAX_FRAMES) {
    if (values[lo] <= values[hi]) {
      let note: string
      if (values[lo] >= leftMax) {
        leftMax = values[lo]
        note = `left ${values[lo]} <= right ${values[hi]}: raises left wall to ${leftMax}, no water, move lo right`
      } else {
        water += leftMax - values[lo]
        note = `left ${values[lo]} below left wall ${leftMax}: traps ${leftMax - values[lo]}, total ${water}, move lo right`
      }
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note })
      lo += 1
    } else {
      let note: string
      if (values[hi] >= rightMax) {
        rightMax = values[hi]
        note = `right ${values[hi]} < left ${values[lo]}: raises right wall to ${rightMax}, no water, move hi left`
      } else {
        water += rightMax - values[hi]
        note = `right ${values[hi]} below right wall ${rightMax}: traps ${rightMax - values[hi]}, total ${water}, move hi left`
      }
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note })
      hi -= 1
    }
  }
  // Mark the terminal frame so the renderer lands on a found state showing the answer.
  if (frames.length) {
    frames[frames.length - 1] = {
      ...frames[frames.length - 1],
      found: true,
      note: `pointers met: total trapped water = ${water}`,
    }
  }
  // Complete iff the pointers met (lo >= hi) rather than the loop stopping at the cap.
  const complete = lo >= hi
  return { frames, answer: water, complete }
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

/**
 * Longest substring without repeating characters, traced as an EXPANDING window
 * [l..r] over the static string. We scan r left to right; when the incoming
 * character already sits inside the current window, we advance l past its last
 * occurrence so the window stays duplicate-free. The answer is the maximum window
 * length seen. The string is never mutated; every frame describes the window over
 * the cells exactly as displayed. Returns the max length.
 */
function traceLongestSubstring(chars: string[]): { frames: ArrayTraceFrame[]; answer: number; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  const n = chars.length
  const lastSeen = new Map<string, number>()
  let l = 0
  let best = 0
  let bestL = 0
  let bestR = 0
  // The window grows one cell per outer iteration. We record one frame per r so
  // the learner watches the window expand and the left edge jump on a duplicate.
  for (let r = 0; r < n && frames.length < MAX_FRAMES; r++) {
    const ch = chars[r]
    const prev = lastSeen.get(ch)
    let jumped = false
    if (prev !== undefined && prev >= l) {
      l = prev + 1
      jumped = true
    }
    lastSeen.set(ch, r)
    const windowLen = r - l + 1
    if (windowLen > best) {
      best = windowLen
      bestL = l
      bestR = r
    }
    const note = jumped
      ? `'${displayChar(ch)}' repeats: move l to ${l}, window [${l}..${r}] length ${windowLen}`
      : `add '${displayChar(ch)}': window [${l}..${r}] length ${windowLen}`
    frames.push({ pointerAt: { l, r }, highlight: range(l, r), note })
  }
  // Mark the best window on the final frame.
  if (frames.length) {
    frames[frames.length - 1] = {
      ...frames[frames.length - 1],
      found: true,
      pointerAt: { l: bestL, r: bestR },
      highlight: range(bestL, bestR),
      note: `longest window [${bestL}..${bestR}], length ${best}`,
    }
  }
  // Complete iff every character was scanned (r reached the last index) rather
  // than the loop stopping early at the frame cap. We track the scan separately
  // from the final best-window frame, so re-derive from how many frames we wrote.
  const complete = frames.length === n && n >= 2
  return { frames, answer: best, complete }
}

/**
 * Valid palindrome by two pointers converging from both ends, skipping any
 * non-alphanumeric character and comparing case-insensitively. Each frame shows
 * the two cursors over the static string and the comparison made. The string is
 * read-only. Returns a boolean: true iff the cleaned string reads the same both ways.
 */
function traceValidPalindrome(chars: string[]): { frames: ArrayTraceFrame[]; answer: boolean; complete: boolean } {
  const frames: ArrayTraceFrame[] = []
  const n = chars.length
  let lo = 0
  let hi = n - 1
  let answer = true
  let settled = false
  while (lo < hi && frames.length < MAX_FRAMES) {
    // Skip non-alphanumeric from the left.
    if (!isAlphanumeric(chars[lo])) {
      frames.push({ pointerAt: { lo, hi }, highlight: [lo], note: `skip '${displayChar(chars[lo])}' at ${lo}: not alphanumeric` })
      lo += 1
      continue
    }
    // Skip non-alphanumeric from the right.
    if (!isAlphanumeric(chars[hi])) {
      frames.push({ pointerAt: { lo, hi }, highlight: [hi], note: `skip '${displayChar(chars[hi])}' at ${hi}: not alphanumeric` })
      hi -= 1
      continue
    }
    const a = chars[lo].toLowerCase()
    const b = chars[hi].toLowerCase()
    if (a !== b) {
      frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note: `'${displayChar(chars[lo])}' != '${displayChar(chars[hi])}': not a palindrome` })
      answer = false
      settled = true
      break
    }
    frames.push({ pointerAt: { lo, hi }, highlight: [lo, hi], note: `'${displayChar(chars[lo])}' == '${displayChar(chars[hi])}': matches, move both inward` })
    lo += 1
    hi -= 1
  }
  // If the pointers crossed without a mismatch, the (cleaned) string is a palindrome.
  if (!settled && lo >= hi) {
    settled = true
    answer = true
  }
  // Mark the terminal frame so the renderer lands on a found state.
  if (settled && frames.length) {
    frames[frames.length - 1] = {
      ...frames[frames.length - 1],
      found: true,
      note: answer ? `pointers met: every pair matched, it reads the same both ways` : frames[frames.length - 1].note,
    }
  }
  // Complete iff we reached a verdict (a mismatch break or the pointers crossing),
  // not the frame cap. settled captures exactly that.
  return { frames, answer, complete: settled }
}

/** A single alphanumeric character (used by valid-palindrome skipping). */
function isAlphanumeric(ch: string): boolean {
  return /^[a-z0-9]$/i.test(ch)
}

/**
 * Render a single character for a cell label and machine note. Spaces and other
 * whitespace are escaped to a visible token so a blank cell never confuses the
 * learner; everything else is shown as-is. Tokens stay within the schema's 8-char
 * cell limit.
 */
function displayChar(ch: string): string {
  if (ch === ' ') return '␣'
  if (ch === '\t') return '\\t'
  if (ch === '\n') return '\\n'
  return ch
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
  two_pointers_area: ['lo', 'hi'],
  two_pointers_water: ['lo', 'hi'],
  sliding_window: ['l', 'r'],
  fast_slow: ['slow', 'fast'],
  partition: ['low', 'mid', 'high'],
  kadane: ['i'],
  longest_substring: ['l', 'r'],
  valid_palindrome: ['lo', 'hi'],
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
  // String patterns run over characters, not numbers; route them away from the
  // numeric path so a caller that picked the wrong entry point never traces a
  // string as if it were an array of numbers.
  if (isStringPattern(pattern)) return null
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
  else if (pattern === 'two_pointers_area') run = traceTwoPointersArea(values)
  else if (pattern === 'two_pointers_water') run = traceTwoPointersWater(values)
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
 * Run a STRING-input pattern (longest substring / valid palindrome) over the
 * characters of `input`. Each character becomes a read-only cell; the returned
 * result carries `cells` (the display characters) so the renderer shows letters
 * rather than numbers. The same eligibility gates apply: the string must be 2..16
 * characters, the run must reach a terminal state (not the frame cap), and it must
 * produce at least 3 frames (the schema floor). Returns null on unusable input.
 */
export function runStringArrayTrace(
  pattern: ArrayPattern,
  input: string,
): ArrayTraceResult | null {
  if (!isStringPattern(pattern)) return null
  const chars = Array.from(input)
  // Reuse the numeric cell bounds: 2..MAX_CELLS cells for a clean walkthrough.
  if (chars.length < 2 || chars.length > MAX_CELLS) return null

  let run: { frames: ArrayTraceFrame[]; answer: unknown; complete: boolean }
  if (pattern === 'longest_substring') run = traceLongestSubstring(chars)
  else run = traceValidPalindrome(chars)

  if (!run.complete) return null
  if (run.frames.length < 3) return null
  // values keeps the array length (char codes) so length-based invariants still
  // hold; cells carries the per-cell display token the renderer reads.
  return {
    pattern,
    pointers: POINTERS[pattern],
    values: chars.map((c) => c.charCodeAt(0)),
    cells: chars.map(displayChar),
    frames: run.frames,
    answer: run.answer,
  }
}

/**
 * Compute a STRING-input pattern's TRUE answer, uncapped by the display frame
 * limit. The cross-check oracle for the string patterns. Returns null on input
 * too short to trace.
 */
export function computeStringAnswer(pattern: ArrayPattern, input: string): unknown {
  const chars = Array.from(input)
  if (chars.length < 2) return null
  if (pattern === 'longest_substring') {
    const lastSeen = new Map<string, number>()
    let l = 0
    let best = 0
    for (let r = 0; r < chars.length; r++) {
      const prev = lastSeen.get(chars[r])
      if (prev !== undefined && prev >= l) l = prev + 1
      lastSeen.set(chars[r], r)
      best = Math.max(best, r - l + 1)
    }
    return best
  }
  // valid_palindrome: case-insensitive, alphanumeric-only.
  let lo = 0
  let hi = chars.length - 1
  while (lo < hi) {
    if (!isAlphanumeric(chars[lo])) { lo += 1; continue }
    if (!isAlphanumeric(chars[hi])) { hi -= 1; continue }
    if (chars[lo].toLowerCase() !== chars[hi].toLowerCase()) return false
    lo += 1
    hi -= 1
  }
  return true
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
  if (pattern === 'two_pointers_area') {
    // Max container area, uncapped. Converge lo/hi; track best area; move the
    // shorter wall inward. Matches traceTwoPointersArea exactly.
    let lo = 0, hi = values.length - 1
    let best = 0
    while (lo < hi) {
      const area = Math.min(values[lo], values[hi]) * (hi - lo)
      if (area > best) best = area
      if (values[lo] < values[hi]) lo += 1
      else hi -= 1
    }
    return best
  }
  if (pattern === 'two_pointers_water') {
    // Total trapped water, uncapped. Converge lo/hi tracking each side's running
    // max; accumulate the deficit below the binding wall. Matches the tracer.
    let lo = 0, hi = values.length - 1
    let leftMax = 0, rightMax = 0
    let water = 0
    while (lo < hi) {
      if (values[lo] <= values[hi]) {
        if (values[lo] >= leftMax) leftMax = values[lo]
        else water += leftMax - values[lo]
        lo += 1
      } else {
        if (values[hi] >= rightMax) rightMax = values[hi]
        else water += rightMax - values[hi]
        hi -= 1
      }
    }
    return water
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
  if (pattern === 'two_pointers_area') {
    if (frame.found) {
      return {
        title: 'Largest container settled',
        explanation: `The two walls have met. The widest-times-tallest container seen along the way is the largest area, so that value is the answer.`,
      }
    }
    const movedLo = frame.note.includes('move lo')
    return {
      title: index === 0 ? 'Start from the widest pair' : movedLo ? 'Move the left wall in' : 'Move the right wall in',
      explanation: movedLo
        ? `The left wall is the shorter of the two, so it caps the water this container can hold. Moving the taller right wall could only shrink the width, so the left wall steps inward in search of a taller one.`
        : `The right wall is no taller than the left, so it caps the container. Moving the left wall could only lose width without raising the limit, so the right wall steps inward looking for more height.`,
    }
  }
  if (pattern === 'two_pointers_water') {
    if (frame.found) {
      return {
        title: 'All water counted',
        explanation: `The two cursors have met, so every column has been measured. The sum of water trapped above each column along the way is the answer.`,
      }
    }
    const traps = frame.note.includes('traps')
    const movedLo = frame.note.includes('move lo')
    return {
      title: traps ? 'Trap water over this column' : 'Raise the wall',
      explanation: traps
        ? `This column sits below the tallest wall behind it on the binding side, so the gap fills with water. Add that deficit to the total and step the shorter side inward.`
        : movedLo
          ? `The left column is the shorter side and is at least as tall as every wall behind it, so it becomes the new left wall. Nothing is trapped here; step the left cursor inward.`
          : `The right column is the shorter side and is at least as tall as every wall behind it, so it becomes the new right wall. Nothing is trapped here; step the right cursor inward.`,
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
  if (pattern === 'longest_substring') {
    if (frame.found) {
      return {
        title: 'Longest window settled',
        explanation: `Every character has been scanned. The widest duplicate-free window seen along the way is highlighted, and its length is the answer.`,
      }
    }
    const jumped = frame.note.includes('repeats')
    return {
      title: index === 0 ? 'Open the window' : jumped ? 'Slide past the repeat' : 'Grow the window',
      explanation: jumped
        ? `The incoming character already sits inside the window, so the left edge jumps past its earlier copy. The window stays free of repeats and keeps scanning.`
        : `The incoming character is new to the window, so the right edge extends and the window grows by one. The running length updates as the window widens.`,
    }
  }
  if (pattern === 'valid_palindrome') {
    if (frame.found) {
      const isMatch = frame.note.includes('reads the same')
      return {
        title: isMatch ? 'Reads the same both ways' : 'Mismatch found',
        explanation: isMatch
          ? `The two cursors crossed without ever disagreeing, so every meaningful pair matched. The cleaned string reads the same forward and backward.`
          : `The characters under the two cursors differ once letters and digits are compared case-insensitively. A single mismatch is enough to rule it out.`,
      }
    }
    if (frame.note.includes('skip')) {
      return {
        title: 'Skip the noise',
        explanation: `The cursor sits on a character that is not a letter or digit, so it carries no meaning for the palindrome test. Step that cursor inward and keep the comparison honest.`,
      }
    }
    return {
      title: 'Compare the ends',
      explanation: `Both cursors sit on letters or digits. Compared case-insensitively they match, so move both inward and test the next pair from the outside in.`,
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

  // String patterns supply per-cell display tokens (characters); numeric patterns
  // render the value itself. Either way the cell text stays within the schema's
  // 8-char limit (single chars, escaped whitespace, or short numbers).
  const cells = trace.cells
    ? trace.cells.map((token) => ({ value: token }))
    : trace.values.map((v) => ({ value: String(v) }))

  return {
    kind: 'stepped',
    title: opts.title,
    base: {
      kind: 'array',
      cells,
      pointers: trace.pointers,
      rangeTrack: trace.pattern === 'binary_search',
    },
    trace_verified: true,
    autoplay: false,
    steps,
  }
}
