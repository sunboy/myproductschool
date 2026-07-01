/**
 * Pure, deterministic trace-reduction + shape-detection for the generic
 * execution walkthrough (Phase B of the hybrid render).
 *
 * Phase A (scripts/solutions/trace/genericTrace.ts) sys.settrace-s a challenge's
 * REAL reference_solution on ONE real test case and returns up to 400 raw frames,
 * each carrying the executed line and a shallow snapshot of the solution's locals.
 * That timeline is too long and too noisy to render directly.
 *
 * `reduceTrace` collapses it into a <=8-step "execution spec": a viz mode detected
 * from the SHAPE of the locals (never the challenge tag), the star container local
 * to animate, and 3-8 chosen steps carrying only the sanitized, meaningful state.
 * It is correct by construction because the trace IS the real reference execution.
 *
 * Deterministic by contract: the same GenericTrace in ALWAYS produces the same spec
 * out. No wall-clock, no randomness, no map-iteration-order dependence in the
 * chosen output. Fail-soft: a trace with no usable frames returns null.
 *
 * This module does NOT touch the stepped-diagram schema, graft, or the renderer.
 * A later phase maps this spec onto a new "execution" verified base.
 */

import type { GenericTrace, TraceFrame } from '../../../../scripts/solutions/trace/genericTrace'

// ── Public output shape ──────────────────────────────────────────────────────

/** Detected render family for the reduced trace. */
export type ExecutionViz = 'matrix' | 'array' | 'ribbon' | 'callstack' | 'table'

/** Sanitized locals: names carrying only serializable, deterministic values. */
export type SanitizedLocals = Record<string, unknown>

/** A grid coordinate into the star matrix container. */
export interface ExecutionCursor {
  r: number
  c: number
}

/** One reduced step the renderer walks through. */
export interface ReducedExecutionStep {
  /** 1-based source line (line N => sourceLines[N-1]); mirrors the raw frame. */
  line: number
  /** Short deterministic label for the step (inputs / final / interior move). */
  note?: string
  /** Sanitized locals visible after this line executed. */
  locals: SanitizedLocals
  /** For matrix viz: the (r,c) cell the scalar loop indices point at, if resolvable. */
  cursor?: ExecutionCursor
  /** For array/ribbon viz: named scalar indices over the star container. */
  pointers?: Record<string, number>
  /** Snapshot of the star container's value at this step (array/matrix/ribbon). */
  container?: unknown
  /** For callstack viz: reconstructed call-nesting depth (0 = top-level entry). */
  depth?: number
}

/** The reduced, render-ready execution spec. */
export interface ReducedExecution {
  viz: ExecutionViz
  /** The (class-adapted) reference source, one entry per line. Passed through. */
  sourceLines: string[]
  /** Name of the star container local (array/matrix/ribbon). Absent for table/callstack. */
  star?: string
  /** 3-8 chosen steps, always including the first (inputs) and last (answer). */
  steps: ReducedExecutionStep[]
  /** Which safety caps tripped upstream, so the renderer can mark an incomplete trace. */
  capped?: { frames: boolean; time: boolean }
}

// ── Tuning constants ─────────────────────────────────────────────────────────

const MAX_STEPS = 8
const MIN_STEPS = 3
/** Interior steps between the pinned first and last (8 total, minus first + last). */
const MAX_INTERIOR = MAX_STEPS - 2

// ── 1. Sanitization ──────────────────────────────────────────────────────────

/** CPython comprehension/genexpr iterator temporaries: `.0`, `.1`, ... */
const COMPREHENSION_ITER = /^\.\d+$/
/** Opaque object repr with a memory address, e.g. "<obj <Foo object at 0x10a...>>". */
const OPAQUE_ADDRESS = /0x[0-9a-fA-F]+/
/** Function / bound-method / module reprs that leaked as a string value. */
const FUNCTION_REPR = /^<(?:obj )?<?(?:function|bound method|built-in|module|class|method-wrapper|cell)\b/i

/**
 * True when a serialized value is deterministic + meaningful enough to keep.
 * Drops the address-bearing opaque objects and function/module reprs the Phase A
 * tracer can leak as `<obj ...>` strings. Recurses one level into containers so a
 * list/dict containing a leaked repr is dropped too (its shape is unstable).
 */
function isCleanValue(v: unknown, depth = 0): boolean {
  if (v === null) return true
  const t = typeof v
  if (t === 'number' || t === 'boolean') return true
  if (t === 'string') {
    const s = v as string
    if (OPAQUE_ADDRESS.test(s)) return false
    if (FUNCTION_REPR.test(s)) return false
    // A leaked `<obj ...>` repr without an address is still opaque and unstable.
    if (/^<obj /.test(s)) return false
    return true
  }
  if (depth >= 3) return true // deep enough; the tracer already elided beyond depth 2
  if (Array.isArray(v)) return v.every((x) => isCleanValue(x, depth + 1))
  if (t === 'object') {
    const obj = v as Record<string, unknown>
    // Node/set sentinels from the tracer are clean structured values.
    if ('__node__' in obj || '__set__' in obj) {
      return Object.values(obj).every((x) => isCleanValue(x, depth + 1))
    }
    return Object.values(obj).every((x) => isCleanValue(x, depth + 1))
  }
  return false
}

/**
 * Drop comprehension-iterator names and any value that fails the clean-value test.
 * Deterministic: iterates the object's own keys in insertion order and rebuilds.
 */
function sanitizeLocals(locals: Record<string, unknown>): SanitizedLocals {
  const out: SanitizedLocals = {}
  for (const name of Object.keys(locals)) {
    if (COMPREHENSION_ITER.test(name)) continue
    const val = locals[name]
    if (!isCleanValue(val)) continue
    out[name] = val
  }
  return out
}

interface CleanFrame {
  line: number
  locals: SanitizedLocals
}

// ── Value shape helpers ──────────────────────────────────────────────────────

function isListOfLists(v: unknown): v is unknown[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((row) => Array.isArray(row))
  )
}

/**
 * True when a list-of-lists is a genuine 2-D GRID: >=2 rows, every row the SAME
 * length (rectangular), and every cell a scalar. This rejects the common
 * false-positive where a heap / list of coordinate tuples (`[[dist,x,y], ...]`)
 * gets mistaken for a spatial matrix and rendered as a grid the algorithm never
 * navigates. A ragged or tuple-of-mixed-things shape is NOT a matrix; it falls
 * through to the array or table viz where its real state still shows.
 */
function isGridLike(v: unknown): v is unknown[][] {
  if (!Array.isArray(v) || v.length < 2) return false
  if (!v.every((row) => Array.isArray(row))) return false
  const width = (v[0] as unknown[]).length
  if (width < 2) return false
  return (v as unknown[][]).every(
    (row) => row.length === width && row.every((cell) => isScalar(cell)),
  )
}

/** A 1-D list of scalars (numbers/strings/booleans/null), the tracer's elide marker aside. */
function isScalarList(v: unknown): v is unknown[] {
  if (!Array.isArray(v)) return false
  return v.every(
    (x) => x === null || ['number', 'string', 'boolean'].includes(typeof x),
  )
}

function isNodeValue(v: unknown): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v) && '__node__' in (v as object)
}

function isScalar(v: unknown): boolean {
  return v === null || ['number', 'string', 'boolean'].includes(typeof v)
}

function isIntScalar(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

/** Stable structural signature of a value, for cheap change detection. Always a
 * string: JSON.stringify(undefined) is the value `undefined` (not a throw) and a
 * circular value throws, so both are coalesced to a stable string sentinel. */
function signature(v: unknown): string {
  try {
    const s = JSON.stringify(v)
    return s === undefined ? ' undef' : s
  } catch {
    return String(v)
  }
}

/** Character-level distance between two JSON signatures (a proxy for state change). */
function changeMagnitude(a: unknown, b: unknown): number {
  const sa = signature(a)
  const sb = signature(b)
  if (sa === sb) return 0
  // Symmetric difference of characters is stable and monotone with edit size.
  const len = Math.max(sa.length, sb.length)
  let diff = Math.abs(sa.length - sb.length)
  const min = Math.min(sa.length, sb.length)
  for (let i = 0; i < min; i++) if (sa[i] !== sb[i]) diff++
  return diff / Math.max(1, len) + diff
}

// ── 2. Detection ─────────────────────────────────────────────────────────────

interface Detection {
  viz: ExecutionViz
  /** Star container local name for array/matrix/ribbon. */
  star?: string
  /** For matrix: candidate scalar index names, in priority (row, col) order. */
  cursorNames?: string[]
  /** For array/ribbon: scalar index names to expose as pointers. */
  pointerNames?: string[]
}

/**
 * Track, across all frames, how much each local NAME evolves and what shape it
 * holds. A name that is a list-of-lists whose value changes across frames is a
 * matrix candidate; a 1-D scalar list that dominates is an array candidate; a
 * string held ~constant while integer indices advance over it is a ribbon; a
 * node-typed single local with the structure living in frame order is a callstack.
 */
function detectViz(frames: CleanFrame[]): Detection {
  // Gather per-name observations.
  interface NameStat {
    name: string
    seen: number
    changes: number // distinct-value transitions
    listOfListsHits: number
    gridLikeHits: number // list-of-lists that is a rectangular grid of scalars
    scalarListHits: number
    stringHits: number
    nodeHits: number
    intScalarHits: number
    maxLen: number // for list/string length
    firstIndex: number // frame index of first appearance (tie-break, deterministic)
  }
  const stats = new Map<string, NameStat>()
  const lastSig = new Map<string, string>()

  frames.forEach((f, fi) => {
    for (const name of Object.keys(f.locals)) {
      const val = f.locals[name]
      let st = stats.get(name)
      if (!st) {
        st = {
          name,
          seen: 0,
          changes: 0,
          listOfListsHits: 0,
          gridLikeHits: 0,
          scalarListHits: 0,
          stringHits: 0,
          nodeHits: 0,
          intScalarHits: 0,
          maxLen: 0,
          firstIndex: fi,
        }
        stats.set(name, st)
      }
      st.seen++
      if (isListOfLists(val)) {
        st.listOfListsHits++
        if (isGridLike(val)) st.gridLikeHits++
        st.maxLen = Math.max(st.maxLen, val.length)
      } else if (isScalarList(val)) {
        st.scalarListHits++
        st.maxLen = Math.max(st.maxLen, val.length)
      } else if (typeof val === 'string') {
        st.stringHits++
        st.maxLen = Math.max(st.maxLen, val.length)
      } else if (isNodeValue(val)) {
        st.nodeHits++
      } else if (isIntScalar(val)) {
        st.intScalarHits++
      }
      const sig = signature(val)
      const prev = lastSig.get(name)
      if (prev !== undefined && prev !== sig) st.changes++
      lastSig.set(name, sig)
    }
  })

  const all = [...stats.values()]
  // Deterministic ordering for any "pick the dominant" tie: by the metric, then
  // by first appearance, then by name.
  const byName = (a: NameStat, b: NameStat) =>
    a.firstIndex - b.firstIndex || a.name.localeCompare(b.name)

  // MATRIX: a RECTANGULAR grid-of-scalars local that actually mutates across frames.
  // The grid-like gate rejects heaps / lists of coordinate tuples that happen to be
  // list-of-lists but are not a spatial matrix the algorithm navigates.
  const matrixCandidates = all
    .filter((s) => s.gridLikeHits >= 2 && s.changes >= 1)
    .sort((a, b) => b.changes - a.changes || byName(a, b))
  if (matrixCandidates.length > 0) {
    const star = matrixCandidates[0].name
    // Cursor from scalar int locals that plausibly index the matrix. Prefer the
    // two most-frequently-present int scalars, ordered by name for determinism so
    // (r,c) style pairs resolve stably. Exclude the star itself.
    const cursorNames = all
      .filter((s) => s.intScalarHits >= 1 && s.name !== star)
      .sort((a, b) => b.intScalarHits - a.intScalarHits || byName(a, b))
      .slice(0, 4)
      .map((s) => s.name)
    return { viz: 'matrix', star, cursorNames }
  }

  // ARRAY: a single dominant 1-D scalar list that evolves. Dominant = most changes
  // among scalar-list locals, and it must change at least once.
  const arrayCandidates = all
    .filter((s) => s.scalarListHits >= 2)
    .sort((a, b) => b.changes - a.changes || b.scalarListHits - a.scalarListHits || byName(a, b))
  if (arrayCandidates.length > 0 && arrayCandidates[0].changes >= 1) {
    const star = arrayCandidates[0].name
    const pointerNames = all
      .filter((s) => s.intScalarHits >= 1 && s.name !== star)
      .sort((a, b) => b.intScalarHits - a.intScalarHits || byName(a, b))
      .slice(0, 3)
      .map((s) => s.name)
    return { viz: 'array', star, pointerNames }
  }

  // RIBBON: a string local held ~constant (few/no changes) while >=1 int index
  // advances over it. The string is the ribbon; the indices scan it.
  const stringCandidates = all
    .filter((s) => s.stringHits >= 2 && s.maxLen >= 2)
    .sort((a, b) => a.changes - b.changes || b.stringHits - a.stringHits || byName(a, b))
  if (stringCandidates.length > 0) {
    const star = stringCandidates[0]
    const advancingIndices = all
      .filter((s) => s.intScalarHits >= 2 && s.changes >= 1 && s.name !== star.name)
      .sort((a, b) => b.changes - a.changes || byName(a, b))
    if (advancingIndices.length >= 1 && star.changes <= advancingIndices[0].changes) {
      return {
        viz: 'ribbon',
        star: star.name,
        pointerNames: advancingIndices.slice(0, 3).map((s) => s.name),
      }
    }
  }

  // CALLSTACK is DELIBERATELY DISABLED. Depth cannot be recovered from a line-event
  // tracer: the only signal is line-number movement, and a recursive function whose
  // body runs top-to-bottom produces monotone-climbing "depth" that never returns
  // (empirically [0,1,2,3,4,5,6] on a tree that only recurses 2-3 deep), teaching
  // the false lesson that recursion gets perpetually deeper. Rather than animate a
  // wrong depth, node-heavy traces fall through to the TABLE viz, which shows the
  // real locals (including the current node) accurately with no fabricated nesting.
  // Re-enable only with a tracer that emits true call/return events.

  // TABLE: nothing dominates (or it is recursion we will not fake as a callstack).
  // Straight-line value walk; render each step's real locals as a value table.
  return { viz: 'table' }
}

// ── 3. Reduction ─────────────────────────────────────────────────────────────

/**
 * Detect the outer-loop-header source line: the most-frequently-hit LOW line
 * number among the frames. Loop headers sit near the top of the function and are
 * re-entered on every iteration, so they dominate the low-line frequency count.
 * Deterministic: ties broken toward the smaller line number.
 */
function detectLoopHeaderLine(frames: CleanFrame[]): number | null {
  const counts = new Map<number, number>()
  for (const f of frames) counts.set(f.line, (counts.get(f.line) ?? 0) + 1)
  const revisited = [...counts.entries()].filter(([, c]) => c >= 2)
  if (revisited.length === 0) return null
  // Highest frequency wins; tie -> lowest line number (the outer header).
  revisited.sort((a, b) => b[1] - a[1] || a[0] - b[0])
  return revisited[0][0]
}

/** The star value in a frame, for change-magnitude scoring. */
function starValue(frame: CleanFrame, star: string | undefined): unknown {
  if (!star) return undefined
  return frame.locals[star]
}

/**
 * Loop-family reduction (matrix / array / ribbon): keep frame0 (inputs) and the
 * final frame (answer), plus up to 6 interior candidates. Candidates are the
 * outer-loop-header revisits (one per iteration); if there are too many, keep the
 * ones with the largest state change in the star container; if too few, fall back
 * to the largest-star-change interior frames overall. Deterministic throughout.
 */
function reduceLoopFamily(
  frames: CleanFrame[],
  star: string | undefined,
): number[] {
  const n = frames.length
  const first = 0
  const last = n - 1

  const headerLine = detectLoopHeaderLine(frames)
  // Interior candidate indices (exclude the pinned first + last).
  let candidates: number[] = []
  if (headerLine != null) {
    candidates = frames
      .map((f, i) => (f.line === headerLine ? i : -1))
      .filter((i) => i > first && i < last)
  }
  // If loop-header revisits are unavailable or sparse, fall back to all interior.
  if (candidates.length === 0) {
    candidates = []
    for (let i = first + 1; i < last; i++) candidates.push(i)
  }

  if (candidates.length <= MAX_INTERIOR) {
    // Keep them all, in execution order.
    return dedupeSorted([first, ...candidates, last])
  }

  // Too many: score each by star-container change vs the PREVIOUS kept frame, and
  // keep the MAX_INTERIOR largest. Ties broken toward the earlier frame index so
  // the result is deterministic and reads left-to-right.
  const scored = candidates.map((i) => {
    const prevIdx = i - 1 >= 0 ? i - 1 : i
    const mag = star
      ? changeMagnitude(starValue(frames[prevIdx], star), starValue(frames[i], star))
      : 0
    return { i, mag }
  })
  scored.sort((a, b) => b.mag - a.mag || a.i - b.i)
  const keptInterior = scored.slice(0, MAX_INTERIOR).map((s) => s.i)
  return dedupeSorted([first, ...keptInterior, last])
}

/**
 * Callstack reduction: one step per call-ENTRY and per RETURN that changes the
 * bubbling value, following the deepest path, capped at 8. We reconstruct depth
 * from consecutive frame line movement: a jump BACK to a lower/earlier line after
 * progressing is treated as a return; forward progression into the body is a call.
 * Since the generic tracer emits line events (not call/return events), we
 * approximate nesting by the recursion depth implied by which locals are present:
 * deeper calls introduce fresh parameter bindings. Fully deterministic.
 */
function reduceCallstack(frames: CleanFrame[]): { kept: number[]; depths: Map<number, number> } {
  const n = frames.length
  const depths = new Map<number, number>()

  // Approximate depth by the count of distinct "call-parameter-like" scalar locals
  // present. In practice recursion re-binds the same parameter names per level, so
  // the tracer's flat locals cannot show true depth; we instead track ENTRY/RETURN
  // by line movement. A step is a call-entry when the line advances into the body;
  // a return when the line jumps back above the current running minimum after work.
  let depth = 0
  let prevLine = frames[0]?.line ?? 0
  const entries: number[] = []
  const returns: number[] = []

  frames.forEach((f, i) => {
    if (i === 0) {
      depths.set(i, 0)
      entries.push(i)
      prevLine = f.line
      return
    }
    if (f.line > prevLine) {
      // moving forward into the body => treat as descending a call
      depth++
      entries.push(i)
    } else if (f.line < prevLine) {
      // jumping back => a return bubbling a value up
      depth = Math.max(0, depth - 1)
      returns.push(i)
    }
    depths.set(i, depth)
    prevLine = f.line
  })

  // Keep call-entries and returns-that-change the bubbling answer-ish value. The
  // deepest path first, then trim to 8 while always keeping first + last.
  const last = n - 1
  const changingReturns = returns.filter((i) => {
    const prev = i - 1 >= 0 ? frames[i - 1] : frames[i]
    return changeMagnitude(prev.locals, frames[i].locals) > 0
  })

  // Prefer the deepest-depth steps; break ties by earlier index.
  const interiorPool = [...new Set([...entries, ...changingReturns])]
    .filter((i) => i > 0 && i < last)
  interiorPool.sort((a, b) => (depths.get(b)! - depths.get(a)!) || a - b)
  const keptInterior = interiorPool.slice(0, MAX_INTERIOR)

  return { kept: dedupeSorted([0, ...keptInterior, last]), depths }
}

/** Table reduction: even, deterministic spread of interior frames plus first + last. */
function reduceTable(frames: CleanFrame[]): number[] {
  const n = frames.length
  const first = 0
  const last = n - 1
  if (n <= MAX_STEPS) {
    const all: number[] = []
    for (let i = 0; i < n; i++) all.push(i)
    return all
  }
  // Evenly sample MAX_INTERIOR interior indices between first and last.
  const kept: number[] = [first]
  const interiorSpan = last - first
  for (let k = 1; k <= MAX_INTERIOR; k++) {
    const idx = first + Math.round((interiorSpan * k) / (MAX_INTERIOR + 1))
    if (idx > first && idx < last) kept.push(idx)
  }
  kept.push(last)
  return dedupeSorted(kept)
}

function dedupeSorted(indices: number[]): number[] {
  return [...new Set(indices)].sort((a, b) => a - b)
}

// ── Step assembly ────────────────────────────────────────────────────────────

/** Resolve the (r,c) cursor for a matrix step from the frame's scalar int locals. */
function resolveCursor(
  frame: CleanFrame,
  star: string | undefined,
  cursorNames: string[] | undefined,
): ExecutionCursor | undefined {
  if (!star || !cursorNames || cursorNames.length === 0) return undefined
  const matrix = frame.locals[star]
  if (!isListOfLists(matrix)) return undefined
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  // Collect the int scalars present this frame, in cursorName priority order.
  const present = cursorNames
    .map((name) => ({ name, v: frame.locals[name] }))
    .filter((x) => isIntScalar(x.v)) as { name: string; v: number }[]
  if (present.length < 2) return undefined
  // First in priority order that is a valid row index -> r; next valid col -> c.
  let r: number | undefined
  let c: number | undefined
  for (const p of present) {
    if (r === undefined && p.v >= 0 && p.v < rows) {
      r = p.v
      continue
    }
    if (c === undefined && p.v >= 0 && p.v < cols) {
      c = p.v
    }
  }
  if (r === undefined || c === undefined) return undefined
  return { r, c }
}

/**
 * Named integer pointers over the star container for array/ribbon steps. Only a
 * pointer that is IN RANGE of the container it points to this step is emitted, so
 * the animation never draws a pointer at a cell that does not exist. The raw value
 * still appears in the step's `locals` table, so an out-of-range index (e.g. an
 * end-of-scan `i === len`) is visible as a number but not mis-drawn on the row.
 */
function resolvePointers(
  frame: CleanFrame,
  pointerNames: string[] | undefined,
  containerLen: number,
): Record<string, number> | undefined {
  if (!pointerNames || pointerNames.length === 0) return undefined
  const out: Record<string, number> = {}
  for (const name of pointerNames) {
    const v = frame.locals[name]
    if (isIntScalar(v) && v >= 0 && v < containerLen) out[name] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function noteFor(position: 'first' | 'last' | 'interior'): string {
  if (position === 'first') return 'inputs'
  if (position === 'last') return 'answer'
  return 'step'
}

// ── Entry point ──────────────────────────────────────────────────────────────

/**
 * Reduce a raw GenericTrace (up to 400 frames) to a deterministic <=8-step
 * execution spec with a detected viz mode. Returns null when no frame survives
 * sanitization (nothing meaningful to render).
 */
export function reduceTrace(trace: GenericTrace): ReducedExecution | null {
  const rawFrames: TraceFrame[] = Array.isArray(trace.frames) ? trace.frames : []
  // 1. SANITIZE every frame. Drop frames that end up empty after sanitization only
  // when there is other signal, but keep at least the boundary frames' shape.
  const clean: CleanFrame[] = rawFrames.map((f) => ({
    line: typeof f.line === 'number' ? f.line : 0,
    locals: sanitizeLocals(f.locals ?? {}),
  }))

  // Frames with zero clean locals carry no state; drop them, but never let the
  // trace go empty. This removes pure control-flow lines that only touched noise.
  let frames = clean.filter((f) => Object.keys(f.locals).length > 0)
  if (frames.length === 0) frames = clean
  if (frames.length === 0) return null

  // 2. DETECT viz from the shape of the (sanitized) locals across frames.
  const detection = detectViz(frames)

  // 3. REDUCE to <=8 by viz family.
  let keptIndices: number[]
  let depths: Map<number, number> | null = null
  if (detection.viz === 'callstack') {
    const res = reduceCallstack(frames)
    keptIndices = res.kept
    depths = res.depths
  } else if (detection.viz === 'table') {
    keptIndices = reduceTable(frames)
  } else {
    keptIndices = reduceLoopFamily(frames, detection.star)
  }

  // Enforce the 3..8 window deterministically. If reduction produced fewer than
  // MIN_STEPS (tiny trace), pad with the nearest unused interior frames; if more
  // than MAX_STEPS (shouldn't happen given the caps above), trim the middle.
  keptIndices = enforceWindow(keptIndices, frames.length)

  const steps: ReducedExecutionStep[] = keptIndices.map((idx, order) => {
    const frame = frames[idx]
    const position =
      order === 0 ? 'first' : order === keptIndices.length - 1 ? 'last' : 'interior'
    const step: ReducedExecutionStep = {
      line: frame.line,
      note: noteFor(position),
      locals: frame.locals,
    }
    if (detection.viz === 'matrix') {
      const cursor = resolveCursor(frame, detection.star, detection.cursorNames)
      if (cursor) step.cursor = cursor
      if (detection.star && detection.star in frame.locals) {
        step.container = frame.locals[detection.star]
      }
    } else if (detection.viz === 'array' || detection.viz === 'ribbon') {
      const container =
        detection.star && detection.star in frame.locals ? frame.locals[detection.star] : undefined
      if (container !== undefined) step.container = container
      // The pointer row is the array length or the string length; only in-range
      // pointers are drawn, so the animation never points past the container.
      const containerLen = Array.isArray(container)
        ? container.length
        : typeof container === 'string'
          ? [...container].length
          : 0
      const pointers = resolvePointers(frame, detection.pointerNames, containerLen)
      if (pointers) step.pointers = pointers
    } else if (detection.viz === 'callstack' && depths) {
      step.depth = depths.get(idx) ?? 0
    }
    return step
  })

  const spec: ReducedExecution = {
    viz: detection.viz,
    sourceLines: Array.isArray(trace.sourceLines) ? trace.sourceLines : [],
    steps,
  }
  if (detection.star && detection.viz !== 'callstack' && detection.viz !== 'table') {
    spec.star = detection.star
  }
  if (trace.capped) spec.capped = { frames: !!trace.capped.frames, time: !!trace.capped.time }
  return spec
}

/**
 * Clamp a chosen index list to the [MIN_STEPS, MAX_STEPS] window while always
 * keeping the first and last. Deterministic padding pulls in the earliest unused
 * interior frames; deterministic trimming drops the innermost kept indices.
 */
function enforceWindow(indices: number[], total: number): number[] {
  let kept = dedupeSorted(indices).filter((i) => i >= 0 && i < total)
  if (kept.length === 0) kept = [0]
  const first = 0
  const last = Math.max(0, total - 1)
  if (!kept.includes(first)) kept = dedupeSorted([first, ...kept])
  if (last !== first && !kept.includes(last)) kept = dedupeSorted([...kept, last])

  // Pad up to MIN_STEPS with the earliest interior frames not yet kept.
  if (kept.length < MIN_STEPS) {
    for (let i = 0; i < total && kept.length < MIN_STEPS; i++) {
      if (!kept.includes(i)) kept = dedupeSorted([...kept, i])
    }
  }
  // Trim down to MAX_STEPS by removing interior indices closest to the center,
  // deterministically (drop from the middle outward, keeping first + last).
  while (kept.length > MAX_STEPS) {
    const interior = kept.slice(1, kept.length - 1)
    // Drop the interior element nearest the middle; tie -> the later index.
    const mid = (kept.length - 1) / 2
    let dropAt = 1
    let best = Infinity
    for (let k = 1; k < kept.length - 1; k++) {
      const dist = Math.abs(k - mid)
      if (dist < best || (dist === best)) {
        best = dist
        dropAt = k
      }
    }
    void interior
    kept.splice(dropAt, 1)
  }
  return kept
}
