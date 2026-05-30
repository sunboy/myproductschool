// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any

import type { CanvasAction } from '@/lib/types'
import { summarizeScene } from '@/lib/hatch/canvas-scene'
import { computeLayout, chooseAnchors, routeOrthogonal, pointsBounds } from '@/lib/hatch/canvas-layout'
import type { LayoutBox, LayoutEdge, AnchorRect } from '@/lib/hatch/canvas-layout'

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

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Coerce an element's geometry to finite numbers so a malformed (NaN/Infinity)
 * coordinate never reaches Excalidraw, where it throws during render and trips
 * the React error boundary. Defensive only - well-formed elements pass through
 * with identical values.
 */
function sanitizeElementGeometry<T extends Record<string, unknown>>(el: T): T {
  const next: Record<string, unknown> = { ...el }
  next.x = finiteOr(el.x, 0)
  next.y = finiteOr(el.y, 0)
  if ('width' in el) next.width = Math.max(0, finiteOr(el.width, 0))
  if ('height' in el) next.height = finiteOr(el.height, 0)
  if (Array.isArray(el.points)) {
    next.points = (el.points as unknown[]).map((p) => {
      if (Array.isArray(p)) return [finiteOr(p[0], 0), finiteOr(p[1], 0)]
      return [0, 0]
    })
  }
  return next as T
}

/**
 * The single choke point for writing to the canvas. Excalidraw throws
 * synchronously during its NEXT render if any element carries a non-finite
 * x/y/width/height or a points array with NaN/Infinity, and that throw lands in
 * the React error boundary ("something went wrong") - outside any try/catch we
 * hold here, because React renders on its own tick. Sanitizing at every write
 * (creates, connects, annotations, tween frames, relayout) guarantees no
 * malformed geometry ever reaches the renderer. Every updateScene call in this
 * module MUST go through here.
 */
function safeUpdateScene(api: ExcalidrawAPI, elements: unknown[]): void {
  const safe = (Array.isArray(elements) ? elements : []).map((el) =>
    el && typeof el === 'object'
      ? sanitizeElementGeometry(el as Record<string, unknown>)
      : el
  )
  api.updateScene({ elements: safe })
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
      // A throw inside requestAnimationFrame escapes the surrounding try/catch
      // in executeActions and would surface to the React error boundary. Guard
      // the whole tick and always resolve so the queue keeps draining.
      try {
        const now = performance.now()
        const t = Math.min((now - start) / duration, 1)
        // ease-out cubic for natural deceleration
        const eased = 1 - Math.pow(1 - t, 3)
        const raw = task.api.getSceneElements() as Array<Record<string, unknown>>
        const elements = Array.isArray(raw) ? raw : []
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
        safeUpdateScene(task.api, updated)
        if (t < 1) requestAnimationFrame(tick)
        else resolve()
      } catch {
        resolve()
      }
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
        safeUpdateScene(api, [...elements, ...cloned])
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
        safeUpdateScene(api, [
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
        ])
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

      safeUpdateScene(api, [...elements, ...newEls])

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

      // Choose facing anchor sides based on relative position, then route an
      // orthogonal elbow through the gutter. Straight diagonal lines (the old
      // behavior) sliced through neighbouring boxes whenever the target was
      // left of / above / below the source.
      const fromRect: AnchorRect = {
        x: from.x ?? 0,
        y: from.y ?? 0,
        width: from.width ?? 0,
        height: from.height ?? 0,
      }
      const toRect: AnchorRect = {
        x: to.x ?? 0,
        y: to.y ?? 0,
        width: to.width ?? 0,
        height: to.height ?? 0,
      }
      const { start, end } = chooseAnchors(fromRect, toRect)
      const points = routeOrthogonal(start, end)
      const bounds = pointsBounds(start.x, start.y, points)
      const arrowId = uniqueId()
      const newScene: unknown[] = [...elements]

      // Build a PURELY GEOMETRIC arrow. We deliberately do NOT set
      // startBinding/endBinding: a bound non-elbow arrow has only its first and
      // last points re-projected toward the bound element's centre via focus/gap,
      // while our intermediate elbow vertices are left untouched - which drags the
      // visible line through the box interior, across the table text. With null
      // bindings Excalidraw renders our exact edge-anchored elbow and never moves
      // an endpoint. The from/to linkage the bindings used to carry for scene
      // readback + relayout now travels in customData (preserved across updates).
      const arrow: Record<string, unknown> = {
        id: arrowId,
        type: 'arrow',
        x: start.x,
        y: start.y,
        width: bounds.width,
        height: bounds.height,
        points,
        strokeColor: '#4a4e4a',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        ...baseFields(),
        roundness: { type: 2 },
        startBinding: null,
        endBinding: null,
        customData: { hatchFrom: from.id ?? null, hatchTo: to.id ?? null },
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
        boundElements: null as Array<{ id: string; type: string }> | null,
      }

      if (action.label) {
        // Arrow labels are also bound text elements (containerId = arrow id).
        // Place the label at the connector midpoint.
        const midX = start.x + (end.x - start.x) / 2
        const midY = start.y + (end.y - start.y) / 2
        const labelEl = makeBoundLabel(
          arrowId,
          action.label,
          midX - 30,
          midY - 10,
          60,
          20
        )
        const labelId = (labelEl as { id: string }).id
        arrow.boundElements = [{ id: labelId, type: 'text' }]
        newScene.push(arrow, labelEl)
      } else {
        newScene.push(arrow)
      }

      // No box back-link: the arrow is unbound, so injecting it into each box's
      // boundElements would make Excalidraw treat the boxes as bound and
      // re-synthesize phantom bindings on the next interaction. Connection
      // linkage lives in arrow.customData instead (see scene readback).
      safeUpdateScene(api, newScene)
      break
    }
    case 'annotate': {
      safeUpdateScene(api, [
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
      ])
      break
    }
    case 'remove': {
      const updated = (elements as SceneElement[]).map((el) =>
        el.text === action.targetLabel || el.label?.text === action.targetLabel
          ? { ...el, isDeleted: true }
          : el
      )
      safeUpdateScene(api, updated)
      break
    }
    case 'rename': {
      const updated = (elements as SceneElement[]).map((el) =>
        el.text === action.fromLabel || el.label?.text === action.fromLabel
          ? { ...el, text: action.toLabel_rename ?? '', label: { text: action.toLabel_rename ?? '' } }
          : el
      )
      safeUpdateScene(api, updated)
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

  // Recompute arrow geometry for arrows whose endpoints moved, then re-center
  // any bound label on the new connector midpoint.
  const arrowMidpoints = new Map<string, { x: number; y: number }>()

  const reMutated = mutated.map((el): AnyEl => {
    if (el.isDeleted) return el
    if (el.type !== 'arrow' && el.type !== 'line') return el

    // Resolve endpoints from customData (our unbound arrows) first, falling
    // back to legacy startBinding/endBinding for any older bound arrows.
    const custom = el.customData as { hatchFrom?: string | null; hatchTo?: string | null } | null | undefined
    const startBinding = el.startBinding as { elementId?: string } | null | undefined
    const endBinding = el.endBinding as { elementId?: string } | null | undefined
    const fromId = custom?.hatchFrom ?? startBinding?.elementId
    const toId = custom?.hatchTo ?? endBinding?.elementId

    if (!fromId || !toId) return el

    // Find the (already mutated) from/to shapes
    const fromEl = mutated.find((e) => e.id === fromId)
    const toEl = mutated.find((e) => e.id === toId)

    // Recompute if either endpoint moved.
    if (!fromEl || !toEl) return el
    if (!deltas.has(fromId) && !deltas.has(toId)) return el

    // Re-derive facing anchors + orthogonal route from the new box positions.
    // Must mirror the create-time routing or relayout would flatten elbows
    // back into diagonal straight lines.
    const fromRect: AnchorRect = {
      x: (fromEl.x as number) ?? 0,
      y: (fromEl.y as number) ?? 0,
      width: (fromEl.width as number) ?? 0,
      height: (fromEl.height as number) ?? 0,
    }
    const toRect: AnchorRect = {
      x: (toEl.x as number) ?? 0,
      y: (toEl.y as number) ?? 0,
      width: (toEl.width as number) ?? 0,
      height: (toEl.height as number) ?? 0,
    }
    const { start, end } = chooseAnchors(fromRect, toRect)
    const points = routeOrthogonal(start, end)
    const bounds = pointsBounds(start.x, start.y, points)

    // Record the connector midpoint so any bound label can be re-centered on
    // the new route rather than dragged by a start-point delta (which would
    // drift off an elbow connector).
    arrowMidpoints.set(el.id as string, {
      x: start.x + (end.x - start.x) / 2,
      y: start.y + (end.y - start.y) / 2,
    })

    return {
      ...el,
      x: start.x,
      y: start.y,
      width: bounds.width,
      height: bounds.height,
      points,
      version: ((el.version as number) ?? 1) + 1,
      versionNonce: Math.floor(Math.random() * 1e9),
    }
  })

  // Re-center arrow-bound label text on the new connector midpoint
  const finalElements = reMutated.map((el): AnyEl => {
    if (el.type !== 'text' || !el.containerId) return el
    const mid = arrowMidpoints.get(el.containerId as string)
    if (!mid) return el
    const w = (el.width as number) ?? 60
    const h = (el.height as number) ?? 20
    return {
      ...el,
      x: mid.x - w / 2,
      y: mid.y - h / 2,
      version: ((el.version as number) ?? 1) + 1,
      versionNonce: Math.floor(Math.random() * 1e9),
    }
  })

  // safeUpdateScene sanitizes every element (final safety net against the
  // non-finite geometry that trips Excalidraw's render-time validation).
  safeUpdateScene(api, finalElements)

  // Return new Y positions for tween targets
  const newYMap = new Map<string, number>()
  for (const [id, pos] of positions.entries()) {
    newYMap.set(id, Number.isFinite(pos.y) ? pos.y : 0)
  }
  return newYMap
}

// ---------------------------------------------------------------------------
// Action executor — with discipline-aware relayout
// ---------------------------------------------------------------------------

/**
 * Result of a draw batch. Callers use this to surface a graceful Hatch message
 * when a diagram could not be fully applied instead of letting a throw bubble
 * up to the React error boundary ("something went wrong").
 */
export interface ExecuteActionsResult {
  ok: boolean
  applied: number
  skipped: number
  failed: number
}

/**
 * Validate a single action before applying it. Pure and defensive: a truncated
 * or malformed model response (e.g. when interpret hits max_tokens) can leave
 * actions with missing/typeless elements or unresolvable labels. We drop those
 * here so the rest of the batch still draws ("draw what's valid").
 *
 * Returns a possibly-narrowed action to apply, or null to skip it entirely.
 */
export function validateAction(action: unknown): CanvasAction | null {
  if (!action || typeof action !== 'object') return null
  const a = action as Record<string, unknown>
  const kind = a.action

  switch (kind) {
    case 'create': {
      const els = Array.isArray(a.elements) ? a.elements : []
      const validEls = els.filter(
        (e) => e && typeof e === 'object' && typeof (e as Record<string, unknown>).type === 'string'
      )
      if (validEls.length === 0) return null
      return { ...(a as object), elements: validEls } as unknown as CanvasAction
    }
    case 'create_from_library': {
      if (typeof a.library_item !== 'string' || !a.library_item.trim()) return null
      return a as unknown as CanvasAction
    }
    case 'connect': {
      if (typeof a.fromLabel !== 'string' || typeof a.toLabel !== 'string') return null
      if (!a.fromLabel.trim() || !a.toLabel.trim()) return null
      return a as unknown as CanvasAction
    }
    case 'annotate': {
      if (typeof a.text !== 'string' || !a.text.trim()) return null
      return a as unknown as CanvasAction
    }
    case 'remove': {
      if (typeof a.targetLabel !== 'string' || !a.targetLabel.trim()) return null
      return a as unknown as CanvasAction
    }
    case 'rename': {
      if (typeof a.fromLabel !== 'string' || !a.fromLabel.trim()) return null
      if (typeof a.toLabel_rename !== 'string' || !a.toLabel_rename.trim()) return null
      return a as unknown as CanvasAction
    }
    default:
      return null
  }
}

export async function executeActions(
  actions: CanvasAction[],
  api: ExcalidrawAPI,
  libraryItems: LibraryItem[],
  discipline?: string
): Promise<ExecuteActionsResult> {
  const result: ExecuteActionsResult = { ok: true, applied: 0, skipped: 0, failed: 0 }

  // Defensive: callers cast loosely-typed model output to CanvasAction[].
  const rawActions = Array.isArray(actions) ? actions : []
  const validActions: CanvasAction[] = []
  for (const raw of rawActions) {
    const v = validateAction(raw)
    if (v) validActions.push(v)
    else result.skipped++
  }
  if (validActions.length === 0) {
    result.ok = result.failed === 0 && result.skipped === 0
    return result
  }

  const stagger = validActions.length >= 5 ? Math.min(2000 / validActions.length, 200) : 0

  // Track which element ids were NEW shapes created in this batch (for tween)
  const createdShapeIds: string[] = []

  const hasCreates = validActions.some(
    (a) => a.action === 'create' || a.action === 'create_from_library'
  )

  for (let i = 0; i < validActions.length; i++) {
    const action = validActions[i]

    // One bad action must not abort the batch or crash the app.
    try {
      if (action.action === 'create' || action.action === 'create_from_library') {
        // Snapshot before
        const beforeRaw = api.getSceneElements() as Array<{ id: string }>
        const before = new Set((Array.isArray(beforeRaw) ? beforeRaw : []).map((e) => e.id))
        await applyAction(action, api, libraryItems, i === 0 ? 0 : stagger)
        // Collect new shape ids (not text bound children)
        const afterRaw = api.getSceneElements() as Array<{ id: string; type: string; containerId?: string | null }>
        for (const el of Array.isArray(afterRaw) ? afterRaw : []) {
          if (!before.has(el.id) && !el.containerId) {
            createdShapeIds.push(el.id)
          }
        }
      } else {
        await applyAction(action, api, libraryItems, i === 0 ? 0 : stagger)
      }
      result.applied++
    } catch (err) {
      result.failed++
      result.ok = false
      console.error('canvas action failed, skipping:', action.action, err)
    }
  }

  // Run relayout after all creates but before tweens. A relayout throw must not
  // crash the app - the shapes are already on the canvas, just unarranged.
  if (hasCreates && createdShapeIds.length > 0) {
    try {
      const newYMap = await relayoutScene(api, discipline)

      // Tween newly created shapes from (finalY - 40, opacity 0) to (finalY, opacity 100)
      for (const id of createdShapeIds) {
        const finalY = newYMap.get(id)
        if (finalY !== undefined) {
          tweenElement(api, id, { opacity: 0, y: finalY - 40 }, { opacity: 100, y: finalY }, 250)
        }
      }
    } catch (err) {
      result.ok = false
      console.error('canvas relayout failed (shapes left as drawn):', err)
    }
  }

  return result
}
