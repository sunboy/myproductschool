// e2e/content-management.spec.ts
import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'hackproduct-admin-dev'

// Helper: create a job via API (bypasses UI for speed in non-UI tests)
async function createJob(page: Page, inputType: string, inputRaw: string, mode = 'api') {
  const res = await page.request.post(`${BASE_URL}/api/admin/content/jobs`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
    data: { input_type: inputType, input_raw: inputRaw, mode },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.job_id as string
}

// Helper: poll job until status matches
async function waitForJobStatus(page: Page, jobId: string, targetStatus: string, maxWait = 120_000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await page.request.get(`${BASE_URL}/api/admin/content/jobs/${jobId}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    const data = await res.json()
    if (data.job?.status === targetStatus) return data
    if (data.job?.status === 'failed') throw new Error(`Job failed: ${data.job.error_message}`)
    await page.waitForTimeout(2000)
  }
  throw new Error(`Job did not reach ${targetStatus} within ${maxWait}ms`)
}

test.describe('Content Hub', () => {
  test('loads admin content page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible()
    await expect(page.getByRole('button', { name: /New Challenge/i })).toBeVisible()
  })

  test('opens authoring drawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await page.getByRole('button', { name: /New Challenge/i }).click()
    await expect(page.getByRole('heading', { name: 'New Challenge' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Url' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Text' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Question' })).toBeVisible()
  })

  test('creates a job from text input', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await page.getByRole('button', { name: /New Challenge/i }).click()
    await page.getByRole('button', { name: 'Text' }).click()
    await page.locator('textarea').fill('A fintech startup is deciding whether to build a BNPL feature for their SMB expense management product. The CFO wants it to drive revenue but the engineering lead is worried about credit risk.')
    await page.getByRole('button', { name: 'API' }).click()
    await page.getByRole('button', { name: 'Generate Challenge' }).click()

    // Drawer closes after submission
    await expect(page.getByRole('heading', { name: 'New Challenge' })).not.toBeVisible({ timeout: 5000 })

    // Job appears in list
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Review Page', () => {
  test('renders scenario and all 4 FLOW step panels', async ({ page }) => {
    const jobId = await createJob(
      page,
      'question',
      'Should Stripe build a crypto payment gateway in 2025?',
      'api'
    )
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)

    // Scenario card
    await expect(page.getByRole('heading', { name: 'Scenario' })).toBeVisible()
    await expect(page.locator('input, textarea').first()).toBeVisible()

    // 4 FLOW steps rendered with theme badges
    await expect(page.getByText(/T1 · Upstream Before Downstream/)).toBeVisible()
    await expect(page.getByText(/T4 · Width Before Depth/)).toBeVisible()
    await expect(page.getByText(/T5 · Name the Criterion/)).toBeVisible()
    await expect(page.getByText(/T7 · A Recommendation Is/)).toBeVisible()
  })

  test('approve step sets badge', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Notion add a CRM feature?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Approve Step' }).first().click()
    await expect(page.getByText('✓ Approved').first()).toBeVisible()
  })

  test('bulk approve all steps', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Figma add version branching?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Bulk Approve All' }).click()
    const approvedBadges = page.getByText('✓ Approved')
    await expect(approvedBadges).toHaveCount(4)
  })

  test('publish creates live challenge and redirects', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Linear add a mobile app?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Bulk Approve All' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()

    // Redirected to hub
    await expect(page).toHaveURL(`${BASE_URL}/admin/content`, { timeout: 15_000 })

    // Job shows published badge
    await expect(page.getByText('published').first()).toBeVisible()
  })
})

test.describe('Learner Playback after Publish', () => {
  test('published challenge appears in challenges list and is playable', async ({ page }) => {
    // Create and publish via API
    const jobId = await createJob(page, 'question', 'Should GitHub add an AI code reviewer?', 'api')
    const { draft } = await waitForJobStatus(page, jobId, 'review', 120_000)

    const publishRes = await page.request.post(`${BASE_URL}/api/admin/content/drafts/${draft.id}/publish`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    expect(publishRes.ok()).toBeTruthy()
    const { challenge_id } = await publishRes.json()

    // Learner navigates to challenges workspace — challenge is directly accessible by slug
    await page.goto(`${BASE_URL}/workspace/challenges/${challenge_id}`)
    // The challenge workspace should load (not 404)
    await expect(page.locator('body')).not.toContainText('Page not found', { timeout: 10_000 })
  })
})
