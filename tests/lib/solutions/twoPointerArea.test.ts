import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runArrayTrace, buildSteppedArrayDiagram, computeAnswer } from '../../../src/lib/solutions/trace/arrayTrace'
import { buildSteppedTraceFromMetadata } from '../../../src/lib/solutions/trace'
import { SolutionDiagramSchema, InteractiveStepDiagramSchema } from '../../../src/lib/solutions/schema'

// ── two_pointers_area: Container With Most Water ──────────────────────────────
//
// The canonical LeetCode example. Heights [1,8,6,2,5,4,8,3,7]; the optimal
// container uses the walls at index 1 (height 8) and index 8 (height 7), so the
// area is min(8,7) * (8-1) = 7 * 7 = 49.

const CONTAINER_HEIGHTS = [1, 8, 6, 2, 5, 4, 8, 3, 7]

test('two_pointers_area trace finds the max container area and converges by moving the shorter wall', () => {
  const trace = runArrayTrace('two_pointers_area', CONTAINER_HEIGHTS, 0)
  assert.ok(trace)
  assert.equal(trace!.answer, 49)
  assert.equal(trace!.pointers.join(','), 'lo,hi')
  // Hand-verified first three converging moves (the prompt's proof example):
  //   step0: lo0(h1) hi8(h7) -> area min(1,7)*8 = 8; left wall shorter, lo -> 1
  //   step1: lo1(h8) hi8(h7) -> area min(8,7)*7 = 49; right not taller, hi -> 7
  //   step2: lo1(h8) hi7(h3) -> area min(8,3)*6 = 18; right shorter, hi -> 6
  const firstThree = trace!.frames.slice(0, 3).map((f) => f.pointerAt)
  assert.deepEqual(firstThree, [
    { lo: 0, hi: 8 },
    { lo: 1, hi: 8 },
    { lo: 1, hi: 7 },
  ])
  // The best area (49) is reached at the second pair and never beaten; the final
  // frame is the terminal "found" state.
  assert.equal(trace!.frames.at(-1)!.found, true)
})

test('two_pointers_area oracle agrees with the display trace (uncapped)', () => {
  assert.equal(computeAnswer('two_pointers_area', CONTAINER_HEIGHTS, 0), 49)
  // A simple two-equal-walls case: [5,5] would be too small (len 2 traces 1 frame),
  // so use a 4-wall case. [1,2,4,3]: best is min(2,3)*2 = 4 (index1..3) or
  // min(1,3)*3 = 3 -> best 4.
  assert.equal(computeAnswer('two_pointers_area', [1, 2, 4, 3], 0), 4)
})

test('two_pointers_area built diagram passes the schema with the verified marker', () => {
  const trace = runArrayTrace('two_pointers_area', CONTAINER_HEIGHTS, 0)
  const diagram = buildSteppedArrayDiagram(trace!, { title: 'Container With Most Water' })
  assert.equal(SolutionDiagramSchema.safeParse(diagram).success, true)
  assert.equal(InteractiveStepDiagramSchema.safeParse(diagram).success, true)
  assert.equal(diagram.trace_verified, true)
  assert.equal(diagram.base.kind, 'array')
})

test('Container With Most Water (tagged two-pointers, area objective) is stepped eligible', () => {
  // Mirrors the real algo-code-029 metadata: a single array arg, scalar expected.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution:
        'class Solution:\n    def maxArea(self, height):\n        left, right = 0, len(height) - 1\n        max_area = 0\n        while left < right:\n            h = min(height[left], height[right])\n            width = right - left\n            max_area = max(max_area, h * width)\n            if height[left] < height[right]:\n                left += 1\n            else:\n                right -= 1\n        return max_area',
      test_cases: [{ id: 'tc-01', args: [CONTAINER_HEIGHTS], expected: 49 }],
    },
    ['two-pointers'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'two_pointers_area')
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('two_pointers_area cross-check rejects a wrong expected area', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(height):\n    max_area = 0\n    # min(...) * width container area',
      test_cases: [{ id: 'tc-01', args: [CONTAINER_HEIGHTS], expected: 48 }], // wrong; real is 49
    },
    ['two-pointers'],
  )
  assert.equal(candidate, null)
})

// ── two_pointers_water: Trapping Rain Water ───────────────────────────────────
//
// The canonical LeetCode example. Heights [0,1,0,2,1,0,1,3,2,1,2,1] trap 6 units.

// A 6-wall profile that fits the 8-frame display cap (5 converging moves). This
// is the live Trapping challenge's second visible case: [4,2,0,3,2,5] -> 9.
const TRAP_HEIGHTS_SMALL = [4, 2, 0, 3, 2, 5]
// The canonical 12-wall LeetCode example. It traps 6, but its 11 converging moves
// exceed the 8-step display cap, so its DISPLAY trace is rejected (kept honest);
// the uncapped oracle still computes 6 for cross-checking.
const TRAP_HEIGHTS_BIG = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

test('two_pointers_water trace accumulates the trapped water and converges by advancing the shorter side', () => {
  const trace = runArrayTrace('two_pointers_water', TRAP_HEIGHTS_SMALL, 0)
  assert.ok(trace)
  assert.equal(trace!.answer, 9)
  assert.equal(trace!.pointers.join(','), 'lo,hi')
  assert.equal(trace!.frames.at(-1)!.found, true)
  // Hand-verified moves over [4,2,0,3,2,5] (indices 0..5):
  //   step0: lo0(h4) hi5(h5). left<=right; 4 >= leftMax 0 -> leftMax=4, no water, lo->1.
  //   step1: lo1(h2) hi5(h5). left<=right; 2 < leftMax 4 -> traps 2, total 2, lo->2.
  //   step2: lo2(h0) hi5(h5). left<=right; 0 < leftMax 4 -> traps 4, total 6, lo->3.
  //   step3: lo3(h3) hi5(h5). left<=right; 3 < leftMax 4 -> traps 1, total 7, lo->4.
  //   step4: lo4(h2) hi5(h5). left<=right; 2 < leftMax 4 -> traps 2, total 9, lo->5. meet.
  const moves = trace!.frames.map((f) => f.pointerAt)
  assert.deepEqual(moves, [
    { lo: 0, hi: 5 },
    { lo: 1, hi: 5 },
    { lo: 2, hi: 5 },
    { lo: 3, hi: 5 },
    { lo: 4, hi: 5 },
  ])
})

test('two_pointers_water oracle agrees with the display trace (uncapped) and computes the big example', () => {
  assert.equal(computeAnswer('two_pointers_water', TRAP_HEIGHTS_SMALL, 0), 9)
  // The uncapped oracle is not limited by the display frame cap, so it still
  // computes the canonical 12-wall example's 6 units (used to cross-check it even
  // though the big input's DISPLAY trace is too long to show).
  assert.equal(computeAnswer('two_pointers_water', TRAP_HEIGHTS_BIG, 0), 6)
  // A flat / monotonic profile traps nothing.
  assert.equal(computeAnswer('two_pointers_water', [1, 2, 3, 4], 0), 0)
  // A simple basin [3,0,2] traps min(3,2)-0 = 2 over the middle column.
  assert.equal(computeAnswer('two_pointers_water', [3, 0, 2], 0), 2)
})

test('a 12-wall trapping input exceeds the 8-step display cap, so its display trace is rejected', () => {
  // 11 converging moves > MAX_FRAMES (8): the display trace cannot reach a terminal
  // state within the cap, so runArrayTrace returns null rather than show a partial,
  // misleading animation. (The challenge can still verify off a smaller visible case.)
  const trace = runArrayTrace('two_pointers_water', TRAP_HEIGHTS_BIG, 0)
  assert.equal(trace, null)
})

test('Trapping Rain Water (real metadata: 3 visible cases) routes to two_pointers_water and verifies', () => {
  // Mirrors the live 35064002 challenge: object-form reference_solution with
  // python carrying left_max + right_max, and the real visible test cases. The
  // 12-wall case oracle-certifies (6) but is too long to display; the 6-wall case
  // ([4,2,0,3,2,5] -> 9) supplies the clean display trace; [3,3,3,3] -> 0 also
  // certifies. All three must agree for the candidate to ship.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: {
        python:
          'def solution(height):\n    if not height:\n        return 0\n    left, right = 0, len(height) - 1\n    left_max, right_max = 0, 0\n    water = 0\n    while left < right:\n        if height[left] <= height[right]:\n            if height[left] >= left_max:\n                left_max = height[left]\n            else:\n                water += left_max - height[left]\n            left += 1\n        else:\n            if height[right] >= right_max:\n                right_max = height[right]\n            else:\n                water += right_max - height[right]\n            right -= 1\n    return water',
      },
      test_cases: [
        { id: 'tc1', args: [TRAP_HEIGHTS_BIG], expected: 6, hidden: false },
        { id: 'tc2', args: [TRAP_HEIGHTS_SMALL], expected: 9, hidden: false },
        { id: 'tc3', args: [[3, 3, 3, 3]], expected: 0, hidden: false },
      ],
    },
    ['two-pointers'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'two_pointers_water')
  assert.equal(candidate!.diagram.trace_verified, true)
  // The displayed trace is the clean 6-wall case (5 frames), not the 12-wall one.
  assert.equal(candidate!.diagram.steps.length, 5)
})

test('two_pointers_water cross-check rejects a wrong expected total', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: { python: 'left_max = 0\nright_max = 0\nwater = 0' },
      // real trapped water for [4,2,0,3,2,5] is 9; claim a wrong 3.
      test_cases: [{ id: 'tc1', args: [TRAP_HEIGHTS_SMALL], expected: 3 }],
    },
    ['two-pointers'],
  )
  assert.equal(candidate, null)
})

// ── Routing: pair-sum two-pointers must NOT be mislabeled as an area variant ──

test('a plain pair-sum two-pointer problem still routes to two_pointers (not area/water)', () => {
  // Sorted-array pair sum: target 10 in [1,3,4,6,8,11] -> indices [2,3]. No area
  // (min*width) and no left_max/right_max signature, so it stays pair-sum.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution:
        'def solution(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo < hi:\n        s = nums[lo] + nums[hi]\n        if s == target: return [lo, hi]\n        if s < target: lo += 1\n        else: hi -= 1\n    return []',
      test_cases: [{ id: 't1', args: [[1, 3, 4, 6, 8, 11], 10], expected: [2, 3] }],
    },
    ['two-pointers'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'two_pointers')
})

test('the area variant is NOT routed when the reference has no area/water signature', () => {
  // Even with the two-pointers tag and a single array arg, a reference that does
  // not show min()*width or left_max+right_max stays on the pair-sum tracer, which
  // then bails because there is no scalar target to extract. No diagram ships.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(nums):\n    lo, hi = 0, len(nums)-1\n    return lo + hi',
      test_cases: [{ id: 't1', args: [CONTAINER_HEIGHTS], expected: 8 }],
    },
    ['two-pointers'],
  )
  // Routes to two_pointers (no area/water signature). The pair-sum extractor needs
  // a scalar target it lacks, so the case is unextractable and nothing certifies.
  assert.equal(candidate, null)
})

test('two_pointers_area does NOT require a sorted array (heights are arbitrary)', () => {
  // The container heights are deliberately unsorted; the area tracer must still run.
  const trace = runArrayTrace('two_pointers_area', [3, 1, 2, 4, 1], 0)
  assert.ok(trace)
  // best: min(3, height)*width across pairs. min(3,1)*4=4, min(3,4)*3=9 (idx0..3),
  // ... the max is 9.
  assert.equal(trace!.answer, computeAnswer('two_pointers_area', [3, 1, 2, 4, 1], 0))
})
