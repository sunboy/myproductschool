/**
 * Visual verification for the feedback overhaul: seeds a realistic completed
 * FLOW attempt (full feedback_json including the Mental Models framework
 * layer) and captures the feedback page at 1440/768/375 into
 * docs/notes/feedback-ui/. Gated behind FEEDBACK_SHOTS=1.
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, cleanupTestUser, type TestUser } from './helpers'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function apiLogin(page: Page, user: TestUser) {
  const res = await page.request.post('/api/auth/login', { data: { email: user.email, password: user.password } })
  expect(res.ok()).toBeTruthy()
}

const FEEDBACK_JSON = {
  overall: 'You framed the problem before reaching for solutions, and the tradeoff you named in Optimize was a real one. The Win step is where the score leaked: the metric had no threshold and no timeline, so the recommendation reads as a hope rather than a bet.',
  total_score: 29,
  max_score: 40,
  grade_label: 'Solid',
  strengths: [
    'You separated the symptom (complaints) from the cause (trust in the earnings data) before proposing anything.',
    'Your option list included one structurally different play, not three variations of the same fix.',
  ],
  improvements: [
    'Name the threshold: "engagement improves" is not falsifiable. Pick the number that would prove you wrong.',
    'The guardrail metric was missing. Every recommendation needs the counter-signal you would watch.',
  ],
  key_insight: 'A recommendation without a falsifiable metric is an opinion with confidence. The threshold is what turns it into a decision.',
  dimensions: [
    { dimension: 'diagnostic_accuracy', score: 8.2, commentary: 'You found the upstream problem on the second read and said why the surface complaint was a symptom.', suggestions: ['Ask whose goal is served earlier: it took three exchanges to name the stakeholder.'] },
    { dimension: 'framing_precision', score: 7.4, commentary: 'The problem statement had the person, the blocker, and the consequence. The scope boundary was implied, not stated.', suggestions: ['State what you are NOT solving. One sentence saves the whole room a detour.'] },
    { dimension: 'metric_fluency', score: 5.1, commentary: 'The metric was directionally right but had no threshold and no timeline, so it cannot fail.', suggestions: ['Use the structure: we will know this worked if X reaches Y by Z. Then name the counter-signal.'] },
    { dimension: 'recommendation_strength', score: 6.8, commentary: 'Clear pick, honest tradeoff. The sacrifice was named, which most attempts skip.', suggestions: ['Close with ownership: who does what next week.'] },
  ],
  mental_models_breakdown: [
    { step: 'frame', competency: 'motivation_theory', reasoning_move: 'Identify friction before designing the fix', demonstrated: 'You asked what blocks drivers from trusting the data before proposing UI.', missed: '', framework_hint: 'Motivation Theory: Motivation, then Friction, then Satisfaction, then Nudge. You worked at Friction.', score: 82 },
    { step: 'list', competency: 'creative_execution', reasoning_move: 'Generate structurally distinct options, not variations', demonstrated: 'Three options with different mechanisms: transparency, verification, incentive.', missed: '', framework_hint: 'Creative Execution: distinct structures beat volume.', score: 74 },
    { step: 'optimize', competency: 'taste', reasoning_move: 'Feel the difference between a tradeoff and a preference', demonstrated: 'You named what the pick gives up, not just what it gains.', missed: 'The criterion was implicit. Say what you are optimizing for before comparing.', framework_hint: 'Taste: a tradeoff has a named sacrifice. A preference just feels cleaner.', score: 66 },
    { step: 'win', competency: 'domain_expertise', reasoning_move: 'A real metric requires domain knowledge to name', demonstrated: 'Right metric family (activation of the earnings view).', missed: 'No threshold, no timeline, no counter-signal. The bet cannot fail as stated.', framework_hint: 'Domain Expertise: thresholds come from knowing the baseline.', score: 51 },
  ],
  weakest_competency: 'domain_expertise',
  detected_patterns: [],
}

test.describe('feedback UI shots', () => {
  test.skip(!process.env.FEEDBACK_SHOTS, 'set FEEDBACK_SHOTS=1')
  test.describe.configure({ timeout: 180_000 })

  let user: TestUser

  test.afterEach(async () => {
    if (user) await cleanupTestUser(user.id).catch(() => {})
  })

  test('FLOW feedback page renders the tiered shell', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300)) })
    user = await createTestUser()
    const c = admin()
    await c.from('profiles').update({ has_seen_hatch_intro: true }).eq('id', user.id)
    const { data: challenge } = await c
      .from('challenges').select('id').eq('challenge_type', 'flow').eq('is_published', true).limit(1).single()
    const { data: attempt, error } = await c.from('challenge_attempts').insert({
      user_id: user.id,
      challenge_id: challenge!.id,
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_score: 29,
      max_score: 40,
      grade_label: 'Solid',
      feedback_json: FEEDBACK_JSON,
      mental_models_breakdown: FEEDBACK_JSON.mental_models_breakdown,
      weakest_competency: 'domain_expertise',
    }).select('id').single()
    expect(error).toBeNull()
    await apiLogin(page, user)

    const url = `/challenges/${challenge!.id}/feedback?attempt=${attempt!.id}`
    await page.request.get(url).catch(() => {})
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })

    // The tiered shell landed: hero score on the canonical scale + grade chip
    // + the framework layer visible (C1 proof).
    await expect(page.getByText('/10').first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('Solid', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Where the score came from')).toBeVisible()
    await expect(page.getByText(/a tradeoff has a named sacrifice/i)).toBeVisible()

    for (const [w, h, name] of [[1440, 900, '1440'], [768, 1024, '768'], [375, 812, '375']] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(900)
      await page.screenshot({ path: `docs/notes/feedback-ui/flow-feedback-${name}.png`, fullPage: false })
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: 'docs/notes/feedback-ui/flow-feedback-full.png', fullPage: true })
    if (consoleErrors.length) console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors.slice(0, 5), null, 1))
  })

  test('live-interview debrief renders the tiered shell', async ({ page }) => {
    user = await createTestUser()
    const c = admin()
    await c.from('profiles').update({ has_seen_hatch_intro: true }).eq('id', user.id)
    const debrief = {
      overallScore: 3.6,
      grade: 'Solid',
      flowScores: { frame: 4.1, list: 3.8, optimize: 3.4, win: 2.9 },
      strengths: [
        'You asked whose goal the feature serves before proposing anything.',
        'The tradeoff in Optimize named a real sacrifice, not a preference.',
      ],
      improvements: [
        'The Win metric had no threshold. Pick the number that would prove you wrong.',
        'You accepted the first framing. Push back once before designing.',
      ],
      competencySignals: [
        { competency: 'motivation_theory', stepDetected: 'frame', signal: 'Separated friction from motivation in the opening read.' },
        { competency: 'strategic_thinking', stepDetected: 'optimize', signal: 'Named the criterion before comparing options.' },
        { competency: 'strategic_thinking', stepDetected: 'win', signal: 'Framed the recommendation as a hypothesis.' },
        { competency: 'cognitive_empathy', stepDetected: 'list', signal: 'Simulated the support team as a stakeholder unprompted.' },
      ],
      failurePatternsDetected: [],
      nextActions: [
        { title: 'Run a Win-move rep', description: 'One challenge focused on falsifiable metrics.', href: '/challenges', type: 'challenge' },
      ],
      nextChallengeRecommendation: 'Practice the metric-threshold structure on a fresh scenario before your next live round.',
    }
    const { data: session, error } = await c.from('live_interview_sessions').insert({
      user_id: user.id,
      role_id: 'swe',
      status: 'completed',
      started_at: new Date(Date.now() - 32 * 60_000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 32 * 60,
      calibration_snapshot: {},
      flow_coverage: {},
      flow_coverage_credits: {},
      total_turns: 18,
      debrief_json: debrief,
    }).select('id').single()
    expect(error).toBeNull()
    await apiLogin(page, user)

    const url = `/live-interviews/${session!.id}/debrief`
    await page.request.get(url).catch(() => {})
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })

    await expect(page.getByText('/10').first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('The four moves')).toBeVisible()
    await expect(page.getByText('Strongest move')).toBeVisible()
    await expect(page.getByText('Competency Signals')).toBeVisible()

    for (const [w, h, name] of [[1440, 900, '1440'], [768, 1024, '768'], [375, 812, '375']] as const) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(900)
      await page.screenshot({ path: `docs/notes/feedback-ui/debrief-${name}.png`, fullPage: false })
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: 'docs/notes/feedback-ui/debrief-full.png', fullPage: true })
  })
})
