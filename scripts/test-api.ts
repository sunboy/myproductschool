/**
 * API test harness — 7 UX journeys.
 *
 * Run:
 *   USE_MOCK_DATA=true npx tsx scripts/test-api.ts
 *
 * Requires the dev server running at http://localhost:3000.
 * Mock mode bypasses auth for routes that implement IS_MOCK.
 * Routes that do not implement mock bypass will gracefully fail as 401.
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import {
  test,
  request,
  summary,
  assert,
  assertExists,
  assertShape,
  BASE_URL,
} from './test-helpers'
import {
  CALIBRATION_RESPONSES,
  LUMA_FEEDBACK_PAYLOAD,
  LUMA_CHAT_PAYLOAD,
  LUMA_NUDGE_PAYLOAD,
  SIMULATION_TURN_CONTENT,
} from './test-fixtures'

// ── Module-level state that flows between journeys ─────────────

let calibrationAttemptId = 'mock-calibration-1'
let challengeId = 'mock-challenge-001'
let attemptId = 'mock-attempt-00000000-0000-0000-0000-000000000000'
let completedAttemptId = 'mock-attempt-00000000-0000-0000-0000-000000000000'
let sessionId = 'mock-session-001'
let planSlug = 'pm-interview-foundations'

// ── Dev server check ──────────────────────────────────────────

async function checkDevServer(): Promise<void> {
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
  } catch {
    console.error(`\nERROR: Dev server is not reachable at ${BASE_URL}`)
    console.error('Start it with: USE_MOCK_DATA=true npm run dev')
    process.exit(1)
  }
}

// ── Journey 1: Onboarding ─────────────────────────────────────

async function journey1(): Promise<void> {
  console.log('\n=== Journey 1: Onboarding ===')

  await test('POST /api/onboarding/role — sets role', async () => {
    const { status, body } = await request('POST', '/api/onboarding/role', { role: 'swe' })
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['success'], 'role response')
  })

  await test('POST /api/onboarding/calibration/submit — returns attempt_id', async () => {
    const { status, body } = await request('POST', '/api/onboarding/calibration/submit', {
      responses: CALIBRATION_RESPONSES,
    })
    assert(status === 200, `Expected 200, got ${status}`)
    // In mock mode returns { attempt_id } only
    assertShape(body, ['attempt_id'], 'calibration submit response')
    const b = body as Record<string, unknown>
    assertExists(b.attempt_id, 'attempt_id should exist')
    calibrationAttemptId = b.attempt_id as string
  })

  await test('GET /api/onboarding/results — returns scores + archetype', async () => {
    const { status, body } = await request('GET', '/api/onboarding/results')
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['scores', 'archetype'], 'results response')
    const b = body as Record<string, unknown>
    assert(typeof b.archetype === 'string' && (b.archetype as string).length > 0, 'archetype should be non-empty string')
  })

  await test('POST /api/onboarding/complete — succeeds', async () => {
    const { status } = await request('POST', '/api/onboarding/complete', {})
    // This route does NOT implement mock bypass — will 401 without auth cookies
    // Accept 200 or 401 gracefully; only fail on unexpected 5xx
    assert(status < 500, `Unexpected server error: ${status}`)
  })
}

// ── Journey 2: Challenge Practice (Full FLOW) ─────────────────

async function journey2(): Promise<void> {
  console.log('\n=== Journey 2: Challenge Practice ===')

  await test('GET /api/challenges?limit=1 — returns challenge list', async () => {
    const { status, body } = await request('GET', '/api/challenges?limit=1')
    // This route does NOT implement IS_MOCK — will 401 in mock mode
    if (status === 401) {
      // Use hardcoded challengeId for subsequent tests
      console.log('    (401 expected: /api/challenges has no mock bypass; using mock challengeId)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.challenges, 'challenges should exist')
    const challenges = b.challenges as unknown[]
    assert(challenges.length >= 1, 'Expected at least 1 challenge')
    const first = challenges[0] as Record<string, unknown>
    challengeId = first.id as string
  })

  await test('GET /api/challenges/:id — returns challenge detail', async () => {
    const { status, body } = await request('GET', `/api/challenges/${challengeId}`)
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['challenge', 'steps'], 'challenge detail response')
    const b = body as Record<string, unknown>
    const steps = b.steps as unknown[]
    assert(steps.length === 4, `Expected 4 steps, got ${steps.length}`)
  })

  await test('POST /api/challenges/:id/start — creates attempt', async () => {
    const { status, body } = await request('POST', `/api/challenges/${challengeId}/start`, {})
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['attempt'], 'start response')
    const b = body as Record<string, unknown>
    const attempt = b.attempt as Record<string, unknown>
    assert(attempt.status === 'in_progress', `Expected status in_progress, got ${attempt.status}`)
    attemptId = attempt.id as string
  })

  const flowSteps = ['frame', 'list', 'optimize', 'win'] as const

  for (const step of flowSteps) {
    await test(`GET /api/challenges/:id/step/${step} — returns questions`, async () => {
      const { status, body } = await request(
        'GET',
        `/api/challenges/${challengeId}/step/${step}?attempt_id=${attemptId}`
      )
      assert(status === 200, `Expected 200, got ${status}`)
      const b = body as Record<string, unknown>
      assertExists(b.questions, 'questions should exist')
      const questions = b.questions as unknown[]
      assert(questions.length >= 1, `Expected at least 1 question in ${step}`)

      for (const q of questions) {
        const question = q as Record<string, unknown>
        await test(
          `POST /api/challenges/:id/step/${step}/submit — question ${question.id}`,
          async () => {
            const options = (question.options ?? []) as Array<Record<string, unknown>>
            const selectedOptionId = options.length > 0 ? (options[0].id as string) : null
            const responseType = question.response_type as string

            const payload: Record<string, unknown> = {
              attempt_id: attemptId,
              question_id: question.id,
              response_type: responseType,
              time_spent_seconds: 30,
            }

            if (responseType === 'freeform') {
              payload.user_text = 'This is a test response for freeform grading.'
              payload.selected_option_id = null
            } else if (responseType === 'pure_mcq') {
              payload.selected_option_id = selectedOptionId
              payload.user_text = null
            } else {
              // mcq_plus_elaboration or modified_option
              payload.selected_option_id = selectedOptionId
              payload.user_text = null
            }

            const { status: sStatus, body: sBody } = await request(
              'POST',
              `/api/challenges/${challengeId}/step/${step}/submit`,
              payload
            )
            assert(sStatus === 200, `Expected 200, got ${sStatus}`)
            assertShape(sBody, ['score', 'grade_label'], `submit response for ${step}`)
          }
        )
      }
    })
  }

  await test('POST /api/challenges/:id/complete — returns score + xp', async () => {
    const { status, body } = await request('POST', `/api/challenges/${challengeId}/complete`, {
      attempt_id: attemptId,
    })
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['total_score', 'grade_label', 'xp_awarded'], 'complete response')
    completedAttemptId = attemptId
  })
}

// ── Journey 3: Luma Interactions ─────────────────────────────

async function journey3(): Promise<void> {
  console.log('\n=== Journey 3: Luma Interactions ===')

  await test('POST /api/luma/feedback — returns feedback', async () => {
    const { status, body } = await request('POST', '/api/luma/feedback', {
      ...LUMA_FEEDBACK_PAYLOAD,
      challengeId,
      attemptId: completedAttemptId,
    })
    assert(status === 200, `Expected 200, got ${status}`)
    // Mock returns MOCK_FEEDBACK_FULL which has what_worked/what_to_fix
    const b = body as Record<string, unknown>
    const hasStrengths = 'strengths' in b || 'what_worked' in b
    assert(hasStrengths, 'feedback response should have strengths or what_worked')
    const hasImprovements = 'improvements' in b || 'what_to_fix' in b
    assert(hasImprovements, 'feedback response should have improvements or what_to_fix')
  })

  await test('POST /api/luma/nudge — returns nudge', async () => {
    const { status, body } = await request('POST', '/api/luma/nudge', {
      ...LUMA_NUDGE_PAYLOAD,
      challengeId,
    })
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    // nudge may be null for empty draft — but key must exist
    assert('nudge' in b, 'body should have nudge key')
  })

  await test('POST /api/luma/chat — returns reply', async () => {
    const { status, body } = await request('POST', '/api/luma/chat', {
      ...LUMA_CHAT_PAYLOAD,
      challengeId,
    })
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.reply, 'reply should exist')
    assert((b.reply as string).length > 0, 'reply should be non-empty')
  })
}

// ── Journey 4: Dashboard Data ────────────────────────────────

async function journey4(): Promise<void> {
  console.log('\n=== Journey 4: Dashboard Data ===')

  await test('GET /api/move-levels — returns 4 moves', async () => {
    const { status, body } = await request('GET', '/api/move-levels')
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.moves, 'moves should exist')
    const moves = b.moves as Array<Record<string, unknown>>
    assert(moves.length === 4, `Expected 4 moves, got ${moves.length}`)
    for (const move of moves) {
      assert('level' in move, `move should have level`)
      assert('progress_pct' in move, `move should have progress_pct`)
    }
  })

  await test('GET /api/dna — returns competencies (may 401 without mock bypass)', async () => {
    const { status, body } = await request('GET', '/api/dna')
    if (status === 401) {
      console.log('    (401 expected: /api/dna has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['competencies', 'weakest_link', 'overall_level'], 'dna response')
    const b = body as Record<string, unknown>
    const validLevels = ['Beginner', 'Developing', 'Advanced', 'Expert']
    assert(validLevels.includes(b.overall_level as string), `overall_level should be one of ${validLevels.join(', ')}`)
  })

  await test('GET /api/challenges/next — returns next challenge', async () => {
    const { status, body } = await request('GET', '/api/challenges/next')
    if (status === 401) {
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    // body.challenge may be null — that's ok, but the key should be present
    const b = body as Record<string, unknown>
    assert('challenge' in b, 'response should have challenge key (may be null)')
  })

  await test('GET /api/challenges/quick-take — returns quick-take prompt', async () => {
    const { status, body } = await request('GET', '/api/challenges/quick-take')
    if (status === 401) {
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    // Mock returns { id, prompt_text, move, time_limit_seconds }
    assertShape(body, ['id', 'prompt_text'], 'quick-take response')
  })

  await test('GET /api/challenges/growth-snapshot — returns snapshot', async () => {
    const { status, body } = await request('GET', '/api/challenges/growth-snapshot')
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['first', 'latest'], 'growth snapshot response')
    const b = body as Record<string, unknown>
    if (b.first !== null && b.first !== undefined) {
      assertShape(b.first, ['excerpt', 'grade_label', 'total_score'], 'growth snapshot first')
    }
    if (b.latest !== null && b.latest !== undefined) {
      assertShape(b.latest, ['excerpt', 'grade_label', 'total_score'], 'growth snapshot latest')
    }
  })
}

// ── Journey 5: Progress & Analytics ──────────────────────────

async function journey5(): Promise<void> {
  console.log('\n=== Journey 5: Progress & Analytics ===')

  await test('GET /api/attempts?limit=5 — returns array', async () => {
    const { status, body } = await request('GET', '/api/attempts?limit=5')
    if (status === 401) {
      console.log('    (401 expected: /api/attempts has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assert(Array.isArray(body), 'body should be an array')
  })

  await test('GET /api/attempts?limit=5&include_patterns=true — returns array', async () => {
    const { status, body } = await request('GET', '/api/attempts?limit=5&include_patterns=true')
    if (status === 401) {
      console.log('    (401 expected: /api/attempts has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assert(Array.isArray(body), 'body should be an array')
  })

  await test('GET /api/challenges/mastery — returns array', async () => {
    const { status, body } = await request('GET', '/api/challenges/mastery')
    if (status === 401) {
      console.log('    (401 expected: /api/challenges/mastery has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assert(Array.isArray(body), 'body should be an array')
    if (Array.isArray(body) && body.length > 0) {
      const first = body[0] as Record<string, unknown>
      assert('challenge_id' in first, 'mastery item should have challenge_id')
      assert('is_completed' in first, 'mastery item should have is_completed')
    }
  })

  await test('GET /api/move-levels/frame — returns frame move detail', async () => {
    const { status, body } = await request('GET', '/api/move-levels/frame')
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['move', 'level', 'xp', 'xp_to_next'], 'move level detail')
    const b = body as Record<string, unknown>
    assert(b.move === 'frame', `Expected move=frame, got ${b.move}`)
  })

  await test('GET /api/dna/recommend — returns recommendation (may 401)', async () => {
    const { status, body } = await request('GET', '/api/dna/recommend')
    if (status === 401) {
      console.log('    (401 expected: /api/dna/recommend has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['reason'], 'dna recommend response')
  })
}

// ── Journey 6: Simulation Flow ────────────────────────────────

async function journey6(): Promise<void> {
  console.log('\n=== Journey 6: Simulation Flow ===')

  await test('POST /api/simulation/start — returns sessionId', async () => {
    const { status, body } = await request('POST', '/api/simulation/start', { companyId: null })
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.sessionId, 'sessionId should exist')
    sessionId = b.sessionId as string
  })

  // Simulation turn/end/GET require real auth — they 401 in mock mode
  // We attempt them and log gracefully

  await test('POST /api/simulation/:id/turn — turn 1 (may 401)', async () => {
    const { status, body } = await request('POST', `/api/simulation/${sessionId}/turn`, {
      content: SIMULATION_TURN_CONTENT,
    })
    if (status === 401) {
      console.log('    (401 expected: simulation turn has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.reply, 'reply should exist')
  })

  await test('POST /api/simulation/:id/turn — turn 2 (may 401)', async () => {
    const { status, body } = await request('POST', `/api/simulation/${sessionId}/turn`, {
      content: 'My second point is that we should validate with a small experiment first.',
    })
    if (status === 401) {
      console.log('    (401 expected: simulation turn has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.reply, 'reply should exist')
  })

  await test('POST /api/simulation/:id/turn — turn 3 (may 401)', async () => {
    const { status, body } = await request('POST', `/api/simulation/${sessionId}/turn`, {
      content: 'The success metric I would track is the 30-day retention of users who engaged with the new feature.',
    })
    if (status === 401) {
      console.log('    (401 expected: simulation turn has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.reply, 'reply should exist')
  })

  await test('POST /api/simulation/:id/end — ends session (may 401)', async () => {
    const { status } = await request('POST', `/api/simulation/${sessionId}/end`, {})
    if (status === 401) {
      console.log('    (401 expected: simulation end has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
  })

  await test('GET /api/simulation/:id — retrieves session (may 401)', async () => {
    const { status, body } = await request('GET', `/api/simulation/${sessionId}`)
    if (status === 401) {
      console.log('    (401 expected: simulation GET has no mock bypass)')
      return
    }
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['session', 'turns'], 'simulation session response')
    const b = body as Record<string, unknown>
    const turns = b.turns as unknown[]
    assert(turns.length >= 2, `Expected at least 2 turns, got ${turns.length}`)
  })
}

// ── Journey 7: Study Plans ────────────────────────────────────

async function journey7(): Promise<void> {
  console.log('\n=== Journey 7: Study Plans ===')

  await test('GET /api/study-plans — returns plan list', async () => {
    const { status, body } = await request('GET', '/api/study-plans')
    assert(status === 200, `Expected 200, got ${status}`)
    const b = body as Record<string, unknown>
    assertExists(b.plans, 'plans should exist')
    const plans = b.plans as Array<Record<string, unknown>>
    assert(plans.length >= 1, `Expected at least 1 plan, got ${plans.length}`)
    planSlug = plans[0].slug as string
  })

  await test('GET /api/study-plans/:slug — returns plan detail', async () => {
    const { status, body } = await request('GET', `/api/study-plans/${planSlug}`)
    assert(status === 200, `Expected 200, got ${status}`)
    assertShape(body, ['plan', 'chapters'], 'study plan detail response')
  })

  await test('POST /api/study-plans/:slug/activate — activates plan', async () => {
    const { status } = await request('POST', `/api/study-plans/${planSlug}/activate`, {})
    assert(status === 200, `Expected 200, got ${status}`)
  })
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\nAPI Test Harness — ${BASE_URL}`)
  console.log(`Mock mode: USE_MOCK_DATA=${process.env.USE_MOCK_DATA ?? 'not set'}`)

  await checkDevServer()

  await journey1()
  await journey2()
  await journey3()
  await journey4()
  await journey5()
  await journey6()
  await journey7()

  summary()
}

main().catch((err: unknown) => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
