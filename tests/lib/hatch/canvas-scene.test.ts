import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { summarizeScene } from '@/lib/hatch/canvas-scene'

// Minimal bound-text table: an Excalidraw rectangle plus its containerId text
// child (this is how the executor writes labelled boxes).
function box(id: string, label: string, x: number, y: number, width = 160, height = 80) {
  return [
    { id, type: 'rectangle', x, y, width, height, boundElements: [{ id: `${id}-t`, type: 'text' }] },
    { id: `${id}-t`, type: 'text', containerId: id, text: label, x: x + 10, y: y + 30, width: width - 20, height: 20 },
  ]
}

describe('summarizeScene — connection resolution', () => {
  it('resolves an unbound arrow via customData.hatchFrom/hatchTo', () => {
    const elements = [
      ...box('b1', 'Users', 0, 0),
      ...box('b2', 'Posts', 400, 0),
      {
        id: 'a1',
        type: 'arrow',
        x: 160,
        y: 16,
        width: 240,
        height: 0,
        points: [[0, 0], [240, 0]],
        startBinding: null,
        endBinding: null,
        customData: { hatchFrom: 'b1', hatchTo: 'b2' },
      },
    ]
    const scene = summarizeScene(elements)
    assert.equal(scene.connections.length, 1)
    assert.deepEqual(
      { from: scene.connections[0].from, to: scene.connections[0].to },
      { from: 'Users', to: 'Posts' },
    )
  })

  it('falls back to the nearest-entity heuristic when an arrow has neither binding nor customData', () => {
    const elements = [
      ...box('b1', 'Users', 0, 0),
      ...box('b2', 'Posts', 400, 0),
      {
        // Arrow drawn from the right edge of Users to the left edge of Posts,
        // with no binding and no customData — must still resolve by proximity.
        id: 'a1',
        type: 'arrow',
        x: 160,
        y: 16,
        width: 240,
        height: 0,
        points: [[0, 0], [240, 0]],
        startBinding: null,
        endBinding: null,
      },
    ]
    const scene = summarizeScene(elements)
    assert.equal(scene.connections.length, 1)
    assert.deepEqual(
      { from: scene.connections[0].from, to: scene.connections[0].to },
      { from: 'Users', to: 'Posts' },
    )
  })
})
