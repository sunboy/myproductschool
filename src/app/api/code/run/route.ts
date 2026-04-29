import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { wrapWithHarness } from '@/lib/judge0/harness'
import { submitToJudge0, pollJudge0Result, mapJudge0Status } from '@/lib/judge0/client'
import type { SupportedJudge0Language } from '@/lib/judge0/languageMap'
import type { RunResult, TestResult } from '@/lib/coding/types'
import { compareOutputs } from '@/lib/coding/compare'
import type { CompareMode } from '@/lib/coding/compare'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 100   // per-user
const SESSION_LIMIT = 50  // per-session

// ---------------------------------------------------------------------------
// Helpers — JSON normalization for expected-vs-actual comparison
// ---------------------------------------------------------------------------

/** Parse a Judge0 stdout line into a JS value for deep-equal comparison. */
function parseOutput(raw: string | null): unknown {
  if (raw === null) return null
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Fall back to the trimmed string itself for non-JSON stdout
    return trimmed
  }
}

/** Deep-equal check after JSON normalization, using the test case's compare_mode. */
function outputsMatch(
  stdout: string | null,
  expected: unknown,
  mode: CompareMode = 'exact'
): boolean {
  const actual = parseOutput(stdout)
  return compareOutputs(actual, expected, mode)
}

// ---------------------------------------------------------------------------
// Rate-limit helpers
// ---------------------------------------------------------------------------

/** Count how many code_run events the user has logged today. */
async function countDailyRuns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // We store code_run events in challenge_attempts.conversation_summary as a
  // JSON event log.  The daily count is approximate — we scan all attempts
  // belonging to the user that were updated today and count code_run events.
  const { data } = await supabase
    .from('challenge_attempts')
    .select('conversation_summary')
    .eq('user_id', userId)
    .gte('updated_at', today.toISOString())

  if (!data) return 0

  let count = 0
  for (const row of data) {
    const events = parseEventLog(row.conversation_summary)
    count += events.filter((e) => e.type === 'code_run').length
  }
  return count
}

/** Count code_run events for a specific attempt (session). */
async function countSessionRuns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attemptId: string
): Promise<number> {
  const { data } = await supabase
    .from('challenge_attempts')
    .select('conversation_summary')
    .eq('id', attemptId)
    .single()

  if (!data) return 0
  const events = parseEventLog(data.conversation_summary)
  return events.filter((e) => e.type === 'code_run').length
}

// ---------------------------------------------------------------------------
// Event log helpers — stored in challenge_attempts.conversation_summary
// ---------------------------------------------------------------------------

interface CodeRunEvent {
  type: 'code_run'
  timestamp: string
  language: string
  testsPassed: number
  testsTotal: number
  runId: string
}

type EventLogEntry = CodeRunEvent | Record<string, unknown>

function parseEventLog(raw: unknown): EventLogEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as EventLogEntry[]
  // conversation_summary may already be a JSON string (canvas sessions store text)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as EventLogEntry[]
    } catch {
      // Not a JSON array — wrap existing content
    }
  }
  return []
}

async function appendCodeRunEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  attemptId: string,
  event: CodeRunEvent
): Promise<void> {
  const { data } = await supabase
    .from('challenge_attempts')
    .select('conversation_summary')
    .eq('id', attemptId)
    .single()

  const events = parseEventLog(data?.conversation_summary)
  events.push(event)

  await supabase
    .from('challenge_attempts')
    .update({ conversation_summary: events })
    .eq('id', attemptId)
}

// ---------------------------------------------------------------------------
// Fetch attempt + challenge from sessionId
// ---------------------------------------------------------------------------

interface TestCase {
  id: string
  label: string
  args: unknown[]
  expected: unknown
  hidden: boolean
  compare_mode?: CompareMode
  /** Positional input types — when present, harness deserializes structured inputs */
  input_types?: string[]
  /** Output type — when present, harness serializes structured output */
  output_type?: string
}

interface ChallengeMetadata {
  test_cases?: TestCase[]
}

async function fetchChallengeContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  userId: string
): Promise<{ attemptId: string; metadata: ChallengeMetadata } | null> {
  // sessionId IS the attempt_id in this codebase
  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, status')
    .eq('id', sessionId)
    .single()

  if (!attempt || attempt.user_id !== userId) return null

  const { data: challenge } = await supabase
    .from('challenges')
    .select('metadata')
    .eq('id', attempt.challenge_id)
    .single()

  if (!challenge) return null

  return {
    attemptId: attempt.id,
    metadata: (challenge.metadata as ChallengeMetadata) ?? {},
  }
}

// ---------------------------------------------------------------------------
// POST /api/code/run
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // --- Auth ---
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // --- Parse body ---
  let body: {
    sessionId?: string
    code?: string
    language?: string
    testCaseIds?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { sessionId, code, language, testCaseIds } = body

  if (!sessionId || !code || !language) {
    return NextResponse.json({ error: 'Missing required fields: sessionId, code, language' }, { status: 400 })
  }

  // --- Reject SQL (handled by sql.js worker in browser) ---
  if (language === 'sql') {
    return NextResponse.json(
      { error: 'SQL execution is handled client-side via the sql.js worker. Do not send SQL to this endpoint.' },
      { status: 400 }
    )
  }

  // --- Validate language ---
  const supportedLanguages: SupportedJudge0Language[] = ['python', 'javascript', 'java', 'cpp', 'go']
  if (!supportedLanguages.includes(language as SupportedJudge0Language)) {
    return NextResponse.json(
      { error: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}` },
      { status: 400 }
    )
  }
  const validatedLanguage = language as SupportedJudge0Language

  // --- Fetch challenge context (attempt ownership + test_cases) ---
  const context = await fetchChallengeContext(supabase, sessionId, user.id)
  if (!context) {
    return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 })
  }
  const { attemptId, metadata } = context

  // --- Rate limiting ---
  const [dailyCount, sessionCount] = await Promise.all([
    countDailyRuns(supabase, user.id),
    countSessionRuns(supabase, attemptId),
  ])

  if (dailyCount >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  }
  if (sessionCount >= SESSION_LIMIT) {
    return NextResponse.json({ error: 'session_limit' }, { status: 429 })
  }

  // --- Filter test cases ---
  const allTestCases: TestCase[] = metadata.test_cases ?? []

  let casesToRun: TestCase[]
  if (testCaseIds && testCaseIds.length > 0) {
    casesToRun = allTestCases.filter((tc) => testCaseIds.includes(tc.id))
  } else {
    // Default: run visible test cases only
    casesToRun = allTestCases.filter((tc) => !tc.hidden)
  }

  if (casesToRun.length === 0) {
    return NextResponse.json({ error: 'No test cases to run' }, { status: 400 })
  }

  // --- Build harness-wrapped source code ---
  const wrappedCode = wrapWithHarness(code, validatedLanguage)

  // --- Submit all test cases to Judge0 in parallel ---
  const runId = randomUUID()

  const submissionTokens = await Promise.all(
    casesToRun.map(async (tc) => {
      // Use structured stdin shape when input_types or output_type is present;
      // fall back to bare array for backward compatibility.
      const stdin =
        (tc.input_types && tc.input_types.length > 0) || tc.output_type
          ? JSON.stringify({ args: tc.args, input_types: tc.input_types ?? [], output_type: tc.output_type ?? null })
          : JSON.stringify(tc.args)
      try {
        const { token } = await submitToJudge0({
          sourceCode: wrappedCode,
          language: validatedLanguage,
          stdin,
        })
        return { tc, token, submitError: null }
      } catch (err) {
        return { tc, token: null, submitError: String(err) }
      }
    })
  )

  // --- Poll for results in parallel ---
  const results: TestResult[] = await Promise.all(
    submissionTokens.map(async ({ tc, token, submitError }): Promise<TestResult> => {
      if (submitError || !token) {
        return {
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: submitError ?? 'Submit failed',
        }
      }

      let judge0Result
      try {
        judge0Result = await pollJudge0Result(token)
      } catch {
        // Polling timed out (>20 attempts)
        return {
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: 'execution timed out',
        }
      }

      const statusId = judge0Result.status?.id ?? 13
      const durationMs = judge0Result.time ? Math.round(parseFloat(judge0Result.time) * 1000) : undefined

      // --- Compilation or runtime error ---
      if (statusId === 6) {
        // Compilation error
        return {
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: judge0Result.compile_output?.trim() ?? 'Compilation error',
          durationMs,
        }
      }

      if (statusId === 5) {
        // Time Limit Exceeded
        return {
          id: tc.id,
          label: tc.label,
          status: 'timeout',
          hidden: tc.hidden,
          durationMs,
        }
      }

      if (statusId >= 7 && statusId <= 14) {
        // Runtime errors and other fatal statuses
        return {
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: judge0Result.stderr?.trim() ?? judge0Result.status.description ?? 'Runtime error',
          durationMs,
        }
      }

      if (statusId !== 3) {
        // Unexpected non-terminal status — treat as error
        return {
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: `Unexpected Judge0 status: ${statusId} (${judge0Result.status?.description})`,
          durationMs,
        }
      }

      // --- Status 3 = Accepted (ran successfully) — compare output ---
      const passed = outputsMatch(judge0Result.stdout, tc.expected, tc.compare_mode)
      const executionStatus = passed ? 'passed' : 'failed'

      // Hidden tests that fail must NOT include output/expected
      if (tc.hidden && !passed) {
        return {
          id: tc.id,
          label: tc.label,
          status: executionStatus,
          hidden: tc.hidden,
          durationMs,
          // No output, no expected — prevent reverse-engineering
        }
      }

      return {
        id: tc.id,
        label: tc.label,
        status: executionStatus,
        hidden: tc.hidden,
        output: parseOutput(judge0Result.stdout),
        expected: tc.expected,
        durationMs,
      }
    })
  )

  const testsPassed = results.filter((r) => r.status === 'passed').length
  const testsTotal = results.length

  const runResult: RunResult = {
    runId,
    testsPassed,
    testsTotal,
    results,
  }

  // --- Log code_run event to conversation_summary ---
  // Fire-and-forget — don't block response on this
  appendCodeRunEvent(supabase, attemptId, {
    type: 'code_run',
    timestamp: new Date().toISOString(),
    language: validatedLanguage,
    testsPassed,
    testsTotal,
    runId,
  }).catch((err) => {
    console.error('[code/run] Failed to log event:', err)
  })

  return NextResponse.json(runResult)
}
