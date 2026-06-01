/**
 * Unit tests for the batch submit/poll + retry logic in src/lib/judge0/client.ts.
 *
 * fetch is stubbed so these run without a real Judge0 key. They validate:
 * 1. submitBatchToJudge0 sends ONE /submissions/batch request with all items.
 * 2. Batch response is mapped back to {token|error} preserving order.
 * 3. >20 items are chunked into multiple batch requests.
 * 4. pollJudge0Batch aligns results to the original token order, null for failed.
 * 5. A 429 with Retry-After is retried and then succeeds.
 * 6. Persistent 429 throws Judge0TransientError after retries.
 * 7. Missing key throws Judge0UnconfiguredError (not retried).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const KEY = 'test-judge0-key'

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
}

describe('judge0 batch client', () => {
  beforeEach(() => {
    process.env.JUDGE0_RAPIDAPI_KEY = KEY
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('submits all items in one batch request and maps tokens in order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([{ token: 'tok-a' }, { token: 'tok-b' }, { token: 'tok-c' }])
    )
    vi.stubGlobal('fetch', fetchMock)
    const { submitBatchToJudge0 } = await import('../../src/lib/judge0/client')

    const items = ['x', 'y', 'z'].map((s) => ({ sourceCode: `#${s}`, language: 'python' as const, stdin: '[]' }))
    const res = await submitBatchToJudge0(items)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/submissions/batch')
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent.submissions).toHaveLength(3)
    expect(sent.submissions[0].source_code).toBe('#x')
    expect(res).toEqual([
      { token: 'tok-a', error: null },
      { token: 'tok-b', error: null },
      { token: 'tok-c', error: null },
    ])
  })

  it('captures per-item errors when a submission has no token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse([{ token: 'ok' }, { error: ['language not found'] }])
    ))
    const { submitBatchToJudge0 } = await import('../../src/lib/judge0/client')
    const res = await submitBatchToJudge0([
      { sourceCode: 'a', language: 'python', stdin: '[]' },
      { sourceCode: 'b', language: 'python', stdin: '[]' },
    ])
    expect(res[0]).toEqual({ token: 'ok', error: null })
    expect(res[1].token).toBeNull()
    expect(res[1].error).toContain('language not found')
  })

  it('chunks more than 20 items into multiple batch requests', async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init: RequestInit) => {
      const body = JSON.parse(init.body as string)
      return Promise.resolve(jsonResponse(body.submissions.map((_: unknown, i: number) => ({ token: `t${i}` }))))
    })
    vi.stubGlobal('fetch', fetchMock)
    const { submitBatchToJudge0 } = await import('../../src/lib/judge0/client')

    const items = Array.from({ length: 25 }, (_, i) => ({ sourceCode: `${i}`, language: 'python' as const, stdin: '[]' }))
    const res = await submitBatchToJudge0(items)
    expect(fetchMock).toHaveBeenCalledTimes(2) // 20 + 5
    expect(res).toHaveLength(25)
  })

  it('polls the batch and aligns results to original token order', async () => {
    // First poll: only tok-a terminal. Second poll: tok-c terminal too. tok-b null (never submitted).
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ submissions: [{ token: 'tok-a', status: { id: 3 }, stdout: 'A' }] }))
      .mockResolvedValueOnce(jsonResponse({ submissions: [{ token: 'tok-c', status: { id: 3 }, stdout: 'C' }] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    const { pollJudge0Batch } = await import('../../src/lib/judge0/client')

    const p = pollJudge0Batch(['tok-a', null, 'tok-c'])
    await vi.runAllTimersAsync()
    const res = await p

    expect(res[0]?.stdout).toBe('A')
    expect(res[1]).toBeNull() // failed submit slot stays null
    expect(res[2]?.stdout).toBe('C')
  })

  it('retries a 429 (honoring Retry-After) then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('Too many requests', { status: 429, headers: { 'retry-after': '0' } }))
      .mockResolvedValueOnce(jsonResponse([{ token: 'tok-ok' }]))
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    const { submitBatchToJudge0 } = await import('../../src/lib/judge0/client')

    const p = submitBatchToJudge0([{ sourceCode: 'a', language: 'python', stdin: '[]' }])
    await vi.runAllTimersAsync()
    const res = await p

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(res[0].token).toBe('tok-ok')
  })

  it('throws Judge0TransientError after exhausting retries on persistent 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('429', { status: 429, headers: { 'retry-after': '0' } })))
    vi.useFakeTimers()
    const { submitBatchToJudge0, Judge0TransientError } = await import('../../src/lib/judge0/client')

    const p = submitBatchToJudge0([{ sourceCode: 'a', language: 'python', stdin: '[]' }]).catch((e) => e)
    await vi.runAllTimersAsync()
    const err = await p
    expect(err).toBeInstanceOf(Judge0TransientError)
    expect((err as { status: number }).status).toBe(429)
  })

  it('does NOT retry a submit (POST) timeout — avoids duplicate submissions', async () => {
    // AbortSignal.timeout rejects fetch with a TimeoutError. The POST may have
    // already created submissions server-side, so a timeout must surface, not
    // retry (which would double-submit). Exactly one fetch call, then it throws.
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    vi.stubGlobal('fetch', fetchMock)
    const { submitBatchToJudge0 } = await import('../../src/lib/judge0/client')

    await expect(
      submitBatchToJudge0([{ sourceCode: 'a', language: 'python', stdin: '[]' }])
    ).rejects.toBeInstanceOf(DOMException)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries a poll (GET) timeout then succeeds — idempotent, safe to retry', async () => {
    // A GET poll is idempotent, so a timed-out poll request is retried.
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce(jsonResponse({ submissions: [{ token: 'tok-a', status: { id: 3 }, stdout: 'A' }] }))
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    const { pollJudge0Batch } = await import('../../src/lib/judge0/client')

    const p = pollJudge0Batch(['tok-a'])
    await vi.runAllTimersAsync()
    const res = await p

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(res[0]?.stdout).toBe('A')
  })

  it('pollJudge0Batch stops at the wall-clock deadline and leaves unfinished tokens null', async () => {
    // fetch always returns a non-terminal status (id 2 = Processing), so the
    // loop can only exit via the POLL_DEADLINE_MS wall clock, not by completion.
    // Build a fresh Response per call — a Response body is single-read.
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(jsonResponse({ submissions: [{ token: 'tok-a', status: { id: 2 } }] }))
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    const { pollJudge0Batch } = await import('../../src/lib/judge0/client')

    const p = pollJudge0Batch(['tok-a'])
    await vi.runAllTimersAsync()
    const res = await p

    // Never reached a terminal state → stays null, and the loop terminated
    // (the promise resolved) rather than spinning forever.
    expect(res[0]).toBeNull()
  })

  it('throws Judge0UnconfiguredError when the key is missing (no retry)', async () => {
    delete process.env.JUDGE0_RAPIDAPI_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { submitBatchToJudge0, Judge0UnconfiguredError } = await import('../../src/lib/judge0/client')

    await expect(submitBatchToJudge0([{ sourceCode: 'a', language: 'python', stdin: '[]' }]))
      .rejects.toBeInstanceOf(Judge0UnconfiguredError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
