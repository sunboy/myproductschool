import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/api/withRoute', () => ({ withRoute: (handler: unknown) => handler }))
import { GET } from '../../../src/app/api/attempts/route'

function setup(error: unknown = null, data: unknown[] = []) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, count: data.length, error }).then(resolve) }
  for (const method of [query.select, query.eq, query.order, query.limit]) method.mockReturnValue(query)
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) } })
  mocks.createAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) })
  return query
}
const request = (query = '') => GET(new NextRequest(`https://app.test/api/attempts?${query}`), {})
beforeEach(() => vi.clearAllMocks())

describe('attempt history API', () => {
  it.each(['', 'count=1'])('returns a retryable error instead of empty success for DB failure (%s)', async query => {
    setup({ message: 'database unavailable' })
    const response = await request(query)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Submission history could not be loaded. Please try again.' })
  })
  it.each(['0', '-1', 'NaN', '2.5', '3x', '', '9007199254740992'])('rejects invalid limit %s before database access', async limit => {
    setup()
    const response = await request(`limit=${encodeURIComponent(limit)}`)
    expect(response.status).toBe(400)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
  it('defaults and caps the positive page limit', async () => {
    const query = setup()
    expect((await request()).status).toBe(200)
    expect(query.limit).toHaveBeenLastCalledWith(5)
    expect((await request('limit=100')).status).toBe(200)
    expect(query.limit).toHaveBeenLastCalledWith(20)
  })
  it('keeps targeted lookups scoped to user, challenge, and completed status', async () => {
    const query = setup()
    const response = await request('challenge_id=challenge-1&attempt_id=old-attempt&summary=1')
    expect(response.status).toBe(200)
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.eq).toHaveBeenCalledWith('challenge_id', 'challenge-1')
    expect(query.eq).toHaveBeenCalledWith('id', 'old-attempt')
    expect(query.eq).toHaveBeenCalledWith('status', 'completed')
  })
})
