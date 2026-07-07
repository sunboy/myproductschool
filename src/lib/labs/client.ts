// Client-safe lab registry. Import ONLY from client components / shared code —
// never add server-only imports here. The server half lives in labs/server.ts.

import type { LabClientDefinition, LabId } from './types'
import { ANALYTICS_LAB_CLIENT } from './analytics/client'
import { DEBUGGING_LAB_CLIENT } from './debugging/client'

const LAB_CLIENT_REGISTRY: Record<LabId, LabClientDefinition> = {
  analytics: ANALYTICS_LAB_CLIENT,
  debugging: DEBUGGING_LAB_CLIENT,
}

export function getLabClient(labId: LabId | null | undefined): LabClientDefinition {
  // Analytics is the fallback: existing sessions and unknown types keep the
  // original behavior while new labs opt in via labIdForChallengeType.
  return LAB_CLIENT_REGISTRY[labId ?? 'analytics'] ?? LAB_CLIENT_REGISTRY.analytics
}

export { labIdForChallengeType } from './types'
export type { LabClientDefinition, LabId } from './types'
