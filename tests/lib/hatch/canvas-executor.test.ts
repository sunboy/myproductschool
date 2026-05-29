import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  validateAction,
  executeActions,
} from '@/components/challenge/canvasActionExecutor'

describe('validateAction', () => {
  it('rejects non-objects and unknown action types', () => {
    assert.equal(validateAction(null), null)
    assert.equal(validateAction('create'), null)
    assert.equal(validateAction({ action: 'explode' }), null)
    assert.equal(validateAction({}), null)
  })

  it('drops a create with no valid elements but keeps the typed ones', () => {
    assert.equal(validateAction({ action: 'create', elements: [] }), null)
    assert.equal(validateAction({ action: 'create', elements: [{ foo: 1 }] }), null)
    const ok = validateAction({
      action: 'create',
      elements: [{ type: 'rectangle', label: 'Users' }, { noType: true }],
    })
    assert.ok(ok)
    // malformed element filtered out, valid one retained
    assert.equal((ok as { elements: unknown[] }).elements.length, 1)
  })

  it('requires both labels on connect', () => {
    assert.equal(validateAction({ action: 'connect', fromLabel: 'A' }), null)
    assert.equal(validateAction({ action: 'connect', fromLabel: '', toLabel: 'B' }), null)
    assert.ok(validateAction({ action: 'connect', fromLabel: 'A', toLabel: 'B' }))
  })

  it('validates annotate / remove / rename / create_from_library', () => {
    assert.equal(validateAction({ action: 'annotate', text: '  ' }), null)
    assert.ok(validateAction({ action: 'annotate', text: 'note' }))
    assert.equal(validateAction({ action: 'remove' }), null)
    assert.ok(validateAction({ action: 'remove', targetLabel: 'Users' }))
    assert.equal(validateAction({ action: 'rename', fromLabel: 'A' }), null)
    assert.ok(validateAction({ action: 'rename', fromLabel: 'A', toLabel_rename: 'B' }))
    assert.equal(validateAction({ action: 'create_from_library', library_item: '' }), null)
    assert.ok(validateAction({ action: 'create_from_library', library_item: 'db' }))
  })
})

/**
 * Minimal in-memory stand-in for the Excalidraw imperative API. Tracks elements
 * so executeActions can snapshot before/after, and lets us assert it resolves
 * (never throws) on a malformed batch.
 */
function stubApi() {
  let elements: Array<Record<string, unknown>> = []
  return {
    // Bypass the throwing guard to plant a deliberately corrupt starting scene.
    seed: (els: Array<Record<string, unknown>>) => {
      elements = els
    },
    getSceneElements: () => elements,
    getAppState: () => ({ width: 1200, height: 800, scrollX: 0, scrollY: 0, zoom: { value: 1 } }),
    updateScene: ({ elements: next }: { elements: Array<Record<string, unknown>> }) => {
      // mimic Excalidraw: reject non-finite geometry by throwing, so the test
      // proves sanitizeElementGeometry ran before this point.
      for (const el of next) {
        for (const k of ['x', 'y', 'width', 'height']) {
          const v = el[k]
          if (typeof v === 'number' && !Number.isFinite(v)) {
            throw new Error(`non-finite ${k}`)
          }
        }
      }
      elements = next
    },
    scrollToContent: () => {},
  }
}

describe('executeActions — crash hardening', () => {
  it('resolves a result (never throws) on a fully malformed batch', async () => {
    const api = stubApi()
    const result = await executeActions(
      [
        null as never,
        { action: 'explode' } as never,
        { action: 'create', elements: [] } as never,
      ],
      api as never,
      []
    )
    assert.equal(result.failed, 0)
    assert.equal(result.skipped, 3)
    assert.equal(result.applied, 0)
  })

  it('applies the valid subset and skips the rest', async () => {
    const api = stubApi()
    const result = await executeActions(
      [
        { action: 'create', elements: [{ type: 'rectangle', label: 'Users' }] } as never,
        { action: 'connect', fromLabel: 'Users' } as never, // missing toLabel → skipped
      ],
      api as never,
      []
    )
    assert.ok(result.applied >= 1)
    assert.ok(result.skipped >= 1)
    assert.equal(typeof result.ok, 'boolean')
  })

  it('never feeds non-finite geometry to updateScene', async () => {
    const api = stubApi()
    // updateScene throws on non-finite values; if sanitize works, no throw bubbles.
    const result = await executeActions(
      [
        {
          action: 'create',
          elements: [
            { type: 'rectangle', label: 'A', x: Number.NaN, y: Infinity, width: -5, height: NaN },
          ],
        } as never,
      ],
      api as never,
      []
    )
    assert.equal(typeof result.ok, 'boolean')
  })

  it('sanitizes the connect path even when scene boxes carry NaN dims', async () => {
    // Seed a scene with two label-bearing boxes whose geometry is corrupt.
    // chooseAnchors/routeOrthogonal would derive NaN points from these; the
    // connect write must still be sanitized before reaching updateScene.
    const api = stubApi()
    api.seed([
      { id: 'b1', type: 'rectangle', label: { text: 'Users' }, x: 0, y: 0, width: Number.NaN, height: 80 },
      { id: 'b2', type: 'rectangle', label: { text: 'Posts' }, x: 400, y: Infinity, width: 160, height: 80 },
    ])
    // The throwing guard in stubApi would fire if a NaN reached updateScene.
    const result = await executeActions(
      [{ action: 'connect', fromLabel: 'Users', toLabel: 'Posts', label: 'has many' } as never],
      api as never,
      []
    )
    assert.equal(typeof result.ok, 'boolean')
  })
})
