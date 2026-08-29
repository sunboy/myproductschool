/**
 * Client-side fetch helper for POST /api/casebook/case/[attemptId]/file.
 * That route (owned by another dev, landed while this UI was in progress)
 * files the attempt AND grades it in the same call. Its response is the
 * AUTHENTICATED learner's own graded result — attempt status, verdict, the
 * full move-diff (matched/missed expert moves), grade, and report.narrative_md
 * (which includes a "Moves you missed" section). That is answer-key-adjacent
 * detail meant for the learner's own eyes, not for a public/logged-out
 * surface, and there is no `cc_reports` row or public slug produced by this
 * call — publishing a shareable report is a separate, not-yet-built step.
 * This helper therefore extracts only a minimal, safe summary (grade label,
 * score) for the terminal's inline confirmation and never surfaces the
 * move-diff or narrative to the Challenge workspace UI.
 */

export interface FileReportSuccess {
  ok: true
  status: string
  gradeLabel: string | null
  totalScore: number | null
}

export interface FileReportUnavailable {
  ok: false
  kind: 'unavailable'
  message: string
}

export interface FileReportFailure {
  ok: false
  kind: 'error'
  message: string
}

export type FileReportResult = FileReportSuccess | FileReportUnavailable | FileReportFailure

/**
 * Calls POST /api/casebook/case/[attemptId]/file. Never throws — every
 * branch (network failure, 404 route-not-ready, 402 AI budget cap, other
 * non-2xx, malformed body) resolves to a typed result so the caller never
 * needs try/catch to stay out of a hung state. A 402 (AI budget cap) leaves
 * the attempt at `filed` server-side, so it is safe to surface as a normal
 * retryable error — clicking File report again re-attempts grading from
 * where it left off.
 */
export async function fileChallengeReport(attemptId: string): Promise<FileReportResult> {
  let res: Response
  try {
    res = await fetch(`/api/casebook/case/${attemptId}/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return { ok: false, kind: 'error', message: 'Could not reach the server. Check your connection and try again.' }
  }

  if (res.status === 404) {
    return {
      ok: false,
      kind: 'unavailable',
      message: 'Filing is not available yet. Give it a moment and try again.',
    }
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const b = (body ?? {}) as { error?: string }
    return { ok: false, kind: 'error', message: b.error ?? 'The report could not be filed.' }
  }

  const b = (body ?? {}) as {
    attempt?: { status?: string }
    grade?: { grade_label?: string; total_score?: number }
  }

  return {
    ok: true,
    status: b.attempt?.status ?? 'graded',
    gradeLabel: typeof b.grade?.grade_label === 'string' ? b.grade.grade_label : null,
    totalScore: typeof b.grade?.total_score === 'number' ? b.grade.total_score : null,
  }
}
