import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  chooseAnchors,
  routeOrthogonal,
  pointsBounds,
  computeLayout,
  type AnchorRect,
  type LayoutBox,
  type LayoutEdge,
} from '../../../src/lib/hatch/canvas-layout'

const rect = (x: number, y: number, width = 160, height = 80): AnchorRect => ({
  x,
  y,
  width,
  height,
})

describe('chooseAnchors', () => {
  it('uses facing horizontal sides when the target is to the right', () => {
    const from = rect(0, 0)
    const to = rect(400, 0)
    const { start, end } = chooseAnchors(from, to)
    assert.equal(start.side, 'right')
    assert.equal(end.side, 'left')
    assert.equal(start.x, from.x + from.width) // exits right edge
    assert.equal(end.x, to.x) // enters left edge
  })

  it('reverses sides when the target is to the left', () => {
    const from = rect(400, 0)
    const to = rect(0, 0)
    const { start, end } = chooseAnchors(from, to)
    assert.equal(start.side, 'left')
    assert.equal(end.side, 'right')
    assert.equal(start.x, from.x) // exits left edge
    assert.equal(end.x, to.x + to.width) // enters right edge
  })

  it('uses bottom/top when vertical distance dominates', () => {
    const from = rect(0, 0)
    const to = rect(0, 400)
    const { start, end } = chooseAnchors(from, to)
    assert.equal(start.side, 'bottom')
    assert.equal(end.side, 'top')
    assert.equal(start.y, from.y + from.height)
    assert.equal(end.y, to.y)
  })

  it('uses top/bottom when the target is above', () => {
    const from = rect(0, 400)
    const to = rect(0, 0)
    const { start, end } = chooseAnchors(from, to)
    assert.equal(start.side, 'top')
    assert.equal(end.side, 'bottom')
  })

  it('is deterministic for identical input', () => {
    const a = chooseAnchors(rect(0, 0), rect(400, 120))
    const b = chooseAnchors(rect(0, 0), rect(400, 120))
    assert.deepEqual(a, b)
  })
})

describe('routeOrthogonal', () => {
  it('always starts at the relative origin', () => {
    const { start, end } = chooseAnchors(rect(0, 0), rect(400, 120))
    const points = routeOrthogonal(start, end)
    assert.deepEqual(points[0], [0, 0])
  })

  it('produces an elbow (not a single diagonal) for a horizontal exit with vertical offset', () => {
    const start = { x: 160, y: 40, side: 'right' as const }
    const end = { x: 400, y: 200, side: 'left' as const }
    const points = routeOrthogonal(start, end)
    // 4-point elbow: origin, mid turn, mid turn, end
    assert.equal(points.length, 4)
    // The turn happens at the x-midpoint, so the second point shares y=0 (no diagonal)
    assert.equal(points[1][1], 0)
    // Every segment is axis-aligned (either dx or dy is zero per hop)
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0]
      const dy = points[i][1] - points[i - 1][1]
      assert.ok(dx === 0 || dy === 0, `segment ${i} is not axis-aligned`)
    }
  })

  it('produces an elbow for a vertical exit with horizontal offset', () => {
    const start = { x: 80, y: 80, side: 'bottom' as const }
    const end = { x: 300, y: 320, side: 'top' as const }
    const points = routeOrthogonal(start, end)
    assert.equal(points.length, 4)
    // first hop is vertical only
    assert.equal(points[1][0], 0)
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0]
      const dy = points[i][1] - points[i - 1][1]
      assert.ok(dx === 0 || dy === 0, `segment ${i} is not axis-aligned`)
    }
  })

  it('returns a degenerate segment for coincident anchors', () => {
    const p = routeOrthogonal(
      { x: 10, y: 10, side: 'right' },
      { x: 10, y: 10, side: 'left' }
    )
    assert.deepEqual(p, [[0, 0], [0, 0]])
  })

  it('only ever emits finite coordinates', () => {
    const { start, end } = chooseAnchors(rect(-50, -50), rect(600, 300))
    for (const [px, py] of routeOrthogonal(start, end)) {
      assert.ok(Number.isFinite(px) && Number.isFinite(py))
    }
  })
})

describe('pointsBounds', () => {
  it('offsets the box by the start anchor and spans the points', () => {
    const points: Array<[number, number]> = [
      [0, 0],
      [120, 0],
      [120, 160],
      [240, 160],
    ]
    const b = pointsBounds(160, 40, points)
    assert.equal(b.x, 160)
    assert.equal(b.y, 40)
    assert.equal(b.width, 240)
    assert.equal(b.height, 160)
  })

  it('handles negative relative offsets (target above-left)', () => {
    const points: Array<[number, number]> = [
      [0, 0],
      [-120, 0],
      [-120, -80],
    ]
    const b = pointsBounds(400, 400, points)
    assert.equal(b.width, 120)
    assert.equal(b.height, 80)
    // x/y shift to the min corner
    assert.equal(b.x, 280)
    assert.equal(b.y, 320)
  })
})

describe('computeLayout — overlap + gaps', () => {
  const boxes = (n: number): LayoutBox[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `n${i}`,
      x: 0,
      y: 0,
      width: 160,
      height: 80,
    }))

  it('assigns every box a finite, non-overlapping position', () => {
    const { positions } = computeLayout({ boxes: boxes(6), edges: [] })
    const placed = boxes(6).map((b) => positions.get(b.id)!)
    for (const p of placed) {
      assert.ok(p && Number.isFinite(p.x) && Number.isFinite(p.y))
    }
    // no two boxes share the exact same top-left
    const seen = new Set<string>()
    for (const p of placed) {
      const key = `${p.x},${p.y}`
      assert.ok(!seen.has(key), 'two boxes occupy the same position')
      seen.add(key)
    }
  })

  it('is deterministic across runs', () => {
    const edges: LayoutEdge[] = [{ fromId: 'n0', toId: 'n1' }]
    const a = computeLayout({ boxes: boxes(4), edges })
    const b = computeLayout({ boxes: boxes(4), edges })
    for (const box of boxes(4)) {
      assert.deepEqual(a.positions.get(box.id), b.positions.get(box.id))
    }
  })
})
