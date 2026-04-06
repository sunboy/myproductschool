import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

/**
 * Live Interview API persistence & context tests.
 * Run with mock mode: USE_MOCK_DATA=true PORT=3002 npm run dev
 * Then: npx playwright test e2e/live-interview-persistence.spec.ts
 */

test.describe('Mock mode API smoke tests', () => {
  test('POST /start returns sessionId, companyName, role', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/live-interview/start`, {
      data: {},
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('sessionId', 'mock-session-id')
    expect(body).toHaveProperty('companyName', 'Uber')
    expect(body).toHaveProperty('role', 'PM')
  })

  test('POST /turn returns OpenAI-compat response', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/live-interview/mock-session-id/turn`,
      {
        data: {
          messages: [{ role: 'user', content: 'I think the core problem is driver trust in earnings transparency.' }],
        },
      }
    )
    expect(res.status()).toBe(200)
    const body = await res.json()

    // OpenAI-compatible shape
    expect(body).toHaveProperty('choices')
    expect(body.choices).toHaveLength(1)
    expect(body.choices[0]).toHaveProperty('message')
    expect(body.choices[0].message).toHaveProperty('role', 'assistant')
    expect(body.choices[0].message).toHaveProperty('content')
    expect(typeof body.choices[0].message.content).toBe('string')
    expect(body.choices[0].message.content.length).toBeGreaterThan(0)
    expect(body.choices[0]).toHaveProperty('finish_reason', 'stop')
  })

  test('POST /end returns debriefJson with score fields', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/live-interview/mock-session-id/end`,
      { data: {} }
    )
    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body).toHaveProperty('sessionId', 'mock-session-id')
    expect(body).toHaveProperty('debriefJson')

    const debrief = body.debriefJson
    expect(debrief).toHaveProperty('overallScore')
    expect(typeof debrief.overallScore).toBe('number')
    expect(debrief).toHaveProperty('grade')
    expect(typeof debrief.grade).toBe('string')
    expect(debrief).toHaveProperty('flowScores')
    expect(debrief.flowScores).toHaveProperty('frame')
    expect(debrief.flowScores).toHaveProperty('list')
    expect(debrief.flowScores).toHaveProperty('optimize')
    expect(debrief.flowScores).toHaveProperty('win')

    // Competency signals array
    expect(Array.isArray(debrief.competencySignals)).toBe(true)

    // Strengths and improvements arrays
    expect(Array.isArray(debrief.strengths)).toBe(true)
    expect(Array.isArray(debrief.improvements)).toBe(true)
  })

  test('GET /status returns text/event-stream', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/live-interview/mock-session-id/status`
    )
    // Status endpoint hits Supabase even in mock mode, so it may return an error
    // if the session doesn't exist. We only check Content-Type header since
    // the response is always an SSE stream regardless of DB state.
    const contentType = res.headers()['content-type']
    expect(contentType).toContain('text/event-stream')
  })

  test('POST /chat returns reply string', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/live-interview/mock-session-id/chat`,
      {
        data: { message: 'How should I think about the driver churn problem?' },
      }
    )
    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body).toHaveProperty('reply')
    expect(typeof body.reply).toBe('string')
    expect(body.reply.length).toBeGreaterThan(0)
  })
})

test.describe('Debug endpoint security', () => {
  test('returns 403 without x-debug-key header', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/live-interview/mock-session-id/debug`
    )
    expect(res.status()).toBe(403)
  })

  test('returns 403 with incorrect x-debug-key', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/live-interview/mock-session-id/debug`,
      { headers: { 'x-debug-key': 'wrong-key-12345' } }
    )
    expect(res.status()).toBe(403)
  })
})

test.describe('Full mock lifecycle', () => {
  test('start → turn → chat → end flows without errors', async ({ request }) => {
    // 1. Start session
    const startRes = await request.post(`${BASE_URL}/api/live-interview/start`, {
      data: {},
    })
    expect(startRes.status()).toBe(200)
    const { sessionId } = await startRes.json()
    expect(sessionId).toBeTruthy()

    // 2. Send a turn (voice-style)
    const turnRes = await request.post(
      `${BASE_URL}/api/live-interview/${sessionId}/turn`,
      {
        data: {
          messages: [{ role: 'user', content: 'The root cause is trust erosion from opaque earnings.' }],
        },
      }
    )
    expect(turnRes.status()).toBe(200)
    const turnBody = await turnRes.json()
    expect(turnBody.choices[0].message.content).toBeTruthy()

    // 3. Send a chat message (text-style)
    const chatRes = await request.post(
      `${BASE_URL}/api/live-interview/${sessionId}/chat`,
      {
        data: { message: 'What metrics would I use to measure driver trust?' },
      }
    )
    expect(chatRes.status()).toBe(200)
    const chatBody = await chatRes.json()
    expect(chatBody.reply).toBeTruthy()

    // 4. End session
    const endRes = await request.post(
      `${BASE_URL}/api/live-interview/${sessionId}/end`,
      { data: {} }
    )
    expect(endRes.status()).toBe(200)
    const endBody = await endRes.json()
    expect(endBody.debriefJson.overallScore).toBeGreaterThanOrEqual(0)
    expect(endBody.debriefJson.grade).toBeTruthy()
  })
})
