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
      {
        transcript_uri: 'session-1/workspace-v2-1788679799000-capture-old.tar.gz',
        // Upload completion is after the checkpoint, but capture began before it.
        last_snapshot_at: '2026-09-06T07:30:01.000Z',
      },
      {
        transcript_uri: 'session-1/workspace-v2-1788679800000-capture-fresh.tar.gz',
        last_snapshot_at: '2026-09-06T07:30:02.000Z',
      },
    ]
    const query = {
      select() { return this },
      eq() { return this },
      async maybeSingle() { return { data: snapshots.shift(), error: null } },
    }
    const admin = { from: () => query } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshSnapshot(admin, 'session-1', checkpointAt, { timeoutMs: 20, pollMs: 0 }))
      .resolves.toEqual({
        transcriptUri: 'session-1/workspace-v2-1788679800000-capture-fresh.tar.gz',
        lastSnapshotAt: '2026-09-06T07:30:02.000Z',
        captureId: 'capture-fresh',
        captureStartedAt: checkpointAt,
      })
  })

  it('does not accept a stale snapshot when the bounded wait expires', async () => {
    const query = {
      select() { return this },
      eq() { return this },
      async maybeSingle() {
        return {
          data: {
            transcript_uri: 'session-1/workspace-v2-1788679799000-capture-old.tar.gz',
            last_snapshot_at: '2026-09-06T07:30:01.000Z',
          },
          error: null,
        }
      },
    }
    const admin = { from: () => query } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshSnapshot(admin, 'session-1', '2026-09-06T07:30:00.000Z', { timeoutMs: 0, pollMs: 0 }))
      .resolves.toBeNull()
  })

  it('requires the profile to select a user-state capture begun after the checkpoint', async () => {
    const objects = [
      [{ name: 'claude-v2-s_session-1-t_1788679799000-capture-old.tar.gz' }],
      [
        { name: 'claude-v2-s_session-2-t_1788679802000-capture-other.tar.gz' },
        { name: 'claude-v2-s_session-1-t_1788679801000-capture-fresh.tar.gz' },
      ],
    ]
    const list = async () => ({ data: objects.shift(), error: null })
    const admin = {
      storage: { from: () => ({ list }) },
    } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshUserState(
      admin,
      'user-1',
      'session-1',
      '2026-09-06T07:30:00.000Z',
      { timeoutMs: 20, pollMs: 0 },
    )).resolves.toEqual({
      uri: 'user-1/claude-v2-s_session-1-t_1788679801000-capture-fresh.tar.gz',
      captureId: 'capture-fresh',
      captureStartedAt: '2026-09-06T07:30:01.000Z',
    })
  })

  it('does not upgrade a legacy upload timestamp into capture provenance', async () => {
    const query = {
      select() { return this },
      eq() { return this },
      async maybeSingle() {
        return {
          data: {
            transcript_uri: 'session-1/workspace-1788679801000.tar.gz',
            last_snapshot_at: '2026-09-06T07:30:01.000Z',
          },
          error: null,
        }
      },
    }
    const admin = { from: () => query } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshSnapshot(
      admin,
      'session-1',
      '2026-09-06T07:30:00.000Z',
      { timeoutMs: 0, pollMs: 0 },
    )).resolves.toBeNull()
  })

  it('does not accept a newer user-state capture from another session', async () => {
    const list = async () => {
        return {
          data: [{ name: 'claude-v2-s_session-2-t_1788679801000-capture-other.tar.gz' }],
          error: null,
        }
    }
    const admin = {
      storage: { from: () => ({ list }) },
    } as unknown as ReturnType<typeof createAdminClient>

    await expect(waitForFreshUserState(
      admin,
      'user-1',
      'session-1',
      '2026-09-06T07:30:00.000Z',
      { timeoutMs: 0, pollMs: 0 },
    )).resolves.toBeNull()
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
