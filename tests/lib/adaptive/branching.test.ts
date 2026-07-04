import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyVerdict,
  planBranch,
  applyBranch,
  buildScaffoldStep,
  INITIAL_MACHINE,
  STRETCH_METRIC_STEP,
} from '@/lib/adaptive/branching'
import { arcForDifficulty } from '@/components/v2/mediums/analyticsArc'
import type { MarkVerdict } from '@/components/v2/mediums/types'

function runVerdicts(verdicts: MarkVerdict[], start: 'scaffolded' | 'guided' | 'open' = 'guided') {
  let state = { ...INITIAL_MACHINE }
  let guidance = start
  const moves: Array<'up' | 'down'> = []
  for (const v of verdicts) {
    const r = applyVerdict(state, v, guidance)
    state = r.state
    guidance = r.guidance
    if (r.moved) moves.push(r.moved)
  }
  return { guidance, moves }
}

describe('guidance state machine', () => {
  it('downgrades after two consecutive retries, once', () => {
    const r = runVerdicts(['retry', 'retry', 'retry', 'retry'], 'guided')
    assert.equal(r.guidance, 'scaffolded')
    assert.deepEqual(r.moves, ['down'])
  })

  it('upgrades after two consecutive clean passes, once', () => {
    const r = runVerdicts(['pass', 'pass', 'pass', 'pass'], 'guided')
    assert.equal(r.guidance, 'open')
    assert.deepEqual(r.moves, ['up'])
  })

  it('partial breaks both streaks and moves nothing', () => {
    const r = runVerdicts(['pass', 'partial', 'pass', 'partial', 'pass'], 'guided')
    assert.equal(r.guidance, 'guided')
    assert.deepEqual(r.moves, [])
  })

  it('never oscillates: one net movement each way at most', () => {
    const r = runVerdicts(['pass', 'pass', 'retry', 'retry', 'pass', 'pass', 'retry', 'retry'], 'guided')
    // up once (guided→open), down once (open→guided), then locked.
    assert.equal(r.guidance, 'guided')
    assert.deepEqual(r.moves, ['up', 'down'])
  })

  it('respects the level bounds', () => {
    assert.equal(runVerdicts(['retry', 'retry'], 'scaffolded').guidance, 'scaffolded')
    assert.equal(runVerdicts(['pass', 'pass'], 'open').guidance, 'open')
  })
})

describe('planBranch', () => {
  const arc = arcForDifficulty('advanced')

  it('injects a scaffold before a step with two retries', () => {
    const active = arc[3]
    const plan = planBranch({
      arc,
      activeIdx: 3,
      verdicts: [
        { stepId: active.id, verdict: 'retry' },
        { stepId: active.id, verdict: 'retry' },
      ],
      scaffoldsInjected: 0,
      stretchesInjected: 0,
    })
    assert.equal(plan.action, 'inject_scaffold')
    if (plan.action === 'inject_scaffold') {
      assert.equal(plan.atIdx, 3)
      assert.equal(plan.step.kind, 'scaffold_explainer')
    }
  })

  it('injects a stretch after two clean passes on different steps', () => {
    const plan = planBranch({
      arc,
      activeIdx: 4,
      verdicts: [
        { stepId: arc[2].id, verdict: 'pass' },
        { stepId: arc[3].id, verdict: 'pass' },
      ],
      scaffoldsInjected: 0,
      stretchesInjected: 0,
    })
    assert.equal(plan.action, 'inject_stretch')
    if (plan.action === 'inject_stretch') assert.equal(plan.atIdx, 5)
  })

  it('never exceeds two total injections, one per type', () => {
    const stuck = { arc, activeIdx: 3, verdicts: [
      { stepId: arc[3].id, verdict: 'retry' as const },
      { stepId: arc[3].id, verdict: 'retry' as const },
    ]}
    assert.equal(planBranch({ ...stuck, scaffoldsInjected: 1, stretchesInjected: 0 }).action, 'none')
    assert.equal(planBranch({ ...stuck, scaffoldsInjected: 1, stretchesInjected: 1 }).action, 'none')
  })

  it('never injects on the final step', () => {
    const last = arc.length - 1
    const plan = planBranch({
      arc,
      activeIdx: last,
      verdicts: [
        { stepId: arc[last].id, verdict: 'retry' },
        { stepId: arc[last].id, verdict: 'retry' },
      ],
      scaffoldsInjected: 0,
      stretchesInjected: 0,
    })
    assert.equal(plan.action, 'none')
  })

  it('never scaffolds a scaffold', () => {
    const scaffold = buildScaffoldStep(arc[3])
    const arcWith = [...arc.slice(0, 3), scaffold, ...arc.slice(3)].map((s, i) => ({ ...s, sequence: i + 1 }))
    const plan = planBranch({
      arc: arcWith,
      activeIdx: 3,
      verdicts: [
        { stepId: scaffold.id, verdict: 'retry' },
        { stepId: scaffold.id, verdict: 'retry' },
      ],
      scaffoldsInjected: 1,
      stretchesInjected: 0,
    })
    assert.equal(plan.action, 'none')
  })
})

describe('applyBranch', () => {
  it('inserts and re-sequences contiguously', () => {
    const arc = arcForDifficulty('advanced')
    const next = applyBranch(arc, {
      action: 'inject_stretch',
      step: STRETCH_METRIC_STEP,
      atIdx: 4,
      reason: 'test',
    })
    assert.equal(next.length, arc.length + 1)
    assert.equal(next[4].id, STRETCH_METRIC_STEP.id)
    next.forEach((s, i) => assert.equal(s.sequence, i + 1))
  })
})
