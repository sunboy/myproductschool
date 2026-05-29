import { test, expect } from '@playwright/test'

test.describe('community engagement routes', () => {
  test('community APIs are mounted and protected', async ({ request }) => {
    const gallery = await request.get('/api/community/gallery?challenge_id=fake&attempt_id=fake')
    expect(gallery.status()).not.toBe(404)

    const weeklyRoom = await request.get('/api/community/weekly-room')
    expect(weeklyRoom.status()).not.toBe(404)

    const activityFeed = await request.get('/api/community/activity-feed')
    expect(activityFeed.status()).not.toBe(404)

    const curate = await request.post('/api/admin/community/curate', {
      data: { submission_id: 'fake', action: 'feature' },
    })
    expect(curate.status()).not.toBe(404)
    expect([401, 403]).toContain(curate.status())
  })

  test('weekly room page replaces the old cohort redirect when authenticated', async ({ page }) => {
    await page.route('**/api/community/weekly-room', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        room: {
          id: 'room-1',
          cohort_challenge_id: 'cohort-1',
          title: 'Diagnose the Drop',
          prompt_text: 'Daily active users dropped 15%. Walk through the diagnosis.',
          difficulty: 'standard',
          move_tag: 'frame',
          week_end: new Date(Date.now() + 86400000).toISOString(),
        },
        submission: null,
        days_remaining: 1,
        participants: 12,
        highlights: [],
        hatch_digest: 'Strong answers are segmenting before solutioning.',
      }),
    }))

    await page.goto('/cohort')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth cookies are required for app pages in this environment')
    }

    await expect(page.getByText('Weekly Room')).toBeVisible()
    await expect(page.getByText('Diagnose the Drop')).toBeVisible()
  })
})
