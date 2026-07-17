/**
 * Starter templates for canvas challenges. These are the "skeleton" a user can
 * drop instead of staring at a blank Excalidraw. They are expressed as the SAME
 * CanvasAction list Hatch emits, so they flow through the validated layout +
 * executor path (no hand-built Excalidraw element JSON, no second code path).
 *
 * Deliberately minimal: a skeleton is a starting point to react to, not a
 * solution. The user should immediately want to change it.
 */

import type { CanvasAction } from '@/lib/types'
import type { CanvasChallengeType } from '@/lib/hatch/canvasGuidance'

const SYSTEM_DESIGN_SKELETON: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { type: 'rectangle', x: 0, y: 0, width: 160, height: 64, label: { text: 'Client' } },
      { type: 'rectangle', x: 0, y: 0, width: 160, height: 64, label: { text: 'API Gateway' } },
      { type: 'rectangle', x: 0, y: 0, width: 160, height: 64, label: { text: 'Service' } },
      { type: 'rectangle', x: 0, y: 0, width: 160, height: 64, label: { text: 'Datastore' } },
    ],
  },
  { action: 'connect', fromLabel: 'Client', toLabel: 'API Gateway', label: 'request' },
  { action: 'connect', fromLabel: 'API Gateway', toLabel: 'Service', label: 'route' },
  { action: 'connect', fromLabel: 'Service', toLabel: 'Datastore', label: 'read/write' },
]

const DATA_MODELING_SKELETON: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 110,
        label: { text: 'users' },
        columns: ['id PK', 'email UNIQUE', 'created_at'],
      },
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 130,
        label: { text: 'orders' },
        columns: ['id PK', 'user_id FK', 'total', 'created_at'],
      },
    ],
  },
  { action: 'connect', fromLabel: 'users', toLabel: 'orders', label: '1 : many' },
]

/** The starter-template action list for a canvas challenge type. */
export function canvasStarterTemplate(challengeType: CanvasChallengeType): CanvasAction[] {
  return challengeType === 'data_modeling'
    ? DATA_MODELING_SKELETON
    : SYSTEM_DESIGN_SKELETON
}

// ---------------------------------------------------------------------------
// Overlay template chips (canvas-workspace overlay, round 4)
//
// One chip per diagramming style. Each seed is a CanvasAction[] that runs
// through the same validated executor path as the skeletons above: labeled
// shapes via `create` (x/y are ignored; the executor's free-slot placement +
// relayout arrange the scene) and label-addressed `connect` edges.
// ---------------------------------------------------------------------------

export type CanvasTemplateId =
  | 'systemArchitecture'
  | 'dataFlow'
  | 'sequence'
  | 'c4Context'
  | 'blank'

export interface CanvasTemplate {
  id: CanvasTemplateId
  /** Chip label in the overlay template row. */
  label: string
  actions: CanvasAction[]
}

const BOX = { type: 'rectangle', x: 0, y: 0, width: 160, height: 64 } as const

const SD_DATA_FLOW: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { ...BOX, label: { text: 'Producer' } },
      { ...BOX, label: { text: 'Event Stream' } },
      { ...BOX, label: { text: 'Consumer' } },
      { ...BOX, label: { text: 'Store' } },
    ],
  },
  { action: 'connect', fromLabel: 'Producer', toLabel: 'Event Stream', label: 'publish' },
  { action: 'connect', fromLabel: 'Event Stream', toLabel: 'Consumer', label: 'consume' },
  { action: 'connect', fromLabel: 'Consumer', toLabel: 'Store', label: 'write' },
]

const SD_SEQUENCE: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { ...BOX, label: { text: 'Client' } },
      { ...BOX, label: { text: 'Service' } },
      { ...BOX, label: { text: 'Dependency' } },
    ],
  },
  { action: 'connect', fromLabel: 'Client', toLabel: 'Service', label: '1. request' },
  { action: 'connect', fromLabel: 'Service', toLabel: 'Dependency', label: '2. call' },
  { action: 'connect', fromLabel: 'Service', toLabel: 'Client', label: '3. response' },
]

const SD_C4_CONTEXT: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { type: 'ellipse', x: 0, y: 0, width: 140, height: 70, label: { text: 'User' } },
      { ...BOX, width: 180, height: 80, label: { text: 'Your System' } },
      { ...BOX, label: { text: 'External Service' } },
    ],
  },
  { action: 'connect', fromLabel: 'User', toLabel: 'Your System', label: 'uses' },
  { action: 'connect', fromLabel: 'Your System', toLabel: 'External Service', label: 'calls' },
]

const DM_WRITE_PATH: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { ...BOX, label: { text: 'App' } },
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 110,
        label: { text: 'orders' },
        columns: ['id PK', 'user_id FK', 'status'],
      },
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 110,
        label: { text: 'order_events' },
        columns: ['id PK', 'order_id FK', 'event_type'],
      },
    ],
  },
  { action: 'connect', fromLabel: 'App', toLabel: 'orders', label: 'insert' },
  { action: 'connect', fromLabel: 'orders', toLabel: 'order_events', label: 'append' },
]

const DM_QUERY_PATH: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { ...BOX, label: { text: 'API' } },
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 110,
        label: { text: 'orders' },
        columns: ['id PK', 'user_id FK', 'status'],
      },
      {
        type: 'rectangle', x: 0, y: 0, width: 200, height: 110,
        label: { text: 'order_items' },
        columns: ['id PK', 'order_id FK', 'quantity'],
      },
    ],
  },
  { action: 'connect', fromLabel: 'API', toLabel: 'orders', label: '1. select' },
  { action: 'connect', fromLabel: 'orders', toLabel: 'order_items', label: '2. join' },
]

const DM_SCHEMA_CONTEXTS: CanvasAction[] = [
  {
    action: 'create',
    elements: [
      { ...BOX, width: 180, height: 80, label: { text: 'Core schema' } },
      { ...BOX, label: { text: 'Reporting schema' } },
      { ...BOX, label: { text: 'Archive' } },
    ],
  },
  { action: 'connect', fromLabel: 'Core schema', toLabel: 'Reporting schema', label: 'sync' },
  { action: 'connect', fromLabel: 'Core schema', toLabel: 'Archive', label: 'age out' },
]

const SYSTEM_DESIGN_TEMPLATES: CanvasTemplate[] = [
  { id: 'systemArchitecture', label: 'System Architecture', actions: SYSTEM_DESIGN_SKELETON },
  { id: 'dataFlow', label: 'Data Flow', actions: SD_DATA_FLOW },
  { id: 'sequence', label: 'Sequence', actions: SD_SEQUENCE },
  { id: 'c4Context', label: 'C4 Context', actions: SD_C4_CONTEXT },
  { id: 'blank', label: 'Blank', actions: [] },
]

const DATA_MODELING_TEMPLATES: CanvasTemplate[] = [
  { id: 'systemArchitecture', label: 'Entity Map', actions: DATA_MODELING_SKELETON },
  { id: 'dataFlow', label: 'Write Path', actions: DM_WRITE_PATH },
  { id: 'sequence', label: 'Query Path', actions: DM_QUERY_PATH },
  { id: 'c4Context', label: 'Schema Contexts', actions: DM_SCHEMA_CONTEXTS },
  { id: 'blank', label: 'Blank', actions: [] },
]

/** The overlay template-chip seeds for a canvas challenge type. */
export function canvasTemplatesFor(challengeType: CanvasChallengeType): CanvasTemplate[] {
  return challengeType === 'data_modeling' ? DATA_MODELING_TEMPLATES : SYSTEM_DESIGN_TEMPLATES
}
