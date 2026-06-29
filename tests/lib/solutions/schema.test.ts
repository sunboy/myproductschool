import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SolutionContentSchema,
  SolutionDiagramSchema,
  solutionStructureWarnings,
  type SolutionContentV1,
} from '../../../src/lib/solutions/schema'

function baseContent(overrides: Partial<SolutionContentV1> = {}): SolutionContentV1 {
  return {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'This problem tests whether the candidate sees the lookup structure hiding in a pair-sum question.',
    approaches: [
      {
        id: 'brute-force',
        title: 'Brute force',
        tagline: 'Check every pair; quadratic but honest.',
        body_md: '## Idea\nScan every pair.',
        code: { language: 'python', source: 'def solution(nums, target):\n    ...' },
        complexity: { time: 'O(n^2)', space: 'O(1)' },
      },
      {
        id: 'hash-map',
        title: 'Hash map single pass',
        tagline: 'Trade memory for a single scan.',
        body_md: '## Idea\nStore complements as you go.',
        code: { language: 'python', source: 'def solution(nums, target):\n    seen = {}' },
        complexity: { time: 'O(n)', space: 'O(n)' },
        diagram: {
          kind: 'complexity_curves',
          curves: [
            { label: 'Brute force', shape: 'quadratic' },
            { label: 'Hash map', shape: 'linear' },
          ],
        },
      },
    ],
    ai_collaboration: {
      body_md: 'Own the invariant yourself; have an AI assistant generate adversarial test cases.',
      prompts: [
        { title: 'Edge case hunt', prompt: 'Generate edge cases for this pair-sum function.', why: 'Enumeration is cheap for the assistant and expensive for you.' },
      ],
      pitfalls: ['Asking for the answer first removes the practice value.'],
    },
    key_takeaways: ['Lookup structures turn scans into probes.'],
    ...overrides,
  }
}

test('valid algorithm content parses', () => {
  const result = SolutionContentSchema.safeParse(baseContent())
  assert.equal(result.success, true)
})

test('duplicate approach ids fail', () => {
  const content = baseContent()
  content.approaches[1].id = 'brute-force'
  const result = SolutionContentSchema.safeParse(content)
  assert.equal(result.success, false)
})

test('approach id must be a slug', () => {
  const content = baseContent()
  content.approaches[0].id = 'Brute Force!'
  const result = SolutionContentSchema.safeParse(content)
  assert.equal(result.success, false)
})

test('more than 4 approaches fail', () => {
  const content = baseContent()
  const extra = content.approaches[0]
  content.approaches = [1, 2, 3, 4, 5].map((i) => ({ ...extra, id: `approach-${i}` }))
  const result = SolutionContentSchema.safeParse(content)
  assert.equal(result.success, false)
})

test('architecture diagram enforces node/lane/edge integrity', () => {
  const valid = SolutionDiagramSchema.safeParse({
    kind: 'architecture',
    lanes: ['Client', 'Services'],
    nodes: [
      { id: 'web', label: 'Web app', lane: 0, role: 'client' },
      { id: 'api', label: 'API', lane: 1, role: 'service' },
    ],
    edges: [{ from: 'web', to: 'api' }],
  })
  assert.equal(valid.success, true)

  const badLane = SolutionDiagramSchema.safeParse({
    kind: 'architecture',
    lanes: ['Client'],
    nodes: [
      { id: 'web', label: 'Web app', lane: 0 },
      { id: 'api', label: 'API', lane: 2 },
    ],
    edges: [],
  })
  assert.equal(badLane.success, false)

  const badEdge = SolutionDiagramSchema.safeParse({
    kind: 'architecture',
    lanes: ['Client'],
    nodes: [{ id: 'web', label: 'Web app', lane: 0 }, { id: 'api', label: 'API', lane: 0 }],
    edges: [{ from: 'web', to: 'ghost' }],
  })
  assert.equal(badEdge.success, false)
})

test('flow_steps diagram caps at 7 steps', () => {
  const result = SolutionDiagramSchema.safeParse({
    kind: 'flow_steps',
    steps: Array.from({ length: 8 }, (_, i) => ({ label: `Step ${i}` })),
  })
  assert.equal(result.success, false)
})

test('structure warnings flag a single-approach algorithm solution', () => {
  const content = baseContent()
  content.approaches = [content.approaches[0]]
  const warnings = solutionStructureWarnings(content)
  assert.ok(warnings.some((w) => w.includes('at least 2 approaches')))
})

test('structure warnings flag canvas approaches without diagrams or tradeoffs', () => {
  const content = baseContent({ challenge_type: 'system_design' })
  for (const approach of content.approaches) {
    delete approach.diagram
    delete approach.tradeoffs
  }
  const warnings = solutionStructureWarnings(content)
  assert.ok(warnings.some((w) => w.includes('missing a diagram')))
  assert.ok(warnings.some((w) => w.includes('missing tradeoffs')))
  // code on a design type is also flagged
  assert.ok(warnings.some((w) => w.includes('has code')))
})

test('structure warnings expect a flow_steps diagram on flow types', () => {
  const content = baseContent({ challenge_type: 'flow' })
  for (const approach of content.approaches) {
    delete approach.diagram
    delete approach.code
    delete approach.complexity
  }
  const warnings = solutionStructureWarnings(content)
  assert.ok(warnings.some((w) => w.includes('flow_steps')))
})

// ── Stepped (interactive) diagram ─────────────────────────────────────────────

function steppedArrayDiagram(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'stepped',
    title: 'Binary search on a sorted array',
    base: {
      kind: 'array',
      cells: [{ value: '2' }, { value: '4' }, { value: '7' }, { value: '9' }, { value: '11' }, { value: '13' }, { value: '18' }, { value: '21' }, { value: '29' }],
      pointers: ['lo', 'mid', 'hi'],
      rangeTrack: true,
    },
    trace_verified: true,
    steps: [
      { title: 'Check the middle', explanation: 'mid is 11, target is greater, discard the left half.', decision: 'Move lo to mid+1', delta: { base: 'array', pointerAt: { lo: 0, mid: 4, hi: 8 }, highlight: [4] } },
      { title: 'Search the right half', explanation: 'mid is 18, target is greater, keep narrowing.', decision: 'Move lo to mid+1', delta: { base: 'array', pointerAt: { lo: 5, mid: 6, hi: 8 }, discarded: [0, 1, 2, 3, 4] } },
      { title: 'Find the target', explanation: 'mid is 21, equals target, return the index.', decision: 'Return mid', delta: { base: 'array', pointerAt: { lo: 7, mid: 7, hi: 8 }, discarded: [0, 1, 2, 3, 4, 5, 6], found: true } },
    ],
    ...overrides,
  }
}

test('valid stepped array diagram parses', () => {
  const result = SolutionDiagramSchema.safeParse(steppedArrayDiagram())
  assert.equal(result.success, true)
})

test('stepped diagram with fewer than 3 steps fails', () => {
  const diagram = steppedArrayDiagram()
  ;(diagram as { steps: unknown[] }).steps = (diagram as { steps: unknown[] }).steps.slice(0, 2)
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, false)
})

test('stepped diagram rejects out-of-range pointer index', () => {
  const diagram = steppedArrayDiagram()
  ;(diagram as { steps: { delta: { pointerAt: Record<string, number> } }[] }).steps[0].delta.pointerAt.hi = 99
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, false)
})

test('stepped diagram rejects an unknown pointer name', () => {
  const diagram = steppedArrayDiagram()
  ;(diagram as { steps: { delta: { pointerAt: Record<string, number> } }[] }).steps[0].delta.pointerAt.ghost = 1
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, false)
})

test('stepped diagram rejects a delta.base that mismatches base.kind', () => {
  const diagram = steppedArrayDiagram()
  ;(diagram as { steps: { delta: { base: string } }[] }).steps[1].delta.base = 'pipeline'
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, false)
})

test('verified base without a trace marker fails', () => {
  const diagram = steppedArrayDiagram({ trace_verified: false })
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, false)
})

test('authored flow base does not require a trace marker', () => {
  const result = SolutionDiagramSchema.safeParse({
    kind: 'stepped',
    base: { kind: 'flow', nodes: [{ id: 'client', label: 'Client' }, { id: 'api', label: 'API' }, { id: 'db', label: 'Database' }] },
    steps: [
      { title: 'Request', explanation: 'The client sends a write to the API.', delta: { base: 'flow', activeNode: 'client' } },
      { title: 'Route', explanation: 'The API validates and forwards it.', delta: { base: 'flow', activeNode: 'api', visited: ['client'] } },
      { title: 'Persist', explanation: 'The database commits the row.', delta: { base: 'flow', activeNode: 'db', visited: ['client', 'api'] } },
    ],
  })
  assert.equal(result.success, true)
})

test('more than one stepped diagram per solution fails', () => {
  const content = baseContent()
  content.approaches[0].diagram = steppedArrayDiagram() as never
  content.approaches[1].diagram = steppedArrayDiagram() as never
  const result = SolutionContentSchema.safeParse(content)
  assert.equal(result.success, false)
})

test('a stepped diagram on a flow challenge type fails', () => {
  const content = baseContent({ challenge_type: 'flow' })
  content.approaches = [content.approaches[0]]
  delete content.approaches[0].code
  delete content.approaches[0].complexity
  content.approaches[0].diagram = steppedArrayDiagram() as never
  const result = SolutionContentSchema.safeParse(content)
  assert.equal(result.success, false)
})
