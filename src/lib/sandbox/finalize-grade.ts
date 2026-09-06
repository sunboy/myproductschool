import type { createAdminClient } from '@/lib/supabase/admin'
import type { AnalystGradeResult } from '@/lib/coding-grading/analytics-grader'

type Admin = ReturnType<typeof createAdminClient>

export interface FreshSnapshot {
  transcriptUri: string | null
  lastSnapshotAt: string | null
}

export interface FreshUserState {
  uri: string
  updatedAt: string
}

/**
 * Wait briefly for the container's periodic autosave to include work completed
 * before the final checkpoint. A timeout leaves the live session untouched so
 * the client can retry once the next snapshot lands.
 */
export async function waitForFreshSnapshot(
  admin: Admin,
  sessionId: string,
  checkpointAt: string,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<FreshSnapshot | null> {
  const checkpointMs = Date.parse(checkpointAt)
  if (!Number.isFinite(checkpointMs)) return null

  const timeoutMs = options.timeoutMs ?? 8_000
  const pollMs = options.pollMs ?? 500
  const deadline = Date.now() + timeoutMs

  do {
    const { data, error } = await admin
      .from('claude_code_sessions')
      .select('transcript_uri, last_snapshot_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (error) throw new Error('Latest workspace snapshot could not be checked. Please retry submission.')

    const lastSnapshotAt = (data?.last_snapshot_at as string | null | undefined) ?? null
    if (lastSnapshotAt && Date.parse(lastSnapshotAt) >= checkpointMs) {
      return {
        transcriptUri: (data?.transcript_uri as string | null | undefined) ?? null,
        lastSnapshotAt,
      }
    }

    if (Date.now() >= deadline) return null
    await new Promise((resolve) => setTimeout(resolve, pollMs))
  } while (Date.now() <= deadline)

  return null
}

/** Wait for the stable per-user Claude state object to be overwritten after the final checkpoint. */
export async function waitForFreshUserState(
  admin: Admin,
  uri: string,
  checkpointAt: string,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<FreshUserState | null> {
  const checkpointMs = Date.parse(checkpointAt)
  if (!uri || !Number.isFinite(checkpointMs)) return null

  const slash = uri.lastIndexOf('/')
  const prefix = slash >= 0 ? uri.slice(0, slash) : ''
  const filename = slash >= 0 ? uri.slice(slash + 1) : uri
  const timeoutMs = options.timeoutMs ?? 4_000
  const pollMs = options.pollMs ?? 500
  const deadline = Date.now() + timeoutMs

  do {
    const { data, error } = await admin.storage
      .from('cc-user-state')
      .list(prefix, { limit: 10, search: filename })

    if (error) throw new Error('Reusable skill snapshot could not be checked. Please retry submission.')

    const object = data?.find((entry) => entry.name === filename)
    const updatedAt = object?.updated_at ?? null
    if (updatedAt && Date.parse(updatedAt) >= checkpointMs) return { uri, updatedAt }

    if (Date.now() >= deadline) return null
    await new Promise((resolve) => setTimeout(resolve, pollMs))
  } while (Date.now() <= deadline)

  return null
}

/** Reuse only a complete, server-persisted grading result after a DB failure. */
export function savedAnalyticsGrade(sessionId: string, artifact: unknown): AnalystGradeResult | null {
  if (!artifact || typeof artifact !== 'object') return null
  const record = artifact as Record<string, unknown>
  const cached = record.finalization_result as { session_id?: unknown; total_score?: unknown; grade_label?: unknown } | undefined
  if (!cached || cached.session_id !== sessionId || typeof cached.total_score !== 'number' || !Number.isFinite(cached.total_score) || cached.total_score < 0 || cached.total_score > 100 || typeof cached.grade_label !== 'string' || !cached.grade_label || !record.dimensions || !record.rubric) return null
  return { total_score: cached.total_score, grade_label: cached.grade_label, final_artifact: record as AnalystGradeResult['final_artifact'] }
}

/** Keep the resumable snapshot and host reference, while no longer advertising
 * an active terminal once teardown begins. A failed write must precede teardown.
 */
export async function pauseForFinalization(admin: Admin, sessionId: string) {
  const { data, error } = await admin.from('claude_code_sessions')
    .update({ status: 'idle', ended_at: new Date().toISOString() })
    .eq('id', sessionId).select('id')
  if (error || !data?.length) throw new Error('Could not prepare session for submission. Please try again.')
}

/** Artifact first, attempt second, terminated last. An interrupted write leaves
 * a resumable session and a reusable grade, never a falsely finalized attempt.
 */
export async function persistAnalyticsGrade(
  admin: Admin,
  session: { id: string; attempt_id: string; final_artifact: unknown },
  grade: AnalystGradeResult,
  shareId: string,
): Promise<{ finalArtifact: Record<string, unknown>; shareId: string | null }> {
  const adaptive = (session.final_artifact as { adaptive?: unknown } | null)?.adaptive
  const finalArtifact = {
    ...grade.final_artifact,
    ...(adaptive ? { adaptive } : {}),
    finalization_result: { session_id: session.id, total_score: grade.total_score, grade_label: grade.grade_label },
  }
  const { data: artifactRows, error: artifactError } = await admin.from('claude_code_sessions')
    .update({ final_artifact: finalArtifact }).eq('id', session.id).select('id')
  if (artifactError || !artifactRows?.length) throw new Error('Your feedback could not be saved. Please retry submission.')

  const attemptUpdate = {
    status: 'completed', completed_at: new Date().toISOString(),
    total_score: Math.round((grade.total_score / 100) * 5 * 10) / 10,
    grade_label: grade.grade_label, max_score: 5,
  }
  let persistedShareId: string | null = shareId
  let result = await admin.from('challenge_attempts').update({ ...attemptUpdate, share_id: shareId })
    .eq('id', session.attempt_id).select('id')
  // Compatibility with an older database missing only the optional share column.
  if (result.error && ['42703', 'PGRST204'].includes(result.error.code) && /share_id/.test(result.error.message)) {
    persistedShareId = null
    result = await admin.from('challenge_attempts').update(attemptUpdate).eq('id', session.attempt_id).select('id')
  }
  if (result.error || !result.data?.length) throw new Error('Your submission could not be saved. Please retry submission.')

  const { data: finalRows, error: finalError } = await admin.from('claude_code_sessions')
    .update({ status: 'terminated', ended_at: new Date().toISOString() })
    .eq('id', session.id).select('id')
  if (finalError || !finalRows?.length) throw new Error('Your feedback is saved, but submission could not finish. Please retry submission.')
  return { finalArtifact, shareId: persistedShareId }
}
