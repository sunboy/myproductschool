// src/lib/interview-loops/types.ts

export type LoopStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned'
export type RoundStatus = 'pending' | 'active' | 'paused' | 'completed'
export type LoopDiscipline = 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

export interface InterviewLoop {
  id: string
  user_id: string
  title: string
  target_company: string | null
  target_role: string | null
  status: LoopStatus
  round_order: LoopDiscipline[]
  current_round_index: number
  cross_round_memory: CrossRoundMemoryItem[]
  loop_debrief_json: LoopDebriefResult | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface LoopRound {
  id: string
  loop_id: string
  round_index: number
  discipline: LoopDiscipline
  session_id: string | null
  status: RoundStatus
  paused_at: string | null
  resumed_at: string | null
  pause_snapshot: PauseSnapshot | null
  round_score: number | null
  round_debrief_json: Record<string, unknown> | null
  context_injected: CrossRoundMemoryItem[] | null
  started_at: string | null
  completed_at: string | null
}

export interface CrossRoundMemoryItem {
  signal: string              // e.g. "Consistently frames the right problem quickly"
  round_index: number         // which round this came from
  discipline: LoopDiscipline
}

export interface PauseSnapshot {
  flow_coverage: Record<string, number>
  conversation_memory: unknown[]
  system_prompt_hash: string
}

export interface LoopDebriefResult {
  hire_signal: 'hire' | 'lean_hire' | 'lean_no_hire' | 'no_hire'
  overall_score: number
  round_scores: Array<{
    discipline: LoopDiscipline
    score: number
    grade: string
  }>
  cross_round_insights: Array<{
    pattern: string
    rounds_seen_in: LoopDiscipline[]
    observation: string
  }>
  strengths: string[]
  improvements: string[]
  next_3_challenges: Array<{ id: string; reason: string }>
}
