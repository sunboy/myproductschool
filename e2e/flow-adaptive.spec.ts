/**
 * SUN-251: adaptive FLOW stepper. A fresh (scaffolded) learner gets the hint
 * card open before their first answer; the step API carries the register.
 * No AI calls, no sandbox — this exercises the step GET + workspace render.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

const FLOW_CHALLENGE = 'hp-microsoft-gaming-studio-acquisition'

async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBeTruthy()
}

test.describe('adaptive FLOW stepper (SUN-251)', () => {
  test.describe.configure({ timeout: 150_000 })

  let user: TestUser

  test.afterEach(async () => {
    if (user) await cleanupTestUser(user.id).catch(() => {})
  })

  test('fresh learner is scaffolded: step API returns the register and the hint opens unasked', async ({ page }) => {
    user = await createTestUser()
    await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ).from('profiles').update({ has_seen_hatch_intro: true }).eq('id', user.id)
    await apiLogin(page, user)

    await page.request.get(`/workspace/challenges/${FLOW_CHALLENGE}`).catch(() => {})
    await page.goto(`/workspace/challenges/${FLOW_CHALLENGE}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    })

    // The workspace loads the frame step; capture the step API response.
    const stepRes = await page.waitForResponse(
      (r) => /\/api\/challenges\/.+\/step\/frame\?/.test(r.url()) && r.request().method() === 'GET',
      { timeout: 90_000 },
    )
    const stepBody = (await stepRes.json()) as { guidance?: string }
    expect(stepBody.guidance).toBe('scaffolded')

    // Scaffolded effect: the hint card is open before any interaction.
    await expect(page.getByText(/Hint · /)).toBeVisible({ timeout: 30_000 })
  })
})
