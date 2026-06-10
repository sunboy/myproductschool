// Shared CareerOps types — the contracts every wave (lib, API, UI) reuses.

import type { LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'

export type JobProvider = 'jsearch' | 'greenhouse' | 'lever' | 'ashby' | 'workable'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'archived'

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'archived',
]

// What every source provider returns. The ingestion layer normalizes these into
// `job_listings` rows. `external_id` is unique per provider and drives dedup.
export interface RawListing {
  external_id: string
  title: string
  url: string
  company: string
  location: string | null
  description?: string | null
  department?: string | null
  posted_at?: string | null
}

export interface JobListing {
  id: string
  provider: JobProvider
  external_id: string
  company: string
  role_title: string
  location: string | null
  url: string
  department: string | null
  description: string | null
  posted_at: string | null
  discipline_tags: string[] | null
  is_active: boolean
}

export interface CareerProfile {
  user_id: string
  target_role: string | null
  seniority: string | null
  locations: string[] | null
  key_skills: string[] | null
  resume_text: string | null
  resume_json: unknown | null
  comp_expectation: string | null
  notes: string | null
}

export type ReadinessState = 'ready' | 'gaps' | 'unknown'

// One row of the per-discipline Readiness Map — the conversion surface. Each
// demanded discipline deep-links into its practice + interview surface.
export interface ReadinessRow {
  discipline: LiveInterviewDiscipline
  demanded: boolean
  bar: string
  user_readiness: ReadinessState
  top_gap: string | null
  recommended_rep: string | null
  practice_href: string
  interview_href: string
}

export interface FitBreakdownDimension {
  dimension: string
  weight: number
  score: number // 0..1
  note: string
}

export type FitGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface FitEvaluation {
  score: number // 0..100
  grade: FitGrade
  breakdown: FitBreakdownDimension[]
  gaps: string[]
  level_strategy: string
  report_md: string
  readiness_map: ReadinessRow[]
}

// A discovery-feed entry: a listing plus its deterministic rank and (optional)
// cached AI fit score. `locked` marks rows past the free auto-score allotment.
export interface FeedEntry extends JobListing {
  match_rank: number // 0..1 deterministic overlap score
  score?: number
  grade?: FitGrade
  readiness_map?: ReadinessRow[]
  gaps?: string[]
  locked?: boolean
}

export interface FeedResponse {
  listings: FeedEntry[]
  scored_count: number
  limit_reached: boolean
}
