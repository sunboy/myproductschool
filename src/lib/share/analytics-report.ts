import 'server-only'

import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { readWorkspaceFile } from '@/lib/coding-grading/workspace-inspector'
import { toDimensionViews, type AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'

export interface SharedAnalyticsReport {
  attemptId: string
  challengeId: string
  challengeTitle: string
  shareId: string
  gradeLabel: string | null
  scoreLabel: string
  /** The full report.md the agent wrote, as markdown. */
  reportMarkdown: string
  /** analyst_v1 per-dimension scores, or null when the artifact lacks them. */
  dimensions: AnalystDimensionView[] | null
  /** The grader's two-sentence overall note, if present. */
  overallNote: string | null
}

/** Lightweight header for the OG image — no tarball download (grade + title + dimensions only). */
export interface SharedAnalyticsHeader {
  challengeTitle: string
  gradeLabel: string | null
  scoreLabel: string
  dimensions: AnalystDimensionView[] | null
}

/**
 * Resolve a publicly-shared Claude Code Analytics report by (challengeId, shareId).
 * Returns null if the attempt is not a shared analytics attempt or no report
 * artifact is found. Mirrors getSharedAttemptScorecard but pulls the report.md
 * from the session's workspace snapshot instead of FLOW move levels.
 */
export const getSharedAnalyticsReport = cache(async function getSharedAnalyticsReport(
  admin: SupabaseClient,
  input: { challengeId: string; shareId: string },
): Promise<SharedAnalyticsReport | null> {
  const { data: attempt } = await admin
    .from('challenge_attempts')
    .select('id, challenge_id, total_score, max_score, grade_label, share_id')
    .eq('challenge_id', input.challengeId)
    .eq('share_id', input.shareId)
    .maybeSingle()

  if (!attempt) return null

  // Confirm this is an analytics challenge (else the FLOW scorecard path owns it).
  const { data: challenge } = await admin
    .from('challenges')
    .select('title, challenge_type')
    .eq('id', input.challengeId)
    .maybeSingle()
  if (!challenge || challenge.challenge_type !== 'claude_code_analytics') return null

  // Find the session for this attempt and pull its report + graded dimensions.
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('transcript_uri, final_artifact')
    .eq('attempt_id', attempt.id)
    .maybeSingle()

  const report = session?.transcript_uri
    ? (await readWorkspaceFile(session.transcript_uri as string, n => /report[^/]*\.md$/i.test(n))
       ?? await readWorkspaceFile(session.transcript_uri as string, n => n.endsWith('.md') && !n.includes('.claude/skills/')))
    : null
  if (!report) return null

  const total = Number(attempt.total_score)
  const max = Number(attempt.max_score) || 100
  const scoreLabel = Number.isFinite(total) ? `${Math.round((total / max) * 100)}%` : 'Not scored'

  const fa = (session?.final_artifact ?? null) as { overall_note?: unknown } | null
  const dimensions = toDimensionViews(session?.final_artifact)
  const overallNote = fa && typeof fa.overall_note === 'string' ? fa.overall_note : null

  return {
    attemptId: attempt.id,
    challengeId: input.challengeId,
    challengeTitle: (challenge.title as string) ?? 'Analytics challenge',
    shareId: input.shareId,
    gradeLabel: (attempt.grade_label as string | null) ?? null,
    scoreLabel,
    reportMarkdown: report.content,
    dimensions,
    overallNote,
  }
})

/**
 * Header-only resolver for the OG image: grade + title + dimensions from the DB,
 * with NO tarball download (the OG card never renders the report.md body). Keeps
 * the social-preview path cheap even on a hot public share URL.
 */
export const getSharedAnalyticsHeader = cache(async function getSharedAnalyticsHeader(
  admin: SupabaseClient,
  input: { challengeId: string; shareId: string },
): Promise<SharedAnalyticsHeader | null> {
  const { data: attempt } = await admin
    .from('challenge_attempts')
    .select('id, total_score, max_score, grade_label')
    .eq('challenge_id', input.challengeId)
    .eq('share_id', input.shareId)
    .maybeSingle()
  if (!attempt) return null

  const { data: challenge } = await admin
    .from('challenges')
    .select('title, challenge_type')
    .eq('id', input.challengeId)
    .maybeSingle()
  if (!challenge || challenge.challenge_type !== 'claude_code_analytics') return null

  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('final_artifact')
    .eq('attempt_id', attempt.id)
    .maybeSingle()

  const total = Number(attempt.total_score)
  const max = Number(attempt.max_score) || 100
  const scoreLabel = Number.isFinite(total) ? `${Math.round((total / max) * 100)}%` : 'Not scored'

  return {
    challengeTitle: (challenge.title as string) ?? 'Analytics challenge',
    gradeLabel: (attempt.grade_label as string | null) ?? null,
    scoreLabel,
    dimensions: toDimensionViews(session?.final_artifact),
  }
})
