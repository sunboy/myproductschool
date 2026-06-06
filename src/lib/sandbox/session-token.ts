// lib/sandbox/session-token.ts — server-side only.
//
// Mints the WSS connection token the in-container PTY bridge validates
// (see infra/claude-code-sandbox/entrypoint-pty.js:validateToken).
//
// Token format:  <sessionId>.<hostId>.<base64url-hmac>
//   hmac = base64url( HMAC-SHA256( "<sessionId>.<hostId>", SESSION_TOKEN_SECRET ) )
//
// The container also cross-checks hostId against its own HOST_ID env (formerly
// FLY_MACHINE_ID) so a misrouted connection is rejected.

import { createHmac } from 'crypto'

export function mintSessionToken(
  sessionId: string,
  hostId: string,
  secret: string,
): string {
  const payload = `${sessionId}.${hostId}`
  const hmac = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${hmac}`
}

export function buildWssUrl(
  wssHost: string,
  sessionId: string,
  hostId: string,
  secret: string,
): string {
  const token = mintSessionToken(sessionId, hostId, secret)
  return `wss://${wssHost}/?token=${encodeURIComponent(token)}`
}
