// Analytics lab — client-safe definition. The first Claude Code lab: a live
// analyst session against a read-only BigQuery dataset.

import type { LabClientDefinition } from '../types'
import { DEFAULT_ANALYTICS_ARC, MAP_THE_DATA_STEP, STAKEHOLDER_TENSION_STEP } from '@/components/v2/mediums/analyticsArc'

export const ANALYTICS_LAB_CLIENT: LabClientDefinition = {
  id: 'analytics',
  challengeTypes: ['claude_code_analytics'],
  resourceBadge: { label: 'BigQuery · read-only', icon: 'database' },
  detectors: {
    mcpName: 'bigquery',
    reportPathPattern: '\\/workspace\\/[\\w./-]*report[\\w.-]*\\.md',
  },
  spine: {
    kindToRow: {
      mcp_setup: 'connection',
      connect: 'connection',
      explore_schema: 'schema',
      data_layout: 'schema',
      map_the_data: 'schema',
      analyze: 'drop',
      segment: 'segment',
      answer: 'verdict',
      report: 'report',
      skill: 'skill',
    },
    rowMeta: {
      question:   { label: 'Question',   icon: 'help' },
      connection: { label: 'Connected',  icon: 'database', accent: true },
      schema:     { label: 'Schema',     icon: 'table' },
      drop:       { label: 'The drop',   icon: 'trending_down' },
      segment:    { label: 'Segment',    icon: 'splitscreen' },
      verdict:    { label: 'Verdict',    icon: 'gavel' },
      report:     { label: 'Report',     icon: 'description' },
      skill:      { label: 'Skill',      icon: 'construction', accent: true },
      grade:      { label: 'Grade',      icon: 'workspace_premium' },
    },
  },
  arc: {
    defaultArc: DEFAULT_ANALYTICS_ARC,
    beginnerKinds: new Set(['mcp_setup', 'explore_schema', 'analyze', 'answer']),
    openCompression: { from: ['explore_schema', 'data_layout'], withStep: MAP_THE_DATA_STEP },
    stretch: { afterKind: 'answer', step: STAKEHOLDER_TENSION_STEP },
  },
  missionBrief: {
    subtitle: 'A live Claude Code session against real BigQuery data.',
    promises: [
      { icon: 'verified', text: 'A proven answer, backed by a real number from the data' },
      { icon: 'description', text: 'A report you can share, written to the workspace', accent: true },
      { icon: 'construction', text: 'A reusable skill that teaches the agent this analysis for next time', accent: true },
    ],
    fallbackFirstPrompt: 'What tables are in the dataset?',
    readyLabel: 'Sandbox live · BigQuery connected',
  },
  startup: {
    steps: [
      'Requesting your sandbox',
      'Waking the data warehouse',
      'Booting the Claude Code container',
      'Connecting BigQuery and finishing up',
    ],
  },
}
