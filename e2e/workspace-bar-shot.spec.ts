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
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'docs/notes/adaptive-ui/workspace-bar-coding-1440.png' })
  await cleanupTestUser(user.id).catch(() => {})
})
