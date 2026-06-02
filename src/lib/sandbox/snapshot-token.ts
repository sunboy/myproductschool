// lib/sandbox/snapshot-token.ts — server-side only.
//
// Mints and verifies the bearer token the in-container autosave loop uses when
// it POSTs a workspace tarball to /api/claude-code/session/[id]/snapshot.
//
// Reuses the same HMAC-SHA256 primitive as session-token.ts. The token format
// is slightly different because the caller (the container) does not know its
// own hostId — it only knows the session id. We sign "snapshot:<sessionId>"
// so a snapshot token cannot be replayed as a WSS connect token.
//
// Token format: base64url( HMAC-SHA256( "snapshot:<sessionId>", SESSION_TOKEN_SECRET ) )

import { createHmac, timingSafeEqual } from 'crypto'

const PREFIX = 'snapshot:'

export function mintSnapshotToken(sessionId: string, secret: string): string {
  const payload = `${PREFIX}${sessionId}`
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/**
 * Constant-time comparison. Returns true iff the token is a valid snapshot
 * token for this sessionId and secret. Never throws.
 */
export function verifySnapshotToken(
  sessionId: string,
  token: string,
  secret: string,
): boolean {
  try {
    const expected = mintSnapshotToken(sessionId, secret)
    const a = Buffer.from(token, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
