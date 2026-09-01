// Normalized report shape consumed by the shared FitReportDashboard family.
// The public tool renders SharedFitReport (camelCase, roast, nullable score)
// and the member ScorePanel renders FitEvaluation (snake_case, level_strategy,
// no roast) — these adapters unify them so the bento report is built once.

import type {
  FitBreakdownDimension,
  FitEvaluation,
  FitGrade,
  ReadinessRow,
} from '@/lib/careerops/types'
import type { PublicFitMode, RoastEvaluation, SharedFitReport } from '@/lib/careerops/public/types'

export interface FitReportData {
  mode: PublicFitMode
  score: number | null
  grade: FitGrade | null
  breakdown: FitBreakdownDimension[]
  gaps: string[]
  readiness: ReadinessRow[]
  roast: Pick<RoastEvaluation, 'verdict_line' | 'sections' | 'strengths'> | null
  levelStrategy: string | null
  company: string | null
  roleTitle: string | null
}

export function fromSharedFitReport(report: SharedFitReport): FitReportData {
  return {
    mode: report.mode,
    score: report.includeScore ? report.score : null,
    grade: report.includeScore ? report.grade : null,
    breakdown: report.breakdown ?? [],
    gaps: report.gaps ?? [],
    readiness: report.readinessMap ?? [],
    roast: report.roast,
    levelStrategy: null,
    company: report.company,
    roleTitle: report.roleTitle,
  }
}

export function fromFitEvaluation(
  evaluation: FitEvaluation,
  meta?: { company?: string | null; roleTitle?: string | null },
): FitReportData {
  return {
    mode: 'job_fit',
    score: evaluation.score,
    grade: evaluation.grade,
    breakdown: evaluation.breakdown ?? [],
    gaps: evaluation.gaps ?? [],
    readiness: evaluation.readiness_map ?? [],
    roast: null,
    levelStrategy: evaluation.level_strategy || null,
    company: meta?.company ?? null,
    roleTitle: meta?.roleTitle ?? null,
  }
}
