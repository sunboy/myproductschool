import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
import { toggleBookmark } from '../../../src/lib/showcase/bookmarks'

function client({ signedIn = true, existing = false, lookupError = false, writeError = false } = {}) {
  const lookup = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: existing ? { id: 'bookmark-1' } : null, error: lookupError ? { message: 'Unavailable' } : null }) }
  lookup.select.mockReturnValue(lookup)
  lookup.eq.mockReturnValue(lookup)
  const deletion = { eq: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: writeError ? { message: 'Rejected' } : null }).then(resolve) }
  deletion.eq.mockReturnValue(deletion)
  const writes = { delete: vi.fn().mockReturnValue(deletion), insert: vi.fn().mockResolvedValue({ error: writeError ? { message: 'Rejected' } : null }) }
  const from = vi.fn().mockReturnValue({ ...lookup, ...writes })
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: signedIn ? { id: 'user-1' } : null } }) }, from })
  return { from, ...writes, deletion }
}

beforeEach(() => vi.clearAllMocks())

describe('bookmark persistence', () => {
  it('requires authentication before querying bookmarks', async () => {
    const db = client({ signedIn: false })
    await expect(toggleBookmark('acme', 'launch')).rejects.toThrow('signed in')
    expect(db.from).not.toHaveBeenCalled()
  })
  it('does not turn lookup failures into inserts', async () => {
    const db = client({ lookupError: true })
    await expect(toggleBookmark('acme', 'launch')).rejects.toThrow('load bookmark')
    expect(db.insert).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
  it.each([false, true])('propagates write failures with existing=%s for UI rollback', async existing => {
    client({ existing, writeError: true })
    await expect(toggleBookmark('acme', 'launch')).rejects.toThrow(existing ? 'remove bookmark' : 'save bookmark')
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
  it('saves the authenticated user bookmark and refreshes Library', async () => {
    const db = client()
    await expect(toggleBookmark('acme', 'launch')).resolves.toEqual({ bookmarked: true })
    expect(db.insert).toHaveBeenCalledWith({ user_id: 'user-1', company_slug: 'acme', story_slug: 'launch' })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/explore')
  })
  it('scopes deletion to the authenticated user', async () => {
    const db = client({ existing: true })
    await expect(toggleBookmark('acme', 'launch')).resolves.toEqual({ bookmarked: false })
    expect(db.deletion.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })
})
