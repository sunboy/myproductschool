import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeMoveDiff, type ExpertMove } from '../../../src/lib/casebook/move-diff'

const EXPERT_MOVES: ExpertMove[] = [
  { id: 'move-1', t: 5, label: 'Survey the schema', description: 'Listed tables and fetched schema.' },
  { id: 'move-2', t: 26, label: 'Pull daily volume', description: 'Ran daily and day-of-week queries.' },
  { id: 'move-3', t: 49, label: 'Compute the Tuesday gap', description: 'One clean query for the gap.' },
  { id: 'move-4', t: 74, label: 'Summarize the dip', description: 'Summarized findings.' },
]

describe('computeMoveDiff', () => {
  it('matches every expert move when the learner hit all of them', () => {
    const result = computeMoveDiff(['move-1', 'move-2', 'move-3', 'move-4'], EXPERT_MOVES)
    assert.deepEqual(
      result.matched.map((m) => m.id),
      ['move-1', 'move-2', 'move-3', 'move-4'],
    )
    assert.equal(result.missed.length, 0)
    assert.equal(result.extra.length, 0)
    assert.equal(result.expert_moves_total, 4)
  })

  it('reports missed moves in expert move order, not learner order', () => {
    const result = computeMoveDiff(['move-3', 'move-1'], EXPERT_MOVES)
    assert.deepEqual(
      result.matched.map((m) => m.id),
      ['move-1', 'move-3'],
    )
    assert.deepEqual(
      result.missed.map((m) => m.id),
      ['move-2', 'move-4'],
    )
    assert.equal(result.expert_moves_total, 4)
  })

  it('reports every expert move as missed when the learner hit none', () => {
    const result = computeMoveDiff([], EXPERT_MOVES)
    assert.equal(result.matched.length, 0)
    assert.deepEqual(
      result.missed.map((m) => m.id),
      ['move-1', 'move-2', 'move-3', 'move-4'],
    )
    assert.equal(result.expert_moves_total, 4)
  })

  it('routes learner move ids outside the expert list to extra, not matched or missed', () => {
    const result = computeMoveDiff(['move-1', 'move-99', 'off-script-move'], EXPERT_MOVES)
    assert.deepEqual(
      result.matched.map((m) => m.id),
      ['move-1'],
    )
    assert.deepEqual(
      result.missed.map((m) => m.id),
      ['move-2', 'move-3', 'move-4'],
    )
    assert.deepEqual(result.extra, ['move-99', 'off-script-move'])
  })

  it('collapses duplicate learner move ids without double-counting', () => {
    const result = computeMoveDiff(['move-1', 'move-1', 'move-1'], EXPERT_MOVES)
    assert.equal(result.matched.length, 1)
    assert.equal(result.matched[0].id, 'move-1')
  })

  it('handles an empty expert move list without throwing', () => {
    const result = computeMoveDiff(['move-1'], [])
    assert.equal(result.matched.length, 0)
    assert.equal(result.missed.length, 0)
    assert.deepEqual(result.extra, ['move-1'])
    assert.equal(result.expert_moves_total, 0)
  })
})
