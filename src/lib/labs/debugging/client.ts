// Debugging lab — client-safe definition. The second Claude Code lab: a
// repository with failing tests, driven from reproduction to a proven fix.

import type { LabClientDefinition } from '../types'
import { DEFAULT_DEBUGGING_ARC, BLAST_RADIUS_STEP } from './arc'

export const DEBUGGING_LAB_CLIENT: LabClientDefinition = {
  id: 'debugging',
  challengeTypes: ['claude_code_debugging'],
  resourceBadge: { label: 'Repo · failing tests', icon: 'bug_report' },
  detectors: {
    // No MCP: the repo and its test runner ARE the tools. The connection
    // milestone is filled by the Claude REPL alone.
    mcpName: null,
    reportPathPattern: '\\/workspace\\/[\\w./-]*report[\\w.-]*\\.md',
  },
  spine: {
    kindToRow: {
      env_setup: 'connection',
      reproduce: 'repro',
      localize: 'fault',
      root_cause: 'fault',
      fix: 'fix',
      verify: 'verified',
      report: 'report',
      skill: 'skill',
    },
    rowMeta: {
      question:   { label: 'Bug',       icon: 'bug_report' },
      connection: { label: 'Running',   icon: 'terminal', accent: true },
      repro:      { label: 'Reproduced', icon: 'replay' },
      fault:      { label: 'Root cause', icon: 'my_location' },
      fix:        { label: 'Fix',       icon: 'build' },
      verified:   { label: 'Proven',    icon: 'verified' },
      report:     { label: 'Report',    icon: 'description' },
      skill:      { label: 'Skill',     icon: 'construction', accent: true },
      grade:      { label: 'Grade',     icon: 'workspace_premium' },
    },
  },
  arc: {
    defaultArc: DEFAULT_DEBUGGING_ARC,
    beginnerKinds: new Set(['env_setup', 'reproduce', 'localize', 'fix', 'verify']),
    // Experienced debuggers reproduce and localize in one motion; no separate
    // compression step is authored yet, so open mode keeps the full arc.
    openCompression: null,
    stretch: { afterKind: 'verify', step: BLAST_RADIUS_STEP },
  },
  missionBrief: {
    subtitle: 'A live Claude Code session inside a broken repository.',
    promises: [
      { icon: 'verified', text: 'A proven fix, with the full test suite green' },
      { icon: 'description', text: 'A finding a reviewer can act on, written to the workspace', accent: true },
      { icon: 'construction', text: 'A reusable debugging skill the agent keeps for next time', accent: true },
    ],
    fallbackFirstPrompt: 'Run the test suite and show me what fails',
    readyLabel: 'Sandbox live · repo checked out',
  },
  startup: {
    steps: [
      'Requesting your sandbox',
      'Checking out the repository',
      'Booting the Claude Code container',
      'Wiring the workspace and finishing up',
    ],
  },
}
