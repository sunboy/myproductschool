// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any

import type { CanvasAction } from '@/lib/types'
import { summarizeScene } from '@/lib/hatch/canvas-scene'
import { computeLayout } from '@/lib/hatch/canvas-layout'
import type { LayoutBox, LayoutEdge } from '@/lib/hatch/canvas-layout'

type LibraryItem = { id: string; name?: string; elements: unknown[] }

type SceneElement = {
  x?: number
  y?: number
  width?: number
  height?: number
  label?: { text?: string }
  text?: string
  isDeleted?: boolean
}

function findElementByLabel(elements: readonly unknown[], label: string): SceneElement | undefined {
  return (elements as SceneElement[]).find(
    (el) => el.label?.text === label || el.text === label
  )
}

function uniqueId(): string {
  return `el-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function baseFields() {
  return {
    version: 1 as const,
    versionNonce: Math.floor(Math.random() * 1e9),
    isDeleted: false as const,
    groupIds: [] as string[],
    frameId: null as null,
    roundness: null as null,
    boundElements: null as null,
    updated: Date.now(),
    link: null as null,
    locked: false as const,
    angle: 0 as const,
  }
}

/**
 * Excalidraw renders text inside a shape as a SEPARATE text element with
 * containerId pointing at the shape, AND the shape's boundElements listing
 * the text id. Without both pointers, the text is invisible / not bound.
 */
function makeBoundLabel(
  containerId: string,
  text: string,
  shapeX: number,
  shapeY: number,
  shapeWidth: number,
  shapeHeight: number
): unknown {
  return {
    id: uniqueId(),
    type: 'text',
    x: shapeX + 10,
    y: shapeY + shapeHeight / 2 - 10,
    width: shapeWidth - 20,
    height: 20,
    text,
    originalText: text,
    fontSize: 16,
    fontFamily: 6, // 6 = Nunito (Excalidraw built-in, matches our app font)
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    containerId,
    strokeColor: '#2e3230',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 1,
    strokeStyle: 'solid' as const,
    roughness: 0,
    opacity: 100,
    lineHeight: 1.25,
    ...baseFields(),
  }
}

/**
 * Builds a bound text element for multi-line table bodies (entity name + separator + columns).
 * Unlike makeBoundLabel, this uses left/top alignment and smaller font for readability.
 */
function makeTableBoundLabel(
  containerId: string,
  text: string,
  shapeX: number,
  shapeY: number,
  shapeWidth: number,
  shapeHeight: number
): unknown {
  return {
    id: uniqueId(),
    type: 'text',
    x: shapeX + 12,
    y: shapeY + 8,
    width: shapeWidth - 24,
    height: shapeHeight - 16,
    text,
    originalText: text,
    fontSize: 14,
    fontFamily: 6, // 6 = Nunito (Excalidraw built-in, matches our app font)
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
    containerId,
    strokeColor: '#2e3230',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 1,
    strokeStyle: 'solid' as const,
    roughness: 0,
    opacity: 100,
    lineHeight: 1.25,
    ...baseFields(),
  }
}

// ---------------------------------------------------------------------------
// Layout helpers — grid-based placement to prevent element overlap
// ---------------------------------------------------------------------------

const GRID_GAP = 32
const GRID_START = { x: 60, y: 60 }
const GRID_COLS = 3

type BBox = { x: number; y: number; w: number; h: number }

function getOccupied(elements: readonly unknown[]): BBox[] {
  return (elements as SceneElement[])
    .filter((el) => !el.isDeleted && el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined)
    .map((el) => ({ x: el.x!, y: el.y!, w: el.width!, h: el.height! }))
}

function hasOverlap(a: BBox, occupied: BBox[]): boolean {
  const buf = 8
  return occupied.some(
    (b) =>
      a.x < b.x + b.w + buf &&
      a.x + a.w + buf > b.x &&
      a.y < b.y + b.h + buf &&
      a.y + a.h + buf > b.y
  )
}

function findFreeSlot(
  occupied: BBox[],
  w: number,
  h: number,
  preferX?: number,
  preferY?: number
): { x: number; y: number } {
  if (preferX !== undefined && preferY !== undefined) {
    if (!hasOverlap({ x: preferX, y: preferY, w, h }, occupied)) {
      return { x: preferX, y: preferY }
    }
  }
  for (let row = 0; row < 50; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = GRID_START.x + col * (w + GRID_GAP)
      const y = GRID_START.y + row * (h + GRID_GAP)
      if (!hasOverlap({ x, y, w, h }, occupied)) return { x, y }
    }
  }
  const maxY = occupied.reduce((m, b) => Math.max(m, b.y + b.h), 0)
  return { x: GRID_START.x, y: maxY + GRID_GAP }
}

// ---------------------------------------------------------------------------
// Tween helper - animates newly placed shapes with a fade-in + slide-down
// ---------------------------------------------------------------------------

type TweenTask = {
  api: ExcalidrawAPI
  elementId: string
  fromProps: Partial<{ x: number; y: number; opacity: number }>
  toProps: Partial<{ x: number; y: number; opacity: number }>
  durationMs: number
}

const tweenQueue: TweenTask[] = []
let tweenRunning = false

async function runTween(task: TweenTask): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now()
    const duration = Math.min(task.durationMs, 300)
    const tick = () => {
      const now = performance.now()
      const t = Math.min((now - start) / duration, 1)
      // ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - t, 3)
      const elements = task.api.getSceneElements() as Array<Record<string, unknown>>
      const updated = elements.map((el) => {
        if ((el as { id?: string }).id !== task.elementId) return el
        const next = { ...el }
        for (const key of Object.keys(task.toProps) as Array<keyof typeof task.toProps>) {
          const from = task.fromProps[key] ?? 0
          const to = task.toProps[key] ?? from
          ;(next as Record<string, number>)[key as string] = from + (to - from) * eased
        }
        return next
      })
      task.api.updateScene({ elements: updated })
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

async function processTweenQueue(): Promise<void> {
  if (tweenRunning) return
  tweenRunning = true
  while (tweenQueue.length > 0) {
    const task = tweenQueue.shift()!
    await runTween(task)
  }
  tweenRunning = false
}

export function tweenElement(
  api: ExcalidrawAPI,
  elementId: string,
  fromProps: Partial<{ x: number; y: number; opacity: number }>,
  toProps: Partial<{ x: number; y: number; opacity: number }>,
  durationMs = 250
): void {
  // Skip animation in non-browser environments (tests, SSR)
  if (typeof requestAnimationFrame === 'undefined') return
  tweenQueue.push({ api, elementId, fromProps, toProps, durationMs })
  void processTweenQueue()
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

async function applyAction(
  action: CanvasAction,
  api: ExcalidrawAPI,
  libraryItems: LibraryItem[],
  delay: number
): Promise<void> {
  await new Promise((r) => setTimeout(r, delay))
  const elements = api.getSceneElements() as unknown[]

  switch (action.action) {
    case 'create_from_library': {
      const item = libraryItems.find(
        (li) => li.name?.toLowerCase() === action.library_item?.toLowerCase()
      )
      if (item) {
        const itemEls = item.elements as Array<{ x?: number; y?: number; width?: number; height?: number }>
        const libW = Math.max(...itemEls.map((e) => (e.x ?? 0) + (e.width ?? 140)), 140)
        const libH = Math.max(...itemEls.map((e) => (e.y ?? 0) + (e.height ?? 70)), 70)
        const occupied = getOccupied(api.getSceneElements() as readonly unknown[])
        const slot = findFreeSlot(occupied, libW, libH, undefined, undefined)
        const offsetX = slot.x
        const offsetY = slot.y
        const cloned = (item.elements as Array<{ id?: string; x?: number; y?: number; text?: string }>).map((el, i) => ({
          ...el,
          id: uniqueId() + i,
          x: (el.x ?? 0) + offsetX,
          y: (el.y ?? 0) + offsetY,
          ...(action.label_override && i === 0 ? { text: action.label_override, label: { text: action.label_override } } : {}),
          ...baseFields(),
        }))
        api.updateScene({ elements: [...elements, ...cloned] })
        // Tween the first (container) element
        const firstId = (cloned[0] as { id: string }).id
        const targetY = (cloned[0] as { y?: number }).y ?? 0
        tweenElement(api, firstId, { opacity: 0, y: targetY - 40 }, { opacity: 100, y: targetY }, 250)
      } else {
        // Fallback: labeled rectangle (shape + bound text element)
        const shapeId = uniqueId()
        const width = 140
        const height = 70
        const occupied = getOccupied(api.getSceneElements() as readonly unknown[])
        const slot = findFreeSlot(occupied, width, height, undefined, undefined)
        const x = slot.x
        const y = slot.y
        const labelText = action.label_override ?? action.library_item ?? ''
        const textEl = makeBoundLabel(shapeId, labelText, x, y, width, height)
        const textId = (textEl as { id: string }).id
        api.updateScene({
          elements: [
            ...elements,
            {
              id: shapeId,
              type: 'rectangle',
              x,
              y,
              width,
              height,
              strokeColor: '#4a7c59',
              backgroundColor: '#c8e8d0',
              fillStyle: 'solid',
              strokeWidth: 2,
              roughness: 0,
              opacity: 100,
              ...baseFields(),
              boundElements: [{ id: textId, type: 'text' }],
            },
            textEl,
          ],
        })
        tweenElement(api, shapeId, { opacity: 0, y: y - 40 }, { opacity: 100, y }, 250)
      }
      break
    }
    case 'create': {
      if (!action.elements) break
      const newEls: unknown[] = []
      const tweenTargets: Array<{ id: string; targetY: number }> = []
      const occupied = getOccupied(api.getSceneElements() as readonly unknown[])

      for (const el of action.elements) {
        const label = el.label?.text
        const isShape = el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond'
        const columns = el.columns && el.columns.length > 0 ? el.columns : null
        const shapeId = uniqueId()

        if (label && isShape && columns) {
          // Multi-line table body: entity name + separator + columns
          const bodyText = `${label}\n──\n${columns.join('\n')}`

          // Compute width to fit the longest line
          const longestLen = Math.max(label.length, ...columns.map((c) => c.length))
          const width = Math.min(Math.max(longestLen * 8 + 24, 140), 280)

          // Compute height: 32 header + 22 per column row + 16 padding
          const height = 32 + columns.length * 22 + 16

          const slot = findFreeSlot(occupied, width, height, undefined, undefined)
          const x = slot.x
          const y = slot.y
          occupied.push({ x, y, w: width, h: height })

          const textEl = makeTableBoundLabel(shapeId, bodyText, x, y, width, height)
          const textId = (textEl as { id: string }).id

          newEls.push({
            ...el,
            id: shapeId,
            x,
            y,
            width,
            height,
            strokeColor: '#4a7c59',
            backgroundColor: '#c8e8d0',
            fillStyle: 'solid' as const,
            strokeWidth: 2,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            ...baseFields(),
            boundElements: [{ id: textId, type: 'text' }],
            // strip columns from the Excalidraw element - it's not a native field
            columns: undefined,
          })
          newEls.push(textEl)
          tweenTargets.push({ id: shapeId, targetY: y })
        } else if (label && isShape) {
          // Single-label shape (existing behavior)
          const width = el.width ?? 140
          const height = el.height ?? 60
          const slot = findFreeSlot(occupied, width, height, undefined, undefined)
          const x = slot.x
          const y = slot.y
          occupied.push({ x, y, w: width, h: height })
          const textEl = makeBoundLabel(shapeId, label, x, y, width, height)
          const textId = (textEl as { id: string }).id
          newEls.push({
            ...el,
            id: shapeId,
            x,
            y,
            width,
            height,
            strokeColor: '#4a7c59',
            backgroundColor: '#c8e8d0',
            fillStyle: 'solid' as const,
            strokeWidth: 2,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            ...baseFields(),
            boundElements: [{ id: textId, type: 'text' }],
          })
          newEls.push(textEl)
          tweenTargets.push({ id: shapeId, targetY: y })
        } else {
          const width = el.width ?? (isShape ? 140 : 80)
          const height = el.height ?? (isShape ? 60 : 40)
          const slot = findFreeSlot(occupied, width, height, undefined, undefined)
          const x = slot.x
          const y = slot.y
          occupied.push({ x, y, w: width, h: height })
          newEls.push({
            ...el,
            id: shapeId,
            x,
            y,
            width,
            height,
            strokeColor: '#4a7c59',
            backgroundColor: isShape ? '#c8e8d0' : 'transparent',
            fillStyle: 'solid' as const,
            strokeWidth: 2,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            ...baseFields(),
          })
          tweenTargets.push({ id: shapeId, targetY: y })
        }
      }

      api.updateScene({ elements: [...elements, ...newEls] })

      // Tween each new shape (not bound text - it follows containerId automatically)
      for (const { id, targetY } of tweenTargets) {
        tweenElement(api, id, { opacity: 0, y: targetY - 40 }, { opacity: 100, y: targetY }, 250)
      }
      break
    }
    case 'connect': {
      const from = findElementByLabel(elements, action.fromLabel ?? '') as
        | (SceneElement & { id?: string; boundElements?: Array<{ id: string; type: string }> | null })
        | undefined
      const to = findElementByLabel(elements, action.toLabel ?? '') as
        | (SceneElement & { id?: string; boundElements?: Array<{ id: string; type: string }> | null })
        | undefined
      if (!from || !to) break
      const fromRight = (from.x ?? 0) + (from.width ?? 0)
      const fromMidY = (from.y ?? 0) + (from.height ?? 0) / 2
      const toLeft = to.x ?? 0
      const toMidY = (to.y ?? 0) + (to.height ?? 0) / 2
      const arrowId = uniqueId()
      const newScene: unknown[] = [...elements]

      // Build arrow with explicit start/end bindings to the entities - the
      // scene parser uses these to reliably resolve "from"/"to" later.
      const arrow: Record<string, unknown> = {
        id: arrowId,
        type: 'arrow',
        x: fromRight,
        y: fromMidY,
        width: Math.abs(toLeft - fromRight),
        height: toMidY - fromMidY,
        points: [[0, 0], [toLeft - fromRight, toMidY - fromMidY]],
        strokeColor: '#4a4e4a',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        ...baseFields(),
        roundness: { type: 2 },
        startBinding: from.id ? { elementId: from.id, focus: 0, gap: 4 } : null,
        endBinding: to.id ? { elementId: to.id, focus: 0, gap: 4 } : null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
        boundElements: null as Array<{ id: string; type: string }> | null,
      }

      if (action.label) {
        // Arrow labels are also bound text elements (containerId = arrow id).
        const labelEl = makeBoundLabel(
          arrowId,
          action.label,
          fromRight + (toLeft - fromRight) / 2 - 30,
          fromMidY + (toMidY - fromMidY) / 2 - 10,
          60,
          20
        )
        const labelId = (labelEl as { id: string }).id
        arrow.boundElements = [{ id: labelId, type: 'text' }]
        newScene.push(arrow, labelEl)
      } else {
        newScene.push(arrow)
      }

      // Also link the arrow back into each entity's boundElements so the
      // bindings round-trip through Excalidraw's resize/move handlers.
      const updated = newScene.map((el) => {
        const e = el as { id?: string; boundElements?: Array<{ id: string; type: string }> | null }
        if (e.id === from.id || e.id === to.id) {
          return {
            ...e,
            boundElements: [
              ...(e.boundElements ?? []),
              { id: arrowId, type: 'arrow' as const },
            ],
          }
        }
        return el
      })
      api.updateScene({ elements: updated })
      break
    }
    case 'annotate': {
      api.updateScene({
        elements: [
          ...elements,
          {
            id: uniqueId(),
            type: 'text',
            x: action.x ?? 50,
            y: action.y ?? 50,
            width: 200,
            height: 40,
            text: `⚠ ${action.text ?? ''}`,
            fontSize: 13,
            fontFamily: 6, // 6 = Nunito (Excalidraw built-in, matches our app font)
            strokeColor: '#92400e',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            roughness: 0,
            opacity: 100,
            ...baseFields(),
          },
        ],
      })
      break
    }
    case 'remove': {
      const updated = (elements as SceneElement[]).map((el) =>
        el.text === action.targetLabel || el.label?.text === action.targetLabel
          ? { ...el, isDeleted: true }
          : el
      )
      api.updateScene({ elements: updated })
      break
    }
    case 'rename': {
      const updated = (elements as SceneElement[]).map((el) =>
        el.text === action.fromLabel || el.label?.text === action.fromLabel
          ? { ...el, text: action.toLabel_rename ?? '', label: { text: action.toLabel_rename ?? '' } }
          : el
      )
      api.updateScene({ elements: updated })
      break
    }
  }
}

// ---------------------------------------------------------------------------
// Relayout — run AFTER all creates, BEFORE tweens
// ---------------------------------------------------------------------------

/**
 * Re-positions every shape element in the scene using canvas-layout.ts.
 *
 * Steps:
 *  1. summarizeScene to get entities (labels) + connections + foreignKeys
 *  2. Build LayoutBox[] from RAW element positions (not summarizeScene's center-coords)
 *  3. Build LayoutEdge[] via label→id map; skip unresolved endpoints
 *  4. computeLayout
 *  5. Apply new positions; move bound-text children (containerId===shape) by same dx/dy
 *  6. Recompute arrow geometry for arrows whose both endpoints moved
 *  7. Move arrow-bound label text by arrow delta
 *  8. api.updateScene with all mutated elements
 *
 * Returns a Map of shapeId→newY (for tween targets).
 */
async function relayoutScene(
  api: ExcalidrawAPI,
  discipline: string | undefined
): Promise<Map<string, number>> {
  type AnyEl = Record<string, unknown>

  const rawElements = api.getSceneElements() as AnyEl[]

  // Gather visible shape elements (rectangle / ellipse / diamond, not deleted)
  const shapeEls = rawElements.filter(
    (el) =>
      !el.isDeleted &&
      (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond')
  )

  if (shapeEls.length === 0) return new Map()

  // summarizeScene to get entity labels
  const scene = summarizeScene(rawElements as unknown[])

  // Build label→elementId map from the scene entities
  const labelToId = new Map<string, string>()
  for (const entity of scene.entities) {
    labelToId.set(entity.label, entity.id)
  }

  // Build LayoutBox[] from RAW shape element positions
  const boxes: LayoutBox[] = shapeEls
    .map((el) => ({
      id: el.id as string,
      label: (() => {
        // Find matching entity label from summarizeScene for this element id
        const entity = scene.entities.find((e) => e.id === (el.id as string))
        return entity?.label
      })(),
      x: (el.x as number) ?? 0,
      y: (el.y as number) ?? 0,
      width: (el.width as number) ?? 140,
      height: (el.height as number) ?? 60,
    }))
    .filter((b) => typeof b.x === 'number' && typeof b.y === 'number')

  // Build LayoutEdge[] from connections
  const edges: LayoutEdge[] = []

  for (const conn of scene.connections) {
    const fromId = labelToId.get(conn.from)
    const toId = labelToId.get(conn.to)
    if (fromId && toId) {
      edges.push({ fromId, toId })
    }
  }

  // Also add edges from foreignKeys
  for (const fk of scene.foreignKeys) {
    const fromId = labelToId.get(fk.from)
    const toId = labelToId.get(fk.toTable)
    if (fromId && toId && fromId !== toId) {
      edges.push({ fromId, toId })
    }
  }

  const layoutResult = computeLayout({ boxes, edges, discipline })
  const { positions } = layoutResult

  if (positions.size === 0) return new Map()

  // Build old position map for delta computation
  const oldPositions = new Map<string, { x: number; y: number }>()
  for (const el of shapeEls) {
    oldPositions.set(el.id as string, { x: (el.x as number) ?? 0, y: (el.y as number) ?? 0 })
  }

  // Compute deltas
  const deltas = new Map<string, { dx: number; dy: number }>()
  for (const [id, newPos] of positions.entries()) {
    const old = oldPositions.get(id)
    if (old) {
      deltas.set(id, { dx: newPos.x - old.x, dy: newPos.y - old.y })
    }
  }

  // Mutate elements
  const mutated = rawElements.map((el): AnyEl => {
    const id = el.id as string

    // Shape element — apply new position
    if (positions.has(id)) {
      const newPos = positions.get(id)!
      return {
        ...el,
        x: newPos.x,
        y: newPos.y,
        version: ((el.version as number) ?? 1) + 1,
        versionNonce: Math.floor(Math.random() * 1e9),
      }
    }

    // Bound text — containerId points to a moved shape → apply same delta
    if (el.type === 'text' && el.containerId) {
      const delta = deltas.get(el.containerId as string)
      if (delta) {
        return {
          ...el,
          x: ((el.x as number) ?? 0) + delta.dx,
          y: ((el.y as number) ?? 0) + delta.dy,
          version: ((el.version as number) ?? 1) + 1,
          versionNonce: Math.floor(Math.random() * 1e9),
        }
      }
    }

    return el
  })

  // Recompute arrow geometry for arrows whose both endpoints moved
  // Also move arrow-bound label text by arrow delta
  const arrowDeltas = new Map<string, { dx: number; dy: number }>()

  const reMutated = mutated.map((el): AnyEl => {
    if (el.isDeleted) return el
    if (el.type !== 'arrow' && el.type !== 'line') return el

    const startBinding = el.startBinding as { elementId?: string } | null | undefined
    const endBinding = el.endBinding as { elementId?: string } | null | undefined
    const fromId = startBinding?.elementId
    const toId = endBinding?.elementId

    if (!fromId || !toId) return el

    // Find the (already mutated) from/to shapes
    const fromEl = mutated.find((e) => e.id === fromId)
    const toEl = mutated.find((e) => e.id === toId)

    // Only recompute if BOTH endpoints moved (i.e. have deltas)
    if (!fromEl || !toEl) return el
    if (!deltas.has(fromId) && !deltas.has(toId)) return el

    const fromRight = ((fromEl.x as number) ?? 0) + ((fromEl.width as number) ?? 0)
    const fromMidY = ((fromEl.y as number) ?? 0) + ((fromEl.height as number) ?? 0) / 2
    const toLeft = (toEl.x as number) ?? 0
    const toMidY = ((toEl.y as number) ?? 0) + ((toEl.height as number) ?? 0) / 2

    const oldArrowX = (el.x as number) ?? 0
    const oldArrowY = (el.y as number) ?? 0
    const newArrowX = fromRight
    const newArrowY = fromMidY

    arrowDeltas.set(el.id as string, {
      dx: newArrowX - oldArrowX,
      dy: newArrowY - oldArrowY,
    })

    return {
      ...el,
      x: newArrowX,
      y: newArrowY,
      width: Math.abs(toLeft - fromRight),
      height: toMidY - fromMidY,
      points: [[0, 0], [toLeft - fromRight, toMidY - fromMidY]],
      version: ((el.version as number) ?? 1) + 1,
      versionNonce: Math.floor(Math.random() * 1e9),
    }
  })

  // Move arrow-bound label text by arrow delta
  const finalElements = reMutated.map((el): AnyEl => {
    if (el.type !== 'text' || !el.containerId) return el
    const arrowDelta = arrowDeltas.get(el.containerId as string)
    if (!arrowDelta) return el
    return {
      ...el,
      x: ((el.x as number) ?? 0) + arrowDelta.dx,
      y: ((el.y as number) ?? 0) + arrowDelta.dy,
      version: ((el.version as number) ?? 1) + 1,
      versionNonce: Math.floor(Math.random() * 1e9),
    }
  })

  api.updateScene({ elements: finalElements })

  // Return new Y positions for tween targets
  const newYMap = new Map<string, number>()
  for (const [id, pos] of positions.entries()) {
    newYMap.set(id, pos.y)
  }
  return newYMap
}

// ---------------------------------------------------------------------------
// Action executor — with discipline-aware relayout
// ---------------------------------------------------------------------------

export async function executeActions(
  actions: CanvasAction[],
  api: ExcalidrawAPI,
  libraryItems: LibraryItem[],
  discipline?: string
): Promise<void> {
  const stagger = actions.length >= 5 ? Math.min(2000 / actions.length, 200) : 0

  // Track which element ids were NEW shapes created in this batch (for tween)
  const createdShapeIds: string[] = []

  // Instrument create/create_from_library actions to track new shape ids
  // by snapshot before and after each create action
  const createActions = actions.filter(
    (a) => a.action === 'create' || a.action === 'create_from_library'
  )
  const hasCreates = createActions.length > 0

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]

    if (action.action === 'create' || action.action === 'create_from_library') {
      // Snapshot before
      const before = new Set(
        (api.getSceneElements() as Array<{ id: string }>).map((e) => e.id)
      )
      await applyAction(action, api, libraryItems, i === 0 ? 0 : stagger)
      // Collect new shape ids (not text bound children)
      const after = api.getSceneElements() as Array<{ id: string; type: string; containerId?: string | null }>
      for (const el of after) {
        if (!before.has(el.id) && !el.containerId) {
          createdShapeIds.push(el.id)
        }
      }
    } else {
      await applyAction(action, api, libraryItems, i === 0 ? 0 : stagger)
    }
  }

  // Run relayout after all creates but before tweens
  if (hasCreates && createdShapeIds.length > 0) {
    const newYMap = await relayoutScene(api, discipline)

    // Tween newly created shapes from (finalY - 40, opacity 0) to (finalY, opacity 100)
    for (const id of createdShapeIds) {
      const finalY = newYMap.get(id)
      if (finalY !== undefined) {
        tweenElement(api, id, { opacity: 0, y: finalY - 40 }, { opacity: 100, y: finalY }, 250)
      }
    }
  }
}
