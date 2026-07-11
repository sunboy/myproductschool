// Lab platform — Claude Code as the core experience, many lab types.
//
// A "lab" is a domain instance of the Claude Code medium: analytics (BigQuery
// analyst sessions) was the first; a debugging lab (repo with failing tests)
// is the second. The medium, sandbox provisioning, virtual keys, budget caps,
// grading pipeline, Hatch machinery, and the adaptive engine are lab-agnostic
// engines; everything domain-shaped lives in a LabDefinition.
//
// The registry is split: the CLIENT half (this module + labs/client.ts) holds
// copy, detectors, spine config, and arc data — safe for the browser bundle.
// The SERVER half (labs/server.ts) holds sandbox env mapping, rubric, skill
// names, and access flags — imported only from API routes.

import type { AnalyticsSubProblem, ArtifactRowKey, SubProblemKind } from '@/components/v2/mediums/types'

export type LabId = 'analytics' | 'debugging'

/** Which lab a challenge type belongs to; null = not a Claude Code lab. */
export function labIdForChallengeType(challengeType: string | null | undefined): LabId | null {
  switch (challengeType) {
    case 'claude_code_analytics':
      return 'analytics'
    case 'claude_code_debugging':
      return 'debugging'
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Client-safe definition
// ---------------------------------------------------------------------------

export interface LabDetectors {
  /** MCP server name fragment the terminal watches for; null = lab has no MCP. */
  mcpName: string | null
  /** RegExp source for the written-report path signal. */
  reportPathPattern: string
}

export interface LabSpineConfig {
  /** Arc step kind → spine milestone row. Kinds absent here get no row. */
  kindToRow: Partial<Record<SubProblemKind, ArtifactRowKey>>
  rowMeta: Partial<Record<ArtifactRowKey, { label: string; icon: string; accent?: boolean }>>
}

export interface LabArcConfig {
  defaultArc: AnalyticsSubProblem[]
  /** Kinds retained for beginner-difficulty challenges. */
  beginnerKinds: Set<string>
  /** Open-guidance compression: steps whose kinds appear in `from` collapse
   *  into the single `withStep` (skipped when authors override those steps). */
  openCompression: { from: string[]; withStep: AnalyticsSubProblem } | null
  /** Stretch step appended for open-guidance learners after `afterKind`. */
  stretch: { afterKind: string; step: AnalyticsSubProblem } | null
}

export interface LabClientDefinition {
  id: LabId
  challengeTypes: string[]
  /** Resource badge in the mission column, e.g. 'BigQuery · read-only'. */
  resourceBadge: { label: string; icon: string }
  detectors: LabDetectors
  spine: LabSpineConfig
  arc: LabArcConfig
  missionBrief: {
    subtitle: string
    promises: Array<{ icon: string; text: string; accent?: boolean }>
    fallbackFirstPrompt: string
    /** Readiness pill text once the sandbox is live, e.g. 'Sandbox live · BigQuery connected'. */
    readyLabel: string
  }
  startup: {
    /** Step labels for the determinate startup progress, in order. */
    steps: [string, string, string, string]
  }
}

/** True when the challenge type renders the Claude Code medium (any lab). */
export function isClaudeCodeLab(challengeType: string | null | undefined): boolean {
  return labIdForChallengeType(challengeType) !== null
}
