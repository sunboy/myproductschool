/**
 * E2E: adaptive arcs in the Claude Code Analytics lab — REAL sandboxes.
 *
 * These tests exercise the full stack: real auth users, the real
 * session/start gate chain, real Cloud Run provisioning kicked off by the
 * client, and the real per-session adaptive persistence. Every session is
 * finalized in teardown (finalize destroys the sandbox revision), so no
 * lingering cost survives the run.
 *
 * Run with a dev server on :3002 and .env.local exported, e.g.:
 *   npx dotenv -e .env.local -- npx playwright test e2e/cc-analytics-adaptive.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

const EASY_CHALLENGE = 'cc-003-so-activation' // easy → 4-step base arc
const MEDIUM_CHALLENGE = 'cc-006-thelook-funnel' // medium → full 8-step base arc

const COMPETENCIES = [
  'motivation_theory', 'cognitive_empathy', 'taste',
  'strategic_thinking', 'creative_execution', 'domain_expertise',
]

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/** API login (per repo E2E convention) — immune to cold-compile UI latency. */
async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBeTruthy()
}

async function grantAnalyticsAccess(userId: string) {
  // cc_analytics_access: the flag-independent beta allowlist for the lab.
  // has_seen_hatch_intro: keeps the Shepherd intro tour from auto-starting
  // and covering the workspace with its overlay.
  await admin()
    .from('profiles')
    .update({ cc_analytics_access: true, has_seen_hatch_intro: true })
    .eq('id', userId)
}

/** Rich evidence + a prior terminated CC session → 'open' guidance. */
async function seedAdvancedHistory(userId: string) {
  const c = admin()
  await c.from('learner_competencies').upsert(
    COMPETENCIES.map((competency) => ({
      user_id: userId,
      competency,
      score: 90,
      total_attempts: 30,
      last_updated: new Date().toISOString(),
    })),
    { onConflict: 'user_id,competency' },
  )
  const { data: attempt } = await c
    .from('challenge_attempts')
    .insert({ user_id: userId, challenge_id: EASY_CHALLENGE, status: 'completed' })
    .select('id')
    .single()
  await c.from('claude_code_sessions').insert({
    id: crypto.randomUUID(),
    attempt_id: attempt!.id,
    user_id: userId,
    challenge_id: EASY_CHALLENGE,
    status: 'terminated',
    ended_at: new Date().toISOString(),
  })
}

/** Starts the sandbox from the workspace page; returns the start payload. */
async function startSession(page: Page, challengeId: string) {
  // Pre-warm the route: the workspace page is the heaviest first compile in
  // dev and a cold `goto` can abort before 'load'. The warm request compiles
  // it server-side so the real navigation is fast.
  await page.request.get(`/workspace/challenges/${challengeId}`).catch(() => {})
  // Skip the first-visit onboarding overlay — it hides the start CTA.
  await page.addInitScript(() => {
    localStorage.setItem('cc-analytics-onboarded', '1')
    localStorage.setItem('cc-analytics-brief:cc-003-so-activation', '1')
    localStorage.setItem('cc-analytics-brief:cc-006-thelook-funnel', '1')
  })
  await page.goto(`/workspace/challenges/${challengeId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  })
  const startResponse = page.waitForResponse(
    (r) => r.url().includes('/api/claude-code/session/start') && r.request().method() === 'POST',
    { timeout: 60_000 },
  )
  // The start CTA renders only after the mount-resume probe resolves; give the
  // dev server generous headroom (cold compiles stack up on first visits).
  const startButton = page.getByRole('button', { name: /start sandbox|resume sandbox/i })
  await expect(startButton).toBeVisible({ timeout: 90_000 })
  await startButton.click()
  const res = await startResponse
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as {
    session_id: string
    sub_problems: Array<{ id: string; title: string }>
    arc_complete?: boolean
    guidance?: string
  }
}

/** Finalize via the browser session (destroys the sandbox — the cost teardown). */
async function finalizeSession(page: Page, sessionId: string) {
  await page.request.post(`/api/claude-code/session/${sessionId}/finalize`).catch(() => {})
  // Belt and braces: whatever finalize left, mark terminated so the reaper
  // treats it as done and no active row lingers.
  await admin()
    .from('claude_code_sessions')
    .update({ status: 'terminated', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .neq('status', 'terminated')
}

test.describe('adaptive CC analytics arcs (real sandboxes)', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 })

  let user: TestUser
  let sessionId: string | null = null

  test.afterEach(async ({ page }) => {
    if (sessionId) {
      await finalizeSession(page, sessionId)
      sessionId = null
    }
    if (user) await cleanupTestUser(user.id).catch(() => {})
  })

  test('fresh beginner gets the scaffolded default arc with teaching notes', async ({ page }) => {
    user = await createTestUser()
    await grantAnalyticsAccess(user.id)
    await apiLogin(page, user)

    const data = await startSession(page, MEDIUM_CHALLENGE)
    sessionId = data.session_id

    expect(data.arc_complete).toBeTruthy()
    expect(data.guidance).toBe('scaffolded')
    const ids = data.sub_problems.map((s) => s.id)
    expect(ids).toContain('explore_schema')
    expect(ids).toContain('data_layout')
    expect(ids).not.toContain('map_the_data')

    // The stepper renders the arc; the scaffolded teaching note is visible.
    // The artifact spine renders the arc as milestones; the schema milestone
    // carries the step title as its aria-label.
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByLabel('See what data exists')).toBeVisible()
    await expect(page.getByText(/Click Start sandbox to spin up/i)).toBeVisible()
  })

  test('experienced advanced user gets the compressed open arc with the stretch step', async ({ page }) => {
    user = await createTestUser()
    await grantAnalyticsAccess(user.id)
    await seedAdvancedHistory(user.id)
    await apiLogin(page, user)

    const data = await startSession(page, MEDIUM_CHALLENGE)
    sessionId = data.session_id

    expect(data.arc_complete).toBeTruthy()
    expect(data.guidance).toBe('open')
    const ids = data.sub_problems.map((s) => s.id)
    // This challenge authors an explore_schema override, which correctly
    // disables the map_the_data compression — but the open learner still
    // gets the stretch step appended after `answer`.
    expect(ids).toContain('explore_schema')
    expect(ids).not.toContain('map_the_data')
    expect(ids).toContain('stakeholder_tension')

    await expect(page.getByLabel('Defend the read')).toBeVisible({ timeout: 30_000 })
  })

  test('adaptive state (scaffold injection) persists and survives reconnect', async ({ page }) => {
    user = await createTestUser()
    await grantAnalyticsAccess(user.id)
    await apiLogin(page, user)

    const data = await startSession(page, MEDIUM_CHALLENGE)
    sessionId = data.session_id

    // Simulate the client's branch persistence: inject a scaffold before the
    // analyze step, exactly as handleMark does after two retries.
    const arc = data.sub_problems as Array<Record<string, unknown>>
    const analyzeIdx = arc.findIndex((s) => s.id === 'analyze')
    expect(analyzeIdx).toBeGreaterThan(0)
    const scaffold = {
      id: 'scaffold_analyze',
      sequence: analyzeIdx + 1,
      title: 'Regroup: find the overall drop',
      objective: 'Break the blocked step into its smallest first move.',
      successCriterion: 'Tell Hatch in one line what the step is asking for.',
      suggestedPrompts: ['What did my last output actually say, in plain terms?'],
      kind: 'scaffold_explainer',
    }
    const branched = [...arc.slice(0, analyzeIdx), scaffold, ...arc.slice(analyzeIdx)]
      .map((s, i) => ({ ...s, sequence: i + 1 }))

    // First hit compiles the route in dev and can drop the socket — warm it,
    // then PATCH with one retry.
    await page.request.get(`/api/claude-code/session/${sessionId}/adaptive`).catch(() => {})
    const patchBody = {
      data: {
        guidance: 'scaffolded',
        arc: branched,
        injected: [{ id: 'scaffold_analyze', kind: 'scaffold_explainer', afterStepId: 'data_layout', reason: '2 retries on analyze' }],
        adjustments: [],
      },
    }
    let patch = await page.request
      .patch(`/api/claude-code/session/${sessionId}/adaptive`, patchBody)
      .catch(() => null)
    if (!patch || !patch.ok()) {
      patch = await page.request.patch(`/api/claude-code/session/${sessionId}/adaptive`, patchBody)
    }
    expect(patch.ok()).toBeTruthy()

    // The state poll (the reconnect path) returns the branched arc verbatim.
    const state = await page.request.get(`/api/claude-code/session/${sessionId}/state`)
    expect(state.ok()).toBeTruthy()
    const stateBody = (await state.json()) as {
      sub_problems: Array<{ id: string }>
      arc_complete?: boolean
      guidance?: string
    }
    expect(stateBody.arc_complete).toBeTruthy()
    expect(stateBody.guidance).toBe('scaffolded')
    expect(stateBody.sub_problems.map((s) => s.id)).toContain('scaffold_analyze')
  })
})
