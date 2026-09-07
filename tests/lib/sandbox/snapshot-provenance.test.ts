import { describe, expect, it } from 'vitest'
import {
  expiredUserStateSnapshotUris,
  isDuplicateSnapshotUploadError,
  readSnapshotCaptureHeaders,
  snapshotCaptureFromUri,
  snapshotStoragePath,
} from '../../../src/lib/sandbox/snapshot-provenance'

const startedAtMs = 1_788_679_800_000
const nowMs = startedAtMs + 10_000

describe('snapshot capture provenance', () => {
  it('parses complete v2 capture headers and builds exact object identities', () => {
    const provenance = readSnapshotCaptureHeaders(new Headers({
      'x-snapshot-provenance-version': '2',
      'x-snapshot-capture-started-at': String(startedAtMs),
      'x-snapshot-capture-id': 'capture-1234',
    }), nowMs)

    expect(provenance).toEqual({
      status: 'proven',
      captureId: 'capture-1234',
      captureStartedAtMs: startedAtMs,
      captureStartedAt: '2026-09-06T07:30:00.000Z',
    })
    if (provenance.status !== 'proven') throw new Error('expected proven capture')

    expect(snapshotStoragePath('session-1', 'workspace', provenance))
      .toBe('session-1/workspace-v2-1788679800000-capture-1234.tar.gz')
    expect(snapshotStoragePath('user-1', 'user-state', provenance, 'session-1'))
      .toBe('user-1/claude-v2-s_session-1-t_1788679800000-capture-1234.tar.gz')
  })

  it('rejects partial, malformed, and implausibly future v2 headers', () => {
    expect(readSnapshotCaptureHeaders(new Headers({
      'x-snapshot-provenance-version': '2',
    }), nowMs)).toEqual({ status: 'invalid' })
    expect(readSnapshotCaptureHeaders(new Headers({
      'x-snapshot-provenance-version': '2',
      'x-snapshot-capture-started-at': 'not-a-time',
      'x-snapshot-capture-id': 'capture-1234',
    }), nowMs)).toEqual({ status: 'invalid' })
    expect(readSnapshotCaptureHeaders(new Headers({
      'x-snapshot-provenance-version': '2',
      'x-snapshot-capture-started-at': String(nowMs + 5 * 60_000 + 1),
      'x-snapshot-capture-id': 'capture-1234',
    }), nowMs)).toEqual({ status: 'invalid' })
  })

  it('keeps headerless and legacy object paths explicitly unproven', () => {
    expect(readSnapshotCaptureHeaders(new Headers(), nowMs)).toEqual({ status: 'legacy' })
    expect(snapshotCaptureFromUri('session-1/workspace-1788679800000.tar.gz', 'workspace')).toBeNull()
    expect(snapshotCaptureFromUri('user-1/claude.tar.gz', 'user-state')).toBeNull()
  })

  it('recovers capture start and source session from the selected object URI', () => {
    expect(snapshotCaptureFromUri(
      'user-1/claude-v2-s_session-1-t_1788679800000-capture-1234.tar.gz',
      'user-state',
    )).toEqual({
      sourceSessionId: 'session-1',
      captureId: 'capture-1234',
      captureStartedAtMs: startedAtMs,
      captureStartedAt: '2026-09-06T07:30:00.000Z',
    })
  })

  it('treats a create-only duplicate as an idempotent upload retry', () => {
    expect(isDuplicateSnapshotUploadError({ statusCode: '409', message: 'The resource already exists' })).toBe(true)
    expect(isDuplicateSnapshotUploadError({ statusCode: '500', message: 'Storage unavailable' })).toBe(false)
  })

  it('retains a selected and recently replaced archive while expiring old versions', () => {
    const selected = 'user-1/claude-v2-s_session-1-t_1788679800000-capture-selected.tar.gz'
    const recent = 'claude-v2-s_session-1-t_1788679741000-capture-recent.tar.gz'
    const expired = 'claude-v2-s_session-1-t_1788679199000-capture-expired.tar.gz'

    expect(expiredUserStateSnapshotUris('user-1', [
      { name: selected.slice('user-1/'.length) },
      { name: recent },
      { name: expired },
      { name: 'claude.tar.gz' },
    ], selected, startedAtMs)).toEqual([`user-1/${expired}`])
  })
})
