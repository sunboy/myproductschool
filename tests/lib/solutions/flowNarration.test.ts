import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseFlowNarration,
  buildFlowNarrationContext,
  buildFlowNarrationPrompt,
} from '../../../src/lib/solutions/trace/flowNarration'
import { type SolutionContentV1, type ArchitectureDiagram } from '../../../src/lib/solutions/schema'

/** Build a minimal valid design solution whose optimal approach carries the given architecture. */
function designContentWith(
  arch: ArchitectureDiagram | undefined,
  type: 'system_design' | 'data_modeling' = 'system_design',
): SolutionContentV1 {
  return {
    version: 1,
    challenge_type: type,
    overview_md: 'tests the upload + dedup path under scale.',
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
        title: 'Dedup-first upload',
        tagline: 'hash before you store',
        body_md: 'The optimal walkthrough hashes the chunk, checks the dedup index, then issues a pre-signed URL.',
        tradeoffs: [{ gain: 'skips duplicate writes', cost: 'extra index lookup per upload' }],
        diagram: arch,
      },
    ],
    ai_collaboration: {
      body_md: 'pair on the dedup window',
      prompts: [{ title: 't', prompt: 'p', why: 'w' }],
      pitfalls: ['textbook answer'],
    },
  }
}

const UPLOAD_ARCH: ArchitectureDiagram = {
  kind: 'architecture',
  title: 'Upload path',
  lanes: ['Client', 'Services', 'Data'],
  nodes: [
    { id: 'blobstore', label: 'Object Store', sublabel: 'stores the chunk bytes', lane: 2, role: 'store' },
    { id: 'dedupidx', label: 'Dedup Index', sublabel: 'maps content hash to blob id', lane: 1, role: 'service' },
    { id: 'client', label: 'Uploader', sublabel: 'splits the file into chunks', lane: 0, role: 'client' },
  ],
  edges: [
    { from: 'client', to: 'dedupidx', label: 'check existing hashes' },
    { from: 'dedupidx', to: 'blobstore', label: 'write new chunk only' },
  ],
}

/** A valid 3-entry narration JSON, index-aligned to client -> dedupidx -> blobstore. */
const VALID_JSON = JSON.stringify({
  steps: [
    { title: 'Hash and chunk the file', explanation: 'The uploader splits the file into chunks and hashes each one before any byte leaves the client.', decision: 'Hash locally so the dedup check is cheap' },
    { title: 'Check the dedup index', explanation: 'The dedup index maps each content hash to an existing blob id, so a chunk already stored is never written twice.', decision: 'One index lookup beats a duplicate write' },
    { title: 'Persist only new chunks', explanation: 'The object store receives only the chunks the index did not recognize, keeping write volume proportional to unique data.' },
  ],
})

test('parseFlowNarration accepts a valid N-entry JSON', () => {
  const result = parseFlowNarration(VALID_JSON, 3)
  assert.ok(result)
  assert.equal(result!.length, 3)
  assert.equal(result![0].title, 'Hash and chunk the file')
  assert.equal(result![1].decision, 'One index lookup beats a duplicate write')
  // A step with no decision keeps decision undefined, not an empty string.
  assert.equal(result![2].decision, undefined)
})

test('parseFlowNarration tolerates a ```json code fence', () => {
  const fenced = '```json\n' + VALID_JSON + '\n```'
  const result = parseFlowNarration(fenced, 3)
  assert.ok(result)
  assert.equal(result!.length, 3)
})

test('parseFlowNarration tolerates leading/trailing prose around the object', () => {
  const noisy = 'Here is the narration:\n' + VALID_JSON + '\nLet me know if you want changes.'
  const result = parseFlowNarration(noisy, 3)
  assert.ok(result)
  assert.equal(result!.length, 3)
})

test('parseFlowNarration rejects the wrong count', () => {
  assert.equal(parseFlowNarration(VALID_JSON, 4), null)
  assert.equal(parseFlowNarration(VALID_JSON, 2), null)
})

test('parseFlowNarration rejects a non-array steps field', () => {
  assert.equal(parseFlowNarration(JSON.stringify({ steps: 'nope' }), 1), null)
  assert.equal(parseFlowNarration(JSON.stringify({ steps: {} }), 1), null)
  assert.equal(parseFlowNarration('not json at all', 3), null)
})

test('parseFlowNarration rejects an entry missing title or explanation', () => {
  const missingTitle = JSON.stringify({ steps: [{ explanation: 'has no title' }] })
  assert.equal(parseFlowNarration(missingTitle, 1), null)
  const missingExpl = JSON.stringify({ steps: [{ title: 'has no explanation' }] })
  assert.equal(parseFlowNarration(missingExpl, 1), null)
  const emptyTitle = JSON.stringify({ steps: [{ title: '   ', explanation: 'real' }] })
  assert.equal(parseFlowNarration(emptyTitle, 1), null)
})

test('parseFlowNarration strips em dashes from every field', () => {
  const withDashes = JSON.stringify({
    steps: [
      {
        title: 'Check the index — fast',
        explanation: 'The lookup is cheap — it returns a blob id or nothing.',
        decision: 'Index first — write second',
      },
    ],
  })
  const result = parseFlowNarration(withDashes, 1)
  assert.ok(result)
  assert.ok(!result![0].title.includes('—'))
  assert.ok(!result![0].explanation.includes('—'))
  assert.ok(!result![0].decision!.includes('—'))
  assert.equal(result![0].title, 'Check the index, fast')
})

test('parseFlowNarration clamps over-length fields to the schema caps', () => {
  const longTitle = 'T'.repeat(200)
  const longExpl = 'E'.repeat(500)
  const longDecision = 'D'.repeat(200)
  const oversized = JSON.stringify({
    steps: [{ title: longTitle, explanation: longExpl, decision: longDecision }],
  })
  const result = parseFlowNarration(oversized, 1)
  assert.ok(result)
  assert.equal(result![0].title.length, 80)
  assert.equal(result![0].explanation.length, 320)
  assert.equal(result![0].decision!.length, 120)
})

test('buildFlowNarrationContext pulls the optimal approach edges + ordered nodes', () => {
  const ctx = buildFlowNarrationContext(designContentWith(UPLOAD_ARCH))
  assert.ok(ctx)
  // Nodes are ordered like the structure: client floats to the front, store sinks back.
  assert.deepEqual(ctx!.nodes.map((n) => n.id), ['client', 'dedupidx', 'blobstore'])
  // Sublabels + roles travel with each node so the narrator can ground its prose.
  assert.equal(ctx!.nodes[0].sublabel, 'splits the file into chunks')
  assert.equal(ctx!.nodes[1].role, 'service')
  // The REAL edges from the optimal approach are carried through, labels and all.
  assert.equal(ctx!.edges.length, 2)
  const checkEdge = ctx!.edges.find((e) => e.from === 'client' && e.to === 'dedupidx')
  assert.ok(checkEdge)
  assert.equal(checkEdge!.label, 'check existing hashes')
  // Solution context is pulled from the optimal (last) approach, not the brute force.
  assert.equal(ctx!.optimalTitle, 'Dedup-first upload')
  assert.deepEqual(ctx!.tradeoffs, [{ gain: 'skips duplicate writes', cost: 'extra index lookup per upload' }])
})

test('buildFlowNarrationContext returns null for a non-design type', () => {
  const content = designContentWith(UPLOAD_ARCH)
  ;(content as { challenge_type: string }).challenge_type = 'algorithm'
  assert.equal(buildFlowNarrationContext(content as SolutionContentV1), null)
})

test('buildFlowNarrationContext returns null when the optimal approach has no architecture', () => {
  assert.equal(buildFlowNarrationContext(designContentWith(undefined)), null)
})

test('buildFlowNarrationPrompt embeds the real edges, sublabels, and the exact step count', () => {
  const ctx = buildFlowNarrationContext(designContentWith(UPLOAD_ARCH))
  assert.ok(ctx)
  const { system, user } = buildFlowNarrationPrompt(ctx!)
  // The contract names the exact count and the index alignment.
  assert.ok(system.includes('EXACTLY 3 entries'))
  // Real edge labels and node sublabels appear in the user content for grounding.
  assert.ok(user.includes('check existing hashes'))
  assert.ok(user.includes('splits the file into chunks'))
  assert.ok(user.includes('Dedup-first upload'))
  // The style bans are stated in the system prompt.
  assert.ok(system.includes('No em dashes'))
  assert.ok(/Claude|Anthropic/.test(system)) // the no-vendor instruction names them to ban them
})
