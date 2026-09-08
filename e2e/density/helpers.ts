import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config as loadDotenv } from 'dotenv'

// Playwright does not auto-load .env.local (that's a Next.js convention). The
// admin helpers below need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
// so load it explicitly; a no-op if the vars are already in the environment.
loadDotenv({ path: '.env.local' })

export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, laptop: { width: 1280, height: 720 }, mobile: { width: 375, height: 812 } } as const
export type ViewportName = keyof typeof VIEWPORTS

export const PRO_USER = { email: 'sandeeptnvs@gmail.com', password: 'Sandeep#89' }

const cookieCache = new Map<string, Array<{ name: string; value: string; domain: string; path: string }>>()

/** Logs in once per user per run (the login route is rate-limited to 10/min/IP) and reuses the cookies. */
export async function loginViaApi(page: Page, user = PRO_USER) {
  // Pre-accept essential cookies so the banner never covers bottom-of-viewport controls.
  await page.addInitScript(() => { try { window.localStorage.setItem('hackproduct_cookie_choice', 'essential') } catch {} })
  const cached = cookieCache.get(user.email)
  if (cached) { await page.context().addCookies(cached); return }
  let res = await page.request.post('/api/auth/login', { data: user })
  for (let i = 0; i < 3 && res.status() === 429; i++) {
    const retry = Number((await res.json().catch(() => ({}))).retryAfter ?? 20)
    await new Promise(r => setTimeout(r, Math.min(65, retry + 1) * 1000))
    res = await page.request.post('/api/auth/login', { data: user })
  }
  expect(res.status(), 'login').toBe(200)
  const cookies = await page.context().cookies()
  cookieCache.set(user.email, cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })))
}

export async function setDensityFlag(on: boolean) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error } = await admin.from('app_flags').upsert({ key: 'ui_density_v1', value: on, updated_at: new Date().toISOString() })
  if (error) throw error
}

/** Resets a user back to "brand new" — clears onboarding_completed_at and drops
 *  any resumable onboarding_state row — so new-user E2E fixtures stay new-user
 *  across repeated runs (the dashboard/welcome flow marks them complete). */
export async function resetOnboarding(userId: string) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error: profileError } = await admin.from('profiles').update({ onboarding_completed_at: null }).eq('id', userId)
  if (profileError) throw profileError
  const { error: stateError } = await admin.from('onboarding_state').delete().eq('user_id', userId)
  if (stateError) throw stateError
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
  // The Next.js dev-tools badge (bottom-left) intercepts clicks on the nav toggle in dev.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(500)
}
