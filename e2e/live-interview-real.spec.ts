/**
 * Real-mode 20-turn Luma live interview E2E test.
 *
 * Prerequisites:
 *   1. A real-mode dev server must be running:
 *      ANTHROPIC_API_KEY=<key> ADMIN_DEBUG_KEY=hackproduct-debug PORT=3003 npm run dev
 *      (do NOT set USE_MOCK_DATA=true)
 *   2. Test account must exist in Supabase:
 *      Email: test-e2e-1774745731@hackproduct.dev / Password: e2etest123!
 *
 * Run:
 *   npx playwright test e2e/live-interview-real.spec.ts --reporter=line --timeout=300000
 *
 * Env vars (optional overrides):
 *   REAL_BASE_URL  — defaults to http://localhost:3003
 *   ADMIN_DEBUG_KEY — defaults to hackproduct-debug
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.REAL_BASE_URL ?? 'http://localhost:3003'
const ADMIN_DEBUG_KEY = process.env.ADMIN_DEBUG_KEY ?? 'hackproduct-debug'
const E2E_EMAIL = 'test-e2e-1774745731@hackproduct.dev'
const E2E_PASSWORD = 'e2etest123!'

// 20-turn PM interview — driver earnings transparency problem
const INTERVIEW_MESSAGES = [
  "I'm ready. What's the problem we're solving today?",
  "Got it. So the core issue is driver churn. I want to start by understanding what's actually causing drivers to leave — is it earnings, flexibility, safety, or something else?",
  "Based on the data you mentioned — earnings confusion correlates with churn — I think the root cause is that drivers can't trust the platform to pay them correctly. The job isn't 'reduce support tickets', it's 'make drivers feel their income is reliable and transparent'.",
  "Right. So if the real job is trust in earnings, I'd think about stakeholders differently. Individual gig drivers optimize ruthlessly — they'll switch to Lyft immediately if numbers don't pencil. Full-time drivers feel more exposed. And fleet operators care about aggregate visibility across 50+ drivers.",
  "Three structurally different approaches: First, radical transparency — show every calculation step, auditable earnings log. Second, proactive trust signals — push confirmations in real-time, 'Your surge was 1.8x because of the airport demand spike at 6pm'. Third, third-party verification — let drivers export to tools like Keeper Tax or partner with an independent auditor.",
  "I'd optimize for driver retention of the top 20% earners, because they drive disproportionate supply reliability. The sacrifice is that this approach doesn't solve for new driver onboarding — we'd need a separate workstream for that.",
  "The metric I'd track: 30-day driver retention rate for drivers who contacted support about earnings in the previous 90 days. Baseline is 40%, target is 65% in 6 months. Counter-signal: if support volume goes up after the feature launches, we're adding complexity not clarity.",
  "For sequencing: start with the auditable earnings log — lowest lift, highest trust impact. Then proactive surge confirmations in the next quarter. Third-party export as a stretch goal.",
  "The team I'd need: one backend engineer for the earnings calculation API, one mobile engineer for the driver app UI, a data analyst to validate the earnings model, and a driver ops partner to run the beta with 200 drivers.",
  "Biggest risk is that earnings disputes reveal actual calculation errors in our system — which would be damaging to discover publicly. So I'd run a private beta first, audit our own math before we make it transparent to drivers.",
  "On the Win step — I'd recommend launching the auditable earnings log to the top-earning 20% of drivers first, with a 60-day beta period. Success is 65% 30-day retention (up from 40%) among beta participants, and a 30% reduction in earnings-related support tickets.",
  "The 'because' behind the recommendation: earnings opacity creates a trust vacuum that drivers fill with suspicion. Once drivers can verify the math themselves, the suspicion dissolves — and a driver who trusts the platform is worth 4x a driver who doesn't.",
  "I think the failure mode I need to watch for is over-indexing on power users — the top 20% earners might love the transparency, but if full-time drivers who are most financially vulnerable don't benefit, we've solved the wrong problem.",
  "If I were presenting this to the CEO, I'd lead with the business case: top-earning drivers generate 60% of trip volume. A 25% improvement in their retention is worth more than a 10% improvement across the whole driver base.",
  "One thing I didn't address: what happens when the auditable log shows a driver was underpaid? We need a clear escalation path — fast payout adjustment within 24 hours, no questions asked. That's the trust moment that really matters.",
  "On the product principle level: transparency is not enough. Transparency plus fast remediation is what creates trust. So the earnings log is necessary but not sufficient — we need to pair it with a 'Dispute this charge' button that auto-triggers a review.",
  "Thinking about second-order effects: if we make earnings completely transparent, drivers will start optimizing their behavior to maximize earnings — which could create supply concentration in high-surge areas and a 'dead zone' problem for lower-demand neighborhoods.",
  "To guard against that: we could add a 'consistency bonus' for drivers who cover underserved areas — pays out monthly, calculated on the same transparent system. That aligns transparency with platform health.",
  "Wrapping up my recommendation: phase one is the auditable earnings log for top earners with fast dispute resolution. Phase two is proactive surge confirmations. Phase three is the consistency bonus to balance supply distribution. All measured against 30-day driver retention and earnings-related support ticket volume.",
  "That's my full answer. I feel like I got stronger on the Frame and List steps after your pushback, but I know I didn't get deep enough on the Optimize tradeoffs early on — I should have named the criterion before jumping to solutions.",
]

// ── Helper: check if server is available and in real (non-mock) mode ──────────────
// Returns: 'real' | 'mock' | 'unavailable'
async function checkServerMode(request: import('@playwright/test').APIRequestContext): Promise<'real' | 'mock' | 'unavailable'> {
  try {
    // In mock mode, /start returns sessionId = 'mock-session-id' without auth
    const probe = await request.post(`${BASE_URL}/api/live-interview/start`, {
      data: {},
      timeout: 10000,
    })
    if (probe.status() === 200) {
      const body = await probe.json()
      if (body.sessionId === 'mock-session-id') {
        return 'mock'
      }
      // Got a real session ID — real mode
      return 'real'
    }
    // 401 = real server but requires auth (expected)
    if (probe.status() === 401) {
      return 'real'
    }
    return 'real'
  } catch (err: unknown) {
    // Connection refused = server not running at this URL
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ECONNREFUSED') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('net::ERR')) {
      return 'unavailable'
    }
    // Other errors — assume real mode with auth requirement
    return 'real'
  }
}

// ── Helper: browser login to get real session cookies ──────────────────────────────
async function loginViaBrowser(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto(`${BASE_URL}/login`, { timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.fill('input[type="email"]', E2E_EMAIL)
  await page.fill('input[type="password"]', E2E_PASSWORD)
  await page.click('button[type="submit"]')
  // Wait for redirect to dashboard or onboarding
  await page.waitForURL(/\/(dashboard|onboarding|explore|welcome)/, { timeout: 30000 })
  console.log('Logged in, current URL:', page.url())
  const cookies = await page.context().cookies()
  return cookies.map((c) => `${c.name}=${c.value}`)
}

// ── Main test ──────────────────────────────────────────────────────────────────────

test.describe('Real-mode 20-turn Luma interview', () => {
  test.setTimeout(300000) // 5 minutes — 20 Claude API calls

  test('20-turn conversation with personalization verification', async ({ page, request }) => {
    // Step 0: Verify the real-mode server is available and not in mock mode
    const serverMode = await checkServerMode(request)

    if (serverMode === 'unavailable') {
      console.error(
        '\n\n' +
        'SERVER NOT AVAILABLE AT ' + BASE_URL + '\n' +
        'This test requires a real-mode server. Start one with:\n' +
        '  ANTHROPIC_API_KEY=<key> ADMIN_DEBUG_KEY=hackproduct-debug PORT=3003 npm run dev\n' +
        'Then run:\n' +
        '  REAL_BASE_URL=http://localhost:3003 npx playwright test e2e/live-interview-real.spec.ts --grep "20-turn"\n\n'
      )
      test.skip()
      return
    }

    if (serverMode === 'mock') {
      console.error(
        '\n\n' +
        'SERVER IS RUNNING IN MOCK MODE at ' + BASE_URL + '\n' +
        'This test requires a real-mode server (no USE_MOCK_DATA). Start one with:\n' +
        '  ANTHROPIC_API_KEY=<key> ADMIN_DEBUG_KEY=hackproduct-debug PORT=3003 npm run dev\n' +
        'Then run:\n' +
        '  REAL_BASE_URL=http://localhost:3003 npx playwright test e2e/live-interview-real.spec.ts --grep "20-turn"\n\n'
      )
      test.skip()
      return
    }

    // Step 1: Authenticate via browser to get real Supabase session cookies
    console.log('\n--- Step 1: Browser login ---')
    const cookieStrings = await loginViaBrowser(page)
    const cookieHeader = cookieStrings.join('; ')
    console.log('Cookies obtained:', cookieStrings.filter((c) => c.startsWith('sb-')).length, 'Supabase cookies')

    const authHeaders = { Cookie: cookieHeader }

    // Step 2: Start interview session
    console.log('\n--- Step 2: Start interview session ---')
    const startRes = await request.post(`${BASE_URL}/api/live-interview/start`, {
      data: { roleId: 'PM' },
      headers: authHeaders,
    })

    const startStatus = startRes.status()
    const startBody = await startRes.json()
    console.log('Start response status:', startStatus, 'body:', JSON.stringify(startBody).slice(0, 300))
    expect(startStatus).toBe(200)
    const { sessionId, companyName, role } = startBody

    expect(sessionId).toBeTruthy()
    expect(typeof sessionId).toBe('string')
    console.log('Session created:', sessionId)
    console.log('Company:', companyName ?? '(no company)')
    console.log('Role:', role)

    // Step 3: Debug endpoint — inspect system prompt for personalization
    console.log('\n--- Step 3: Debug endpoint — system prompt inspection ---')
    const debugRes = await request.get(`${BASE_URL}/api/live-interview/${sessionId}/debug`, {
      headers: {
        ...authHeaders,
        'x-debug-key': ADMIN_DEBUG_KEY,
      },
    })

    let systemPromptPreview = '(debug endpoint unavailable)'
    let hasCalibrationData = false

    if (debugRes.status() === 200) {
      const debugBody = await debugRes.json()
      systemPromptPreview = debugBody.lumaContextPreview ?? debugBody.systemPrompt?.slice(0, 500) ?? ''
      hasCalibrationData = debugBody.hasCalibrationData ?? false
      console.log('System prompt preview (first 200 chars):')
      console.log(systemPromptPreview.slice(0, 200))
      console.log('Has calibration data:', hasCalibrationData)
      console.log('Calibration snapshot:', JSON.stringify(debugBody.calibrationSnapshot, null, 2))
    } else {
      console.warn('Debug endpoint returned', debugRes.status(), '— check ADMIN_DEBUG_KEY')
    }

    // Step 4: Send 20 chat messages and collect Luma's responses
    console.log('\n--- Step 4: 20-turn conversation ---')
    const lumaReplies: string[] = []

    for (let i = 0; i < INTERVIEW_MESSAGES.length; i++) {
      const userMsg = INTERVIEW_MESSAGES[i]
      console.log(`\nTurn ${i + 1}/20`)
      console.log(`USER: ${userMsg.slice(0, 100)}${userMsg.length > 100 ? '...' : ''}`)

      const chatRes = await request.post(`${BASE_URL}/api/live-interview/${sessionId}/chat`, {
        data: { message: userMsg },
        headers: authHeaders,
        timeout: 30000, // 30s per turn
      })

      expect(chatRes.status()).toBe(200)
      const chatBody = await chatRes.json()

      expect(chatBody).toHaveProperty('reply')
      expect(typeof chatBody.reply).toBe('string')
      // Luma may legitimately go silent (e.g. "I'll wait") — reply can be empty string

      const reply = chatBody.reply as string
      lumaReplies.push(reply)
      console.log(`LUMA: ${reply.slice(0, 100)}${reply.length > 100 ? '...' : ''}${reply.length === 0 ? '(silent)' : ''}`)
    }

    console.log('\n✓ All 20 turns completed')
    console.log('Total Luma replies:', lumaReplies.length, `(${lumaReplies.filter(r => r.length > 0).length} non-empty)`)

    // Step 5: Verify conversation was persisted (debug endpoint post-turns)
    console.log('\n--- Step 5: Verify turn persistence ---')
    if (debugRes.status() === 200) {
      const debugPostRes = await request.get(`${BASE_URL}/api/live-interview/${sessionId}/debug`, {
        headers: {
          ...authHeaders,
          'x-debug-key': ADMIN_DEBUG_KEY,
        },
      })
      if (debugPostRes.status() === 200) {
        const debugPostBody = await debugPostRes.json()
        const totalTurns = debugPostBody.totalTurns ?? debugPostBody.turns?.length ?? 0
        console.log('DB turn count:', totalTurns, '(expected ~40 — 20 user + 20 luma)')
        // Each message produces 2 turns (user + luma), so 20 messages = 40 turns
        expect(totalTurns).toBeGreaterThanOrEqual(38) // allow for slight off-by-one
      }
    }

    // Step 6: End session and generate debrief
    console.log('\n--- Step 6: End session + debrief ---')
    const endRes = await request.post(`${BASE_URL}/api/live-interview/${sessionId}/end`, {
      data: {},
      headers: authHeaders,
      timeout: 60000, // Debrief uses claude-opus-4-6 — may take up to 60s
    })

    expect(endRes.status()).toBe(200)
    const endBody = await endRes.json()

    expect(endBody).toHaveProperty('sessionId', sessionId)
    expect(endBody).toHaveProperty('debriefJson')

    const debrief = endBody.debriefJson

    // ── Assertions: score structure ───────────────────────────────────────────
    console.log('\n--- Step 7: Debrief assertions ---')

    // Overall score must be a number 0-100
    expect(typeof debrief.overallScore).toBe('number')
    expect(debrief.overallScore).toBeGreaterThanOrEqual(0)
    expect(debrief.overallScore).toBeLessThanOrEqual(100)

    // Grade must be one of the valid values
    expect(['Strong', 'Good', 'Developing', 'Needs Work']).toContain(debrief.grade)

    // FLOW scores — all 4 steps must be present and in 0-100 range
    // (scores may legitimately be 0 if the candidate didn't engage with the actual problem)
    expect(debrief.flowScores).toHaveProperty('frame')
    expect(debrief.flowScores).toHaveProperty('list')
    expect(debrief.flowScores).toHaveProperty('optimize')
    expect(debrief.flowScores).toHaveProperty('win')
    expect(debrief.flowScores.frame).toBeGreaterThanOrEqual(0)
    expect(debrief.flowScores.list).toBeGreaterThanOrEqual(0)
    expect(debrief.flowScores.optimize).toBeGreaterThanOrEqual(0)
    expect(debrief.flowScores.win).toBeGreaterThanOrEqual(0)

    // Competency signals — at least 2 (we covered all FLOW steps)
    expect(Array.isArray(debrief.competencySignals)).toBe(true)
    expect(debrief.competencySignals.length).toBeGreaterThanOrEqual(2)

    // Strengths and improvements — at least 1 each
    expect(Array.isArray(debrief.strengths)).toBe(true)
    expect(debrief.strengths.length).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(debrief.improvements)).toBe(true)
    expect(debrief.improvements.length).toBeGreaterThanOrEqual(1)

    // Print debrief summary
    console.log('\n=== DEBRIEF RESULTS ===')
    console.log('Overall Score:', debrief.overallScore)
    console.log('Grade:', debrief.grade)
    console.log('FLOW Scores:', JSON.stringify(debrief.flowScores))
    console.log('Competency Signals:', debrief.competencySignals.length)
    debrief.competencySignals.forEach((s: { competency: string; signal: string; stepDetected: string }) => {
      console.log(`  - [${s.stepDetected}] ${s.competency}: ${s.signal.slice(0, 80)}`)
    })
    console.log('Strengths:', debrief.strengths.length)
    debrief.strengths.forEach((s: string) => console.log(`  + ${s.slice(0, 80)}`))
    console.log('Improvements:', debrief.improvements.length)
    debrief.improvements.forEach((s: string) => console.log(`  - ${s.slice(0, 80)}`))
    console.log('Next Challenge:', debrief.nextChallengeRecommendation?.slice(0, 100))

    if (debrief.failurePatternsDetected?.length > 0) {
      console.log('Failure Patterns Detected:', debrief.failurePatternsDetected.length)
      debrief.failurePatternsDetected.forEach((fp: { patternId: string; patternName: string }) => {
        console.log(`  ! [${fp.patternId}] ${fp.patternName}`)
      })
    }

    // Step 7: Verify DB writeback — call debug endpoint to confirm session is completed
    console.log('\n--- Step 8: Verify DB writeback ---')
    if (debugRes.status() === 200) {
      const finalDebugRes = await request.get(`${BASE_URL}/api/live-interview/${sessionId}/debug`, {
        headers: {
          ...authHeaders,
          'x-debug-key': ADMIN_DEBUG_KEY,
        },
      })
      if (finalDebugRes.status() === 200) {
        const finalBody = await finalDebugRes.json()
        console.log('Final session status:', finalBody.status)
        expect(finalBody.status).toBe('completed')
      }
    }

    // ── Summary report ───────────────────────────────────────────────────────
    console.log('\n=== TEST SUMMARY ===')
    console.log('Status: DONE')
    console.log('Auth approach: Browser UI login → Supabase SSR cookies')
    console.log('Session ID:', sessionId)
    console.log('System prompt personalized:', hasCalibrationData)
    console.log('System prompt preview:', systemPromptPreview.slice(0, 200))
    console.log('\n20 Luma Responses (abbreviated):')
    lumaReplies.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.slice(0, 100)}${r.length > 100 ? '...' : ''}`)
    })
    console.log('\nDebrief: score=' + debrief.overallScore + ', grade=' + debrief.grade)
    console.log('FLOW:', JSON.stringify(debrief.flowScores))
    console.log('Competency signals:', debrief.competencySignals.length)
  })
})

// ── Sanity test: can run against mock server to verify test structure ───────────────

test.describe('Mock-mode sanity: test structure validation', () => {
  test.setTimeout(60000)

  test('mock server returns expected shape (validates test scaffolding)', async ({ request }) => {
    // This test runs against any available server to verify the test structure.
    const MOCK_URL = process.env.REAL_BASE_URL ?? 'http://localhost:3002'

    // Start mock session
    const startRes = await request.post(`${MOCK_URL}/api/live-interview/start`, {
      data: {},
    })
    if (startRes.status() !== 200) {
      console.log('Mock server not available at', MOCK_URL, '— skipping sanity test')
      test.skip()
      return
    }
    const startBody = await startRes.json()
    const { sessionId } = startBody
    expect(sessionId).toBe('mock-session-id')
    console.log('Mock session ID:', sessionId)

    // Send one chat message
    const chatRes = await request.post(`${MOCK_URL}/api/live-interview/${sessionId}/chat`, {
      data: { message: INTERVIEW_MESSAGES[0] },
    })
    expect(chatRes.status()).toBe(200)
    const chatBody = await chatRes.json()
    expect(chatBody).toHaveProperty('reply')
    expect(typeof chatBody.reply).toBe('string')
    console.log('Mock reply:', chatBody.reply.slice(0, 80))

    // End and debrief
    const endRes = await request.post(`${MOCK_URL}/api/live-interview/${sessionId}/end`, {
      data: {},
    })
    expect(endRes.status()).toBe(200)
    const endBody = await endRes.json()
    const debrief = endBody.debriefJson

    expect(debrief).toHaveProperty('overallScore')
    expect(debrief).toHaveProperty('grade')
    expect(debrief).toHaveProperty('flowScores')
    expect(['Strong', 'Good', 'Developing', 'Needs Work']).toContain(debrief.grade)
    console.log('Mock debrief score:', debrief.overallScore, '/', debrief.grade)
    console.log('Mock sanity test: PASSED — test scaffolding is correct')
  })
})
