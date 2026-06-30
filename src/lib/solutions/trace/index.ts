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

import { runArrayTrace, buildSteppedArrayDiagram, computeAnswer, type ArrayPattern } from './arrayTrace'
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
}

/**
 * Infer the array pattern from technique/topic tags, then a conservative
 * reference-code fallback. The fallbacks fire only on strong, unambiguous signals
 * so an unrelated solution is never mislabeled (a wrong label fails the cross-check
 * downstream anyway, but a cheap textual gate avoids running a doomed trace).
 */
function detectPattern(tags: string[], referenceSource: string): ArrayPattern | null {
  for (const tag of tags) {
    const hit = PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) return hit
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

  if (pattern === 'fast_slow' || pattern === 'kadane') {
    // No scalar parameter; the array alone drives the walk / running sum.
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
