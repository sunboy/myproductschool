import { test, expect } from '@playwright/test'

/**
 * Canvas native-render verification.
 *
 * executeActions builds Excalidraw elements in the browser (text metrics are
 * DOM-only), so it cannot be unit-tested under tsx. The dev-only harness at
 * /canvas-harness mounts the real canvas and exposes window.__runDraw /
 * __getScene / __summarize. This spec drives a canned draw and asserts the
 * rendered scene: connectors are UNBOUND (so Excalidraw never re-projects an
 * endpoint into the box interior), carry linkage in customData, and anchor on
 * the box EDGES — the regression this guards against is arrows starting inside
 * a box and slicing across its text.
 *
 * Requires a dev server on :3002. Gated behind RUN_CANVAS_E2E so it does not
 * run by default (no webServer configured).
 */

type SceneEl = {
  id?: string
  type?: string
  x?: number
  y?: number
  points?: Array<[number, number]>
  startBinding?: unknown
  endBinding?: unknown
  customData?: { hatchFrom?: string | null; hatchTo?: string | null } | null
  boundElements?: Array<{ type: string }> | null
}

const TABLE_A = {
  action: 'create',
  elements: [{ type: 'rectangle', x: 0, y: 0, width: 160, height: 80, label: { text: 'Users' } }],
}
const TABLE_B = {
  action: 'create',
  elements: [{ type: 'rectangle', x: 400, y: 0, width: 160, height: 80, label: { text: 'Posts' } }],
}
const CONNECT = { action: 'connect', fromLabel: 'Users', toLabel: 'Posts', label: '1:N' }

async function drawAndRead(page: import('@playwright/test').Page, discipline: string) {
  await page.goto('/canvas-harness')
  await page.waitForFunction(() => (window as unknown as { __canvasReady?: boolean }).__canvasReady === true, {
    timeout: 20000,
  })
  return page.evaluate(
    async ([actions, disc]) => {
      const w = window as unknown as {
        __runDraw: (a: unknown[], d?: string) => Promise<unknown>
        __getScene: () => unknown[]
      }
      await w.__runDraw(actions as unknown[], disc as string)
      // Let the relayout pass + a render tick settle.
      await new Promise((r) => setTimeout(r, 1500))
      return w.__getScene()
    },
    [[TABLE_A, TABLE_B, CONNECT], discipline] as const,
  ) as Promise<SceneEl[]>
}

for (const discipline of ['data_modeling', 'system_design']) {
  test(`connectors anchor on box edges and stay unbound (${discipline})`, async ({ page }) => {
    test.skip(!process.env.RUN_CANVAS_E2E, 'set RUN_CANVAS_E2E=1 to run against a live :3002 server')

    const scene = await drawAndRead(page, discipline)

    const boxes = scene.filter((e) => e.type === 'rectangle')
    const arrow = scene.find((e) => e.type === 'arrow')
    expect(boxes.length).toBe(2)
    expect(arrow, 'an arrow connector was rendered').toBeTruthy()

    // Unbound — Excalidraw renders our exact geometry, no endpoint re-projection.
    expect(arrow!.startBinding).toBeNull()
    expect(arrow!.endBinding).toBeNull()

    // Linkage carried in customData, resolvable back to the two boxes.
    const boxIds = new Set(boxes.map((b) => b.id))
    expect(boxIds.has(arrow!.customData?.hatchFrom ?? '')).toBeTruthy()
    expect(boxIds.has(arrow!.customData?.hatchTo ?? '')).toBeTruthy()

    // First point is the local origin; the absolute origin must sit ON a box
    // perimeter (left or right edge of the source box), never in its interior.
    const pts = arrow!.points ?? []
    expect(pts.length).toBeGreaterThanOrEqual(2)
    expect(pts[0]).toEqual([0, 0])

    const from = boxes.find((b) => b.id === arrow!.customData?.hatchFrom)!
    const fromLeft = from.x ?? 0
    const fromRight = (from.x ?? 0) + 160
    const originX = arrow!.x ?? 0
    const onEdge = Math.abs(originX - fromLeft) < 2 || Math.abs(originX - fromRight) < 2
    expect(onEdge, `arrow origin x=${originX} must be on a box edge (${fromLeft} or ${fromRight})`).toBeTruthy()

    // No phantom arrow binding leaked into either box.
    for (const box of boxes) {
      const bound = box.boundElements ?? []
      expect(bound.some((b) => b.type === 'arrow')).toBeFalsy()
    }

    // Visual regression net.
    await expect(page.locator('.hatch-canvas')).toHaveScreenshot(`canvas-${discipline}.png`, {
      maxDiffPixelRatio: 0.02,
    })
  })
}
