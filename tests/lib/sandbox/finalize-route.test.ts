import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createAdminClient: vi.fn(), grade: vi.fn(), destroy: vi.fn(), pause: vi.fn(), persist: vi.fn(), after: vi.fn() }))
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: mocks.after }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/sandbox', () => ({ getSandbox: () => ({ destroySession: mocks.destroy }) }))
vi.mock('@/lib/sandbox/record-spend', () => ({ recordSessionSpend: vi.fn().mockResolvedValue({}) }))
vi.mock('@/lib/coding-grading/analytics-grader', () => ({ gradeAnalystSession: mocks.grade }))
vi.mock('@/lib/usage/ai-budget', () => ({ getUserPlanForBudget: vi.fn().mockResolvedValue('free') }))
vi.mock('@/lib/sandbox/finalize-grade', async original => ({ ...await original<typeof import('@/lib/sandbox/finalize-grade')>(), pauseForFinalization: mocks.pause, persistAnalyticsGrade: mocks.persist }))
import { POST } from '../../../src/app/api/claude-code/session/[id]/finalize/route'

const grade = { total_score: 80, grade_label: 'strong', final_artifact: { rubric: 'analyst_v1', dimensions: {}, overall_note: 'Feedback', skills_written: [], workspace_ok: true } }
function setup(options: { status?: string; artifact?: unknown; attemptError?: boolean } = {}) {
  const session = { id: 'session-1', user_id: 'user-1', challenge_id: 'challenge-1', attempt_id: 'attempt-1', host_instance_id: 'host-1', transcript_uri: 'saved.tar.gz', status: options.status ?? 'active', final_artifact: options.artifact ?? {} }
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) } })
  mocks.createAdminClient.mockReturnValue({ from(table: string) {
    return { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: table === 'claude_code_sessions' ? session : { title: 'Challenge', prompt_text: '', challenge_type: 'claude_code_analytics' }, error: null }), single: async () => ({ data: null, error: options.attemptError ? { message: 'DB unavailable' } : null }) }
  } })
  mocks.pause.mockImplementation(async () => { session.status = 'idle' })
  mocks.destroy.mockResolvedValue(undefined)
  mocks.grade.mockResolvedValue(grade)
  mocks.persist.mockResolvedValue({ finalArtifact: grade.final_artifact, shareId: null })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
  return session
}
const submit = () => POST(new NextRequest('https://app.test/api/claude-code/session/session-1/finalize', { method: 'POST' }), { params: Promise.resolve({ id: 'session-1' }) })
beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllGlobals())

describe('analytics submission orchestration', () => {
  it('leaves a resumable idle snapshot on AI budget rejection after teardown', async () => {
    const session = setup()
    mocks.grade.mockRejectedValue({ isLimitError: true })
    const response = await submit()
    expect(response.status).toBe(402)
    expect(session.status).toBe('idle')
    expect(session.transcript_uri).toBe('saved.tar.gz')
    expect(mocks.destroy).toHaveBeenCalledWith('host-1')
    expect(mocks.after).toHaveBeenCalledOnce()
    expect(mocks.persist).not.toHaveBeenCalled()
  })
  it('returns failure without teardown if pausing cannot be saved', async () => {
    setup()
    mocks.pause.mockRejectedValue(new Error('Pause failed'))
    expect((await submit()).status).toBe(503)
    expect(mocks.destroy).not.toHaveBeenCalled()
    expect(mocks.grade).not.toHaveBeenCalled()
  })
  it('does not call the model again when retrying a cached result from this session', async () => {
    setup({ status: 'idle', artifact: { ...grade.final_artifact, finalization_result: { session_id: 'session-1', total_score: 80, grade_label: 'strong' } } })
    expect((await submit()).status).toBe(200)
    expect(mocks.grade).not.toHaveBeenCalled()
    expect(mocks.persist).toHaveBeenCalledOnce()
  })
  it('does not reuse feedback carried forward from an earlier session', async () => {
    setup({ artifact: { ...grade.final_artifact, finalization_result: { session_id: 'old-session', total_score: 80, grade_label: 'strong' } } })
    expect((await submit()).status).toBe(200)
    expect(mocks.grade).toHaveBeenCalledOnce()
  })
  it('returns a retryable error when grade persistence fails', async () => {
    setup()
    mocks.persist.mockRejectedValue(new Error('Your submission could not be saved. Please retry submission.'))
    expect((await submit()).status).toBe(503)
  })
  it('does not regrade or invent ungraded success on an unreadable finalized attempt', async () => {
    setup({ status: 'terminated', attemptError: true })
    expect((await submit()).status).toBe(503)
    expect(mocks.grade).not.toHaveBeenCalled()
    expect(mocks.pause).not.toHaveBeenCalled()
  })
})
