import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  buildLowSignalDebrief: vi.fn(),
  checkAndGrantAchievements: vi.fn(),
  tableCalls: [] as string[],
  events: [] as string[],
  persistedPayload: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/mock', () => ({ IS_MOCK: false }))
vi.mock('@/lib/live-interview/debrief-generator', () => ({
  buildLowSignalDebrief: mocks.buildLowSignalDebrief,
  generateDebrief: vi.fn(),
}))
vi.mock('@/lib/live-interview/artifact-grader', () => ({ gradeArtifact: vi.fn() }))
vi.mock('@/lib/live-interview/disciplines', () => ({ normalizeDiscipline: () => null }))
vi.mock('@/lib/live-interview/workspace-adapters', () => ({
  buildLiveWorkspaceSignal: () => ({ state: 'missing', summary: '' }),
  isSubstantiveWorkspaceSignal: () => false,
}))
vi.mock('@/lib/hatch/skill-context', () => ({
  buildSkillContextPack: vi.fn().mockResolvedValue({ practiceLink: null }),
}))
vi.mock('@/lib/usage/ai-budget', () => ({
  AiBudgetExceededError: class AiBudgetExceededError extends Error {},
  getUserPlanForBudget: vi.fn(),
}))
vi.mock('@/lib/usage/assert-plan-limit', () => ({
  PlanLimitExceeded: class PlanLimitExceeded extends Error {},
  assertPlanLimit: vi.fn(),
}))
vi.mock('@/lib/security/rate-limit', () => ({ rateLimit: vi.fn() }))
vi.mock('@/lib/api/error', () => ({
  apiError: (status: number, code: string, error: string) =>
    Response.json({ ok: false, code, error }, { status }),
}))
vi.mock('@/lib/achievements/check', () => ({
  checkAndGrantAchievements: mocks.checkAndGrantAchievements,
}))

import { POST } from '../../../src/app/api/live-interview/[id]/end/route'

const debrief = {
  overallScore: 1.2,
  grade: 'Needs Work',
  flowScores: { frame: 1.2, list: 1, optimize: 1, win: 1 },
  competencySignals: [],
  failurePatternsDetected: [],
  strengths: [],
  improvements: ['Add a substantive answer.'],
  nextChallengeRecommendation: 'Try again.',
  nextActions: [],
}

function setup(options: { persistenceError?: boolean } = {}) {
  const session = {
    user_id: 'user-1',
    status: 'active',
    debrief_json: null,
    calibration_snapshot: {},
    scenario_rubric: null,
    flow_coverage: { frame: 0, list: 0, optimize: 0, win: 0 },
    challenge_id: null,
    started_at: new Date().toISOString(),
  }

  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  })

  mocks.createAdminClient.mockReturnValue({
    from(table: string) {
      mocks.tableCalls.push(table)
      mocks.events.push(`from:${table}`)
      let operation: 'select' | 'update' | null = null
      const builder: Record<string, unknown> & PromiseLike<unknown> = {
        select() {
          operation = 'select'
          return builder
        },
        update(payload: Record<string, unknown>) {
          operation = 'update'
          mocks.events.push(`update:${table}`)
          mocks.persistedPayload = payload
          return builder
        },
        eq() {
          return builder
        },
        single() {
          const data = table === 'live_interview_sessions'
            ? session
            : table === 'profiles'
              ? { xp_total: 0, streak_days: 0 }
              : null
          return Promise.resolve({ data, error: null })
        },
        order() {
          return Promise.resolve({ data: [], error: null })
        },
        then<TResult1 = unknown, TResult2 = never>(
          onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          const result = table === 'live_interview_sessions' && operation === 'update' && options.persistenceError
            ? { data: null, error: { message: 'database unavailable' } }
            : { data: null, error: null }
          return Promise.resolve(result).then(onfulfilled, onrejected)
        },
      }
      return builder
    },
    rpc(name: string) {
      mocks.events.push(`rpc:${name}`)
      return Promise.resolve({ data: null, error: null })
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.tableCalls.length = 0
  mocks.events.length = 0
  mocks.persistedPayload = null
  mocks.buildLowSignalDebrief.mockReturnValue(debrief)
  mocks.checkAndGrantAchievements.mockResolvedValue(undefined)
})

describe('live interview debrief persistence', () => {
  it('returns a retryable failure before rewards when the debrief cannot be saved', async () => {
    setup({ persistenceError: true })

    const response = await POST(
      new Request('https://app.test/api/live-interview/session-1/end', { method: 'POST' }),
      { params: Promise.resolve({ id: 'session-1' }) },
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: 'debrief_persistence_failed',
      error: 'Your debrief could not be saved. Please retry.',
    })
    expect(mocks.persistedPayload).toMatchObject({
      status: 'completed',
      debrief_json: debrief,
    })
    expect(mocks.tableCalls).not.toContain('profiles')
    expect(mocks.tableCalls).not.toContain('learner_competencies')
    expect(mocks.tableCalls).not.toContain('user_failure_patterns')
    expect(mocks.checkAndGrantAchievements).not.toHaveBeenCalled()
    expect(mocks.events.some((event) => event.startsWith('rpc:'))).toBe(false)
  })

  it('persists the completed debrief before applying rewards', async () => {
    setup()

    const response = await POST(
      new Request('https://app.test/api/live-interview/session-1/end', { method: 'POST' }),
      { params: Promise.resolve({ id: 'session-1' }) },
    )

    expect(response.status).toBe(200)
    const persistedIndex = mocks.events.indexOf('update:live_interview_sessions')
    const rewardIndex = mocks.events.indexOf('from:profiles')
    expect(persistedIndex).toBeGreaterThanOrEqual(0)
    expect(rewardIndex).toBeGreaterThan(persistedIndex)
    expect(mocks.checkAndGrantAchievements).toHaveBeenCalledOnce()
  })
})
