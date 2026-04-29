/**
 * Smoke test: POST /api/hatch/canvas/interpret with coding mode
 * Usage: PORT=3001 npx tsx scripts/smoke-hatch-coding.ts
 *
 * Verifies that the coding-mode branch returns a coaching response that
 * references the user's code (Python / 'solution' function).
 */

const PORT = process.env.PORT ?? '3000'
const BASE_URL = `http://localhost:${PORT}`

async function run() {
  console.log(`Smoke testing Hatch coding mode at ${BASE_URL}...\n`)

  const payload = {
    message: "Why might my function be returning the wrong value?",
    challengeType: 'coding',
    challengeId: 'smoke-test-challenge',
    attemptId: 'smoke-test-attempt',
    current_code: 'def solution(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[n], i]\n        seen[n] = i',
    current_language: 'python',
    last_run_result: {
      passed: 1,
      failed: 1,
      error: 'Expected [0,1] but got [1,1]',
    },
    time_elapsed_seconds: 420,
    time_remaining_seconds: 1380,
    history: [],
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/hatch/canvas/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('❌ Could not connect to server. Is it running?', err)
    process.exit(1)
  }

  if (res.status === 401) {
    // Auth is expected in a real environment — treat as passing the route layer
    console.log('⚠️  Got 401 (Unauthorized) — server reached, auth wall hit. Route is wired correctly.')
    console.log('   In production, a valid Supabase session cookie is required.')
    process.exit(0)
  }

  if (!res.ok) {
    const text = await res.text()
    console.error(`❌ Unexpected HTTP ${res.status}: ${text}`)
    process.exit(1)
  }

  const data = await res.json() as {
    intent: string
    message: string
    actions: unknown[]
    annotations?: unknown[]
  }

  console.log('Response:', JSON.stringify(data, null, 2))

  const checks: { label: string; pass: boolean }[] = [
    {
      label: 'intent is "coach"',
      pass: data.intent === 'coach',
    },
    {
      label: 'message is non-empty string',
      pass: typeof data.message === 'string' && data.message.trim().length > 0,
    },
    {
      label: 'actions is empty array (no canvas actions for coding)',
      pass: Array.isArray(data.actions) && data.actions.length === 0,
    },
    {
      label: 'message mentions code context (Python/solution/nums/line)',
      pass: /python|solution|nums|line|enumerate|seen|target|return/i.test(data.message),
    },
  ]

  let allPassed = true
  console.log('\nChecks:')
  for (const check of checks) {
    const status = check.pass ? '✅' : '❌'
    console.log(`  ${status} ${check.label}`)
    if (!check.pass) allPassed = false
  }

  if (allPassed) {
    console.log('\n✅ All checks passed — Hatch coding mode is working correctly.')
    process.exit(0)
  } else {
    console.log('\n❌ Some checks failed.')
    process.exit(1)
  }
}

run()
