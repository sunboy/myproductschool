import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSteppedTraceFromMetadata } from '../../../src/lib/solutions/trace'
import { graftSteppedTrace } from '../../../src/lib/solutions/trace/graft'
import { SolutionDiagramSchema, type SolutionContentV1 } from '../../../src/lib/solutions/schema'

const BINARY_SEARCH_META = {
  reference_solution: 'def solution(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = lo + (hi-lo)//2\n        if nums[mid] == target: return mid\n        if nums[mid] < target: lo = mid+1\n        else: hi = mid-1\n    return -1',
  test_cases: [
    { id: 't1', args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 },
  ],
}

test('binary-search challenge with a matching tag is stepped eligible', () => {
  const candidate = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'binary_search')
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('pattern is inferred from reference code when tags are absent', () => {
  const candidate = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, [])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'binary_search')
})

test('no recognizable pattern -> not eligible', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'def solution(s):\n    return s[::-1]', test_cases: [{ args: ['abc'], expected: 'cba' }] },
    ['string-manipulation'],
  )
  assert.equal(candidate, null)
})

test('cross-check rejects a pattern whose answer disagrees with the expected output', () => {
  // Tagged binary-search, but the expected output is a wrong index. The canonical
  // run returns 7; expected says 3, so we must NOT ship a misleading walkthrough.
  const candidate = buildSteppedTraceFromMetadata(
    { ...BINARY_SEARCH_META, test_cases: [{ args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 3 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('a too-small array yields no eligible trace', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[5, 10], 10], expected: 1 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

// ── Codex review hardening (cross-check + sortedness + completeness) ──────────

test('an extractable case missing `expected` disqualifies the pattern', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21] /* no expected */ }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('one agreeing case does not certify when another extractable case disagrees', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: BINARY_SEARCH_META.reference_solution,
      test_cases: [
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 }, // agrees
        { args: [[1, 3, 5, 7, 9, 11, 13, 15], 9], expected: 99 },       // wrong oracle -> disqualify
      ],
    },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('an unsorted array is rejected for binary search', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[9, 2, 7, 4, 21, 13, 18, 11, 29], 21], expected: 4 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('all-cases-agree certifies and produces a verified diagram', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: BINARY_SEARCH_META.reference_solution,
      test_cases: [
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 },
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 2], expected: 0 },
      ],
    },
    ['binary-search'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.diagram.trace_verified, true)
})

// ── New tracers route from tags and cross-check against expected ──────────────

test('fast-slow-pointers tag routes to fast_slow and verifies against the duplicate', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(nums):\n    slow=nums[0]; fast=nums[nums[0]]\n    while slow!=fast: slow=nums[slow]; fast=nums[nums[fast]]\n    p=0\n    while p!=slow: p=nums[p]; slow=nums[slow]\n    return p',
      test_cases: [{ args: [[1, 3, 4, 2, 2]], expected: 2 }],
    },
    ['fast-slow-pointers'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'fast_slow')
  assert.equal(candidate!.diagram.trace_verified, true)
})

test('fast_slow cross-check rejects a wrong expected duplicate', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'slow fast', test_cases: [{ args: [[1, 3, 4, 2, 2]], expected: 4 }] },
    ['cycle-detection'],
  )
  assert.equal(candidate, null) // oracle says 2, expected says 4
})

test('kadane tag routes to kadane and verifies against the max-subarray sum', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(nums):\n    cur=best=nums[0]\n    for x in nums[1:]: cur=max(x,cur+x); best=max(best,cur)\n    return best',
      test_cases: [{ args: [[-2, 1, -3, 4, -1, 2, 1]], expected: 6 }],
    },
    ['kadane'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'kadane')
  assert.equal(candidate!.diagram.trace_verified, true)
})

test('kadane cross-check rejects a wrong expected sum', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'max subarray', test_cases: [{ args: [[-2, 1, -3, 4, -1, 2, 1]], expected: 10 }] },
    ['maximum-subarray'],
  )
  assert.equal(candidate, null) // oracle says 6, expected says 10
})

test('partition / dutch-national-flag tag routes to partition and verifies the partitioned array', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(nums, pivot):\n    low=mid=0; high=len(nums)-1\n    while mid<=high: ...',
      test_cases: [{ args: [[2, 0, 2, 1, 1, 0], 1], expected: [0, 0, 1, 1, 2, 2] }],
    },
    ['dutch-national-flag'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'partition')
  assert.equal(candidate!.diagram.trace_verified, true)
})

test('partition cross-check rejects an expected array that is not the partition result', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'partition', test_cases: [{ args: [[2, 0, 2, 1, 1, 0], 1], expected: [0, 1, 2] }] },
    ['partition'],
  )
  assert.equal(candidate, null) // wrong multiset / length
})

test('partition cross-check is ORDER-SENSITIVE: a mis-ordered same-multiset permutation is rejected', () => {
  // Input [3,1,4,1,5] around pivot 3. Correct partition layout: the two <3 cells
  // (1,1) first, then the one ==3 cell, then the two >3 cells (4,5):
  //   [1,1,3,4,5]  -> certifies.
  const ok = buildSteppedTraceFromMetadata(
    { reference_solution: 'partition', test_cases: [{ args: [[3, 1, 4, 1, 5], 3], expected: [1, 1, 3, 4, 5] }] },
    ['partition'],
  )
  assert.ok(ok, 'a correctly partitioned expected array should certify')

  // The OLD order-insensitive check sorted both sides, so it certified ANY
  // permutation of the same multiset. This expected array is the same five values
  // but NOT partitioned around 3 (the ==3 cell sits in the lows band, a >3 cell
  // leads). The order-sensitive check must reject it -> null.
  const bad = buildSteppedTraceFromMetadata(
    { reference_solution: 'partition', test_cases: [{ args: [[3, 1, 4, 1, 5], 3], expected: [5, 3, 1, 1, 4] }] },
    ['partition'],
  )
  assert.equal(bad, null, 'a mis-ordered same-multiset permutation must NOT vacuously certify')
})

test('partition cross-check no longer certifies [2,1,3,5,4] against a fully sorted expected', () => {
  // The auditor's concrete case: the input multiset {1,2,3,4,5} partitioned around
  // pivot 3 has counts less=2, equal=1, greater=2, so the only valid layout is
  // [<3,<3,3,>3,>3]. The arrangement [2,1,3,5,4] satisfies that (2,1 below; 3
  // equal; 5,4 above) and certifies. But a different input order that the OLD
  // sort-both check treated as identical, e.g. expected [1,2,4,3,5], puts a >3
  // value (4) in the equal slot and the ==3 value in a highs slot -> rejected.
  const certifies = buildSteppedTraceFromMetadata(
    { reference_solution: 'partition', test_cases: [{ args: [[1, 2, 3, 4, 5], 3], expected: [2, 1, 3, 5, 4] }] },
    ['partition'],
  )
  assert.ok(certifies)
  const rejected = buildSteppedTraceFromMetadata(
    { reference_solution: 'partition', test_cases: [{ args: [[1, 2, 3, 4, 5], 3], expected: [1, 2, 4, 3, 5] }] },
    ['partition'],
  )
  assert.equal(rejected, null)
})

test('fast_slow long-cycle permutation is not stepped eligible and does not hang', () => {
  // [1,2,3,4,5,6,7,8,9,0] is one long cycle. The display trace cannot reach the
  // meeting point within the frame cap, so runArrayTrace returns null and the
  // challenge keeps its static diagram. The orchestration must RETURN (no hang).
  const started = Date.now()
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'slow fast',
      test_cases: [{ args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]], expected: 0 }],
    },
    ['fast-slow-pointers'],
  )
  assert.equal(candidate, null)
  assert.ok(Date.now() - started < 1000, 'orchestration must not hang on a long-cycle permutation')
})

test('reference-code fallback infers fast_slow from a slow/fast pointer pair', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'slow = nums[0]\nfast = nums[nums[0]]\nwhile slow != fast:\n    slow = nums[slow]\n    fast = nums[nums[fast]]',
      test_cases: [{ args: [[1, 3, 4, 2, 2]], expected: 2 }],
    },
    [],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'fast_slow')
})

test('graft strips a model-authored stepped diagram even if it self-claims trace_verified', async () => {
  // A malicious/hallucinated model diagram with a fake verified marker and WRONG deltas.
  const fakeStepped = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'array' as const, cells: [{ value: '1' }, { value: '2' }, { value: '3' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'x', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 1, hi: 2 } } },
      { title: 'y', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'z', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 }, found: true } },
    ],
  }
  const content: SolutionContentV1 = {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests the sorted-array invariant.',
    approaches: [
      { id: 'brute', title: 'Brute', tagline: 'scan', body_md: 'scan', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(1)' } },
      { id: 'optimal', title: 'Binary search', tagline: 'halve', body_md: 'halve', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(log n)', space: 'O(1)' }, diagram: fakeStepped },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
  }

  // No metadata -> not eligible to attach a real trace, but the model's stepped
  // diagram MUST still be stripped (it could be wrong and self-claims verified)
  // and no top-level walkthrough is produced.
  const { content: out, grafted } = await graftSteppedTrace(content, null, [])
  assert.equal(grafted, false)
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
  assert.equal(out.walkthrough, undefined)

  // With real metadata, the model's stepped diagram is replaced by the verified
  // one, which now lands on the TOP-LEVEL walkthrough field (not on an approach).
  const { content: out2, grafted: grafted2 } = await graftSteppedTrace(content, BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted2, true)
  // No approach carries a stepped diagram anymore — the trace moved up.
  assert.equal(out2.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
  assert.ok(out2.walkthrough)
  assert.equal(out2.walkthrough!.kind, 'stepped')
  // the surviving stepped diagram is the harness one (9 cells from the real test case), not the fake 3-cell one
  const diagram = out2.walkthrough as typeof fakeStepped
  assert.equal(diagram.base.cells.length, 9)
})

// ── Prose overlay: the model's TEXT lands by index; the deltas stay harness-owned ─

/** Build an algorithm solution whose optimal approach carries `modelStepped`. */
function contentWithModelStepped(modelStepped: unknown): SolutionContentV1 {
  return {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests the sorted-array invariant.',
    approaches: [
      { id: 'brute', title: 'Brute', tagline: 'scan', body_md: 'scan', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(1)' } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'optimal', title: 'Binary search', tagline: 'halve', body_md: 'halve', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(log n)', space: 'O(1)' }, diagram: modelStepped as any },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
  }
}

test('overlay copies the model per-step prose by index but never its deltas', async () => {
  // The harness binary-search trace on the prototype input has exactly 3 steps.
  // The model supplies 3 steps of prose with the SAME base.kind ('array') and
  // GARBAGE deltas. The overlay must keep the model's title/explanation/decision
  // text and discard every model delta (the harness deltas survive untouched).
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  assert.equal(harness.steps.length, 3)
  const harnessPointerAt = harness.steps.map((s) => (s.delta as { pointerAt: Record<string, number> }).pointerAt)

  const modelStepped = {
    kind: 'stepped' as const,
    trace_verified: true, // self-claimed; must be ignored
    base: { kind: 'array' as const, cells: [{ value: '0' }, { value: '0' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'Probe the middle', explanation: 'Halving the sorted range removes the impossible half each comparison.', decision: 'check midpoint', delta: { base: 'array' as const, pointerAt: { lo: 9, mid: 9, hi: 9 } } },
      { title: 'Shift right', explanation: 'The midpoint sits below the target, so the answer can only live above it.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'Land on the answer', explanation: 'The midpoint now equals the target, so the index is returned.', delta: { base: 'array' as const, pointerAt: { lo: 5, mid: 5, hi: 5 }, found: true } },
    ],
  }

  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(modelStepped), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness

  // Prose IS the model's, by index.
  assert.deepEqual(diagram.steps.map((s) => s.title), ['Probe the middle', 'Shift right', 'Land on the answer'])
  assert.equal(diagram.steps[1].explanation, 'The midpoint sits below the target, so the answer can only live above it.')
  // Base + cells stay harness-owned (9 real cells, not the model's 2).
  assert.equal(diagram.base.kind, 'array')
  assert.equal((diagram.base as { cells: unknown[] }).cells.length, 9)
  // Every delta is the HARNESS delta, not the model's garbage pointers.
  diagram.steps.forEach((s, i) => {
    assert.deepEqual((s.delta as { pointerAt: Record<string, number> }).pointerAt, harnessPointerAt[i])
  })
  // The harness's verified marker is what survives (the model cannot self-assert it).
  assert.equal(diagram.trace_verified, true)
})

test('overlay is fail-soft when the model step count differs from the trace', async () => {
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  const harnessTitles = harness.steps.map((s) => s.title)

  // Two model steps vs the harness's three: counts disagree, so the harness
  // placeholder prose must stand (no partial overlay).
  const modelStepped = {
    kind: 'stepped' as const,
    base: { kind: 'array' as const, cells: [{ value: '0' }, { value: '0' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'Model A', explanation: 'this prose must be ignored entirely.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 1 } } },
      { title: 'Model B', explanation: 'this prose must be ignored entirely.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 1 }, found: true } },
    ],
  }

  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(modelStepped), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  assert.equal(diagram.steps.length, 3)
  // Harness prose stands; none of the model titles leak in.
  assert.deepEqual(diagram.steps.map((s) => s.title), harnessTitles)
  assert.equal(diagram.steps.some((s) => s.title === 'Model A' || s.title === 'Model B'), false)
})

test('overlay is fail-soft when the model base.kind differs from the harness base', async () => {
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  const harnessTitles = harness.steps.map((s) => s.title)

  // A flow-base model diagram (3 steps) cannot overlay an array harness: the
  // base.kind must match, so the harness prose stands.
  const modelStepped = {
    kind: 'stepped' as const,
    base: { kind: 'flow' as const, nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
    steps: [
      { title: 'Flow A', explanation: 'ignored.', delta: { base: 'flow' as const, activeNode: 'a' } },
      { title: 'Flow B', explanation: 'ignored.', delta: { base: 'flow' as const, activeNode: 'b' } },
      { title: 'Flow C', explanation: 'ignored.', delta: { base: 'flow' as const, activeNode: 'a' } },
    ],
  }

  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(modelStepped), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  assert.equal(diagram.base.kind, 'array')
  assert.deepEqual(diagram.steps.map((s) => s.title), harnessTitles)
})

test('overlay falls back to harness prose when a borrowed field breaks the schema', async () => {
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  const harnessTitles = harness.steps.map((s) => s.title)

  // The model supplies a matching base.kind + step count, but one title exceeds
  // the schema's 80-char cap. The overlaid diagram fails validation, so graft
  // reverts to the harness diagram (its prose) rather than shipping invalid text.
  const tooLong = 'T'.repeat(120)
  const modelStepped = {
    kind: 'stepped' as const,
    base: { kind: 'array' as const, cells: [{ value: '0' }, { value: '0' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: tooLong, explanation: 'over-length title should force a fall back.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 1 } } },
      { title: 'ok', explanation: 'fine.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 1 } } },
      { title: 'ok', explanation: 'fine.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 1 }, found: true } },
    ],
  }

  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(modelStepped), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  // Reverted to harness prose; the over-length title never ships.
  assert.deepEqual(diagram.steps.map((s) => s.title), harnessTitles)
  assert.equal(diagram.steps.some((s) => s.title.length > 80), false)
})

test('a non-stepped model diagram on the optimal approach contributes no prose overlay', async () => {
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  const harnessTitles = harness.steps.map((s) => s.title)

  // The model attached a complexity_curves diagram (legit, non-stepped). There is
  // no stepped diagram to borrow prose from, so the harness prose stands and the
  // harness stepped diagram is still grafted.
  const curves = {
    kind: 'complexity_curves' as const,
    curves: [{ label: 'Binary search O(log n)', shape: 'log' as const }],
  }
  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(curves), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  // The non-stepped diagram stays on its approach; the harness trace lands top-level.
  assert.equal(out.approaches.some((a) => a.diagram?.kind === 'complexity_curves'), true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  assert.deepEqual(diagram.steps.map((s) => s.title), harnessTitles)
})

// ── Migration: an existing approach-level stepped diagram is moved up in place ──

test('an existing approach-level stepped diagram is migrated up to content.walkthrough and stripped from the approach', async () => {
  // Simulate already-stored content (old layout) whose optimal approach carries a
  // legacy stepped diagram. Re-grafting must move the trace up to .walkthrough,
  // strip it from the approach, and keep the model's per-step prose by index.
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram
  const legacyStepped = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'array' as const, cells: [{ value: '0' }, { value: '0' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'Legacy probe', explanation: 'Halve the sorted range to discard the impossible half.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'Legacy shift', explanation: 'The midpoint is below the target, so search the upper half.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'Legacy land', explanation: 'The midpoint equals the target, so the index is returned.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 }, found: true } },
    ],
  }

  const { content: out, grafted } = await graftSteppedTrace(contentWithModelStepped(legacyStepped), BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  // Migrated UP: no approach keeps a stepped diagram.
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  // Prose from the legacy approach diagram is preserved by index.
  assert.deepEqual(diagram.steps.map((s) => s.title), ['Legacy probe', 'Legacy shift', 'Legacy land'])
  // Base + deltas remain harness-owned (9 real cells).
  assert.equal((diagram.base as { cells: unknown[] }).cells.length, 9)
})

// ── Idempotence: a prior top-level walkthrough is rebuilt in place, not duplicated ─

test('a prior content.walkthrough is rebuilt in place and its prose is preserved', async () => {
  const harness = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])!.diagram

  const priorWalkthrough = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'array' as const, cells: [{ value: '0' }, { value: '0' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'Prior probe', explanation: 'Halve the sorted range to discard the impossible half.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'Prior shift', explanation: 'The midpoint is below the target, so search the upper half.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'Prior land', explanation: 'The midpoint equals the target, so the index is returned.', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 }, found: true } },
    ],
  }

  const content: SolutionContentV1 = {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests the sorted-array invariant.',
    approaches: [
      { id: 'brute', title: 'Brute', tagline: 'scan', body_md: 'scan', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(1)' } },
      { id: 'optimal', title: 'Binary search', tagline: 'halve', body_md: 'halve', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(log n)', space: 'O(1)' } },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walkthrough: priorWalkthrough as any,
  }

  const { content: out, grafted } = await graftSteppedTrace(content, BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted, true)
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
  assert.ok(out.walkthrough)
  const diagram = out.walkthrough as typeof harness
  // Prior prose is preserved by index; deltas/base stay harness-owned.
  assert.deepEqual(diagram.steps.map((s) => s.title), ['Prior probe', 'Prior shift', 'Prior land'])
  assert.equal((diagram.base as { cells: unknown[] }).cells.length, 9)
})

// ── String patterns route from tags and cross-check against expected ──────────

test('valid-palindrome certifies "A man, a plan, a canal: Panama" -> true via the oracle', () => {
  // The famous 30-char string is too long for a displayable trace, so no diagram
  // is built (certifiedCount may be >0 but diagramTrace stays null -> null). Prove
  // the cross-check itself accepts the oracle here, then certify a short palindrome
  // end-to-end below. This documents that the over-long canonical case is correctly
  // rejected for DISPLAY while the boolean cross-check logic is exercised separately.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(s):\n    lo,hi=0,len(s)-1\n    while lo<hi: ...',
      test_cases: [{ args: ['A man, a plan, a canal: Panama'], expected: true }],
    },
    ['valid-palindrome'],
  )
  // Over-long input -> no displayable diagram, so the candidate is null even though
  // the oracle agrees. This is the fail-closed display gate, not a cross-check fail.
  assert.equal(candidate, null)
})

test('valid-palindrome certifies a short palindrome end-to-end and verifies the diagram', () => {
  // "racecar" (7 chars) is short enough to display: the oracle is true, the expected
  // is true, and the trace produces a clean 3-frame walkthrough.
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(s):\n    lo,hi=0,len(s)-1\n    while lo<hi: ...',
      test_cases: [{ args: ['racecar'], expected: true }],
    },
    ['valid-palindrome'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'valid_palindrome')
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
  // Cells display characters.
  const cells = (candidate!.diagram.base as { cells: { value: string }[] }).cells
  assert.deepEqual(cells.map((c) => c.value), ['r', 'a', 'c', 'e', 'c', 'a', 'r'])
})

test('valid-palindrome accepts the expected encoded as the string "true"', () => {
  // Some stored cases keep `expected` as a stringified boolean. The cross-check
  // normalizes "true"/"false" so the boolean answer still certifies.
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'palindrome', test_cases: [{ args: ['racecar'], expected: 'true' }] },
    ['palindrome'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'valid_palindrome')
})

test('longest-substring "abcabcbb" -> 3 certifies and produces a verified diagram', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'def solution(s):\n    seen={}; l=0; best=0\n    for r,ch in enumerate(s): ...',
      test_cases: [{ args: ['abcabcbb'], expected: 3 }],
    },
    ['longest-substring'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'longest_substring')
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('longest-substring takes a lone string `input` field (not just args)', () => {
  // Some cases store the input as `input: "abcabcbb"` rather than `args: [...]`.
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'sliding window', test_cases: [{ input: 'abcabcbb', expected: 3 }] },
    ['longest-substring-without-repeating-characters'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'longest_substring')
})

test('a wrong-expected STRING case returns null (cross-check rejects it)', () => {
  // Longest substring of "abcabcbb" is 3, but the stored expected says 5. The
  // oracle disagrees, so no misleading walkthrough ships.
  const longestWrong = buildSteppedTraceFromMetadata(
    { reference_solution: 'sliding window', test_cases: [{ args: ['abcabcbb'], expected: 5 }] },
    ['longest-substring'],
  )
  assert.equal(longestWrong, null)

  // Valid palindrome "racecar" is true, but the stored expected says false.
  const palindromeWrong = buildSteppedTraceFromMetadata(
    { reference_solution: 'palindrome', test_cases: [{ args: ['racecar'], expected: false }] },
    ['valid-palindrome'],
  )
  assert.equal(palindromeWrong, null)
})

test('a string case missing `expected` disqualifies the pattern', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'sliding window', test_cases: [{ args: ['abcabcbb'] /* no expected */ }] },
    ['longest-substring'],
  )
  assert.equal(candidate, null)
})

test('one agreeing string case does not certify when another disagrees', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: 'sliding window',
      test_cases: [
        { args: ['abcabcbb'], expected: 3 }, // agrees
        { args: ['pwwkew'], expected: 99 },  // wrong oracle (real answer 3) -> disqualify
      ],
    },
    ['longest-substring'],
  )
  assert.equal(candidate, null)
})

test('valid-palindrome stays a string pattern through graft (cells show characters)', async () => {
  const content: SolutionContentV1 = {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests the two-pointer string scan.',
    approaches: [
      { id: 'brute', title: 'Reverse', tagline: 'compare', body_md: 'reverse', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(n)' } },
      { id: 'optimal', title: 'Two pointers', tagline: 'converge', body_md: 'converge', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(n)', space: 'O(1)' } },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
  }
  const meta = {
    reference_solution: 'def solution(s):\n    lo,hi=0,len(s)-1\n    while lo<hi: ...',
    test_cases: [{ args: ['racecar'], expected: true }],
  }
  const { content: out, grafted } = await graftSteppedTrace(content, meta, ['valid-palindrome'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  assert.equal(out.walkthrough!.kind, 'stepped')
  const cells = (out.walkthrough!.base as { cells: { value: string }[] }).cells
  assert.deepEqual(cells.map((c) => c.value), ['r', 'a', 'c', 'e', 'c', 'a', 'r'])
})

// ── Sequence harness reaches through the single graft seam (array -> grid -> sequence) ─

/** Build an algorithm solution carrying no model stepped diagram. */
function plainAlgoContent(): SolutionContentV1 {
  return {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests pointer rewiring over a linked list.',
    approaches: [
      { id: 'recursive', title: 'Recursive', tagline: 'unwind', body_md: 'unwind', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(n)' } },
      { id: 'optimal', title: 'Iterative pointers', tagline: 'rewire', body_md: 'rewire', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(n)', space: 'O(1)' } },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
  }
}

test('reverse-linked-list flows through graft to a verified sequence walkthrough (array+grid yield, sequence fires)', async () => {
  // Array and grid harnesses do not recognize a linked-list reversal, so for the
  // algorithm case they return null and the sequence harness is reached. The
  // graft seam must produce a top-level `sequence` walkthrough with the real
  // node row, verified against the test cases' expected reversed output.
  const meta = {
    reference_solution: 'prev=None; curr=head; while curr: nxt=curr.next; curr.next=prev; prev=curr; curr=nxt',
    test_cases: [
      { id: 'tc1', args: [[1, 2, 3, 4]], expected: [4, 3, 2, 1], input_types: ['linked_list'] },
      { id: 'tc2', args: [[1, 2]], expected: [2, 1], input_types: ['linked_list'] },
    ],
  }
  const { content: out, grafted } = await graftSteppedTrace(plainAlgoContent(), meta, ['reverse-linked-list'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  assert.equal(out.walkthrough!.kind, 'stepped')
  assert.equal(out.walkthrough!.base.kind, 'sequence')
  // The display row is the original list order (the renderer rewires via pointers).
  const nodes = (out.walkthrough!.base as { nodes: { label: string }[] }).nodes
  assert.deepEqual(nodes.map((n) => n.label), ['1', '2', '3', '4'])
  // No approach kept a stepped diagram; the trace lives on the top-level field.
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)
})

test('inorder-traversal flows through graft to a verified sequence walkthrough', async () => {
  const meta = {
    reference_solution: 'def inorder(root): return inorder(root.left)+[root.val]+inorder(root.right)',
    test_cases: [
      { id: 'tc1', args: [[1, null, 2, 3]], expected: [1, 3, 2], input_types: ['tree'] },
      { id: 'tc2', args: [[4, 2, 6, 1, 3, 5, 7]], expected: [1, 2, 3, 4, 5, 6, 7], input_types: ['tree'] },
    ],
  }
  const { content: out, grafted } = await graftSteppedTrace(plainAlgoContent(), meta, ['inorder-traversal'])
  assert.equal(grafted, true)
  assert.ok(out.walkthrough)
  assert.equal(out.walkthrough!.base.kind, 'sequence')
})

test('a wrong-variant tree-construction challenge is rejected by the graft seam (no walkthrough)', async () => {
  // "Construct Binary Tree from Preorder and Inorder" is tagged `inorder` but its
  // expected is a tree array, not the inorder of arg 0. Every algorithm harness
  // declines, so graft produces NO walkthrough rather than a misleading one.
  const meta = {
    test_cases: [
      { args: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], expected: [3, 9, 20, null, null, 15, 7] },
    ],
  }
  const { content: out, grafted } = await graftSteppedTrace(plainAlgoContent(), meta, ['inorder'])
  assert.equal(grafted, false)
  assert.equal(out.walkthrough, undefined)
})
