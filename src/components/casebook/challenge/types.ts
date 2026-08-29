/**
 * Client-side types for the Challenge workspace (full case session). These
 * mirror the server-projected payload shape for a case (see page.tsx) and
 * the POST /api/casebook/case/start response contract (see
 * src/app/api/casebook/case/start/route.ts). This file has zero server
 * imports and zero sandbox/LLM dependencies; it is pure UI contract.
 *
 * IMPORTANT: `objectives` and `verdict_spec` on cc_cases are answer-adjacent
 * (the grading rubric) and must NEVER be typed here or threaded through any
 * client component. If a field like that shows up in this file, that is a
 * contract bug.
 */

export interface ChallengeCase {
  id: string
  title: string
  hook: string
  brief_md: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  est_minutes: number
}

export interface ChallengePayload {
  case: ChallengeCase
}

export type ChallengeSessionStatus = 'idle' | 'starting' | 'active' | 'ended'

export type ChallengeEndReason =
  | 'completed'
  | 'time_exhausted'
  | 'left'
  | 'session_error'
  | 'limit_reached'
  | 'upstream_dead'

export type ChallengeFileStatus = 'idle' | 'filing' | 'filed' | 'error' | 'unavailable'
