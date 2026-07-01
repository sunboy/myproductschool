import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureSolutionForChallenge,
  type SolutionGenDeps,
} from '../../../src/lib/solutions/ensure-solution'
import type { SolutionContentV1 } from '../../../src/lib/solutions/schema'

// The eager helper resolves the challenge via resolveChallengeIdentity, which
// runs against the injected admin client (a fake here). It uses the same fake
// query builder for the challenge_solutions reads/writes and for the
// challenges lookups. No real Supabase or Anthropic call fires in any test.

const READY_CONTENT: SolutionContentV1 = {
  version: 1,
  challenge_type: 'flow',
  overview_md: 'A grounded overview of what this challenge is really testing.',
  approaches: [
    {
      id: 'reasoning-walkthrough',
      title: 'The reasoning walkthrough',
      tagline: 'Frame, list, optimize, win.',
      body_md: '## Frame\nFind the friction behind the symptom.',
      diagram: { kind: 'flow_steps', steps: [{ label: 'Symptom' }, { label: 'Friction' }] },
    },
  ],
  ai_collaboration: {
    body_md: 'Own the framing yourself; use an AI assistant to stress-test it.',
    prompts: [{ title: 'Stress-test', prompt: 'Critique my framing: [paste]', why: 'Uses the AI as a critic.' }],
    pitfalls: ['Asking for the answer up front removes the practice value.'],
  },
}

/**
 * A minimal chainable Supabase query builder for tests. Each `from(table)` call
 * returns a fresh chain; terminal `maybeSingle()`/awaiting the chain resolves to
 * a caller-supplied result keyed by an `intent` the test declares. Every builder
 * method returns `this` so the real call sites (`.update().eq().in().select()`)
 * chain without error. `select(...)` after a mutating `update(...)` resolves to
 * the mutation result so the atomic-claim reads its rows.
 */
interface TableScript {
  // Result for a resolve/read `.maybeSingle()` on this table.
  maybeSingle?: unknown
  // Result for a `.update(...).select(...)` claim (the rows the claim "captured").
  claim?: { data: Array<{ challenge_id: string }> | null }
  // Optional callback fired on any `.update(...)` so a test can assert the payload.
  onUpdate?: (payload: Record<string, unknown>) => void
}

function makeAdmin(scripts: Record<string, TableScript[]>) {
  // Track how many times each table has been accessed so a table can return a
  // different scripted result on successive `.from()` calls (resolve, then read,
  // then claim, then final store).
  const counters: Record<string, number> = {}

  function from(table: string) {
    const idx = counters[table] ?? 0
    counters[table] = idx + 1
    const script = (scripts[table]?.[idx] ?? scripts[table]?.[scripts[table].length - 1] ?? {}) as TableScript
    let sawUpdate = false
    let sawUpsert = false

    const chain: Record<string, unknown> = {}
    const passthrough = () => chain
    for (const method of ['select', 'eq', 'in', 'lt', 'order', 'limit']) {
      chain[method] = passthrough
    }
    chain.upsert = () => {
      sawUpsert = true
      return Promise.resolve({ data: null, error: null })
    }
    chain.update = (payload: Record<string, unknown>) => {
      sawUpdate = true
      script.onUpdate?.(payload)
      return chain
    }
    chain.maybeSingle = () => Promise.resolve({ data: script.maybeSingle ?? null, error: null })
    // Awaiting the chain (used by the claim's trailing `.select(...)`) resolves to
    // the claim result when this access was a mutation, else a null-data read.
    chain.then = (resolve: (v: unknown) => unknown) => {
      const value = sawUpdate
        ? (script.claim ?? { data: null, error: null })
        : sawUpsert
          ? { data: null, error: null }
          : { data: script.maybeSingle ?? null, error: null }
      return Promise.resolve(value).then(resolve)
    }
    return chain
  }

  return { from } as unknown as SolutionGenDeps['admin']
}

/** A deps bundle that never touches the network. */
function fakeDeps(over: Partial<SolutionGenDeps>): Partial<SolutionGenDeps> {
  return {
    buildSourceContext: (async () => ({ challengeType: 'flow', userContent: 'ctx' })) as SolutionGenDeps['buildSourceContext'],
    createMessage: (async () => ({
      content: [{ type: 'text', text: JSON.stringify(READY_CONTENT) }],
    })) as unknown as SolutionGenDeps['createMessage'],
    graft: (async (content: SolutionContentV1) => ({ content, grafted: false })) as SolutionGenDeps['graft'],
    ...over,
  }
}

test('skips when a ready solution already exists (no generation)', async () => {
  let generated = false
  const admin = makeAdmin({
    // resolveChallengeIdentity: byId lookup returns the row.
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    // existing solution is already ready.
    challenge_solutions: [{ maybeSingle: { generation_status: 'ready', content: READY_CONTENT } }],
  })
  const result = await ensureSolutionForChallenge('c1', {
    deps: fakeDeps({
      admin,
      createMessage: (async () => {
        generated = true
        return { content: [{ type: 'text', text: '{}' }] }
      }) as unknown as SolutionGenDeps['createMessage'],
    }),
  })
  assert.equal(result.status, 'skipped')
  assert.equal(generated, false, 'must not call the model when a ready solution exists')
})

test('skips when the challenge cannot be resolved', async () => {
  const admin = makeAdmin({
    // Every challenges lookup (byId, bySlug) misses.
    challenges: [{ maybeSingle: null }],
  })
  const result = await ensureSolutionForChallenge('missing', { deps: fakeDeps({ admin }) })
  assert.equal(result.status, 'skipped')
})

test('fail-soft: a thrown error during generation returns failed, never throws', async () => {
  const admin = makeAdmin({
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    challenge_solutions: [
      // read: not ready yet
      { maybeSingle: { generation_status: 'pending', content: null } },
      // upsert (row ensure)
      {},
      // claim UPDATE captures the row (this worker holds the claim)
      { claim: { data: [{ challenge_id: 'c1' }] } },
      // failed-status write after the throw
      {},
    ],
  })
  const result = await ensureSolutionForChallenge('c1', {
    deps: fakeDeps({
      admin,
      createMessage: (async () => {
        throw new Error('anthropic exploded')
      }) as unknown as SolutionGenDeps['createMessage'],
    }),
  })
  assert.equal(result.status, 'failed')
})

test('contended (another worker holds the claim) is treated as skipped', async () => {
  const admin = makeAdmin({
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    challenge_solutions: [
      { maybeSingle: { generation_status: 'generating', content: null } }, // read
      {}, // upsert
      { claim: { data: [] } }, // normal claim: no rows
      { claim: { data: [] } }, // stale reclaim: no rows -> contended
    ],
  })
  const result = await ensureSolutionForChallenge('c1', { deps: fakeDeps({ admin }) })
  assert.equal(result.status, 'skipped')
})

test('happy path: generates, stores generated_by=eager, returns ready', async () => {
  let updatePayload: Record<string, unknown> | null = null
  const admin = makeAdmin({
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    challenge_solutions: [
      { maybeSingle: { generation_status: 'pending', content: null } }, // read
      {}, // upsert
      { claim: { data: [{ challenge_id: 'c1' }] } }, // claim captured
      { onUpdate: (p) => { if (p.generation_status === 'ready') updatePayload = p } }, // final store
    ],
  })
  const result = await ensureSolutionForChallenge('c1', { deps: fakeDeps({ admin }) })
  assert.equal(result.status, 'ready')
  assert.equal(result.grafted, false)
  assert.ok(updatePayload, 'a ready store must occur')
  assert.equal((updatePayload as unknown as Record<string, unknown>).generated_by, 'eager')
})

test('force bypasses the ready-solution skip and regenerates', async () => {
  let generated = false
  const admin = makeAdmin({
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    challenge_solutions: [
      // With force, the ready-check read is skipped entirely; first access is the upsert.
      {}, // upsert
      { claim: { data: [{ challenge_id: 'c1' }] } }, // claim captured
      {}, // final store
    ],
  })
  const result = await ensureSolutionForChallenge('c1', {
    force: true,
    deps: fakeDeps({
      admin,
      createMessage: (async () => {
        generated = true
        return { content: [{ type: 'text', text: JSON.stringify(READY_CONTENT) }] }
      }) as unknown as SolutionGenDeps['createMessage'],
    }),
  })
  assert.equal(result.status, 'ready')
  assert.equal(generated, true, 'force must regenerate even when a ready solution exists')
})

test('no source context marks the row failed and returns failed', async () => {
  const admin = makeAdmin({
    challenges: [{ maybeSingle: { id: 'c1', slug: null, display_number: null, challenge_type: 'flow' } }],
    challenge_solutions: [
      { maybeSingle: { generation_status: 'pending', content: null } }, // read
      {}, // upsert
      { claim: { data: [{ challenge_id: 'c1' }] } }, // claim captured
      {}, // failed store
    ],
  })
  const result = await ensureSolutionForChallenge('c1', {
    deps: fakeDeps({
      admin,
      buildSourceContext: (async () => null) as SolutionGenDeps['buildSourceContext'],
    }),
  })
  assert.equal(result.status, 'failed')
})
