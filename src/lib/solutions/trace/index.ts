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

import { runArrayTrace, buildSteppedArrayDiagram, type ArrayPattern } from './arrayTrace'
import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

interface VisibleTestCase {
  id?: string
  label?: string
  args?: unknown[]
  input?: unknown
  expected?: unknown
}

export interface SteppedTraceCandidate {
  /** The verified diagram (deltas + base + verified marker), prose is placeholder. */
  diagram: InteractiveStepDiagram
  /** The slug the model should attach this diagram to (the optimal approach). */
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
}

/** Infer the array pattern from technique/topic tags, then a reference-code fallback. */
function detectPattern(tags: string[], referenceSource: string): ArrayPattern | null {
  for (const tag of tags) {
    const hit = PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) return hit
  }
  const src = referenceSource.toLowerCase()
  // Conservative fallbacks: only fire on strong, unambiguous signals.
  if (/\bmid\b/.test(src) && /(lo|left|low)\b/.test(src) && /(hi|right|high)\b/.test(src)) return 'binary_search'
  return null
}

/** Pull a numeric array + scalar parameter from a visible test case for the given pattern. */
function extractArrayInput(tc: VisibleTestCase, pattern: ArrayPattern): { values: number[]; param: number } | null {
  // Prefer the algorithm harness shape: args = [array, scalar?].
  const args = Array.isArray(tc.args) ? tc.args : (Array.isArray(tc.input) ? (tc.input as unknown[]) : null)
  if (!args || args.length === 0) return null

  const firstArray = args.find((a) => Array.isArray(a) && (a as unknown[]).every((v) => typeof v === 'number')) as number[] | undefined
  if (!firstArray) return null

  // The scalar parameter (target / k) is the first non-array number among args.
  const scalar = args.find((a) => typeof a === 'number') as number | undefined

  if (pattern === 'sliding_window') {
    // k must be a sensible window size; default to a middle value if absent.
    const k = typeof scalar === 'number' && scalar >= 1 && scalar <= firstArray.length ? scalar : Math.max(2, Math.floor(firstArray.length / 2))
    return { values: firstArray, param: k }
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
 * have. The returned diagram carries trace_verified:true and placeholder prose;
 * the generation route grafts model-authored prose over the same step indices.
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

  // Try each visible case until one yields a clean (>=3 frame) walkthrough.
  for (const tc of visible) {
    const input = extractArrayInput(tc, pattern)
    if (!input) continue
    const trace = runArrayTrace(pattern, input.values, input.param)
    if (!trace) continue

    // Cross-check: the canonical run's answer must agree with the challenge's
    // own expected output. If they disagree, this pattern is not what the
    // challenge wants, so it is NOT stepped eligible.
    if (tc.expected !== undefined && !answersAgree(trace.answer, tc.expected)) continue

    const diagram = buildSteppedArrayDiagram(trace)
    return { diagram, pattern }
  }
  return null
}

/** Loose structural agreement: index, index pair, or scalar, order-insensitive for pairs. */
function answersAgree(canonical: unknown, expected: unknown): boolean {
  if (Array.isArray(canonical) && Array.isArray(expected)) {
    if (canonical.length !== expected.length) return false
    const a = [...canonical].map(Number).sort((x, y) => x - y)
    const b = [...expected].map(Number).sort((x, y) => x - y)
    return a.every((v, i) => v === b[i])
  }
  // Scalars (found index, best sum). Coerce numeric strings.
  return Number(canonical) === Number(expected) || canonical === expected
}
