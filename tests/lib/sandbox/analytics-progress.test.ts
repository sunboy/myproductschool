import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { readAnalyticsProgress } from '@/lib/sandbox/analytics-progress'
const mocks = vi.hoisted(() => ({ user: 'owner' as string | null, session: { id: 's', user_id: 'owner', status: 'active', final_artifact: { adaptive: { source: 'start' }, preserved: true } }, saved: true, update: vi.fn(), filters: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user ? { id: mocks.user } : null } }) } }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => {
  let updating = false
  const query = { select: () => query, eq: (...args: unknown[]) => { mocks.filters(...args); return query }, is: () => query, update: (data: unknown) => { updating = true; mocks.update(data); return query }, maybeSingle: async () => ({ data: updating ? (mocks.saved ? { id: 's' } : null) : mocks.session, error: null }) }
  return query
} }) }))
import { PATCH } from '@/app/api/claude-code/session/[id]/adaptive/route'
const progress = {
  findings: [{ id: 'step-1', text: 'Conversion fell by 12%.', verdict: 'pass' }],
  activeStepId: 'step-2',
  reportPath: '/workspace/report.md',
  skillsWritten: ['funnel-analyst/SKILL.md'],
}
const body = { guidance: 'guided', arc: [{ id: 'step-1', sequence: 1, title: 'Analyze', objective: 'Find evidence', successCriterion: 'Explain', suggestedPrompts: [], kind: 'investigate' }], injected: [], adjustments: [], progress }
const save = (value: unknown = body) => PATCH(new NextRequest('https://example.test/api/claude-code/session/s/adaptive', { method: 'PATCH', body: JSON.stringify(value) }), { params: Promise.resolve({ id: 's' }) })
beforeEach(() => { vi.clearAllMocks(); mocks.user = 'owner'; mocks.session.user_id = 'owner'; mocks.session.status = 'active'; mocks.saved = true })
describe('analytics checkpoint persistence', () => {
  it('preserves the artifact and saves findings with owner and version filters', async () => {
    expect((await save()).status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({ final_artifact: expect.objectContaining({ preserved: true, adaptive: expect.objectContaining({ source: 'start', progress }) }) })
    expect(mocks.filters).toHaveBeenCalledWith('user_id', 'owner')
    expect(mocks.filters).toHaveBeenCalledWith('final_artifact', JSON.stringify(mocks.session.final_artifact))
  })
  it('rejects unauthenticated or other-user writes', async () => {
    mocks.user = null; expect((await save()).status).toBe(401)
    mocks.user = 'other'; expect((await save()).status).toBe(404)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('does not overwrite a paused/finalized session or concurrent change', async () => {
    mocks.session.status = 'idle'; expect((await save()).status).toBe(409)
    expect(mocks.update).not.toHaveBeenCalled()
    mocks.session.status = 'active'; mocks.saved = false; expect((await save()).status).toBe(409)
  })
  it('rejects malformed evidence and tolerates older artifacts without progress', async () => {
    expect((await save({ ...body, progress: { ...progress, findings: [{ id: 'x', verdict: 'fabricated' }] } })).status).toBe(400)
    expect(readAnalyticsProgress({})).toBeNull()
    expect(readAnalyticsProgress({ adaptive: { progress } })).toEqual(progress)
  })
})
