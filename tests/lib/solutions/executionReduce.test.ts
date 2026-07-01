import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reduceTrace } from '../../../src/lib/solutions/trace/executionReduce'
import type { GenericTrace } from '../../../scripts/solutions/trace/genericTrace'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deep structural equality via JSON, for the determinism assertions. */
function sameSpec(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ── matrix ─────────────────────────────────────────────────────────────────

test('a list-of-lists local that mutates across frames detects viz:matrix with a cursor', () => {
  // Number-of-Islands shape: `grid` mutates '1' -> '0' as DFS floods a cell, with
  // scalar loop indices r/c indexing into it. Modeled after the real tracer output.
  const sourceLines = [
    'def solution(grid):',
    '    rows, cols = len(grid), len(grid[0])',
    '    count = 0',
    '    for r in range(rows):',
    '        for c in range(cols):',
    '            if grid[r][c] == "1":',
    '                grid[r][c] = "0"',
    '                count += 1',
    '    return count',
  ]
  const g = (a: string, b: string, cc: string) => [
    [a, '1', '0'],
    ['0', b, '0'],
    ['0', '0', cc],
  ]
  const frames = [
    { line: 2, locals: { grid: g('1', '1', '1') } },
    { line: 4, locals: { grid: g('1', '1', '1'), rows: 3, cols: 3, count: 0 } },
    { line: 5, locals: { grid: g('1', '1', '1'), rows: 3, cols: 3, count: 0, r: 0 } },
    { line: 6, locals: { grid: g('1', '1', '1'), rows: 3, cols: 3, count: 0, r: 0, c: 0 } },
    { line: 7, locals: { grid: g('0', '1', '1'), rows: 3, cols: 3, count: 0, r: 0, c: 0 } },
    { line: 5, locals: { grid: g('0', '0', '1'), rows: 3, cols: 3, count: 1, r: 1, c: 1 } },
    { line: 5, locals: { grid: g('0', '0', '0'), rows: 3, cols: 3, count: 2, r: 2, c: 2 } },
    { line: 9, locals: { grid: g('0', '0', '0'), rows: 3, cols: 3, count: 2 } },
  ]
  const trace: GenericTrace = { answer: 2, frames, sourceLines, capped: { frames: false, time: false } }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.equal(spec!.viz, 'matrix')
  assert.equal(spec!.star, 'grid')
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
  // The star container travels with the steps and at least one step resolves a cursor.
  assert.ok(spec!.steps.every((s) => s.container !== undefined))
  assert.ok(spec!.steps.some((s) => s.cursor && s.cursor.r >= 0 && s.cursor.c >= 0))
  // First step is inputs, last is answer.
  assert.equal(spec!.steps[0].note, 'inputs')
  assert.equal(spec!.steps.at(-1)!.note, 'answer')
})

// ── array ──────────────────────────────────────────────────────────────────

test('a single evolving 1-D list detects viz:array with pointers', () => {
  // Longest-Increasing-Subsequence shape: a `dp` array is the dominant evolving
  // state, with a write-index `i` advancing.
  const sourceLines = [
    'def solution(nums):',
    '    dp = [1] * len(nums)',
    '    for i in range(len(nums)):',
    '        for j in range(i):',
    '            if nums[j] < nums[i]:',
    '                dp[i] = max(dp[i], dp[j] + 1)',
    '    return max(dp)',
  ]
  const frames = [
    { line: 2, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18] } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 1, 1, 1, 1, 1] } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 1, 1, 1, 1], i: 3 } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 2, 1, 1, 1], i: 4 } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 2, 3, 1, 1], i: 5 } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 2, 3, 4, 1], i: 6 } },
    { line: 3, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 2, 3, 4, 4], i: 7 } },
    { line: 7, locals: { nums: [10, 9, 2, 5, 3, 7, 101, 18], dp: [1, 1, 1, 2, 2, 3, 4, 4] } },
  ]
  const trace: GenericTrace = { answer: 4, frames, sourceLines }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.equal(spec!.viz, 'array')
  assert.equal(spec!.star, 'dp')
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
  // The container rides along on every step where the star is bound (the `dp`
  // array is not yet defined on the inputs frame, so it may be absent there).
  assert.ok(spec!.steps.some((s) => Array.isArray(s.container)))
  assert.ok(spec!.steps.every((s) => 'dp' in s.locals ? Array.isArray(s.container) : s.container === undefined))
  // At least one interior step exposes the write-index pointer.
  assert.ok(spec!.steps.some((s) => s.pointers && typeof s.pointers.i === 'number'))
})

// ── ribbon ─────────────────────────────────────────────────────────────────

test('a constant string with two advancing indices detects viz:ribbon', () => {
  // Two-pointer palindrome scan: `s` is held constant while left/right advance.
  const sourceLines = [
    'def solution(s):',
    '    left, right = 0, len(s) - 1',
    '    while left < right:',
    '        if s[left] != s[right]:',
    '            return False',
    '        left += 1',
    '        right -= 1',
    '    return True',
  ]
  const S = 'racecar'
  const frames = [
    { line: 2, locals: { s: S } },
    { line: 3, locals: { s: S, left: 0, right: 6 } },
    { line: 3, locals: { s: S, left: 1, right: 5 } },
    { line: 3, locals: { s: S, left: 2, right: 4 } },
    { line: 3, locals: { s: S, left: 3, right: 3 } },
    { line: 8, locals: { s: S, left: 3, right: 3 } },
  ]
  const trace: GenericTrace = { answer: true, frames, sourceLines }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.equal(spec!.viz, 'ribbon')
  assert.equal(spec!.star, 's')
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
  // The string rides along and pointers advance over it.
  assert.ok(spec!.steps.every((s) => s.container === S))
  assert.ok(spec!.steps.some((s) => s.pointers && typeof s.pointers.left === 'number'))
})

// ── adversarial-review regressions ─────────────────────────────────────────────

test('a heap of coordinate tuples is NOT mistaken for a matrix (grid-like gate)', () => {
  // K-Closest-Points shape: `heap` is a list of [dist, x, y] tuples that mutates.
  // It is list-of-lists but NOT a rectangular grid of scalars the algorithm
  // navigates, so it must fall through to array/table, never render as a spatial
  // matrix with a cursor on phantom cells.
  const sourceLines = ['def solution(points, k):', '    heap = []', '    for x, y in points:', '        heappush(heap, (-(x*x+y*y), x, y))', '    return [[x,y] for _,x,y in heap]']
  const H = (arr: number[][]) => arr
  const frames = [
    { line: 2, locals: { points: [[1, 3], [-2, 2]], k: 1 } },
    { line: 4, locals: { points: [[1, 3], [-2, 2]], k: 1, heap: H([[-10, 1, 3]]), x: 1, y: 3 } },
    { line: 4, locals: { points: [[1, 3], [-2, 2]], k: 1, heap: H([[-10, 1, 3], [-8, -2, 2]]), x: -2, y: 2 } },
    { line: 5, locals: { points: [[1, 3], [-2, 2]], k: 1, heap: H([[-8, -2, 2]]) } },
  ]
  const trace: GenericTrace = { answer: [[-2, 2]], frames, sourceLines }
  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.notEqual(spec!.viz, 'matrix')
  // No step may carry a matrix cursor when it is not a matrix.
  assert.ok(spec!.steps.every((s) => s.cursor === undefined))
})

test('a star container absent from some frames does not crash change scoring', () => {
  // Regression: signature(undefined) is the value `undefined`, which used to throw
  // on `.length` in changeMagnitude when the star was missing from an interior
  // frame. The reduction must complete and never throw.
  const sourceLines = ['def solution(nums):', '    seen = {}', '    for n in nums:', '        seen[n] = True', '    return list(seen)']
  const A = [3, 1, 4, 1, 5, 9, 2, 6]
  const frames = [
    { line: 2, locals: { nums: A } },
    { line: 4, locals: { nums: A, n: 3, seen: { '3': true } } },
    { line: 3, locals: { nums: A } }, // seen absent here — star undefined this frame
    { line: 4, locals: { nums: A, n: 1, seen: { '3': true, '1': true } } },
    { line: 3, locals: { nums: A } },
    { line: 4, locals: { nums: A, n: 4, seen: { '3': true, '1': true, '4': true } } },
    { line: 5, locals: { nums: A, seen: { '3': true, '1': true, '4': true } } },
  ]
  const trace: GenericTrace = { answer: [3, 1, 4], frames, sourceLines }
  const spec = reduceTrace(trace)
  assert.ok(spec) // completed without throwing
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
})

test('an out-of-range pointer is dropped, never drawn past the container', () => {
  // Linear scan where the loop index runs one past the end at termination (i === len).
  const sourceLines = ['def solution(nums):', '    total = 0', '    for i in range(len(nums)):', '        total += nums[i]', '    return total']
  const A = [5, 8, 2]
  const frames = [
    { line: 2, locals: { nums: A } },
    { line: 4, locals: { nums: A, i: 0, total: 5 } },
    { line: 4, locals: { nums: A, i: 1, total: 13 } },
    { line: 4, locals: { nums: A, i: 2, total: 15 } },
    { line: 5, locals: { nums: A, i: 3, total: 15 } }, // i == len(nums): out of range
  ]
  const trace: GenericTrace = { answer: 15, frames, sourceLines }
  const spec = reduceTrace(trace)
  assert.ok(spec)
  // Whatever the detected viz, no emitted pointer may index at or beyond the array.
  for (const s of spec!.steps) {
    if (s.pointers) {
      for (const idx of Object.values(s.pointers)) assert.ok(idx >= 0 && idx < A.length, `pointer index ${idx} out of range`)
    }
  }
})

// ── callstack ────────────────────────────────────────────────────────────────

test('a node-typed recursion trace detects viz:table (callstack is deliberately disabled)', () => {
  // Max-depth-of-a-binary-tree recursion. Depth CANNOT be recovered from a
  // line-event tracer (line motion alone produces monotone-climbing garbage), so
  // callstack is disabled and node-heavy traces fall through to the table viz,
  // which shows the real locals (including the node) with no fabricated nesting.
  const sourceLines = [
    'def solution(root):',
    '    if not root:',
    '        return 0',
    '    left = solution(root.left)',
    '    right = solution(root.right)',
    '    return 1 + max(left, right)',
  ]
  const node = (repr: (number | null)[]) => ({ __node__: 'tree', val: repr[0] ?? null, repr })
  const frames = [
    { line: 2, locals: { root: node([3, 9, 20, null, null, 15, 7]) } }, // enter, depth 0
    { line: 4, locals: { root: node([3, 9, 20, null, null, 15, 7]) } }, // forward -> depth 1
    { line: 2, locals: { root: node([9]) } }, // recurse into left child (line back) -> return-ish
    { line: 4, locals: { root: node([9]) } }, // forward again -> depth up
    { line: 5, locals: { root: node([9]), left: 0 } }, // forward -> deeper
    { line: 6, locals: { root: node([9]), left: 0, right: 0 } }, // forward
    { line: 2, locals: { root: node([20, 15, 7]) } }, // back -> return bubble
    { line: 6, locals: { root: node([3, 9, 20, null, null, 15, 7]), left: 1, right: 2 } }, // final
  ]
  const trace: GenericTrace = { answer: 3, frames, sourceLines }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.equal(spec!.viz, 'table')
  assert.equal(spec!.star, undefined)
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
  // No step fabricates a depth (callstack is disabled); the node lives in locals.
  assert.ok(spec!.steps.every((s) => s.depth === undefined))
  assert.ok(spec!.steps.some((s) => s.locals.root !== undefined || s.locals.node !== undefined))
})

// ── table (fallback) ─────────────────────────────────────────────────────────

test('a straight-line scalar trace with no dominant container detects viz:table', () => {
  // Integer-reversal: only scalar locals evolve, nothing is a container to animate.
  const sourceLines = [
    'def solution(x):',
    '    result = 0',
    '    sign = 1 if x >= 0 else -1',
    '    x = abs(x)',
    '    while x:',
    '        result = result * 10 + x % 10',
    '        x //= 10',
    '    return sign * result',
  ]
  const frames = [
    { line: 2, locals: { x: 123 } },
    { line: 3, locals: { x: 123, result: 0 } },
    { line: 4, locals: { x: 123, result: 0, sign: 1 } },
    { line: 5, locals: { x: 123, result: 0, sign: 1 } },
    { line: 6, locals: { x: 123, result: 0, sign: 1 } },
    { line: 5, locals: { x: 12, result: 3, sign: 1 } },
    { line: 5, locals: { x: 1, result: 32, sign: 1 } },
    { line: 8, locals: { x: 0, result: 321, sign: 1 } },
  ]
  const trace: GenericTrace = { answer: 321, frames, sourceLines }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.equal(spec!.viz, 'table')
  assert.equal(spec!.star, undefined)
  assert.ok(spec!.steps.length >= 3 && spec!.steps.length <= 8)
  // Table steps carry sanitized locals but no container/cursor/pointers.
  assert.ok(spec!.steps.every((s) => s.container === undefined && s.cursor === undefined))
})

// ── determinism ──────────────────────────────────────────────────────────────

test('the same trace reduced twice yields byte-identical output (determinism)', () => {
  const sourceLines = ['def solution(nums):', '    dp = [1]', '    return dp']
  const frames = [
    { line: 2, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6] } },
    { line: 2, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6], dp: [1, 1, 1] } },
    { line: 2, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6], dp: [1, 2, 1], i: 1 } },
    { line: 2, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6], dp: [1, 2, 3], i: 2 } },
    { line: 2, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6], dp: [1, 2, 3, 4], i: 3 } },
    { line: 3, locals: { nums: [3, 1, 4, 1, 5, 9, 2, 6], dp: [1, 2, 3, 4] } },
  ]
  const trace: GenericTrace = { answer: 4, frames, sourceLines }

  const a = reduceTrace(trace)
  const b = reduceTrace(trace)
  const c = reduceTrace({ ...trace, frames: frames.map((f) => ({ ...f })) })
  assert.ok(a && b && c)
  assert.ok(sameSpec(a, b), 'two reductions of the identical object differ')
  assert.ok(sameSpec(a, c), 'reduction is not a pure function of the input')
})

// ── sanitization ─────────────────────────────────────────────────────────────

test('sanitization drops .N comprehension iterators and <obj ... 0x...> address leaks', () => {
  const sourceLines = [
    'def solution(nums):',
    '    dp = [0]',
    '    total = sum(x for x in nums)',
    '    return total',
  ]
  // Each frame carries the genexpr iterator `.0` and an address-bearing opaque
  // object `it`, both of which must be removed; the meaningful `dp`/`total`/`nums`
  // must survive.
  const noisy = (extra: Record<string, unknown>) => ({
    nums: [1, 2, 3, 4],
    '.0': '<obj <list_iterator object at 0x10ab34f10>>',
    it: '<obj <generator object at 0x7f9a1c0>>',
    fn: '<function solution at 0x105c0>',
    ...extra,
  })
  const frames = [
    { line: 2, locals: noisy({}) },
    { line: 3, locals: noisy({ dp: [0, 0, 0], total: 3 }) },
    { line: 3, locals: noisy({ dp: [0, 0, 0], total: 6, i: 1 }) },
    { line: 3, locals: noisy({ dp: [0, 0, 0], total: 10, i: 2 }) },
    { line: 4, locals: noisy({ dp: [0, 0, 0], total: 10 }) },
  ]
  const trace: GenericTrace = { answer: 10, frames, sourceLines }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  // The noise never appears in any step's locals.
  for (const step of spec!.steps) {
    assert.ok(!('.0' in step.locals), '.0 iterator leaked')
    assert.ok(!('it' in step.locals), 'address-bearing opaque object leaked')
    assert.ok(!('fn' in step.locals), 'function repr leaked')
    // At least the real input survives.
    assert.ok('nums' in step.locals)
  }
})

// ── capped passthrough ───────────────────────────────────────────────────────

test('the capped flag is carried through so the renderer can mark an incomplete trace', () => {
  const sourceLines = ['def solution(nums):', '    dp = [1]', '    return dp']
  const frames = Array.from({ length: 400 }, (_, k) => ({
    line: 2,
    locals: { nums: [1, 2, 3], dp: Array.from({ length: (k % 5) + 1 }, () => 1), i: k },
  }))
  const trace: GenericTrace = {
    answer: 1,
    frames,
    sourceLines,
    capped: { frames: true, time: false },
  }

  const spec = reduceTrace(trace)
  assert.ok(spec)
  assert.deepEqual(spec!.capped, { frames: true, time: false })
  // Even a 400-frame trace collapses to at most 8 steps.
  assert.ok(spec!.steps.length <= 8)
})

// ── null on empty ────────────────────────────────────────────────────────────

test('a trace with no frames returns null (nothing to render)', () => {
  const trace: GenericTrace = { answer: null, frames: [], sourceLines: [] }
  assert.equal(reduceTrace(trace), null)
})
