import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { readWorkspaceFile } from '@/lib/coding-grading/workspace-inspector'

export interface SharedAnalyticsReport {
  attemptId: string
  challengeId: string
  challengeTitle: string
  shareId: string
  gradeLabel: string | null
  scoreLabel: string
  /** The full report.md the agent wrote, as markdown. */
  reportMarkdown: string
}

/**
 * Resolve a publicly-shared Claude Code Analytics report by (challengeId, shareId).
 * Returns null if the attempt is not a shared analytics attempt or no report
 * artifact is found. Mirrors getSharedAttemptScorecard but pulls the report.md
 * from the session's workspace snapshot instead of FLOW move levels.
 */
export async function getSharedAnalyticsReport(
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

  // Find the session for this attempt and pull its report from the snapshot.
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('transcript_uri')
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

  return {
    attemptId: attempt.id,
    challengeId: input.challengeId,
    challengeTitle: (challenge.title as string) ?? 'Analytics challenge',
    shareId: input.shareId,
    gradeLabel: (attempt.grade_label as string | null) ?? null,
    scoreLabel,
    reportMarkdown: report.content,
  }
}
