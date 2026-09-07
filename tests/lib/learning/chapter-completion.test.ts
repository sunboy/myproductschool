import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeLearnChapter } from '../../../src/hooks/useLearnChapter'

afterEach(() => vi.unstubAllGlobals())

describe('chapter completion response contract', () => {
  it('accepts a persisted completion', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', request)
    await expect(completeLearnChapter('product-sense', 'chapter-1')).resolves.toBeUndefined()
    expect(request).toHaveBeenCalledWith('/api/learn/product-sense/chapter-1/complete', { method: 'POST' })
  })

  it.each([401, 404, 500])('does not mark a rejected HTTP %s completion as successful', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
    await expect(completeLearnChapter('product-sense', 'chapter-1')).rejects.toThrow(status === 401 ? 'session expired' : 'could not be saved')
  })

  it('propagates network failure so the reader can retain its incomplete state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(completeLearnChapter('product-sense', 'chapter-1')).rejects.toThrow('Failed to fetch')
  })
})
