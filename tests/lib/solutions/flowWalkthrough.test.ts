import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSteppedFlowFromContent } from '../../../src/lib/solutions/trace/flowWalkthrough'
import { InteractiveStepDiagramSchema, type SolutionContentV1, type ArchitectureDiagram } from '../../../src/lib/solutions/schema'

/** Build a minimal valid system_design solution whose optimal approach carries the given architecture. */
function designContentWith(arch: ArchitectureDiagram | undefined, type: 'system_design' | 'data_modeling' = 'system_design'): SolutionContentV1 {
  return {
    version: 1,
    challenge_type: type,
    overview_md: 'tests the request path under scale.',
    approaches: [
      {
        id: 'simple',
        title: 'Single service',
        tagline: 'one box does everything',
        body_md: 'A first cut.',
        tradeoffs: [{ gain: 'simple', cost: 'does not scale' }],
      },
      {
        id: 'optimal',
        title: 'Layered',
        tagline: 'split the read and write paths',
        body_md: 'The walkthrough.',
        tradeoffs: [{ gain: 'scales reads', cost: 'more moving parts' }],
        diagram: arch,
      },
    ],
    ai_collaboration: { body_md: 'pair on the bottleneck', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['textbook answer'] },
  }
}

const CLIENT_SERVICE_STORE: ArchitectureDiagram = {
  kind: 'architecture',
  title: 'Read path',
  lanes: ['Client', 'Services', 'Data'],
  nodes: [
    { id: 'db', label: 'Primary DB', lane: 2, role: 'store' },
    { id: 'api', label: 'API Gateway', lane: 1, role: 'service' },
    { id: 'web', label: 'Web Client', lane: 0, role: 'client' },
  ],
  edges: [
    { from: 'web', to: 'api' },
    { from: 'api', to: 'db' },
  ],
}

test('a client -> service -> store architecture yields an ordered flow walkthrough', () => {
  const result = buildSteppedFlowFromContent(designContentWith(CLIENT_SERVICE_STORE))
  assert.ok(result)
  const { diagram } = result!
  assert.equal(diagram.base.kind, 'flow')
  // Despite the nodes being declared db, api, web, the client floats to the front
  // and the store sinks to the back: web -> api -> db.
  assert.equal(diagram.base.kind === 'flow' && diagram.base.nodes.map((n) => n.id).join('>'), 'web>api>db')
  // One step per node, each accumulating the visited path.
  assert.equal(diagram.steps.length, 3)
  assert.deepEqual(diagram.steps.map((s) => s.delta.base === 'flow' && s.delta.activeNode), ['web', 'api', 'db'])
  assert.deepEqual(
    diagram.steps[2].delta.base === 'flow' ? diagram.steps[2].delta.visited : null,
    ['web', 'api', 'db'],
  )
  // Authored, not trace-verified (flow asserts no computed state).
  assert.notEqual(diagram.trace_verified, true)
})

test('the emitted diagram passes InteractiveStepDiagramSchema', () => {
  const result = buildSteppedFlowFromContent(designContentWith(CLIENT_SERVICE_STORE))
  assert.ok(result)
  const parsed = InteractiveStepDiagramSchema.safeParse(result!.diagram)
  assert.equal(parsed.success, true)
})

test('an architecture with fewer than 2 nodes is not possible to declare, and a missing diagram returns null', () => {
  // The architecture schema floors at 2 nodes, so "fewer than 2 nodes" surfaces as
  // an absent architecture diagram on the optimal approach.
  const result = buildSteppedFlowFromContent(designContentWith(undefined))
  assert.equal(result, null)
})

test('a non-architecture diagram on the optimal approach returns null', () => {
  const content = designContentWith(undefined)
  content.approaches[content.approaches.length - 1].diagram = {
    kind: 'schema_tables',
    tables: [{ name: 'users', columns: [{ name: 'id', badges: ['PK'] }] }],
    relations: [],
  }
  const result = buildSteppedFlowFromContent(content)
  assert.equal(result, null)
})

test('a 2-node architecture gets a trailing recap step to clear the 3-step floor', () => {
  const twoNode: ArchitectureDiagram = {
    kind: 'architecture',
    title: 'Direct',
    lanes: ['Client', 'Data'],
    nodes: [
      { id: 'client', label: 'Mobile App', lane: 0, role: 'client' },
      { id: 'store', label: 'Object Store', lane: 1, role: 'store' },
    ],
    edges: [{ from: 'client', to: 'store' }],
  }
  const result = buildSteppedFlowFromContent(designContentWith(twoNode))
  assert.ok(result)
  const { diagram } = result!
  assert.equal(diagram.base.kind === 'flow' && diagram.base.nodes.length, 2)
  assert.equal(diagram.steps.length, 3) // 2 node steps + 1 recap
  assert.equal(InteractiveStepDiagramSchema.safeParse(diagram).success, true)
})

test('node ordering is deterministic across repeated runs', () => {
  const a = buildSteppedFlowFromContent(designContentWith(CLIENT_SERVICE_STORE))
  const b = buildSteppedFlowFromContent(designContentWith(CLIENT_SERVICE_STORE))
  assert.ok(a && b)
  assert.deepEqual(
    a!.diagram.base.kind === 'flow' ? a!.diagram.base.nodes : null,
    b!.diagram.base.kind === 'flow' ? b!.diagram.base.nodes : null,
  )
})

test('roles bucket head/tail even when edges form a longer chain', () => {
  const chain: ArchitectureDiagram = {
    kind: 'architecture',
    title: 'Write path',
    lanes: ['Client', 'Services', 'Async', 'Data'],
    nodes: [
      { id: 'queue', label: 'Event Queue', lane: 2, role: 'queue' },
      { id: 'worker', label: 'Ingest Worker', lane: 1, role: 'service' },
      { id: 'gateway', label: 'Edge Gateway', lane: 1, role: 'service' },
      { id: 'cdn', label: 'CDN Client', lane: 0, role: 'client' },
      { id: 'warehouse', label: 'Warehouse', lane: 3, role: 'store' },
    ],
    edges: [
      { from: 'cdn', to: 'gateway' },
      { from: 'gateway', to: 'worker' },
      { from: 'worker', to: 'queue' },
      { from: 'queue', to: 'warehouse' },
    ],
  }
  const result = buildSteppedFlowFromContent(designContentWith(chain, 'data_modeling'))
  assert.ok(result)
  const ids = result!.diagram.base.kind === 'flow' ? result!.diagram.base.nodes.map((n) => n.id) : []
  // Client first, store/queue at the tail; the service chain follows edges in between.
  assert.equal(ids[0], 'cdn')
  assert.deepEqual(ids, ['cdn', 'gateway', 'worker', 'queue', 'warehouse'])
})

test('a non-design challenge type returns null even with an architecture diagram', () => {
  const content = designContentWith(CLIENT_SERVICE_STORE)
  // Force a non-design type; the builder must refuse regardless of the diagram.
  ;(content as { challenge_type: string }).challenge_type = 'algorithm'
  const result = buildSteppedFlowFromContent(content as SolutionContentV1)
  assert.equal(result, null)
})
