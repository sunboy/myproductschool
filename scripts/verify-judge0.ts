#!/usr/bin/env npx tsx
/**
 * Verify Judge0 API connectivity.
 * Run via: npx tsx --env-file=.env.local scripts/verify-judge0.ts
 */

const RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY
const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com'

if (!RAPIDAPI_KEY) {
  console.error('ERROR: JUDGE0_RAPIDAPI_KEY is not set in the environment.')
  console.error('Add it to .env.local and retry: npx tsx --env-file=.env.local scripts/verify-judge0.ts')
  process.exit(1)
}

async function main() {
  const url = `https://${RAPIDAPI_HOST}/about`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY!,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    })
  } catch (err) {
    console.error('Network error reaching Judge0:', err)
    process.exit(1)
  }

  if (!res.ok) {
    const body = await res.text()
    console.error(`Judge0 returned HTTP ${res.status}: ${body}`)
    process.exit(1)
  }

  const data = await res.json() as Record<string, unknown>

  console.log('Judge0 about response:', JSON.stringify(data, null, 2))
  console.log()
  console.log(`implementation: ${data.version ?? data.implementation ?? '(not in about endpoint)'}`)
  console.log('Judge0 reachable')
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
