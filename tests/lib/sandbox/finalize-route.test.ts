import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createAdminClient: vi.fn(), grade: vi.fn(), destroy: vi.fn(), pause: vi.fn(), persist: vi.fn(), after: vi.fn(), fresh: vi.fn(), freshUserState: vi.fn(), inspect: vi.fn(), listSkills: vi.fn(), keyBlock: vi.fn() }))
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: mocks.after }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/sandbox', () => ({ getSandbox: () => ({ destroySession: mocks.destroy }) }))
vi.mock('@/lib/sandbox/record-spend', () => ({ recordSessionSpend: vi.fn().mockResolvedValue({}) }))
vi.mock('@/lib/sandbox/llm-gateway', () => ({ blockSessionKey: mocks.keyBlock }))
vi.mock('@/lib/coding-grading/analytics-grader', () => ({ gradeAnalystSession: mocks.grade }))
vi.mock('@/lib/coding-grading/workspace-inspector', () => ({ inspectWorkspace: mocks.inspect, listUserSkills: mocks.listSkills }))
vi.mock('@/lib/usage/ai-budget', () => ({ getUserPlanForBudget: vi.fn().mockResolvedValue('free') }))
vi.mock('@/lib/sandbox/finalize-grade', async original => ({ ...await original<typeof import('@/lib/sandbox/finalize-grade')>(), pauseForFinalization: mocks.pause, persistAnalyticsGrade: mocks.persist, waitForFreshSnapshot: mocks.fresh, waitForFreshUserState: mocks.freshUserState }))
import { POST } from '../../../src/app/api/claude-code/session/[id]/finalize/route'

const grade = { total_score: 80, grade_label: 'strong', final_artifact: { rubric: 'analyst_v1', dimensions: {}, overall_note: 'Feedback', skills_written: [], workspace_ok: true } }
function setup(options: { status?: string; artifact?: unknown; attemptError?: boolean; profileUri?: string | null } = {}) {
  const session = { id: 'session-1', user_id: 'user-1', challenge_id: 'challenge-1', attempt_id: 'attempt-1', host_instance_id: 'host-1', transcript_uri: 'saved.tar.gz', status: options.status ?? 'active', final_artifact: options.artifact ?? {} }
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) } })
  mocks.createAdminClient.mockReturnValue({ from(table: string) {
    return { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: table === 'claude_code_sessions' ? session : table === 'profiles' ? { cc_claude_state_uri: options.profileUri ?? null } : { title: 'Challenge', prompt_text: '', scenario_context: 'Context', scenario_trigger: 'Trigger', scenario_question: 'Question?', challenge_type: 'claude_code_analytics' }, error: null }), single: async () => ({ data: null, error: options.attemptError ? { message: 'DB unavailable' } : null }) }
  } })
  mocks.pause.mockImplementation(async () => { session.status = 'idle' })
  mocks.destroy.mockResolvedValue(undefined)
  mocks.grade.mockResolvedValue(grade)
  mocks.persist.mockResolvedValue({ finalArtifact: grade.final_artifact, shareId: null })
  mocks.fresh.mockResolvedValue({ transcriptUri: 'fresh.tar.gz', lastSnapshotAt: '2026-09-06T07:30:01.000Z' })
  mocks.freshUserState.mockResolvedValue({ uri: 'user-1/claude.tar.gz', updatedAt: '2026-09-06T07:30:01.000Z' })
  mocks.inspect.mockResolvedValue({ skills: [], artifacts: [{ filename: 'report.md', preview: 'Report' }], fileCount: 1, ok: true })
  mocks.listSkills.mockResolvedValue([])
  mocks.keyBlock.mockResolvedValue({ status: 'blocked', spentCents: 7 })
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
    expect(mocks.keyBlock).toHaveBeenCalledWith('session-1', 4000)
    expect(mocks.keyBlock.mock.invocationCallOrder[0]).toBeLessThan(mocks.destroy.mock.invocationCallOrder[0])
    expect(mocks.after).toHaveBeenCalledOnce()
    expect(mocks.persist).not.toHaveBeenCalled()
  })
  it('returns failure without teardown if pausing cannot be saved', async () => {
    setup()
    mocks.pause.mockRejectedValue(new Error('Pause failed'))
    expect((await submit()).status).toBe(503)
    expect(mocks.destroy).not.toHaveBeenCalled()
    expect(mocks.keyBlock).not.toHaveBeenCalled()
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

  it('grades the fresh snapshot with persisted checkpoints and full scenario', async () => {
    setup({
      artifact: {
        adaptive: {
          updated_at: '2026-09-06T07:30:00.000Z',
          arc: [{ id: 'report', kind: 'report' }],
          progress: {
            findings: [{ id: 'report', text: 'Saved the evidence report.', verdict: 'pass' }],
            activeStepId: 'report',
          },
        },
      },
    })

    expect((await submit()).status).toBe(200)
    expect(mocks.grade).toHaveBeenCalledWith(expect.objectContaining({
      transcriptUri: 'fresh.tar.gz',
      challengePrompt: 'Context\n\nTrigger\n\nQuestion?',
      markedFindings: [{ id: 'report', text: 'Saved the evidence report.', verdict: 'pass' }],
    }))
  })

  it('keeps the sandbox live when the post-checkpoint snapshot is not ready', async () => {
    setup({
      artifact: {
        adaptive: {
          updated_at: '2026-09-06T07:30:00.000Z',
          arc: [{ id: 'report', kind: 'report' }],
          progress: { findings: [{ id: 'report', text: 'Report ready.', verdict: 'pass' }], activeStepId: 'report' },
        },
      },
    })
    mocks.fresh.mockResolvedValue(null)

    const response = await submit()
    expect(response.status).toBe(409)
    expect(mocks.pause).not.toHaveBeenCalled()
    expect(mocks.destroy).not.toHaveBeenCalled()
    expect(mocks.grade).not.toHaveBeenCalled()
  })

  it('does not accept a prior skill before current user state is saved', async () => {
    setup({
      profileUri: 'user-1/claude.tar.gz',
      artifact: {
        adaptive: {
          updated_at: '2026-09-06T07:30:00.000Z',
          arc: [{ id: 'skill', kind: 'skill' }],
          progress: { findings: [{ id: 'skill', text: 'Skill ready.', verdict: 'pass' }], activeStepId: 'skill' },
        },
      },
    })
    mocks.listSkills.mockResolvedValue([{ filename: '.claude/skills/old/SKILL.md', preview: 'Old skill' }])
    mocks.freshUserState.mockResolvedValue(null)

    const response = await submit()
    expect(response.status).toBe(409)
    expect(mocks.listSkills).not.toHaveBeenCalled()
    expect(mocks.pause).not.toHaveBeenCalled()
    expect(mocks.destroy).not.toHaveBeenCalled()
  })

  it('does not substitute a different prior skill for the submitted filename', async () => {
    setup({
      profileUri: 'user-1/claude.tar.gz',
      artifact: {
        adaptive: {
          updated_at: '2026-09-06T07:30:00.000Z',
          arc: [{ id: 'skill', kind: 'skill' }],
          progress: {
            findings: [{ id: 'skill', text: 'New skill ready.', verdict: 'pass' }],
            activeStepId: 'skill',
            skillsWritten: ['new-skill/SKILL.md'],
          },
        },
      },
    })
    mocks.listSkills.mockResolvedValue([{ filename: '.claude/skills/old-skill/SKILL.md', preview: 'Old skill' }])

    const response = await submit()
    expect(response.status).toBe(409)
    expect(mocks.pause).not.toHaveBeenCalled()
    expect(mocks.grade).not.toHaveBeenCalled()
  })
})
