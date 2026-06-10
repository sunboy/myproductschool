// Contracts for the public /job-fit surface: the anonymous tool, the share
// page, and the OG images all render from SharedFitReport.

import type { FitBreakdownDimension, FitGrade, ReadinessRow } from '@/lib/careerops/types'

export type PublicFitMode = 'job_fit' | 'resume_roast'

export type RoastSeverity = 'minor' | 'major' | 'fatal'

export interface RoastSection {
  title: string
  severity: RoastSeverity
  finding: string
  fix: string
}

export interface RoastEvaluation {
  score: number
  grade: FitGrade
  verdict_line: string
  sections: RoastSection[]
  strengths: string[]
  report_md: string
}

// The normalized union the share page and OG images render. `score`/`grade`
// are null for job_fit runs that had no candidate background: a fit score with
// nothing behind it is not shown, the demands analysis is.
export interface SharedFitReport {
  shareId: string
  mode: PublicFitMode
  company: string | null
  roleTitle: string | null
  score: number | null
  grade: FitGrade | null
  breakdown: FitBreakdownDimension[]
  gaps: string[]
  readinessMap: ReadinessRow[]
  reportMd: string
  roast: Pick<RoastEvaluation, 'verdict_line' | 'sections' | 'strengths'> | null
  includeScore: boolean
  isClaimed: boolean
  isAnonymous: boolean
  createdAt: string | null
}
