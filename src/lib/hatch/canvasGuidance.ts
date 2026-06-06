/**
 * Phase spine for guided canvas challenges (system_design + data_modeling).
 *
 * Single source of truth for "where is the user in the draw → notes → ask →
 * submit loop". The coach card, readiness meter, and Hatch chat opener all read
 * the derived phase so they never contradict each other.
 *
 * Pure module — no React. Keep it that way so the hook and any server-side
 * consumer can import it freely.
 */

import type { CanvasScene } from '@/lib/hatch/canvas-scene'

export type CanvasChallengeType = 'system_design' | 'data_modeling'

export type GuidancePhase =
  | 'empty'
  | 'sketching'
  | 'has_canvas_no_notes'
  | 'notes_no_tradeoffs'
  | 'ready'

/**
 * Discipline-aware nouns so one phase map serves both challenge types.
 * data_modeling speaks in tables/links; system_design in nodes/flows.
 */
export interface GuidanceLabels {
  entity: string
  entityPlural: string
  relation: string
  relationPlural: string
}

export interface GuidanceState {
  phase: GuidancePhase
  entityCount: number
  connectionCount: number
  notesCount: number
  totalFields: number
  hasTradeoffs: boolean
  labels: GuidanceLabels
}

/**
 * Structural field shape — deliberately minimal so this module does not import
 * the (large) FlowWorkspace where the full ContextPackField lives. Any object
 * with an id and a value satisfies it.
 */
export interface GuidanceField {
  id: string
  value: string
}

const DATA_MODELING_LABELS: GuidanceLabels = {
  entity: 'table',
  entityPlural: 'tables',
  relation: 'link',
  relationPlural: 'links',
}

const SYSTEM_DESIGN_LABELS: GuidanceLabels = {
  entity: 'node',
  entityPlural: 'nodes',
  relation: 'flow',
  relationPlural: 'flows',
}

/**
 * Fallback signal for tradeoff reasoning when the dedicated Tradeoffs field is
 * empty but the user has argued a tradeoff inside another field.
 */
const TRADEOFF_LANGUAGE_RE =
  /\b(tradeoff|trade-off|because|instead of|chose|decided|risk|bottleneck|consisten|scal|denormaliz|shard|cap theorem)\b/i

function labelsFor(challengeType: CanvasChallengeType): GuidanceLabels {
  return challengeType === 'data_modeling' ? DATA_MODELING_LABELS : SYSTEM_DESIGN_LABELS
}

function detectTradeoffs(fields: GuidanceField[]): boolean {
  const tradeoffField = fields.find((f) => f.id === 'tradeoffs')
  if (tradeoffField && tradeoffField.value.trim()) return true
  return fields.some((f) => TRADEOFF_LANGUAGE_RE.test(f.value))
}

/**
 * Derive the guidance state from the canvas scene and the context-pack fields.
 *
 * Phase rules:
 * - no canvas AND no notes                         → empty
 * - <2 entities AND 0 connections                  → sketching
 * - meaningful canvas (>=2 entities OR >=1 conn)
 *     but 0 filled notes                           → has_canvas_no_notes
 * - canvas + notes, but no tradeoff signal         → notes_no_tradeoffs
 * - otherwise                                      → ready
 */
export function deriveGuidance(
  challengeType: CanvasChallengeType,
  scene: CanvasScene,
  fields: GuidanceField[]
): GuidanceState {
  const entityCount = scene.entities.length
  const connectionCount = scene.connections.length
  const notesCount = fields.filter((f) => f.value.trim()).length
  const totalFields = fields.length
  const hasTradeoffs = detectTradeoffs(fields)

  const hasCanvas = entityCount > 0 || connectionCount > 0
  const meaningfulCanvas = entityCount >= 2 || connectionCount >= 1

  let phase: GuidancePhase
  if (!hasCanvas && notesCount === 0) {
    phase = 'empty'
  } else if (!meaningfulCanvas) {
    phase = 'sketching'
  } else if (notesCount === 0) {
    phase = 'has_canvas_no_notes'
  } else if (!hasTradeoffs) {
    phase = 'notes_no_tradeoffs'
  } else {
    phase = 'ready'
  }

  return {
    phase,
    entityCount,
    connectionCount,
    notesCount,
    totalFields,
    hasTradeoffs,
    labels: labelsFor(challengeType),
  }
}
