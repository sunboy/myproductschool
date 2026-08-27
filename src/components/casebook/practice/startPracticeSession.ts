/**
 * Client-side fetch helper for POST /api/casebook/practice/start. Owned by
 * this task (Phase 4) as the seam between the real UI and the real,
 * already-verified API — see PracticeClient.tsx for how it's used.
 *
 * Mirrors the API's response contract exactly (src/app/api/casebook/
 * practice/start/route.ts). Does not add any field the API doesn't already
 * send — in particular, never types or forwards `rubric`.
 */

export interface PracticeStartAttempt {
  id: string
  attempt_no: number
  status: string
  started_at: string
}

export interface PracticeStartScene {
  case_id: string
  scene_id: string
  title: string
  goal_md: string
  skill_lane: string
  time_budget_s: number
}

export interface PracticeStartSession {
  wss_url: string
  expires_at: string
  status: 'active' | 'provisioning'
}

export interface PracticeStartSuccess {
  ok: true
  attempt: PracticeStartAttempt
  practice: PracticeStartScene
  session: PracticeStartSession | null
  session_error?: string
}

export interface PracticeStartLimitReached {
  ok: false
  kind: 'limit_reached'
  message: string
  used?: number
  limit?: number
  upgradeUrl?: string
}

export interface PracticeStartFailure {
  ok: false
  kind: 'error'
  message: string
}

export type PracticeStartResult = PracticeStartSuccess | PracticeStartLimitReached | PracticeStartFailure

/**
 * Calls the real practice-start endpoint. Every branch resolves to a typed
 * result — this never throws, so callers don't need try/catch to stay out
 * of a hung state.
 */
export async function startPracticeSession(caseId: string, sceneId: string): Promise<PracticeStartResult> {
  let res: Response
  try {
    res = await fetch('/api/casebook/practice/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, sceneId }),
    })
  } catch {
    return { ok: false, kind: 'error', message: 'Could not reach the server. Check your connection and try again.' }
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (res.status === 402) {
    const b = (body ?? {}) as { error?: string; used?: number; limit?: number; upgrade_url?: string }
    return {
      ok: false,
      kind: 'limit_reached',
      message: b.error ?? 'You have used all your practice sessions for now.',
      used: b.used,
      limit: b.limit,
      upgradeUrl: b.upgrade_url,
    }
  }

  if (!res.ok) {
    const b = (body ?? {}) as { error?: string }
    return { ok: false, kind: 'error', message: b.error ?? 'The session could not start.' }
  }

  const b = body as {
    attempt: PracticeStartAttempt
    practice: PracticeStartScene
    session: PracticeStartSession | null
    session_error?: string
  }

  return {
    ok: true,
    attempt: b.attempt,
    practice: b.practice,
    session: b.session,
    ...(b.session_error ? { session_error: b.session_error } : {}),
  }
}
