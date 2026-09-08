import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, laptop: { width: 1280, height: 720 }, mobile: { width: 375, height: 812 } } as const
export type ViewportName = keyof typeof VIEWPORTS

export const PRO_USER = { email: 'sandeeptnvs@gmail.com', password: 'Sandeep#89' }

export async function loginViaApi(page: Page, user = PRO_USER) {
  const res = await page.request.post('/api/auth/login', { data: user })
  expect(res.status(), 'login').toBe(200)
}

export async function setDensityFlag(on: boolean) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error } = await admin.from('app_flags').upsert({ key: 'ui_density_v1', value: on, updated_at: new Date().toISOString() })
  if (error) throw error
}

/** y of the first element matching `selector` relative to the viewport. */
export async function topOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).first().boundingBox()
  expect(box, `bounding box for ${selector}`).not.toBeNull()
  return Math.round(box!.y)
}

export async function expectNoConsoleErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await run()
  expect(errors.filter(e => !e.includes('favicon')), 'console errors').toEqual([])
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-shell="v2"]').first().waitFor({ state: 'attached', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}
