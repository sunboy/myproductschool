/**
 * Visual verification for the adaptive UI (F1-F3): captures the open-guidance
 * workspace at 375/768/1440 into docs/notes/adaptive-ui/. Gated behind
 * ADAPTIVE_SHOTS=1 so the normal suite never provisions a sandbox for
 * screenshots. One real session, finalized in teardown.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

const CHALLENGE = 'cc-006-thelook-funnel'
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

async function seedOpenUser(userId: string) {
  const c = admin()
  await c.from('profiles').update({ cc_analytics_access: true, has_seen_hatch_intro: true }).eq('id', userId)
  await c.from('learner_competencies').upsert(
    COMPETENCIES.map((competency) => ({
      user_id: userId, competency, score: 90, total_attempts: 30, last_updated: new Date().toISOString(),
    })),
    { onConflict: 'user_id,competency' },
  )
  const { data: attempt } = await c
    .from('challenge_attempts')
    .insert({ user_id: userId, challenge_id: 'cc-003-so-activation', status: 'completed' })
    .select('id')
    .single()
  await c.from('claude_code_sessions').insert({
    id: crypto.randomUUID(), attempt_id: attempt!.id, user_id: userId,
    challenge_id: 'cc-003-so-activation', status: 'terminated', ended_at: new Date().toISOString(),
  })
}

async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', { data: { email: user.email, password: user.password } })
  expect(res.ok()).toBeTruthy()
}

test.describe('adaptive UI screenshots', () => {
  test.skip(!process.env.ADAPTIVE_SHOTS, 'set ADAPTIVE_SHOTS=1 to capture')
  test.describe.configure({ timeout: 240_000 })

  let user: TestUser
  let sessionId: string | null = null

  test.afterEach(async ({ page }) => {
    if (sessionId) {
      await page.request.post(`/api/claude-code/session/${sessionId}/finalize`).catch(() => {})
      await admin().from('claude_code_sessions')
        .update({ status: 'terminated', ended_at: new Date().toISOString() })
        .eq('id', sessionId).neq('status', 'terminated')
      sessionId = null
    }
    if (user) await cleanupTestUser(user.id).catch(() => {})
  })

  test('open-guidance workspace at three viewports', async ({ page }) => {
    user = await createTestUser()
    await seedOpenUser(user.id)
    await apiLogin(page, user)

    await page.request.get(`/workspace/challenges/${CHALLENGE}`).catch(() => {})
    await page.addInitScript(() => localStorage.setItem('cc-analytics-onboarded', '1'))
    await page.goto(`/workspace/challenges/${CHALLENGE}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })

    // Mission brief: the per-session start screen (not seeded seen here so we
    // capture it and start the sandbox from its CTA).
    await expect(page.getByText('Your mission')).toBeVisible({ timeout: 90_000 })
    // Wait for the mount-resume probe to settle (the standalone Start CTA
    // renders behind the modal only once resuming resolves) — clicking the
    // brief mid-probe can land on a node React is about to swap.
    await expect(page.getByRole('button', { name: /start sandbox|resume sandbox/i })).toBeVisible({ timeout: 90_000 })
    await page.screenshot({ path: 'docs/notes/adaptive-ui/mission-brief-1440.png', fullPage: false })
    const startResponse = page.waitForResponse(
      (r) => r.url().includes('/api/claude-code/session/start') && r.request().method() === 'POST',
      { timeout: 90_000 },
    )
    await page.getByRole('button', { name: /start the sandbox/i }).click()
    const res = await startResponse
    const data = (await res.json()) as { session_id: string }
    sessionId = data.session_id

    // The stretch step carries the F1 badge — proof the adaptive arc rendered.
    await expect(page.getByLabel('Defend the read')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Stretch', { exact: true }).first()).toBeVisible()
    // F3: the coaching register chip shows the open register in product language.
    await expect(page.getByText('Coaching: Peer-level')).toBeVisible()

    for (const [w, h, name] of [[1440, 900, '1440'], [768, 1024, '768'], [375, 812, '375']] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(600)
      await page.screenshot({ path: `docs/notes/adaptive-ui/open-workspace-${name}.png`, fullPage: false })
    }
  })
})
