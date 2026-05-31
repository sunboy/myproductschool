// lib/judge0/client.ts — server-side only
// Never import this file from client components.
import { JUDGE0_LANGUAGE_IDS } from './languageMap'
import type { TestStatus } from '../coding/types'

const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com'

export class Judge0UnconfiguredError extends Error {
  readonly isUnconfigured = true
  constructor() {
    super('Code runner not configured. Please contact support.')
  }
}

function getKey(): string {
  const key = process.env.JUDGE0_RAPIDAPI_KEY
  if (!key) {
    throw new Judge0UnconfiguredError()
  }
  return key
}

// ---------------------------------------------------------------------------
// Transient-error handling
// ---------------------------------------------------------------------------
// RapidAPI enforces a per-second rate limit on the shared key. Submitting
// several test cases at once (a batch, or the old parallel-per-test pattern)
// can briefly exceed it and return 429, and the shared CE endpoint occasionally
// 500s under load. Both are transient: retry with backoff instead of failing
// the run. 4xx other than 429 (400/401/422) are caller errors — do not retry.

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 4
const BASE_BACKOFF_MS = 400
const MAX_BACKOFF_MS = 3000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Thrown when a request keeps failing transiently after all retries. */
export class Judge0TransientError extends Error {
  readonly isTransient = true
  constructor(public readonly status: number) {
    super('Code runner is busy. Please try again in a moment.')
  }
}

/** Parse a Retry-After header (seconds, or an HTTP date) into ms, or null. */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const secs = Number(header)
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000)
  const date = Date.parse(header)
  if (Number.isFinite(date)) return Math.max(0, date - Date.now())
  return null
}

/**
 * fetch wrapper that injects host/auth headers and retries transient failures
 * (429 / 5xx / network errors) with Retry-After-aware exponential backoff +
 * jitter. Returns a Response with res.ok true for callers to read; throws
 * Judge0TransientError only after exhausting retries on a retryable status.
 */
async function judge0Fetch(path: string, init: RequestInit = {}): Promise<Response> {
  const key = getKey() // throws Judge0UnconfiguredError if missing — not retried
  let lastStatus = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response
    try {
      res = await fetch(`https://${JUDGE0_HOST}${path}`, {
        ...init,
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': JUDGE0_HOST,
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      })
    } catch (networkErr) {
      // Network/DNS/socket error — treat as transient and retry.
      lastStatus = 0
      if (attempt === MAX_RETRIES) throw networkErr
      await sleep(backoffDelay(attempt, null))
      continue
    }

    if (res.ok || !RETRYABLE_STATUSES.has(res.status)) {
      return res
    }

    // Retryable status — back off and try again (unless out of attempts).
    lastStatus = res.status
    if (attempt === MAX_RETRIES) break
    await sleep(backoffDelay(attempt, parseRetryAfter(res.headers.get('retry-after'))))
  }

  throw new Judge0TransientError(lastStatus)
}

/** Exponential backoff with jitter, honoring an explicit Retry-After when given. */
function backoffDelay(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) return Math.min(retryAfterMs, MAX_BACKOFF_MS)
  const exp = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)
  return exp / 2 + Math.random() * (exp / 2) // 50%-100% of exp, jittered
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

// ---------------------------------------------------------------------------
// Batch submission — one HTTP request for all test cases
// ---------------------------------------------------------------------------
// Judge0's POST /submissions/batch creates several submissions in a single
// request (MAX_SUBMISSION_BATCH_SIZE default 20). Using it instead of N
// parallel single POSTs is what keeps a multi-test run under the per-second
// rate limit. Returns one entry per input, preserving order; an entry without
// a token (Judge0 reports per-item errors inline) carries its error string.

export interface BatchSubmissionInput {
  sourceCode: string
  language: keyof typeof JUDGE0_LANGUAGE_IDS
  stdin: string
}

export interface BatchSubmissionResult {
  token: string | null
  error: string | null
}

const MAX_BATCH = 20 // Judge0 MAX_SUBMISSION_BATCH_SIZE default

export async function submitBatchToJudge0(
  items: BatchSubmissionInput[]
): Promise<BatchSubmissionResult[]> {
  const out: BatchSubmissionResult[] = []

  // Chunk to the batch-size cap (challenges have ~1-3 tests today, but be safe).
  for (let start = 0; start < items.length; start += MAX_BATCH) {
    const chunk = items.slice(start, start + MAX_BATCH)
    const res = await judge0Fetch('/submissions/batch?base64_encoded=false', {
      method: 'POST',
      body: JSON.stringify({
        submissions: chunk.map((it) => ({
          source_code: it.sourceCode,
          language_id: JUDGE0_LANGUAGE_IDS[it.language],
          stdin: it.stdin,
        })),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Judge0 batch submit failed: HTTP ${res.status} — ${body}`)
    }

    // Response is an array aligned to the request order. Each item is either
    // { token } on success or an error object (e.g. { error: [...] }) on a
    // per-submission validation failure.
    const data = (await res.json()) as Array<{ token?: string } & Record<string, unknown>>
    for (const entry of data) {
      if (entry.token) {
        out.push({ token: entry.token, error: null })
      } else {
        out.push({ token: null, error: JSON.stringify(entry) })
      }
    }
  }

  return out
}

export async function pollJudge0Result(token: string): Promise<Judge0Result> {
  // Judge0 is async — poll until status.id >= 3 (finished states start at 3).
  const maxAttempts = 20
  const delayMs = 500

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(delayMs)

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
 * Poll a batch of tokens until all reach a terminal state, in a single
 * GET /submissions/batch?tokens=a,b,c per attempt. Returns results aligned to
 * the input token order. A null token (failed submit) yields null in its slot.
 */
export async function pollJudge0Batch(
  tokens: (string | null)[]
): Promise<(Judge0Result | null)[]> {
  const realTokens = tokens.filter((t): t is string => !!t)
  if (realTokens.length === 0) return tokens.map(() => null)

  const byToken = new Map<string, Judge0Result>()
  const maxAttempts = 30
  const delayMs = 500

  for (let i = 0; i < maxAttempts && byToken.size < realTokens.length; i++) {
    await sleep(delayMs)

    const pending = realTokens.filter((t) => !byToken.has(t))
    const res = await judge0Fetch(
      `/submissions/batch?tokens=${pending.join(',')}&base64_encoded=false`
    )
    if (!res.ok) continue

    const data = (await res.json()) as { submissions?: Judge0Result[] }
    for (const sub of data.submissions ?? []) {
      // status.id >= 3 is terminal; record it and stop re-polling that token.
      if (sub.token && sub.status?.id >= 3) {
        byToken.set(sub.token, sub)
      }
    }
  }

  // Align back to the original token order; unresolved tokens stay null.
  return tokens.map((t) => (t ? byToken.get(t) ?? null : null))
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
