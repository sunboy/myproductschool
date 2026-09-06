import { describe, expect, it } from 'vitest'
import type { createAdminClient } from '../../../src/lib/supabase/admin'
import type { AnalystGradeResult } from '../../../src/lib/coding-grading/analytics-grader'
import { pauseForFinalization, persistAnalyticsGrade, savedAnalyticsGrade, waitForFreshSnapshot, waitForFreshUserState } from '../../../src/lib/sandbox/finalize-grade'

const grade = { total_score: 80, grade_label: 'strong', final_artifact: { rubric: 'analyst_v1', dimensions: {}, overall_note: 'Feedback', skills_written: [], workspace_ok: true } } as AnalystGradeResult
const session = { id: 'session-1', attempt_id: 'attempt-1', final_artifact: { adaptive: { guidance: 'guided' } } }
function database(failAt?: string) {
  const state = { status: 'active', transcript_uri: 'saved-work.tar.gz', final_artifact: session.final_artifact as unknown, attempt: { status: 'in_progress' } as Record<string, unknown> }
  const writes: string[] = []
  const admin = { from(table: string) {
    let patch: Record<string, unknown>
    return {
      update(value: Record<string, unknown>) { patch = value; return this },
      eq() { return this },
      async select() {
        const step = table === 'challenge_attempts' ? 'attempt' : patch.status === 'idle' ? 'prepare' : patch.status === 'terminated' ? 'finish' : 'artifact'
        writes.push(step)
        if (failAt === step) return { data: null, error: { code: '08000', message: 'Unavailable' } }
        if (table === 'challenge_attempts') Object.assign(state.attempt, patch)
        else Object.assign(state, patch)
        return { data: [{ id: table === 'challenge_attempts' ? 'attempt-1' : 'session-1' }], error: null }
      },
    }
  } } as unknown as ReturnType<typeof createAdminClient>
  return { state, writes, admin }
}

describe('durable analytics finalization', () => {
  it('waits for a snapshot at or after the final checkpoint', async () => {
    const checkpointAt = '2026-09-06T07:30:00.000Z'
    const snapshots = [
      { transcript_uri: 'old.tar.gz', last_snapshot_at: '2026-09-06T07:29:59.000Z' },
      { transcript_uri: 'fresh.tar.gz', last_snapshot_at: checkpointAt },
    ]
    const query = {
      select() { return this },
      eq() { return this },
      async maybeSingle() { return { data: snapshots.shift(), error: null } },
    }
    const admin = { from: () => query } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshSnapshot(admin, 'session-1', checkpointAt, { timeoutMs: 20, pollMs: 0 }))
      .resolves.toEqual({ transcriptUri: 'fresh.tar.gz', lastSnapshotAt: checkpointAt })
  })

  it('does not accept a stale snapshot when the bounded wait expires', async () => {
    const query = {
      select() { return this },
      eq() { return this },
      async maybeSingle() {
        return { data: { transcript_uri: 'old.tar.gz', last_snapshot_at: '2026-09-06T07:29:59.000Z' }, error: null }
      },
    }
    const admin = { from: () => query } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshSnapshot(admin, 'session-1', '2026-09-06T07:30:00.000Z', { timeoutMs: 0, pollMs: 0 }))
      .resolves.toBeNull()
  })

  it('requires the user-state object to be overwritten after the checkpoint', async () => {
    const objects = [
      [{ name: 'claude.tar.gz', updated_at: '2026-09-06T07:29:59.000Z' }],
      [{ name: 'claude.tar.gz', updated_at: '2026-09-06T07:30:01.000Z' }],
    ]
    const list = async () => ({ data: objects.shift(), error: null })
    const admin = {
      storage: { from: () => ({ list }) },
    } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshUserState(
      admin,
      'user-1/claude.tar.gz',
      '2026-09-06T07:30:00.000Z',
      { timeoutMs: 20, pollMs: 0 },
    )).resolves.toEqual({
      uri: 'user-1/claude.tar.gz',
      updatedAt: '2026-09-06T07:30:01.000Z',
    })
  })

  it('pauses before teardown without dropping the saved workspace', async () => {
    const db = database()
    await pauseForFinalization(db.admin, session.id)
    expect(db.state.status).toBe('idle')
    expect(db.state.transcript_uri).toBe('saved-work.tar.gz')
  })
  it('does not permit teardown when pause persistence fails', async () => {
    const db = database('prepare')
    await expect(pauseForFinalization(db.admin, session.id)).rejects.toThrow('prepare session')
    expect(db.state.status).toBe('active')
  })
  it('persists artifact, scaled attempt grade, then terminates', async () => {
    const db = database()
    await pauseForFinalization(db.admin, session.id)
    await persistAnalyticsGrade(db.admin, session, grade, 'share-1')
    expect(db.writes).toEqual(['prepare', 'artifact', 'attempt', 'finish'])
    expect(db.state.attempt).toMatchObject({ status: 'completed', total_score: 4, max_score: 5 })
    expect(db.state.status).toBe('terminated')
    expect(db.state.final_artifact).toMatchObject({ adaptive: { guidance: 'guided' } })
  })
  it.each(['artifact', 'attempt', 'finish'])('keeps a retryable session on %s write failure', async step => {
    const db = database(step)
    await pauseForFinalization(db.admin, session.id)
    await expect(persistAnalyticsGrade(db.admin, session, grade, 'share-1')).rejects.toThrow('retry submission')
    expect(db.state.status).toBe('idle')
    expect(db.state.transcript_uri).toBe('saved-work.tar.gz')
    if (step === 'artifact') expect(db.writes).not.toContain('attempt')
    else expect(savedAnalyticsGrade(session.id, db.state.final_artifact)?.total_score).toBe(80)
    if (step === 'attempt') expect(db.state.attempt.status).toBe('in_progress')
    if (step === 'finish') expect(db.state.attempt.status).toBe('completed')
  })
  it('reuses persisted feedback only for the same session, never resumed work', async () => {
    const db = database('attempt')
    await persistAnalyticsGrade(db.admin, session, grade, 'share-1').catch(() => {})
    expect(savedAnalyticsGrade('session-1', db.state.final_artifact)?.total_score).toBe(80)
    expect(savedAnalyticsGrade('resumed-session-2', db.state.final_artifact)).toBeNull()
    expect(savedAnalyticsGrade('session-1', { finalization_result: { session_id: 'session-1', total_score: 101, grade_label: 'strong' } })).toBeNull()
  })
})
