/**
 * Client-side fetch helper for POST /api/casebook/case/start. Mirrors the
 * API's response contract exactly (src/app/api/casebook/case/start/route.ts).
 * Does not add any field the API doesn't already send — in particular,
 * never types or forwards `objectives` or `verdict_spec`.
 *
 * Deliberately parallel to startPracticeSession.ts (Phase 4), with two real
 * differences from that contract: the success body's content key is
 * `challenge` (not `practice`), and there is no `sceneId` — a Challenge
 * session covers the whole case, not one scene.
 */

export interface ChallengeStartAttempt {
  id: string
  status: string
  started_at: string
}

export interface ChallengeStartCase {
  case_id: string
  title: string
}

export interface ChallengeStartSession {
  wss_url: string
  expires_at: string
  status: 'active' | 'provisioning'
}

export interface ChallengeStartSuccess {
  ok: true
  attempt: ChallengeStartAttempt
  challenge: ChallengeStartCase
  session: ChallengeStartSession | null
  session_error?: string
}

export interface ChallengeStartLimitReached {
  ok: false
  kind: 'limit_reached'
  message: string
  used?: number
  limit?: number
  upgradeUrl?: string
}

export interface ChallengeStartFailure {
  ok: false
  kind: 'error'
  message: string
}

export type ChallengeStartResult = ChallengeStartSuccess | ChallengeStartLimitReached | ChallengeStartFailure

/**
 * Calls the real case-start endpoint. Every branch resolves to a typed
 * result — this never throws, so callers don't need try/catch to stay out
 * of a hung state.
 */
export async function startChallengeSession(caseId: string): Promise<ChallengeStartResult> {
  let res: Response
  try {
    res = await fetch('/api/casebook/case/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
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
      message: b.error ?? 'You have used all your challenge attempts for now.',
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
    attempt: ChallengeStartAttempt
    challenge: ChallengeStartCase
    session: ChallengeStartSession | null
    session_error?: string
  }

  return {
    ok: true,
    attempt: b.attempt,
    challenge: b.challenge,
    session: b.session,
    ...(b.session_error ? { session_error: b.session_error } : {}),
  }
}
