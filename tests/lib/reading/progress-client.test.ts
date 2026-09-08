import { describe, it, expect, vi } from 'vitest'
import { createProgressReporter, readingProgressKey } from '@/lib/reading/progress-client'

describe('progress-client', () => {
  it('builds a stable local key', () => {
    expect(readingProgressKey('module_chapter', 'context-engineering', 'context-poisoning')).toBe('hp:reading:module_chapter:context-engineering/context-poisoning')
  })
  it('debounces PUTs and keeps the latest value', async () => {
    vi.useFakeTimers()
    const calls: unknown[] = []
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => { calls.push(JSON.parse(String(init?.body))); return new Response('{}', { status: 200 }) }) as unknown as typeof fetch
    const report = createProgressReporter({ contentType: 'autopsy_story', parentId: 'buffer', contentId: 'buffer-fake-landing-page-mvp', fetcher, delayMs: 500 })
    report(0.1, 'beat-1'); report(0.4, 'beat-2')
    await vi.advanceTimersByTimeAsync(600)
    expect(calls).toEqual([{ content_type: 'autopsy_story', parent_id: 'buffer', content_id: 'buffer-fake-landing-page-mvp', progress: 0.4, last_heading: 'beat-2' }])
    vi.useRealTimers()
  })
})
