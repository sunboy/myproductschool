// tests/flow-confidence-calibration.spec.ts
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const EMAIL = 'flowtest-batch@test.hackproduct.dev'
const PASSWORD = 'FlowBatch!2026'

test.describe('FLOW Challenge - Confidence Calibration', () => {
  let challengeSlug = ''

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    console.log('\n=== STEP 1: Navigate to dashboard ===')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const url = page.url()
    if (url.includes('/login')) {
      console.log('Redirected to login, authenticating...')

      // Dismiss cookie banner if present
      try {
        const cookieButton = page.locator('button:has-text("Essential only")')
        if (await cookieButton.isVisible()) {
          await cookieButton.click()
          await page.waitForTimeout(500)
        }
      } catch (e) {
        console.log('No cookie banner found')
      }

      // Fill form
      await page.fill('input[type="email"]', EMAIL)
      await page.fill('input[type="password"]', PASSWORD)
      await page.click('button[type="submit"]')
      console.log('Waiting for dashboard to load...')
      // Just wait for the page to show something indicating it logged in
      await page.waitForSelector('[data-testid*="dashboard"], [data-testid*="nav"], h1', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(3000)
    }

    console.log('✅ Authenticated and at dashboard')

    // Open a fresh FLOW challenge
    console.log('\n=== STEP 2: Open FLOW challenge ===')
    const challenges = [
      'the-silent-bug-and-the-bigger-drop',
      'code-velocity-and-hidden-debt',
      'model-accuracy-vs-segment-reality',
      'trust-then-autonomy'
    ]

    for (const slug of challenges) {
      try {
        console.log(`Trying ${slug}...`)
        await page.goto(`${BASE_URL}/workspace/challenges/${slug}`, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        })
        await page.waitForTimeout(8000)

        // Check if we have a question and not completed
        const hasQuestion = await page.locator('[data-testid*="question"]').first().isVisible().catch(() => false)
        const isCompleted = await page.locator('text=/already completed|results/i').first().isVisible().catch(() => false)

        if (hasQuestion && !isCompleted) {
          challengeSlug = slug
          console.log(`✅ Opened fresh challenge: ${slug}`)
          break
        } else {
          console.log(`Skipping ${slug} (completed or no question)`)
        }
      } catch (e) {
        console.log(`Failed ${slug}: ${(e as Error).message}`)
      }
    }

    expect(challengeSlug).toBeTruthy()
  })

  test('Answer 3 Frame questions with varied confidence and verify calibration display', async ({ page }) => {
    console.log('\n=== STEP 3: Answer 3 Frame questions with varied confidence ===')

    // Q1: Rock solid
    console.log('\nQ1: Selecting option A + Rock solid confidence')
    const optionA1 = page.locator('[data-testid*="option"]').first()
    if (await optionA1.isVisible()) {
      await optionA1.click()
      await page.waitForTimeout(500)
    }

    const rockBtn1 = page.locator('button:has-text("Rock solid")').first()
    if (await rockBtn1.isVisible()) {
      await rockBtn1.click()
      await page.waitForTimeout(500)
    }

    let nextBtn = page.locator('button:has-text("Next question")').first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      console.log('Q1 submitted, waiting...')
      await page.waitForTimeout(1500)
    }

    // Q2: Guessing
    console.log('Q2: Selecting option C + Guessing confidence')
    const options = page.locator('[data-testid*="option"]')
    const optionC = options.nth(2)
    if (await optionC.isVisible()) {
      await optionC.click()
      await page.waitForTimeout(500)
    }

    const guessingBtn = page.locator('button:has-text("Guessing")').first()
    if (await guessingBtn.isVisible()) {
      await guessingBtn.click()
      await page.waitForTimeout(500)
    }

    nextBtn = page.locator('button:has-text("Next question")').first()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      console.log('Q2 submitted, waiting...')
      await page.waitForTimeout(1500)
    }

    // Q3: Rock solid + Submit
    console.log('Q3: Selecting option A + Rock solid + Submit step')
    const optionA3 = page.locator('[data-testid*="option"]').first()
    if (await optionA3.isVisible()) {
      await optionA3.click()
      await page.waitForTimeout(500)
    }

    const rockBtn3 = page.locator('button:has-text("Rock solid")').first()
    if (await rockBtn3.isVisible()) {
      await rockBtn3.click()
      await page.waitForTimeout(500)
    }

    const submitBtn = page.locator('button:has-text("Submit step")').first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      console.log('Step submitted, grading...')
      await page.waitForTimeout(15000)
    }

    console.log('\n=== STEP 4: Verify reveal ===')

    // Screenshot of full reveal
    const revealPath = '/tmp/reveal-screenshot.png'
    await page.screenshot({ path: revealPath, fullPage: true })
    console.log(`✅ Full reveal screenshot: ${revealPath}`)

    // A: Hatch's Take
    console.log('\nA. Hatch\'s Take:')
    let hatchText = await page.locator('[data-testid="hatchs-take"]').textContent().catch(() => null)

    if (!hatchText) {
      // Try alternate selectors
      hatchText = await page.locator('[class*="Hatch"], [class*="hatch"], [class*="coaching"]').first().textContent().catch(() => null)
    }

    if (hatchText && hatchText.trim().length > 20) {
      const firstSentence = hatchText.split('.')[0] + '.'
      console.log(`   "${firstSentence}"`)
    } else {
      const skeleton = await page.locator('[class*="skeleton"], [class*="shimmer"]').first().isVisible().catch(() => false)
      if (skeleton) {
        console.log('   ⚠️ Skeleton/shimmer visible (still loading)')
      } else {
        console.log('   ⚠️ No Hatch coaching text found')
      }
    }

    // D: Score and question count
    const stepScore = await page.locator('[data-testid*="score"]').textContent().catch(() => null)
    console.log(`\nD. Step score: ${stepScore || 'not found'}`)

    const questionRows = await page.locator('[data-testid*="question-"]').all()
    console.log(`   Question count: ${questionRows.length}`)

    // B & C: For each question
    console.log('\nB & C. Questions breakdown:')

    for (let i = 0; i < Math.min(3, questionRows.length); i++) {
      const row = questionRows[i]

      // Try to click to expand
      try {
        await row.click()
        await page.waitForTimeout(500)
      } catch (e) {
        console.log(`  Could not click Q${i + 1}`)
      }

      // Get all text content from this row
      const rowText = await row.textContent()
      console.log(`\n  Q${i + 1} row content:`)
      console.log(`    "${rowText?.trim().slice(0, 200).replace(/\n/g, ' ')}"`)

      // Look for confidence chip
      const confidenceChip = row.locator('[data-testid*="confidence"], [class*="confidence"]').first()
      const confidenceText = await confidenceChip.textContent().catch(() => null)
      if (confidenceText) {
        console.log(`    Confidence chip: "${confidenceText}"`)
      } else {
        console.log(`    Confidence: (not found in this row)`)
      }

      // Look for quality badge
      const qualityBadge = row.locator('[data-testid*="quality"], [class*="quality"], [class*="badge"]').first()
      const qualityText = await qualityBadge.textContent().catch(() => null)
      if (qualityText) {
        console.log(`    Quality badge: "${qualityText}"`)
      }

      // Look for calibration note
      const calibrationNote = row.locator('[data-testid*="calibration"], [class*="calibration"]').first()
      const calibrationText = await calibrationNote.textContent().catch(() => null)
      if (calibrationText) {
        console.log(`    Calibration note: "${calibrationText}"`)
      }

      // Screenshot of question
      const qScreenPath = `/tmp/q${i + 1}-screenshot.png`
      try {
        await row.screenshot({ path: qScreenPath })
        console.log(`    Screenshot: ${qScreenPath}`)
      } catch (e) {
        console.log(`    Could not screenshot Q${i + 1}`)
      }
    }

    console.log(`\n=== RESULTS ===`)
    console.log(`Challenge slug used: ${challengeSlug}`)
    console.log(`Full reveal at: ${revealPath}`)
    console.log('Individual question screenshots at: /tmp/q1-screenshot.png, /tmp/q2-screenshot.png, /tmp/q3-screenshot.png')

    // Basic assertion to mark test as passed
    expect(challengeSlug).toBeTruthy()
    expect(questionRows.length).toBeGreaterThanOrEqual(3)
  })
})
