import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { deriveGuidanceLevel } from '@/lib/adaptive/guidance'
import { arcForLearner, arcForDifficulty, mergeArc } from '@/components/v2/mediums/analyticsArc'

describe('deriveGuidanceLevel', () => {
  it('scaffolds beginners and anyone with almost no evidence', () => {
    assert.equal(deriveGuidanceLevel({ level: 'Beginner', totalEvidence: 50, priorCcSessions: 5 }), 'scaffolded')
    assert.equal(deriveGuidanceLevel({ level: 'Expert', totalEvidence: 2, priorCcSessions: 5 }), 'scaffolded')
  })

  it('never opens the first analytics session', () => {
    assert.equal(deriveGuidanceLevel({ level: 'Expert', totalEvidence: 40, priorCcSessions: 0 }), 'guided')
  })

  it('opens for experienced advanced users', () => {
    assert.equal(deriveGuidanceLevel({ level: 'Advanced', totalEvidence: 20, priorCcSessions: 1 }), 'open')
    assert.equal(deriveGuidanceLevel({ level: 'Expert', totalEvidence: 40, priorCcSessions: 3 }), 'open')
  })

  it('guides the middle', () => {
    assert.equal(deriveGuidanceLevel({ level: 'Developing', totalEvidence: 20, priorCcSessions: 4 }), 'guided')
  })
})

describe('arcForLearner', () => {
  it('leaves scaffolded and guided arcs identical to the difficulty arc', () => {
    for (const g of ['scaffolded', 'guided'] as const) {
      assert.deepEqual(
        arcForLearner('advanced', g).map((s) => s.id),
        arcForDifficulty('advanced').map((s) => s.id),
      )
    }
  })

  it('compresses orientation steps and appends the stretch step for open', () => {
    const ids = arcForLearner('advanced', 'open').map((s) => s.id)
    assert.ok(ids.includes('map_the_data'))
    assert.ok(!ids.includes('explore_schema'))
    assert.ok(!ids.includes('data_layout'))
    assert.equal(ids[ids.indexOf('answer') + 1], 'stakeholder_tension')
  })

  it('re-sequences contiguously', () => {
    const arc = arcForLearner('advanced', 'open')
    arc.forEach((s, i) => assert.equal(s.sequence, i + 1))
  })

  it('does not compress a beginner arc that lacks data_layout', () => {
    const ids = arcForLearner('beginner', 'open').map((s) => s.id)
    assert.ok(!ids.includes('map_the_data'))
    assert.ok(ids.includes('explore_schema'))
  })
})

describe('mergeArc with guidance', () => {
  it('defaults to guided and matches legacy behavior exactly', () => {
    assert.deepEqual(mergeArc('advanced', undefined), mergeArc('advanced', undefined, 'guided'))
    assert.deepEqual(
      mergeArc('advanced', undefined).map((s) => s.id),
      arcForDifficulty('advanced').map((s) => s.id),
    )
  })

  it('disables open compression when a challenge overrides an orientation step, but keeps the stretch', () => {
    const overrides = [{ id: 'data_layout', title: 'Custom layout step' }]
    const ids = mergeArc('advanced', overrides, 'open').map((s) => s.id)
    assert.ok(ids.includes('explore_schema'))
    assert.ok(ids.includes('data_layout'))
    assert.ok(!ids.includes('map_the_data'))
    assert.ok(ids.includes('stakeholder_tension'))
  })

  it('applies overrides onto the open arc when compression is active', () => {
    const overrides = [{ id: 'analyze', objective: 'Custom analyze objective' }]
    const arc = mergeArc('advanced', overrides, 'open')
    assert.equal(arc.find((s) => s.id === 'analyze')?.objective, 'Custom analyze objective')
    assert.ok(arc.some((s) => s.id === 'map_the_data'))
  })
})

describe('deriveGuidance register strictness (SUN-253)', () => {
  it('holds open-register readiness until two fields carry reasoning', async () => {
    const { deriveGuidance } = await import('@/lib/hatch/canvasGuidance')
    const scene = { elementCount: 4, entities: [{}, {}, {}] as never[], connections: [{}, {}] as never[], groups: [], freeText: [], foreignKeys: [] } as never
    const oneNote = [
      { id: 'tradeoffs', value: 'We trade consistency for availability here.' },
      { id: 'assumptions', value: '' },
    ]
    const guided = deriveGuidance('system_design', scene, oneNote, 'guided')
    const open = deriveGuidance('system_design', scene, oneNote, 'open')
    assert.equal(guided.phase, 'ready')
    assert.notEqual(open.phase, 'ready')
    assert.equal(open.strictHold, true)

    const twoNotes = [
      { id: 'tradeoffs', value: 'We trade consistency for availability here.' },
      { id: 'assumptions', value: 'Read-heavy workload, 10:1.' },
    ]
    assert.equal(deriveGuidance('system_design', scene, twoNotes, 'open').phase, 'ready')
  })
})

describe('live interview register block (SUN-254)', () => {
  it('includes the register section only for scaffolded and open', async () => {
    const { buildLiveInterviewSystemPrompt } = await import('@/lib/live-interview/system-prompt')
    const base = {
      archetype: 'The Analyst',
      archetypeDescription: '',
      moveLevels: { frame: 2, list: 2, optimize: 2, win: 2 },
      failurePatterns: [],
      competencies: [],
      hatchContext: '',
    }
    const open = buildLiveInterviewSystemPrompt({ ...base, guidanceLevel: 'open' }, false)
    assert.ok(open.includes('[INTERVIEW REGISTER]'))
    assert.ok(open.includes('falsifiability'))
    const scaffolded = buildLiveInterviewSystemPrompt({ ...base, guidanceLevel: 'scaffolded' }, false)
    assert.ok(scaffolded.includes('[INTERVIEW REGISTER]'))
    const guided = buildLiveInterviewSystemPrompt({ ...base, guidanceLevel: 'guided' }, false)
    assert.ok(!guided.includes('[INTERVIEW REGISTER]'))
    const none = buildLiveInterviewSystemPrompt(base, false)
    assert.ok(!none.includes('[INTERVIEW REGISTER]'))
  })
})
