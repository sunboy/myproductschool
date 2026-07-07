/**
 * Throwaway visual check for the merged workspace bar (visual-clarity inc. 3).
 * Gated behind BAR_SHOT=1. Captures a real algorithm challenge workspace.
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBeTruthy()
}

test('workspace bar renders merged chrome on a coding challenge', async ({ page }) => {
  test.skip(!process.env.BAR_SHOT, 'set BAR_SHOT=1')
  test.setTimeout(120_000)
  const user = await createTestUser()
  await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .from('profiles').update({ has_seen_hatch_intro: true }).eq('id', user.id)
  await apiLogin(page, user)

  const { data } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .from('challenges').select('id').eq('challenge_type', 'algorithm').eq('is_published', true).limit(1).single()
  await page.request.get(`/workspace/challenges/${data!.id}`).catch(() => {})
  await page.goto(`/workspace/challenges/${data!.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 })

  await expect(page.getByTestId('run-button')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByTestId('submit-button')).toBeVisible()
  for (const [w, h, name] of [[1440, 900, '1440'], [768, 1024, '768'], [375, 812, '375']] as const) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `docs/notes/adaptive-ui/workspace-coding-${name}.png` })
  }
  await cleanupTestUser(user.id).catch(() => {})
})

test('FLOW and canvas workspaces render panelized', async ({ page }) => {
  test.skip(!process.env.BAR_SHOT, 'set BAR_SHOT=1')
  test.setTimeout(180_000)
  const user = await createTestUser()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await admin.from('profiles').update({ has_seen_hatch_intro: true }).eq('id', user.id)
  await apiLogin(page, user)

  for (const [type, slug] of [['flow', 'flow'], ['system_design', 'canvas']] as const) {
    const { data } = await admin
      .from('challenges').select('id').eq('challenge_type', type).eq('is_published', true).limit(1).single()
    await page.request.get(`/workspace/challenges/${data!.id}`).catch(() => {})
    await page.goto(`/workspace/challenges/${data!.id}`, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await page.waitForTimeout(6000)
    for (const [w, h, name] of [[1440, 900, '1440'], [768, 1024, '768']] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(800)
      await page.screenshot({ path: `docs/notes/adaptive-ui/workspace-${slug}-${name}.png` })
    }
  }
  await cleanupTestUser(user.id).catch(() => {})
})
