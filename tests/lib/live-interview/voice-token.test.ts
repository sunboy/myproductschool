import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LIVE_INTERVIEW_VOICE_TOKEN_TTL_MS,
  createLiveInterviewVoiceToken,
  verifyLiveInterviewVoiceToken,
} from '../../../src/lib/live-interview/voice-token'

const ORIGINAL_ENV = process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET

test.after(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET
  } else {
    process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET = ORIGINAL_ENV
  }
})

test('creates and verifies a live interview voice token', () => {
  process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET = 'voice-token-test-secret'

  const now = Date.UTC(2026, 4, 6)
  const token = createLiveInterviewVoiceToken({
    sessionId: 'session-123',
    userId: 'user-123',
  }, now)

  assert.ok(token)
  const payload = verifyLiveInterviewVoiceToken(token, 'session-123', now + 1000)
  assert.equal(payload?.sessionId, 'session-123')
  assert.equal(payload?.userId, 'user-123')
  assert.equal(payload?.exp, now + LIVE_INTERVIEW_VOICE_TOKEN_TTL_MS)
})

test('rejects expired, tampered, or wrong-session voice tokens', () => {
  process.env.LIVE_INTERVIEW_VOICE_TOKEN_SECRET = 'voice-token-test-secret'

  const now = Date.UTC(2026, 4, 6)
  const token = createLiveInterviewVoiceToken({
    sessionId: 'session-123',
    userId: 'user-123',
  }, now)
  assert.ok(token)

  assert.equal(verifyLiveInterviewVoiceToken(token, 'session-456', now + 1000), null)
  assert.equal(verifyLiveInterviewVoiceToken(token, 'session-123', now + LIVE_INTERVIEW_VOICE_TOKEN_TTL_MS + 1), null)
  assert.equal(verifyLiveInterviewVoiceToken(`${token}x`, 'session-123', now + 1000), null)
})
