/**
 * E2E: the debugging lab (second Claude Code lab) — REAL sandbox.
 *
 * Proves the lab registry end to end: the flag gate (admin bypass on, 403
 * off), the debugging arc + spine rendering, real provisioning with the repo
 * tarball path, and finalize grading against debug_v1. The session is
 * finalized in teardown — no lingering cost.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

const CHALLENGE = 'ccd-001-cart-pricing'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBeTruthy()
}

test.describe('debugging lab (real sandbox)', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

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

  test('flag off: non-admin cannot start a debugging session', async ({ page }) => {
    user = await createTestUser()
    await admin().from('profiles')
      .update({ cc_analytics_access: true, has_seen_hatch_intro: true })
      .eq('id', user.id)
    await apiLogin(page, user)

    const res = await page.request.post('/api/claude-code/session/start', {
      data: { challenge_id: CHALLENGE },
    })
    // Unpublished + flag off: RLS makes the challenge invisible entirely.
    expect([403, 404]).toContain(res.status())
  })

  test('admin runs the debugging arc against a real sandbox and grades debug_v1', async ({ page }) => {
    user = await createTestUser()
    await admin().from('profiles')
      .update({ cc_analytics_access: true, has_seen_hatch_intro: true, role: 'admin' })
      .eq('id', user.id)
    await apiLogin(page, user)

    await page.request.get(`/workspace/challenges/${CHALLENGE}`).catch(() => {})
    await page.addInitScript(() => {
      localStorage.setItem('cc-analytics-onboarded', '1')
      localStorage.setItem('cc-analytics-brief:ccd-001-cart-pricing', '1')
    })
    await page.goto(`/workspace/challenges/${CHALLENGE}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    })

    // The debugging lab's identity renders: resource badge + spine milestones.
    await expect(page.getByText('Repo · failing tests')).toBeVisible({ timeout: 90_000 })
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByLabel('Reproduce the failure')).toBeVisible()
    await expect(page.getByLabel('Prove it')).toBeVisible()

    // Start a REAL sandbox session.
    const startResponse = page.waitForResponse(
      (r) => r.url().includes('/api/claude-code/session/start') && r.request().method() === 'POST',
      { timeout: 90_000 },
    )
    const startButton = page.getByRole('button', { name: /start sandbox|resume sandbox/i })
    await expect(startButton).toBeVisible({ timeout: 90_000 })
    await startButton.click()
    const res = await startResponse
    expect(res.ok()).toBeTruthy()
    const data = (await res.json()) as {
      session_id: string
      sub_problems: Array<{ id: string; kind?: string }>
      arc_complete?: boolean
      guidance?: string
    }
    sessionId = data.session_id

    // The server computed the debugging arc (fresh user → scaffolded, full set).
    expect(data.arc_complete).toBeTruthy()
    expect(data.guidance).toBe('scaffolded')
    const ids = data.sub_problems.map((s) => s.id)
    expect(ids).toEqual(expect.arrayContaining(['env_setup', 'reproduce', 'localize', 'root_cause', 'fix', 'verify']))
    expect(ids).not.toContain('explore_schema')

    // Visual record of the second lab.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'docs/notes/adaptive-ui/debugging-workspace-1440.png' })

    // Finalize (also the cost teardown) and confirm the debug_v1 grade landed.
    const fin = await page.request.post(`/api/claude-code/session/${sessionId}/finalize`)
    expect(fin.ok()).toBeTruthy()
    const { data: row } = await admin()
      .from('claude_code_sessions')
      .select('final_artifact, status')
      .eq('id', sessionId)
      .single()
    const artifact = row?.final_artifact as { rubric?: string } | null
    expect(artifact?.rubric).toBe('debug_v1')
    sessionId = null // finalized above; afterEach only needs the belt-and-braces update
  })
})
