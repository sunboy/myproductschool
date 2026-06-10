import 'server-only'

// Public share lookups for fit reports. Anonymous runs live in
// public_fit_reports; members' evaluations get a share_id on
// career_fit_evaluations. Both render through the same /job-fit/r/[shareId]
// surface, so this module normalizes either row into SharedFitReport.
// All reads go through the admin client; RLS stays closed.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FitBreakdownDimension, FitGrade, ReadinessRow } from '@/lib/careerops/types'
import type { PublicFitMode, RoastSection, SharedFitReport } from './types'

export function createShareId() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '').slice(0, 32)
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === '23505'
}

function asGrade(value: unknown): FitGrade | null {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'F'
    ? value
    : null
}

function asNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

interface PublicFitReportRow {
  share_id: string
  mode: PublicFitMode
  company: string | null
  role_title: string | null
  score: number | string | null
  grade: string | null
  breakdown: unknown
  gaps: unknown
  readiness_map: unknown
  report_md: string | null
  roast: unknown
  include_score: boolean
  claimed_by: string | null
  created_at: string | null
}

interface FitEvaluationRow {
  share_id: string | null
  company: string | null
  role_title: string | null
  score: number | string | null
  grade: string | null
  breakdown: unknown
  gaps: unknown
  readiness_map: unknown
  report_md: string | null
  created_at: string | null
}

function fromPublicRow(row: PublicFitReportRow): SharedFitReport {
  const roast =
    row.roast && typeof row.roast === 'object'
      ? {
          verdict_line: String((row.roast as Record<string, unknown>).verdict_line ?? ''),
          sections: asArray<RoastSection>((row.roast as Record<string, unknown>).sections),
          strengths: asArray<unknown>((row.roast as Record<string, unknown>).strengths).map(String),
        }
      : null

  return {
    shareId: row.share_id,
    mode: row.mode,
    company: row.company,
    roleTitle: row.role_title,
    score: asNumber(row.score),
    grade: asGrade(row.grade),
    breakdown: asArray<FitBreakdownDimension>(row.breakdown),
    gaps: asArray<unknown>(row.gaps).map(String),
    readinessMap: asArray<ReadinessRow>(row.readiness_map),
    reportMd: row.report_md ?? '',
    roast,
    includeScore: row.include_score,
    isClaimed: Boolean(row.claimed_by),
    isAnonymous: true,
    createdAt: row.created_at,
  }
}

function fromEvaluationRow(row: FitEvaluationRow): SharedFitReport | null {
  if (!row.share_id) return null
  return {
    shareId: row.share_id,
    mode: 'job_fit',
    company: row.company,
    roleTitle: row.role_title,
    score: asNumber(row.score),
    grade: asGrade(row.grade),
    breakdown: asArray<FitBreakdownDimension>(row.breakdown),
    gaps: asArray<unknown>(row.gaps).map(String),
    readinessMap: asArray<ReadinessRow>(row.readiness_map),
    reportMd: row.report_md ?? '',
    roast: null,
    includeScore: true,
    isClaimed: true,
    isAnonymous: false,
    createdAt: row.created_at,
  }
}

export async function getSharedFitReport(
  admin: SupabaseClient,
  shareId: string,
): Promise<SharedFitReport | null> {
  if (!shareId || shareId.length > 64) return null

  const { data: publicRow } = await admin
    .from('public_fit_reports')
    .select(
      'share_id, mode, company, role_title, score, grade, breakdown, gaps, readiness_map, report_md, roast, include_score, claimed_by, created_at',
    )
    .eq('share_id', shareId)
    .maybeSingle()

  if (publicRow) return fromPublicRow(publicRow as PublicFitReportRow)

  const { data: evalRow } = await admin
    .from('career_fit_evaluations')
    .select('share_id, company, role_title, score, grade, breakdown, gaps, readiness_map, report_md, created_at')
    .eq('share_id', shareId)
    .maybeSingle()

  return evalRow ? fromEvaluationRow(evalRow as FitEvaluationRow) : null
}

// Same retry-on-collision contract as getOrCreateAttemptShare.
export async function getOrCreateEvaluationShareId(
  admin: SupabaseClient,
  input: { evaluationId: string; userId: string },
): Promise<string | null> {
  const { data, error } = await admin
    .from('career_fit_evaluations')
    .select('id, user_id, share_id')
    .eq('id', input.evaluationId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data || data.user_id !== input.userId) return null
  if (data.share_id) return data.share_id as string

  for (let tries = 0; tries < 3; tries += 1) {
    const shareId = createShareId()
    const { data: updated, error: updateError } = await admin
      .from('career_fit_evaluations')
      .update({ share_id: shareId })
      .eq('id', input.evaluationId)
      .is('share_id', null)
      .select('share_id')
      .maybeSingle()

    if (updated?.share_id) return updated.share_id as string
    if (updateError && !isUniqueViolation(updateError)) throw new Error(updateError.message)

    const { data: existing } = await admin
      .from('career_fit_evaluations')
      .select('share_id')
      .eq('id', input.evaluationId)
      .maybeSingle()
    if (existing?.share_id) return existing.share_id as string
  }

  return null
}
