/**
 * Verification spec for the coding "complete" screen fixes:
 *   1. "Ask Hatch" on the failing-tests banner opens the Hatch chat panel
 *      (previously a no-op because the panel was only mounted at phase==='question').
 *   2. "Retry grading" on a grading error re-grades the SAME submission in place
 *      (previously it started a new attempt and returned to the editor).
 *
 * Self-contained: creates a real (service-role) test user + seeds a real coding
 * challenge, logs in for real (the proxy rejects fully-mocked auth), then mocks
 * /api/code/run (Judge0) and /api/challenges/.../coding-submit for determinism.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/coding-complete-fixes.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
// A real, fully-formed published algorithm challenge (a minimal hand-seeded row
// does not render the editor — the workspace needs the full metadata shape).
// CodingFeedback handles sql + algorithm identically, so this covers both.
const REAL_CODING_CHALLENGE_ID = process.env.E2E_CODING_CHALLENGE_ID ?? '76b51737-99b9-4fe5-be09-90decb5077fd'

async function mockJudge0AllFail(page: Page) {
  await page.route('**/api/code/run', (route) =>
    route.fulfill({
      json: {
        runId: 'r1', testsPassed: 0, testsTotal: 3,
        results: [
          { id: 'tc1', label: 'Basic', status: 'failed', hidden: false, expected: '[0,1]', output: 'null' },
          { id: 'tc2', label: 'Sorted', status: 'failed', hidden: false, expected: '[1,2]', output: 'null' },
          { id: 'tc3', label: 'Empty', status: 'failed', hidden: false, expected: '[]', output: 'null' },
        ],
      },
    })
  )
}

function gradePayload(overall: number, headline: string) {
  const d = { score: Math.max(1, Math.round(overall)), verdict: 'x', evidence: 'x', hole_to_poke: 'x', how_to_improve: 'x' }
  return {
    grade: {
      overall_score: overall, headline,
      dimensions: { problem_approach: d, ai_collaboration: d, code_quality: d, verification_discipline: d, interview_communication: d },
      top_strength: 'x', top_improvement: 'x', what_a_5_would_look_like: 'x',
    },
  }
}

test.describe('Coding complete-screen fixes', () => {
  test.setTimeout(180000)

  let user: TestUser

  test.beforeAll(async () => {
    try {
      user = await createTestUser()
    } catch (err) {
      test.skip(true, `setup failed (need Supabase service role): ${String(err)}`)
    }
  })

  test.afterAll(async () => {
    if (user) await cleanupTestUser(user.id).catch(() => {})
  })

  // Log in by POSTing the app's own /api/auth/login (the form UI is flaky in
  // dev). The page's request context shares its cookie jar with the browser, so
  // the Set-Cookie auth session is applied to subsequent page navigations.
  async function login(page: Page): Promise<void> {
    const res = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: user.email, password: user.password },
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.status() >= 400) {
      test.skip(true, `login failed ${res.status()}: ${await res.text().catch(() => '')}`)
    }
  }

  // The cookie-consent banner is a fixed bottom overlay (z-[70]) that intercepts
  // pointer events on the workspace controls. Pre-seed the localStorage choice so
  // the banner never renders (more robust than clicking it after the fact).
  async function suppressCookieBanner(page: Page): Promise<void> {
    await page.addInitScript(() => {
      try { window.localStorage.setItem('hackproduct_cookie_choice', 'all') } catch { /* ignore */ }
    })
  }

  // After a (mocked) submit, the workspace calls loadSubmissionHistory() which
  // GETs /api/attempts and REPLACES sessionHistory. Since coding-submit is mocked,
  // the real DB has no matching row, so the just-graded attempt would vanish from
  // history and `isCurrentAttemptRecord` would flip false (hiding Ask Hatch/Retry).
  // Echo back a single row whose id matches the attempt the client submitted, so
  // the reconciliation keeps the current attempt selected — mirroring prod, where
  // the row really exists. Returns a getter for the captured attemptId.
  function mockAttemptsEcho(page: Page): { current: () => string | null } {
    const state = { id: null as string | null }
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/coding-submit')) {
        try { state.id = JSON.parse(req.postData() ?? '{}').attemptId ?? null } catch { /* ignore */ }
      }
    })
    void page.route('**/api/attempts**', (route) => {
      if (!state.id) return route.fulfill({ json: [] })
      return route.fulfill({
        json: [{
          id: state.id,
          challenge_id: REAL_CODING_CHALLENGE_ID,
          challenge_type: 'algorithm',
          grade_label: null,
          score: null,
          max_score: 5,
          submitted_at: '2026-06-01T00:00:00Z',
          feedback_json: null,
        }],
      })
    })
    return { current: () => state.id }
  }

  async function openAndSubmit(page: Page): Promise<boolean> {
    await suppressCookieBanner(page)
    await login(page)
    await page.goto(`${BASE_URL}/workspace/challenges/${REAL_CODING_CHALLENGE_ID}`, { waitUntil: 'domcontentloaded' })
    if (page.url().includes('/login') || page.url().includes('/welcome')) {
      test.skip(true, 'not authenticated after login'); return false
    }
    await page.waitForSelector('[data-testid="submit-button"]', { timeout: 75000 })
    await page.getByTestId('submit-button').click()
    return true
  }

  test('Fix 1: Ask Hatch on the failing-tests banner opens the chat panel', async ({ page }) => {
    mockAttemptsEcho(page)
    await mockJudge0AllFail(page)
    await page.route('**/api/challenges/*/coding-submit', (route) =>
      route.fulfill({ json: gradePayload(1.2, 'Tests are failing — start with the empty-input case.') })
    )
    await page.route('**/api/hatch/canvas/interpret', (route) =>
      route.fulfill({ json: { intent: 'coach', message: 'What happens when the input is empty?', actions: [] } })
    )

    if (!(await openAndSubmit(page))) return

    await expect(page.getByTestId('grading-column')).toBeVisible({ timeout: 30000 })
    await expect(page.getByTestId('correctness-column')).toContainText(/0 of 3 tests passed/i)

    // Target the banner button explicitly — there are also a column "Ask Hatch
    // about this" button and the panel's own floating open button.
    await page.getByTestId('ask-hatch-banner').click()

    // hatch-input only exists in the live panel, so it's the unambiguous signal
    // that the chat opened.
    await expect(page.getByTestId('hatch-input')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('hatch-input')).toHaveValue(/tests are failing/i)
  })

  test('Fix 2: Retry grading re-grades in place, stays on complete screen', async ({ page }) => {
    mockAttemptsEcho(page)
    await mockJudge0AllFail(page)
    let submitCalls = 0
    await page.route('**/api/challenges/*/coding-submit', (route) => {
      submitCalls++
      if (submitCalls === 1) {
        return route.fulfill({ status: 500, json: { error: 'Grading failed', details: 'Invalid grading: missing overall_score' } })
      }
      return route.fulfill({ json: gradePayload(1.0, 'Scored from your test results.') })
    })

    if (!(await openAndSubmit(page))) return

    const col = page.getByTestId('grading-column')
    await expect(col).toContainText(/Couldn.t generate feedback/i, { timeout: 30000 })
    await expect(col).toContainText(/test results are still shown/i)
    await expect(col).not.toContainText(/still in the editor/i)

    await page.getByRole('button', { name: /^retry grading$/i }).click()

    // Stays on complete screen, NOT back in the editor
    await expect(page.getByTestId('correctness-column')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('monaco-editor-container')).toHaveCount(0)

    await expect(col).not.toContainText(/Couldn.t generate feedback/i, { timeout: 20000 })
    expect(submitCalls).toBeGreaterThanOrEqual(2)
  })

  test('Fix 3: a 409 on retry shows a clear message and does not blank the panel', async ({ page }) => {
    mockAttemptsEcho(page)
    await mockJudge0AllFail(page)
    let submitCalls = 0
    await page.route('**/api/challenges/*/coding-submit', (route) => {
      submitCalls++
      if (submitCalls === 1) {
        return route.fulfill({ status: 500, json: { error: 'Grading failed', details: 'Invalid grading: missing overall_score' } })
      }
      // Simulate the attempt already being graded (e.g. a fallback grade persisted).
      return route.fulfill({ status: 409, json: { error: 'Already submitted' } })
    })

    if (!(await openAndSubmit(page))) return

    const col = page.getByTestId('grading-column')
    await expect(col).toContainText(/Couldn.t generate feedback/i, { timeout: 30000 })

    await page.getByRole('button', { name: /^retry grading$/i }).click()

    // The panel must NOT go blank — it shows the friendly already-graded message,
    // and the correctness column is still present (no editor regression).
    await expect(col).toContainText(/already graded/i, { timeout: 10000 })
    await expect(page.getByTestId('correctness-column')).toBeVisible()
    await expect(page.getByTestId('monaco-editor-container')).toHaveCount(0)
  })
})
