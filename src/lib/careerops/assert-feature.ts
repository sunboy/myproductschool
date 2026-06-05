// Server-side feature guard used at the top of every /api/career-ops/* route
// (after request parsing, before/with auth). Returns the house 404
// `feature_disabled` envelope when the feature's flag chain is off, or null when
// the route may proceed. Mirrors how the codebase returns apiError envelopes.

import { apiError } from '@/lib/api/error'
import { isCareerOpsFeatureEnabled, type CareerOpsFeature } from './flags'

export function assertCareerOpsFeature(key: CareerOpsFeature) {
  if (!isCareerOpsFeatureEnabled(key)) {
    return apiError(404, 'feature_disabled', 'This feature is not available.')
  }
  return null
}
