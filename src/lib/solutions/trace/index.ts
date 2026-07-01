/**
 * Trace orchestration: decide whether a challenge is stepped-eligible and, if
 * so, produce a machine-verified stepped diagram skeleton from its real content.
 *
 * Eligibility is self-enforcing: a stepped diagram only appears when we can
 * (a) recognize a supported array pattern, (b) run it on a real visible test
 * case, and (c) cross-check the canonical run's answer against the challenge's
 * own expected output. Any failure means no stepped diagram (the solution keeps
 * its static diagram). The model never authors the deltas.
 */

import {
  runArrayTrace,
  runStringArrayTrace,
  buildSteppedArrayDiagram,
  computeAnswer,
  computeStringAnswer,
  isStringPattern,
  type ArrayPattern,
} from './arrayTrace'
import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

interface VisibleTestCase {
  id?: string
  label?: string
  args?: unknown[]
  input?: unknown
  expected?: unknown
}

export interface SteppedTraceCandidate {
  /**
   * The verified diagram (deltas + base + verified marker). Its per-step prose is
   * a readable deterministic default; the generation route may overlay
   * model-authored title/explanation/decision/pills by step index (see graft.ts).
   */
  diagram: InteractiveStepDiagram
  /** The pattern the diagram traces; the diagram attaches to the optimal approach. */
  pattern: ArrayPattern
}

const PATTERN_TAGS: Record<string, ArrayPattern> = {
  'binary-search': 'binary_search',
  'binary_search': 'binary_search',
  'binary search': 'binary_search',
  'two-pointers': 'two_pointers',
  'two_pointers': 'two_pointers',
  'two pointers': 'two_pointers',
  'sliding-window': 'sliding_window',
  'sliding_window': 'sliding_window',
  'sliding window': 'sliding_window',
  'fast-slow-pointers': 'fast_slow',
  'fast_slow_pointers': 'fast_slow',
  'fast slow pointers': 'fast_slow',
  'fast-slow': 'fast_slow',
  'cycle-detection': 'fast_slow',
  'cycle detection': 'fast_slow',
  'floyd': 'fast_slow',
  'kadane': 'kadane',
  "kadane's-algorithm": 'kadane',
  'maximum-subarray': 'kadane',
  'maximum subarray': 'kadane',
  'max-subarray': 'kadane',
  'partition': 'partition',
  'dutch-national-flag': 'partition',
  'dutch national flag': 'partition',
  'three-way-partition': 'partition',
  'quickselect': 'partition',
  // String two-pointers: Valid Palindrome converges from both ends, skipping
  // non-alphanumerics. Tagged generically as a string two-pointers problem.
  'valid-palindrome': 'valid_palindrome',
  'valid palindrome': 'valid_palindrome',
  'palindrome': 'valid_palindrome',
  // String sliding window without a fixed size: Longest Substring Without
  // Repeating Characters grows the window and shrinks it on a duplicate.
  'longest-substring': 'longest_substring',
  'longest substring': 'longest_substring',
  'longest-substring-without-repeating-characters': 'longest_substring',
  'longest-substring-without-repeating': 'longest_substring',
  'no-repeat-substring': 'longest_substring',
}

/**
 * The two-pointer tag ('two-pointers') maps to the classic pair-sum tracer by
 * default, but two converging-pointer problems use the SAME tag while solving a
 * different objective the pair-sum tracer does NOT compute:
 *   - Container With Most Water: maximize min(height[lo],height[hi]) * (hi-lo),
 *     moving the shorter wall inward. Signature in the reference: an area built
 *     from min(...) times a width, kept as a running max.
 *   - Trapping Rain Water: accumulate water bounded by the smaller side max,
 *     tracking a left-max AND a right-max. Signature: both running maxima.
 *
 * We refine ONLY when the reference code shows that objective; a plain pair-sum
 * two-pointer solution has neither signature and stays on `two_pointers`. The
 * cross-check downstream still rejects a misroute, but this keeps a genuine area
 * problem from running the pair-sum tracer (which would need a target it lacks).
 */
function refineTwoPointers(referenceSource: string): ArrayPattern {
  const src = referenceSource.toLowerCase()
  // Trapping water: the defining signature is a left-max AND a right-max tracked
  // together. Check it FIRST because a trapping reference can also mention area-ish
  // tokens, but only trapping carries both side-maxima.
  const hasLeftMax = /\bleft_?max\b/.test(src) || /\bl_?max\b/.test(src)
  const hasRightMax = /\bright_?max\b/.test(src) || /\br_?max\b/.test(src)
  if (hasLeftMax && hasRightMax) return 'two_pointers_water'
  // Max area: an explicit area objective (maxArea / max_area) or the min-times-width
  // shape that defines a container area.
  const hasAreaName = /\bmax_?area\b/.test(src) || /\bmaxarea\b/.test(src)
  const hasMinTimesWidth = /\bmin\s*\(/.test(src) && /\bwidth\b/.test(src)
  if (hasAreaName || hasMinTimesWidth) return 'two_pointers_area'
  // No area/water signature: it is the classic pair-sum two-pointer.
  return 'two_pointers'
}

/**
 * The ONE canonical technique_tag the auto-tagger writes for each array pattern it
 * recognizes. Every value here re-detects to its key through PATTERN_TAGS (the
 * round-trip an eager tagger relies on: write the canonical tag, and detectPattern
 * routes it back to the same pattern). The two-pointer variants (area / water) map
 * to the shared 'two-pointers' tag because they are refined from the reference
 * code's objective, not the tag; see refineTwoPointers.
 */
export const PATTERN_TO_CANONICAL_TAG: Record<ArrayPattern, string> = {
  binary_search: 'binary-search',
  two_pointers: 'two-pointers',
  sliding_window: 'sliding-window',
  fast_slow: 'cycle-detection',
  kadane: 'maximum-subarray',
  partition: 'dutch-national-flag',
  valid_palindrome: 'valid-palindrome',
  longest_substring: 'longest-substring',
  two_pointers_area: 'two-pointers',
  two_pointers_water: 'two-pointers',
}

/**
 * Infer the array pattern from technique/topic tags, then a conservative
 * reference-code fallback. The fallbacks fire only on strong, unambiguous signals
 * so an unrelated solution is never mislabeled (a wrong label fails the cross-check
 * downstream anyway, but a cheap textual gate avoids running a doomed trace).
 */
export function detectPattern(tags: string[], referenceSource: string): ArrayPattern | null {
  for (const tag of tags) {
    const hit = PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) {
      // The shared two-pointer tag may be an area / water variant; refine by the
      // reference code's objective so a genuine area problem does not run the
      // pair-sum tracer (and a pair-sum problem is never mislabeled as area).
      if (hit === 'two_pointers') return refineTwoPointers(referenceSource)
      return hit
    }
  }
  const src = referenceSource.toLowerCase()
  // Conservative fallbacks: only fire on strong, unambiguous signals.
  if (/\bmid\b/.test(src) && /(lo|left|low)\b/.test(src) && /(hi|right|high)\b/.test(src)) return 'binary_search'
  // fast/slow: a slow/fast pair or the canonical double-hop pattern.
  if (/\bslow\b/.test(src) && /\bfast\b/.test(src)) return 'fast_slow'
  // kadane: the running-max recurrence over a max-subarray name.
  if (/\bmax_so_far\b/.test(src) || (/\bcur(rent)?_?(sum|max)\b/.test(src) && /\bmax\s*\(/.test(src))) return 'kadane'
  return null
}

/** Pull a numeric array + scalar parameter from a visible test case for the given pattern. */
function extractArrayInput(tc: VisibleTestCase, pattern: ArrayPattern): { values: number[]; param: number } | null {
  // Prefer the algorithm harness shape: args = [array, scalar?].
  const args = Array.isArray(tc.args) ? tc.args : (Array.isArray(tc.input) ? (tc.input as unknown[]) : null)
  if (!args || args.length === 0) return null

  const firstArray = args.find((a) => Array.isArray(a) && (a as unknown[]).every((v) => typeof v === 'number')) as number[] | undefined
  if (!firstArray) return null

  // The scalar parameter (target / k / pivot) is the first non-array number among args.
  const scalar = args.find((a) => typeof a === 'number') as number | undefined

  if (pattern === 'sliding_window') {
    // k must be a sensible window size; default to a middle value if absent.
    const k = typeof scalar === 'number' && scalar >= 1 && scalar <= firstArray.length ? scalar : Math.max(2, Math.floor(firstArray.length / 2))
    return { values: firstArray, param: k }
  }

  if (
    pattern === 'fast_slow' ||
    pattern === 'kadane' ||
    pattern === 'two_pointers_area' ||
    pattern === 'two_pointers_water'
  ) {
    // No scalar parameter; the array alone drives the walk / running sum / the
    // converging height comparison (max area, trapped water).
    return { values: firstArray, param: 0 }
  }

  if (pattern === 'partition') {
    // Use the given pivot when present; otherwise pick the median value so a
    // sort-colors style input (0/1/2) partitions around its middle band.
    if (typeof scalar === 'number') return { values: firstArray, param: scalar }
    const sorted = [...firstArray].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return { values: firstArray, param: median }
  }

  // binary_search / two_pointers need a target.
  if (typeof scalar !== 'number') return null
  return { values: firstArray, param: scalar }
}

function extractRef(reference: unknown): string {
  if (typeof reference === 'string') return reference
  if (reference && typeof reference === 'object') {
    const r = reference as Record<string, unknown>
    if (typeof r.python === 'string') return r.python
    if (typeof r.py === 'string') return r.py
  }
  return ''
}

/** Pull the positional args out of a visible test case (args, input-as-args, or a lone string). */
function readArgs(tc: VisibleTestCase): unknown[] | null {
  if (Array.isArray(tc.args)) return tc.args
  if (Array.isArray(tc.input)) return tc.input as unknown[]
  // A lone string input (input: "abc") is a one-arg case for the string patterns.
  if (typeof tc.input === 'string') return [tc.input]
  return null
}

/**
 * Pull a STRING first-arg as cells for the string patterns. Each character becomes
 * a cell, so the input is capped to the array MAX_CELLS (16); a longer string is
 * rejected (returns null) rather than truncated, because a truncated trace would
 * assert an answer the displayed cells do not support. A second string arg
 * (a pattern/target for window-with-pattern problems) is captured too, though the
 * tracers shipped here (longest substring, valid palindrome) take no second
 * string. Returns null when there is no string first-arg.
 */
function extractStringInput(tc: VisibleTestCase): { value: string; param?: string } | null {
  const args = readArgs(tc)
  if (!args || args.length === 0) return null
  const strings = args.filter((a) => typeof a === 'string') as string[]
  if (strings.length === 0) return null
  const value = strings[0]
  if (Array.from(value).length > 16) return null
  return { value, param: strings[1] }
}

/**
 * Certify-and-build for the STRING patterns. Mirrors the numeric path's contract:
 * EVERY visible case we can extract a string input from must carry an `expected`
 * value, and the uncapped string oracle's answer must agree with it; one case
 * disagreeing or missing `expected` disqualifies the pattern. The first case that
 * also yields a clean (complete, >=3 frame) trace supplies the diagram. Returns
 * null when nothing certifies or no clean trace is producible.
 */
function buildSteppedStringTraceFromMetadata(
  metadata: Record<string, unknown>,
  pattern: ArrayPattern,
): SteppedTraceCandidate | null {
  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !(tc as { hidden?: boolean }).hidden && !(tc as { is_hidden?: boolean }).is_hidden)

  let diagramTrace: ReturnType<typeof runStringArrayTrace> | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const input = extractStringInput(tc)
    if (!input) continue // not a string-shaped case for this pattern; ignore it
    if (tc.expected === undefined) return null // extractable case with no oracle: cannot certify

    const answer = computeStringAnswer(pattern, input.value)
    if (answer === null || !answersAgree(pattern, answer, tc.expected, 0)) return null
    certifiedCount++

    if (!diagramTrace) {
      const trace = runStringArrayTrace(pattern, input.value)
      if (trace) diagramTrace = trace
    }
  }

  if (certifiedCount === 0 || !diagramTrace) return null
  return { diagram: buildSteppedArrayDiagram(diagramTrace), pattern }
}

/**
 * Build a verified stepped-array diagram for an algorithm challenge, or null if
 * it is not eligible. Pure (no DB): callers pass the metadata + tags they already
 * have. The returned diagram carries trace_verified:true and readable default
 * prose; the generation route may overlay model-authored prose over the same
 * step indices (see graft.ts), never the deltas.
 */
export function buildSteppedTraceFromMetadata(
  metadata: Record<string, unknown>,
  tags: string[],
): SteppedTraceCandidate | null {
  const reference = extractRef(metadata.reference_solution)
  const pattern = detectPattern(tags, reference)
  if (!pattern) return null

  // String patterns (Valid Palindrome, Longest Substring) read a STRING input and
  // trace over its characters, so they run a separate certify-and-build path.
  if (isStringPattern(pattern)) return buildSteppedStringTraceFromMetadata(metadata, pattern)

  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !(tc as { hidden?: boolean }).hidden && !(tc as { is_hidden?: boolean }).is_hidden)

  // The pattern must be certified by EVERY visible case we can extract an array
  // input from: each such case must carry an `expected` value and the canonical
  // run's answer must agree with it. One coincidental match is not enough, and a
  // case missing `expected` cannot certify the pattern, so it disqualifies it.
  // The first case that also yields a clean (>=3 frame, complete) trace supplies
  // the diagram. If any extractable case disagrees or lacks `expected`, we bail.
  let diagramTrace: ReturnType<typeof runArrayTrace> | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const input = extractArrayInput(tc, pattern)
    if (!input) continue // case shape we can't map to this pattern; ignore it
    if (tc.expected === undefined) return null // an extractable case with no oracle: cannot certify

    // Run the canonical algorithm to completion to get the true answer for this
    // input (independent of frame-cap display limits).
    const answer = computeAnswer(pattern, input.values, input.param)
    if (answer === null || !answersAgree(pattern, answer, tc.expected, input.param)) return null
    certifiedCount++

    if (!diagramTrace) {
      const trace = runArrayTrace(pattern, input.values, input.param)
      if (trace) diagramTrace = trace
    }
  }

  if (certifiedCount === 0 || !diagramTrace) return null
  return { diagram: buildSteppedArrayDiagram(diagramTrace), pattern }
}

/**
 * Coerce a stored `expected` boolean into a real boolean. Accepts a literal
 * boolean, the strings "true"/"false" (case-insensitive, trimmed), or the numbers
 * 1/0. Anything else returns null so the cross-check refuses to certify rather
 * than guessing. Used only by the valid_palindrome boolean comparison.
 */
function normalizeBoolean(x: unknown): boolean | null {
  if (typeof x === 'boolean') return x
  if (typeof x === 'number') {
    if (x === 1) return true
    if (x === 0) return false
    return null
  }
  if (typeof x === 'string') {
    const s = x.trim().toLowerCase()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return null
}

/** A partition answer is region counts: { less, equal, greater }. */
function isPartitionCounts(x: unknown): x is { less: number; equal: number; greater: number } {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof (x as Record<string, unknown>).less === 'number' &&
    typeof (x as Record<string, unknown>).equal === 'number' &&
    typeof (x as Record<string, unknown>).greater === 'number'
  )
}

/**
 * Cross-check the canonical run's answer against the challenge's expected output.
 * The check is pattern-aware so partition is NOT compared order-insensitively. A
 * partition output is always a permutation of its input, so an order-insensitive
 * sort would certify ANY permutation of the input and the check would be vacuous.
 *
 * - partition: the canonical answer is region counts. The expected must be a fully
 *   partitioned ARRAY whose layout matches those counts ORDER-SENSITIVELY: the
 *   first `less` cells all below the pivot, the next `equal` cells all equal to it,
 *   the last `greater` cells all above, in that exact order. A non-partitioned
 *   permutation (e.g. [2,1,3,5,4] around pivot 3) fails. If expected is not an
 *   array of that shape, we refuse to certify (return false) rather than pass.
 * - everything else: index, index pair (order-insensitive), or scalar.
 */
function answersAgree(pattern: ArrayPattern, canonical: unknown, expected: unknown, param: number): boolean {
  // valid_palindrome: the canonical answer is a boolean. Compare against a literal
  // boolean, the strings "true"/"false" (case-insensitive), or 1/0, but NEVER fall
  // through to the numeric scalar coercion below (where Number(false) === 0 would
  // make a `false` answer spuriously match an expected 0). A boolean is decided here.
  if (pattern === 'valid_palindrome') {
    if (typeof canonical !== 'boolean') return false
    const e = normalizeBoolean(expected)
    return e !== null && e === canonical
  }
  // longest_substring: the canonical answer is a length (a non-negative integer),
  // handled by the scalar branch at the bottom (Number(canonical) === Number(expected)).
  if (pattern === 'partition') {
    if (!isPartitionCounts(canonical) || !Array.isArray(expected)) return false
    const arr = expected.map(Number)
    if (arr.some((v) => Number.isNaN(v))) return false
    const { less, equal, greater } = canonical
    if (arr.length !== less + equal + greater) return false
    // The expected array must be laid out as [<pivot ×less | ==pivot ×equal | >pivot ×greater].
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (i < less) {
        if (!(v < param)) return false
      } else if (i < less + equal) {
        if (v !== param) return false
      } else {
        if (!(v > param)) return false
      }
    }
    return true
  }
  if (Array.isArray(canonical) && Array.isArray(expected)) {
    if (canonical.length !== expected.length) return false
    const a = [...canonical].map(Number).sort((x, y) => x - y)
    const b = [...expected].map(Number).sort((x, y) => x - y)
    return a.every((v, i) => v === b[i])
  }
  // Scalars (found index, best sum). Coerce numeric strings.
  return Number(canonical) === Number(expected) || canonical === expected
}
