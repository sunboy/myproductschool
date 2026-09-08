import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { VIEWPORTS, loginViaApi, gotoReady, setDensityFlag } from './helpers'

/** First company + one of its roles, used to start a real session via the API. */
async function pickCompanyRole(): Promise<{ companyId: string; roleId: string; discipline: string }> {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await admin
    .from('company_profiles')
    .select('slug, roles')
    .not('roles', 'is', null)
    .limit(20)
  if (error) throw error
  const withRole = (data ?? []).find((c) => Array.isArray(c.roles) && c.roles.length > 0)
  expect(withRole, 'a company with at least one role').toBeTruthy()
  return { companyId: withRole!.slug, roleId: withRole!.roles[0], discipline: 'product_sense' }
}

test.describe('interviews density', () => {
  test.beforeAll(async () => { await setDensityFlag(true) })
  test.afterAll(async () => { await setDensityFlag(false) })

  test('setup band, panel, and recent sessions column render', async ({ page }) => {
    await loginViaApi(page)
    await page.setViewportSize(VIEWPORTS.desktop)
    await gotoReady(page, '/live-interviews')

    await expect(page.getByTestId('chip-mode-single')).toBeVisible()
    await expect(page.getByTestId('chip-mode-loop')).toBeVisible()
    await expect(page.getByTestId('interview-setup-panel')).toBeVisible()
    await expect(page.getByTestId('recent-sessions-column')).toBeVisible()

    await page.getByTestId('chip-mode-loop').click()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('chip-mode-loop')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('interview-setup-panel')).toBeVisible()
  })

  test('room renders three-column layout for an active session', async ({ page }) => {
    await loginViaApi(page)
    const { companyId, roleId, discipline } = await pickCompanyRole()

    const startRes = await page.request.post('/api/live-interview/start', {
      data: { companyId, roleId, discipline },
    })
    expect(startRes.status(), 'start session').toBe(200)
    const { sessionId, companyName, role } = await startRes.json()
    expect(sessionId).toBeTruthy()

    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(
      `/live-interviews/${sessionId}?company=${encodeURIComponent(companyName ?? companyId)}&role=${encodeURIComponent(role ?? roleId)}&discipline=${discipline}&autostart=1`,
      { waitUntil: 'domcontentloaded' }
    )

    await expect(page.getByTestId('room-layout-v2')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('room-bar-v2')).toBeVisible()
    await expect(page.getByTestId('hatch-column')).toBeVisible()
    await expect(page.getByTestId('interview-transcript-column')).toBeVisible()
    await expect(page.getByTestId('room-bar-flow-tracker')).toBeVisible()

    // Notes pad is the center stage for product_sense (artifact: 'none').
    await expect(page.getByTestId('live-interview-notes')).toBeVisible()
    await page.getByTestId('live-interview-notes-input').fill('The user is blocked by a slow checkout flow.')

    // Chat composer sends through the shared TranscriptComposer.
    await page.getByTestId('live-interview-chat-input').fill('Framing the problem for the driver earnings issue.')
    await page.getByTestId('live-interview-chat-send').click()
    await expect(page.getByTestId('live-interview-chat-input')).toHaveValue('', { timeout: 10_000 })

    // End interview opens the existing confirm flow (shared with legacy room,
    // rendered outside the density/legacy branch so it has no density-specific testid).
    await page.getByTestId('live-interview-end').click()
    await expect(page.getByText('End this interview?')).toBeVisible()
  })

  test('room three-column layout at laptop breakpoint', async ({ page }) => {
    await loginViaApi(page)
    const { companyId, roleId, discipline } = await pickCompanyRole()

    const startRes = await page.request.post('/api/live-interview/start', {
      data: { companyId, roleId, discipline },
    })
    expect(startRes.status()).toBe(200)
    const { sessionId, companyName, role } = await startRes.json()

    await page.setViewportSize(VIEWPORTS.laptop)
    await page.goto(
      `/live-interviews/${sessionId}?company=${encodeURIComponent(companyName ?? companyId)}&role=${encodeURIComponent(role ?? roleId)}&discipline=${discipline}&autostart=1`,
      { waitUntil: 'domcontentloaded' }
    )

    await expect(page.getByTestId('room-layout-v2')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('hatch-column')).toBeVisible()
    await expect(page.getByTestId('interview-transcript-column')).toBeVisible()
  })
})
