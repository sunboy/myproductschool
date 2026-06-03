/**
 * Medium plugin contract for the v2 challenge workspace.
 *
 * A "medium" is the interactive surface a challenge is solved in: the FLOW
 * stepper, an Excalidraw canvas, a Monaco editor, or — added here — a live
 * Claude Code terminal for analytics challenges. The MediumRenderer picks the
 * right one from challenge_type.
 *
 * The terminal contract below is FROZEN: the infra track builds the live
 * xterm-over-WSS terminal to satisfy ClaudeCodeTerminalProps/Handle, and the
 * UX track builds the guided scaffolding against the same interface. Neither
 * side needs the other to be finished to start.
 */

import type { ChallengeType } from '@/lib/types'

export type MediumKind =
  | 'flow_stepper'
  | 'excalidraw'
  | 'monaco_coding'
  | 'claude_code_analytics'

/** Maps a challenge_type to the medium that renders it. */
export function pickMedium(challengeType: ChallengeType): MediumKind {
  switch (challengeType) {
    case 'system_design':
    case 'data_modeling':
      return 'excalidraw'
    case 'sql':
    case 'algorithm':
      return 'monaco_coding'
    case 'claude_code_analytics':
      return 'claude_code_analytics'
    default:
      return 'flow_stepper'
  }
}

// ---------------------------------------------------------------------------
// FROZEN terminal black-box contract
// ---------------------------------------------------------------------------

/** Imperative handle the guided UI uses to drive the terminal. */
export interface ClaudeCodeTerminalHandle {
  /** Type text into the REPL without pressing Enter. The user edits and runs it. */
  insertText(text: string): void
  /** Focus the terminal input. */
  focus(): void
}

/** Props the live terminal accepts. The infra track implements a component to this shape. */
export interface ClaudeCodeTerminalProps {
  /** wss endpoint for the live session (from claude_code_sessions.wss_url). */
  wssUrl: string
  /** Rolling tail of terminal output (~last 4 KB), for Hatch context + status scans. */
  onOutput?: (tail: string) => void
  /** Any keystroke or output — resets the idle timer. */
  onActivity?: () => void
  /** True once the BigQuery MCP server is connected in the session. */
  onMcpStatusChange?: (connected: boolean) => void
  /** Fires when the user writes a .claude/skills/<name>.md file. */
  onSkillWritten?: (filename: string) => void
  /** Fires when the agent writes a report file under /workspace (e.g. report.md). */
  onReportWritten?: (path: string) => void
}

// ---------------------------------------------------------------------------
// Sub-problem stepper (guided structure for an analytics challenge)
// ---------------------------------------------------------------------------

// The full analyst-course arc. `connect` is kept as a back-compat alias for
// `mcp_setup` (older seeded challenges may still use it).
export type SubProblemKind =
  | 'mcp_setup'
  | 'explore_schema'
  | 'data_layout'
  | 'analyze'
  | 'segment'
  | 'answer'
  | 'report'
  | 'skill'
  | 'connect'

export interface AnalyticsSubProblem {
  id: string
  sequence: number
  title: string
  /** One sentence: what "done" looks like. */
  objective: string
  /** What the user pastes or confirms to mark this step done. */
  successCriterion: string
  /** 2-3 prompts the user can click to insert into the terminal. */
  suggestedPrompts: string[]
  kind: SubProblemKind
  /** Analyst-rubric dimension this step feeds, if any (e.g. 'skill_construction'). */
  rubricDimension?: string
  /** "Why this move matters" — 1-3 sentences of course content shown above the prompts. */
  teachingNote?: string
  /** Optional orientation list: "what you should learn here" (not interactive). */
  learnChecklist?: string[]
}

export type MarkVerdict = 'pass' | 'partial' | 'retry'

export interface MarkedFinding {
  id: string
  text: string
  verdict: MarkVerdict
}

// ---------------------------------------------------------------------------
// Medium props
// ---------------------------------------------------------------------------

import type { ChallengePrompt } from '@/lib/types'

export interface MediumProps {
  challenge: ChallengePrompt
  attemptId: string
}
