/**
 * Client-side types for the Practice workspace. These mirror the
 * server-projected payload shape for a single scene (see the Phase 3 task
 * brief) — the API owner produces this shape from cc_scenes, stripping the
 * `rubric` field before it ever reaches the client. This file has zero
 * server imports and zero sandbox/LLM dependencies; it is pure UI contract.
 *
 * IMPORTANT: `rubric` (required_moves, detectors, fail_conditions) is
 * answer-adjacent and must NEVER be typed here or threaded through any
 * client component. If a field like that shows up in this file, that is a
 * contract bug.
 */

export type SkillLane = 'driving-the-agent' | 'forming-hypotheses' | 'naming-the-verdict'

export type SeedTurnRole = 'user' | 'assistant' | 'tool'

export interface SeedTurn {
  t: number
  role: SeedTurnRole
  text: string
}

export interface ScenePreload {
  context_md: string
  visible_tables: string[]
  seed_transcript?: SeedTurn[]
}

export interface PracticeScene {
  id: string
  moduleId: string
  ordinal: number
  title: string
  goal_md: string
  skill_lane: SkillLane
  preload: ScenePreload
  time_budget_s: number
}

export interface PracticeModuleSummary {
  id: string
  title: string
}

export interface PracticePayload {
  module: PracticeModuleSummary
  scene: PracticeScene
  /** 1-indexed position of this scene among the module's practice scenes. */
  sceneIndex: number
  sceneCount: number
}

export type PracticeSessionStatus = 'idle' | 'starting' | 'active' | 'ended'

export type PracticeEndReason = 'completed' | 'time_exhausted' | 'left'
