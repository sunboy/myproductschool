/**
 * The universal, ceiling-free stepped-walkthrough builder.
 *
 * When none of the pattern-tracers (array / grid / sequence / pipeline) recognizes
 * an algorithm, this builder runs the challenge's REAL reference_solution under the
 * generic Python tracer (scripts/solutions/trace/generic_tracer.py via genericTrace.ts)
 * on one real visible test case, reduces the raw timeline to a <=8-step spec
 * (executionReduce.ts), and cross-checks the tracer's own serialized answer against
 * that case's `expected`. The state shown IS what the reference computed, so the
 * walkthrough is correct by construction; the cross-check only guards against a
 * reference that does not actually run or a serialization mismatch.
 *
 * Eligibility mirrors the other verified harnesses: build the diagram ONLY when the
 * traced answer agrees with the challenge's own `expected`. Any disagreement,
 * missing oracle, unusable reference, or empty reduction means no stepped diagram
 * (the solution keeps its static diagram). The model never authors the deltas — it
 * may only overlay per-step prose by index in graft.ts.
 *
 * Async because it spawns a sandboxed Python subprocess. Fail-soft everywhere:
 * every failure path returns null, never throws.
 */

import type {
  InteractiveStepDiagram,
  ExecutionStage,
  ExecutionDelta,
} from '@/lib/solutions/schema'
import {
  runGenericTrace,
  type ReferenceSolution,
  type TraceTestCase,
} from '../../../../scripts/solutions/trace/genericTrace'
import { reduceTrace, type ReducedExecution } from './executionReduce'

// ── Metadata / test-case shapes (only the fields we read) ─────────────────────

interface VisibleTestCase {
  args?: unknown[]
  input?: unknown
  expected?: unknown
  hidden?: boolean
  is_hidden?: boolean
  input_types?: unknown
  output_type?: unknown
}

export interface SteppedExecutionCandidate {
  diagram: InteractiveStepDiagram
  viz: ReducedExecution['viz']
}

// ── Reference extraction ──────────────────────────────────────────────────────

/**
 * Pull a Python reference out of metadata.reference_solution. Accepts a raw string
 * (assumed Python) or an object carrying a `python`/`py` field. Returns null when
 * there is no Python reference to trace (the generic tracer is Python-only).
 */
function extractPythonReference(reference: unknown): ReferenceSolution | null {
  if (typeof reference === 'string') {
    return reference.trim().length > 0 ? reference : null
  }
  if (reference && typeof reference === 'object') {
    const obj = reference as Record<string, unknown>
    const py = obj.python ?? obj.py
    if (typeof py === 'string' && py.trim().length > 0) return { python: py }
  }
  return null
}

// ── Test-case shaping ─────────────────────────────────────────────────────────

/** Coerce a stored `input_types` field into a string[] the tracer understands. */
function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => (typeof x === 'string' ? x : String(x)))
  return out.length > 0 ? out : undefined
}

/**
 * Build the tracer's test-case shape from a stored visible case. Requires an `args`
 * array (the tracer calls solution(*args)); a case without extractable positional
 * args cannot be traced. `input` (single value) is wrapped as a 1-arg call.
 */
function toTraceTest(tc: VisibleTestCase): TraceTestCase | null {
  let args: unknown[] | null = null
  if (Array.isArray(tc.args)) args = tc.args
  else if (tc.input !== undefined) args = [tc.input]
  if (!args || args.length === 0) return null

  return {
    args,
    input_types: asStringArray(tc.input_types),
    output_type: typeof tc.output_type === 'string' ? tc.output_type : null,
  }
}

// ── Answer cross-check ────────────────────────────────────────────────────────

/**
 * Structural, order-sensitive equality between the tracer's serialized answer and
 * the challenge's stored `expected`. Numbers and numeric strings compare equal
 * ("3" == 3) because expected values are frequently stored as strings; booleans
 * and null are compared by value; arrays/objects recurse. Anything ambiguous
 * returns false so the cross-check refuses to certify rather than guessing.
 */
/**
 * Exported for unit testing the cross-check discipline. Returns true iff the
 * tracer's serialized `answer` agrees with the stored `expected`, with the ONLY
 * coercion being a stored-oracle string vs a number/boolean of the same value.
 */
export function answersAgree(answer: unknown, expected: unknown): boolean {
  return deepAgree(answer, expected)
}

function deepAgree(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b

  // Type-aware scalar comparison. The ONLY coercion we allow is the stored-oracle
  // case: exactly one side is a string (oracles are frequently serialized as text)
  // and the other is a number/boolean. We never bridge two values of the SAME
  // non-matching representation (a genuine string "false" must NOT equal a boolean
  // false; a number must NOT equal a differently-typed non-string). This keeps a
  // wrong answer of a different type from being certified as correct.
  const aStr = typeof a === 'string'
  const bStr = typeof b === 'string'
  const aScalar = isComparableScalar(a)
  const bScalar = isComparableScalar(b)
  if (aScalar && bScalar) {
    if (aStr && bStr) return a === b // two strings: exact match only, no coercion
    if (aStr !== bStr) {
      // one string, one number/boolean: coerce the string to the other's canonical form
      const key = aStr ? coerceStringLike(a as string) : coerceStringLike(b as string)
      const other = aStr ? primitiveKey(b) : primitiveKey(a)
      return key !== null && key === other
    }
    // two non-strings of scalar type (number/boolean): strict value equality only
    return a === b
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((x, i) => deepAgree(x, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const oa = a as Record<string, unknown>
    const ob = b as Record<string, unknown>
    const ka = Object.keys(oa)
    const kb = Object.keys(ob)
    if (ka.length !== kb.length) return false
    return ka.every((k) => k in ob && deepAgree(oa[k], ob[k]))
  }
  return false
}

/** Matches ONLY a canonical decimal integer or float: optional sign, digits, one
 * optional fractional part. No scientific notation, no leading zeros, no leading/
 * trailing junk — so "1e3", "0001" do NOT coerce and cannot collapse two distinct
 * encodings into a false match. */
const CANONICAL_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/

/** A finite number, a boolean, or any string — the values we compare as scalars. */
function isComparableScalar(v: unknown): boolean {
  return (typeof v === 'number' && Number.isFinite(v)) || typeof v === 'boolean' || typeof v === 'string'
}

/** Canonical key for a number/boolean (never a string). Normalizes -0 to 0. */
function primitiveKey(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return `n:${v === 0 ? 0 : v}`
  if (typeof v === 'boolean') return `b:${v}`
  return null
}

/** Coerce a stored-oracle STRING to a number/boolean canonical key, or null if it
 * is not a clean canonical number or exact "true"/"false". Trimmed only. */
function coerceStringLike(s: string): string | null {
  const t = s.trim()
  if (CANONICAL_NUMBER.test(t)) return `n:${Number(t) === 0 ? 0 : Number(t)}`
  if (t === 'true') return 'b:true'
  if (t === 'false') return 'b:false'
  return null
}

// ── Diagram assembly ──────────────────────────────────────────────────────────

const NOTE_TITLE: Record<string, string> = {
  inputs: 'Inputs',
  answer: 'Result',
  step: 'Step',
}

/**
 * Map the deterministic ReducedExecution spec onto a schema-valid stepped diagram
 * with an execution base. Default prose per step (title/explanation) is readable on
 * its own; graft.ts may overlay model prose by index. trace_verified:true because
 * the deltas came from the real execution.
 */
function buildDiagram(spec: ReducedExecution, challengeTitle?: string): InteractiveStepDiagram {
  const base: ExecutionStage = {
    kind: 'execution',
    viz: spec.viz,
    sourceLines: spec.sourceLines.map((l) => (l.length > 400 ? l.slice(0, 400) : l)),
  }
  if (spec.star) base.star = spec.star
  if (spec.capped) base.capped = spec.capped

  const steps = spec.steps.map((s, i) => {
    const delta: ExecutionDelta = {
      base: 'execution',
      line: s.line,
      locals: s.locals,
    }
    if (s.cursor) delta.cursor = s.cursor
    if (s.pointers) delta.pointers = s.pointers
    if (s.container !== undefined) delta.container = s.container
    if (typeof s.depth === 'number') delta.depth = s.depth

    const position = i === 0 ? 'inputs' : i === spec.steps.length - 1 ? 'answer' : 'step'
    const title =
      position === 'step' ? `${NOTE_TITLE.step} ${i}` : NOTE_TITLE[position]
    const explanation = defaultExplanation(position, spec.viz)
    return { title, explanation, delta }
  })

  return {
    kind: 'stepped',
    title: challengeTitle ? `${challengeTitle}: how it runs` : 'How the solution runs',
    base,
    trace_verified: true,
    steps,
  }
}

function defaultExplanation(position: 'inputs' | 'answer' | 'step', viz: ReducedExecution['viz']): string {
  if (position === 'inputs') return 'The solution starts with these inputs.'
  if (position === 'answer') return 'The reference solution reaches its result here.'
  switch (viz) {
    case 'matrix':
      return 'The solution moves to the next cell and updates its running state.'
    case 'array':
      return 'The pointers advance and the tracked values change.'
    case 'ribbon':
      return 'The scan moves along the string, comparing characters at the current positions.'
    case 'callstack':
      return 'The recursion descends a level, then bubbles a value back up.'
    default:
      return 'The solution advances and its variables take on new values.'
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

/** Cap on how many visible cases we trace, to bound subprocess cost per challenge. */
const MAX_CERTIFY_CASES = 5

/**
 * Build a verified stepped-execution diagram for ANY coding challenge whose
 * reference solution runs and whose traced answer matches the challenge's own
 * expected output on EVERY extractable, oracle'd visible case, or null when it
 * cannot be certified. Async: spawns the Python tracer once per certified case.
 * Pure aside from those subprocesses (no DB); callers pass metadata they have.
 *
 * Cross-check discipline mirrors the pattern-tracers: it is not enough for the
 * reference to pass ONE case. Every visible case we can shape into a trace call and
 * that carries an `expected` MUST agree, so a reference that only coincidentally
 * matches the first input cannot be certified and animated as truth. The first
 * case that also reduces to a >=3-step spec supplies the diagram.
 */
export async function buildSteppedExecutionFromMetadata(
  metadata: Record<string, unknown>,
  challengeTitle?: string,
): Promise<SteppedExecutionCandidate | null> {
  const reference = extractPythonReference(metadata.reference_solution)
  if (!reference) return null

  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden)
  if (visible.length === 0) return null

  let diagramSpec: ReducedExecution | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const test = toTraceTest(tc)
    if (!test) continue // case shape we cannot turn into a trace call; ignore it
    if (tc.expected === undefined) return null // an extractable case with no oracle: cannot certify
    if (certifiedCount >= MAX_CERTIFY_CASES) break

    let trace
    try {
      trace = await runGenericTrace(reference, test)
    } catch {
      return null // tracer harness failure: fail soft, keep the static diagram
    }
    if (!trace) return null // tracer returned null on any internal failure (fail-soft)

    // Cross-check: the tracer's serialized answer MUST agree with THIS case's
    // expected. Any disagreement means the reference and the stored oracle differ
    // (bad reference, wrong serialization, or a shape we can't compare) — never
    // animate an unverifiable trace, so we bail on the whole challenge.
    if (!answersAgree(trace.answer, tc.expected)) return null
    certifiedCount++

    // The first case that reduces to a >=3-step spec supplies the diagram; later
    // cases still run purely to certify the reference on more inputs.
    if (!diagramSpec) {
      // reduceTrace is pure but defends against a pathological frame; wrap it so one
      // odd challenge can never crash a whole batch (fail soft to the static diagram).
      let spec: ReducedExecution | null = null
      try {
        spec = reduceTrace(trace)
      } catch {
        return null
      }
      // The execution base's schema floor is 3 steps (a 2-transition walkthrough
      // does not read as a motion). Fewer than 3 meaningful steps is too short to
      // animate honestly, so keep looking for a case that reduces to enough steps.
      if (spec && spec.steps.length >= 3) diagramSpec = spec
    }
  }

  if (certifiedCount === 0 || !diagramSpec) return null
  return { diagram: buildDiagram(diagramSpec, challengeTitle), viz: diagramSpec.viz }
}
