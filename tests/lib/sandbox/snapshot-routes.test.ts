import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  verifySnapshotToken: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/sandbox/snapshot-token', () => ({ verifySnapshotToken: mocks.verifySnapshotToken }))

import { POST as saveWorkspace } from '../../../src/app/api/claude-code/session/[id]/snapshot/route'
import { POST as saveUserState } from '../../../src/app/api/claude-code/session/[id]/user-state/route'

const sessionId = 'session-1'
const captureStartedAtMs = Date.now() - 1_000
const captureHeaders = {
  authorization: 'Bearer valid',
  'content-type': 'application/gzip',
  'x-snapshot-provenance-version': '2',
  'x-snapshot-capture-started-at': String(captureStartedAtMs),
  'x-snapshot-capture-id': 'capture-1234',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SESSION_TOKEN_SECRET', 'test-secret')
  mocks.verifySnapshotToken.mockReturnValue(true)
})

describe('snapshot upload routes', () => {
  it('reuses the exact create-only workspace identity when an upload retry finds it stored', async () => {
    const upload = vi.fn().mockResolvedValue({
      error: { statusCode: '409', message: 'The resource already exists' },
    })
    let sessionPatch: Record<string, unknown> | undefined
    const sessionQuery = {
      select() { return this },
      update(value: Record<string, unknown>) { sessionPatch = value; return this },
      eq() { return this },
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: sessionId, status: 'active', started_at: new Date(captureStartedAtMs - 1_000).toISOString() },
        error: null,
      }),
    }
    mocks.createAdminClient.mockReturnValue({
      from: () => sessionQuery,
      storage: { from: () => ({ upload }) },
    })

    const response = await saveWorkspace(new NextRequest(
      `https://app.test/api/claude-code/session/${sessionId}/snapshot`,
      { method: 'POST', headers: captureHeaders, body: new Uint8Array([1, 2, 3]) },
    ), { params: Promise.resolve({ id: sessionId }) })

    const expectedUri = `${sessionId}/workspace-v2-${captureStartedAtMs}-capture-1234.tar.gz`
    expect(response.status).toBe(204)
    expect(upload).toHaveBeenCalledWith(expectedUri, expect.any(Buffer), {
      contentType: 'application/gzip',
      upsert: false,
    })
    expect(sessionPatch?.transcript_uri).toBe(expectedUri)
  })

  it('rejects partial v2 provenance before uploading', async () => {
    const upload = vi.fn()
    const sessionQuery = {
      select() { return this },
      eq() { return this },
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: sessionId, status: 'active', started_at: new Date().toISOString() },
        error: null,
      }),
    }
    mocks.createAdminClient.mockReturnValue({
      from: () => sessionQuery,
      storage: { from: () => ({ upload }) },
    })

    const response = await saveWorkspace(new NextRequest(
      `https://app.test/api/claude-code/session/${sessionId}/snapshot`,
      {
        method: 'POST',
        headers: { authorization: 'Bearer valid', 'x-snapshot-provenance-version': '2' },
        body: new Uint8Array([1]),
      },
    ), { params: Promise.resolve({ id: sessionId }) })

    expect(response.status).toBe(400)
    expect(upload).not.toHaveBeenCalled()
  })

  it('binds user-state identity to its source session and retains recent predecessors', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const list = vi.fn().mockResolvedValue({
      data: [{ name: `claude-v2-s_session-old-t_${captureStartedAtMs - 1_000}-capture-old.tar.gz` }],
      error: null,
    })
    const remove = vi.fn().mockResolvedValue({ error: null })
    const pointerUpdates: Record<string, unknown>[] = []

    mocks.createAdminClient.mockReturnValue({
      from(table: string) {
        if (table === 'claude_code_sessions') {
          return {
            select() { return this },
            eq() { return this },
            async maybeSingle() {
              return {
                data: {
                  id: sessionId,
                  user_id: 'user-1',
                  started_at: new Date(captureStartedAtMs - 1_000).toISOString(),
                },
                error: null,
              }
            },
          }
        }

        let updating = false
        return {
          update(value: Record<string, unknown>) { updating = true; pointerUpdates.push(value); return this },
          select() {
            return updating ? Promise.resolve({ data: [{ id: 'user-1' }], error: null }) : this
          },
          eq() { return this },
          is() { return this },
          async maybeSingle() { return { data: { cc_claude_state_uri: null }, error: null } },
        }
      },
      storage: { from: () => ({ upload, list, remove }) },
    })

    const response = await saveUserState(new NextRequest(
      `https://app.test/api/claude-code/session/${sessionId}/user-state`,
      { method: 'POST', headers: captureHeaders, body: new Uint8Array([4, 5, 6]) },
    ), { params: Promise.resolve({ id: sessionId }) })

    const expectedUri = `user-1/claude-v2-s_${sessionId}-t_${captureStartedAtMs}-capture-1234.tar.gz`
    expect(response.status).toBe(204)
    expect(upload).toHaveBeenCalledWith(expectedUri, expect.any(Buffer), {
      contentType: 'application/gzip',
      upsert: false,
    })
    expect(pointerUpdates).toEqual([{ cc_claude_state_uri: expectedUri }])
    expect(remove).not.toHaveBeenCalled()
  })
})
