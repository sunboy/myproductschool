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
