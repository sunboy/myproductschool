export const SNAPSHOT_PROVENANCE_VERSION = '2'

const CAPTURE_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/
const EARLIEST_CAPTURE_MS = Date.UTC(2020, 0, 1)
const MAX_CLOCK_SKEW_MS = 5 * 60_000
const USER_STATE_RETENTION_MS = 10 * 60_000

export type SnapshotKind = 'workspace' | 'user-state'

export interface SnapshotCaptureProvenance {
  captureId: string
  captureStartedAt: string
  captureStartedAtMs: number
  sourceSessionId?: string
}

export type SnapshotCaptureHeaders =
  | { status: 'legacy' }
  | { status: 'invalid' }
  | ({ status: 'proven' } & SnapshotCaptureProvenance)

/**
 * New sandbox images identify the instant immediately before archive creation.
 * Missing headers belong to a legacy image; partial or malformed v2 headers are
 * rejected rather than silently receiving strong-provenance filenames.
 */
export function readSnapshotCaptureHeaders(
  headers: Headers,
  nowMs = Date.now(),
): SnapshotCaptureHeaders {
  const version = headers.get('x-snapshot-provenance-version')
  const started = headers.get('x-snapshot-capture-started-at')
  const captureId = headers.get('x-snapshot-capture-id')

  if (version === null && started === null && captureId === null) {
    return { status: 'legacy' }
  }

  if (
    version !== SNAPSHOT_PROVENANCE_VERSION
    || !started
    || !/^\d{13}$/.test(started)
    || !captureId
    || !CAPTURE_ID_PATTERN.test(captureId)
  ) {
    return { status: 'invalid' }
  }

  const captureStartedAtMs = Number(started)
  if (
    !Number.isSafeInteger(captureStartedAtMs)
    || captureStartedAtMs < EARLIEST_CAPTURE_MS
    || captureStartedAtMs > nowMs + MAX_CLOCK_SKEW_MS
  ) {
    return { status: 'invalid' }
  }

  return {
    status: 'proven',
    captureId,
    captureStartedAtMs,
    captureStartedAt: new Date(captureStartedAtMs).toISOString(),
  }
}

export function snapshotStoragePath(
  ownerId: string,
  kind: SnapshotKind,
  provenance: SnapshotCaptureProvenance,
  sourceSessionId?: string,
) {
  const basename = kind === 'workspace' ? 'workspace' : 'claude'
  const sessionSegment = kind === 'user-state' ? `s_${sourceSessionId}-t_` : ''
  if (kind === 'user-state' && !sourceSessionId) {
    throw new Error('User-state snapshots require a source session id')
  }
  return `${ownerId}/${basename}-v2-${sessionSegment}${provenance.captureStartedAtMs}-${provenance.captureId}.tar.gz`
}

/**
 * Provenance lives in the immutable object name, binding the capture-start time
 * to the exact object URI selected for restore and grading. Legacy stable paths
 * intentionally return null because their upload timestamps prove only upload.
 */
export function snapshotCaptureFromUri(
  uri: string | null | undefined,
  kind: SnapshotKind,
): SnapshotCaptureProvenance | null {
  if (!uri) return null

  const pattern = kind === 'workspace'
    ? /(?:^|\/)workspace-v2-(\d{13})-([A-Za-z0-9_-]{8,128})\.tar\.gz$/
    : /(?:^|\/)claude-v2-s_([A-Za-z0-9_-]{1,128})-t_(\d{13})-([A-Za-z0-9_-]{8,128})\.tar\.gz$/
  const match = uri.match(pattern)
  if (!match) return null

  const captureStartedAtMs = Number(kind === 'workspace' ? match[1] : match[2])
  if (!Number.isSafeInteger(captureStartedAtMs) || captureStartedAtMs < EARLIEST_CAPTURE_MS) {
    return null
  }

  return {
    captureId: kind === 'workspace' ? match[2] : match[3],
    captureStartedAtMs,
    captureStartedAt: new Date(captureStartedAtMs).toISOString(),
    ...(kind === 'user-state' ? { sourceSessionId: match[1] } : {}),
  }
}

export function isDuplicateSnapshotUploadError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const record = error as { statusCode?: unknown; status?: unknown; name?: unknown; message?: unknown }
  return String(record.statusCode ?? record.status ?? '') === '409'
    || /already exists|duplicate/i.test(String(record.message ?? record.name ?? ''))
}

/**
 * Keep recent versions long enough for a finalizer that already selected one
 * to download it. Later autosaves remove expired versions, so normal retention
 * remains bounded without deleting an in-flight grader's exact object.
 */
export function expiredUserStateSnapshotUris(
  userId: string,
  entries: Array<{ name: string }>,
  selectedUri: string,
  nowMs = Date.now(),
) {
  const cutoff = nowMs - USER_STATE_RETENTION_MS
  return entries.flatMap((entry) => {
    const uri = `${userId}/${entry.name}`
    const capture = snapshotCaptureFromUri(uri, 'user-state')
    return capture && uri !== selectedUri && capture.captureStartedAtMs < cutoff ? [uri] : []
  })
}
