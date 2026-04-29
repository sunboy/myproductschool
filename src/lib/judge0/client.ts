// lib/judge0/client.ts — server-side only
// Never import this file from client components.
import { JUDGE0_LANGUAGE_IDS } from './languageMap'
import type { TestStatus } from '../coding/types'

const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com'

function getKey(): string {
  const key = process.env.JUDGE0_RAPIDAPI_KEY
  if (!key) {
    throw new Error(
      'JUDGE0_RAPIDAPI_KEY is not set. Add it to .env.local (dev) or the production secrets manager.'
    )
  }
  return key
}

async function judge0Fetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://${JUDGE0_HOST}${path}`, {
    ...init,
    headers: {
      'x-rapidapi-key': getKey(),
      'x-rapidapi-host': JUDGE0_HOST,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

export async function submitToJudge0(params: {
  sourceCode: string
  language: keyof typeof JUDGE0_LANGUAGE_IDS
  stdin: string
}): Promise<{ token: string }> {
  const res = await judge0Fetch('/submissions?base64_encoded=false&wait=false', {
    method: 'POST',
    body: JSON.stringify({
      source_code: params.sourceCode,
      language_id: JUDGE0_LANGUAGE_IDS[params.language],
      stdin: params.stdin,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Judge0 submit failed: HTTP ${res.status} — ${body}`)
  }

  return res.json() as Promise<{ token: string }>
}

export async function pollJudge0Result(token: string): Promise<Judge0Result> {
  // Judge0 is async — poll until status.id >= 3 (finished states start at 3).
  const maxAttempts = 20
  const delayMs = 500

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs))

    const res = await judge0Fetch(`/submissions/${token}?base64_encoded=false`)
    if (!res.ok) continue

    const result = (await res.json()) as Judge0Result
    // status.id 1 = In Queue, 2 = Processing, >=3 = terminal state
    if (result.status?.id >= 3) {
      return result
    }
  }

  throw new Error(`Judge0 polling timed out for token ${token}`)
}

/**
 * Map a Judge0 status ID to our internal TestStatus.
 * Note: 'passed'/'failed' here is only about execution success.
 * The actual correctness check compares stdout to expected output.
 */
export function mapJudge0Status(judge0StatusId: number): TestStatus {
  if (judge0StatusId === 3) return 'passed'       // Accepted — ran successfully
  if (judge0StatusId === 4) return 'failed'        // Wrong Answer (when expected_output set)
  if (judge0StatusId === 5) return 'timeout'       // Time Limit Exceeded
  if (judge0StatusId === 6) return 'error'         // Compilation Error
  if (judge0StatusId >= 7 && judge0StatusId <= 12) return 'error' // Runtime errors
  return 'error'                                    // 13 = Internal, 14 = Exec Format, unexpected
}

// Shape of a Judge0 submission result from GET /submissions/:token
export interface Judge0Result {
  status: {
    id: number
    description: string
  }
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  time: string | null      // seconds as string, e.g. "0.042"
  memory: number | null    // KB
  token: string
}
