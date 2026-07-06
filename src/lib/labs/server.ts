// Server half of the lab registry: sandbox env mapping, permission-allowlist
// additions, coach/grader skill names, and access gating. Import ONLY from
// API routes / server code — never from client components.

import type { LabId } from './types'
import { labIdForChallengeType } from './types'

export interface LabServerDefinition {
  id: LabId
  /** challenges.metadata → sandbox env vars (secrets never come from metadata). */
  resolveSandboxEnv(metadata: Record<string, unknown>): Record<string, string>
  /** Extra Claude Code permission-allowlist entries injected at provision time. */
  allowedTools: string[]
  coachSkill: string
  graderSkill: string
  /** app_flags key gating access; undefined = always available (analytics has
   *  its own entitlement module, src/lib/flags/analytics.ts). */
  accessFlag?: string
}

const ANALYTICS_LAB_SERVER: LabServerDefinition = {
  id: 'analytics',
  resolveSandboxEnv(metadata) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (metadata ?? {}) as Record<string, any>
    const ccMeta = (meta.claude_code ?? meta.lab ?? {}) as Record<string, unknown>
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const v = (ccMeta[k] ?? meta[k]) as string | undefined
        if (v) return v
      }
      return undefined
    }
    return {
      BQ_PROJECT: pick('dataset_project', 'BQ_PROJECT') ?? process.env.GCP_PROJECT ?? '',
      BQ_DATASET: pick('dataset_id', 'BQ_DATASET') ?? '',
      BQ_BILLING_PROJECT: pick('dataset_billing_project') ?? process.env.GCP_PROJECT ?? 'hackproduct',
      CLAUDE_MD: pick('claude_md') ?? '',
    }
  },
  allowedTools: [],
  coachSkill: 'hackproduct-analytics-coach',
  graderSkill: 'hackproduct-analytics-grader',
}

const LAB_SERVER_REGISTRY: Record<LabId, LabServerDefinition> = {
  analytics: ANALYTICS_LAB_SERVER,
}

export function getLabServer(labId: LabId | null | undefined): LabServerDefinition {
  return LAB_SERVER_REGISTRY[labId ?? 'analytics'] ?? LAB_SERVER_REGISTRY.analytics
}

export { labIdForChallengeType }
