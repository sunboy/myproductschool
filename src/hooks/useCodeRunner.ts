'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { RunResult, SupportedLanguage } from '@/lib/coding/types'

// ---------------------------------------------------------------------------
// Challenge metadata shapes — typed loosely to avoid coupling to the full
// Challenge type. The hook only needs the parts it actually uses.
// ---------------------------------------------------------------------------

export interface SqlTestCase {
  id: string
  label: string
  hidden: boolean
  expected_rows: Record<string, unknown>[]
  match_mode: 'exact' | 'exact_unordered' | 'contains'
  /** Per-test dataset; the worker runs this instead of the shared setup_script. */
  setup_override?: string
}

export interface AlgorithmicTestCase {
  id: string
  label: string
  hidden: boolean
  args: unknown[]
  expected: unknown
}

export type CodingTestCase = SqlTestCase | AlgorithmicTestCase

export interface SqlSchema {
  setup_script: string
  schema_diagram?: unknown
  sample_data_preview?: unknown
}

export interface CodingChallengeMetadata {
  sql_schema?: SqlSchema
  test_cases?: CodingTestCase[]
  starter_code?: Record<string, string>
}

/** Minimal challenge shape the hook needs. Callers pass a Challenge or ChallengeWithDomain. */
export interface CodingChallengeForRunner {
  id: string
  metadata?: CodingChallengeMetadata | Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Hook args + return
// ---------------------------------------------------------------------------

export interface UseCodeRunnerArgs {
  challenge: CodingChallengeForRunner
  attemptId: string
  language: SupportedLanguage
  onLastRunResult?: (result: RunResult) => void
  onCodeRun?: (result: RunResult) => void
}

export type CodeRunnerStatus = 'idle' | 'hydrating' | 'ready' | 'running'

export interface UseCodeRunnerReturn {
  status: CodeRunnerStatus
  lastRunResult: RunResult | null
  sqlError: string | null
  /** Run visible test cases (or a specific subset by ID). */
  run: (code: string, testCaseIds?: string[]) => Promise<RunResult | null>
  /** Run ALL test cases (visible + hidden) — used for final submit. */
  submit: (code: string) => Promise<RunResult | null>
}

// ---------------------------------------------------------------------------
// Worker message types
// ---------------------------------------------------------------------------

interface WorkerHydrateMessage {
  action: 'hydrate'
  setupScript: string
  requestId: string
}

interface WorkerRunMessage {
  action: 'run'
  userQuery: string
  testCases: SqlTestCase[]
  requestId: string
}

interface WorkerHydrateOkResponse {
  action: 'hydrate_ok'
  requestId: string
}

interface WorkerHydrateErrorResponse {
  action: 'hydrate_error'
  requestId: string
  errorMessage: string
}

interface WorkerRunCompleteResponse {
  action: 'run_complete'
  requestId: string
  results: RunResult['results']
  testsPassed: number
  testsTotal: number
}

type WorkerResponse =
  | WorkerHydrateOkResponse
  | WorkerHydrateErrorResponse
  | WorkerRunCompleteResponse

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSqlChallenge(metadata: CodingChallengeMetadata | Record<string, unknown> | undefined): boolean {
  if (!metadata) return false
  return Boolean((metadata as CodingChallengeMetadata).sql_schema?.setup_script)
}

export function getTestCases(metadata: CodingChallengeMetadata | Record<string, unknown> | undefined): CodingTestCase[] {
  if (!metadata) return []
  return (metadata as CodingChallengeMetadata).test_cases ?? []
}

function randomId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// ---------------------------------------------------------------------------
// useCodeRunner
// ---------------------------------------------------------------------------

export function useCodeRunner({
  challenge,
  attemptId,
  language,
  onLastRunResult,
  onCodeRun,
}: UseCodeRunnerArgs): UseCodeRunnerReturn {
  const [status, setStatus] = useState<CodeRunnerStatus>('idle')
  const [lastRunResult, setLastRunResult] = useState<RunResult | null>(null)
  const [sqlError, setSqlError] = useState<string | null>(null)

  // Stable ref to the Web Worker (SQL path only)
  const workerRef = useRef<Worker | null>(null)

  // Map of pending run requestId → settlers (used to correlate worker responses).
  // Both resolve and reject are kept so worker errors and timeouts can settle
  // the promise — a resolver that only ever resolves on run_complete leaves
  // await codeRunner.submit() hanging forever when the worker dies.
  const pendingRunsRef = useRef<Map<string, { resolve: (result: RunResult) => void; reject: (err: Error) => void }>>(new Map())

  const rejectAllPendingRuns = (message: string) => {
    for (const { reject } of pendingRunsRef.current.values()) {
      reject(new Error(message))
    }
    pendingRunsRef.current.clear()
  }

  const metadata = challenge.metadata as CodingChallengeMetadata | Record<string, unknown> | undefined
  const isSql = isSqlChallenge(metadata)

  // -------------------------------------------------------------------------
  // SQL Worker lifecycle — mount / unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isSql) {
      // Non-SQL: immediately ready — no worker needed
      setStatus('ready')
      return
    }

    // SQL: spawn worker and hydrate
    const setupScript = (metadata as CodingChallengeMetadata).sql_schema!.setup_script
    const worker = new Worker('/workers/sql-worker.js')
    workerRef.current = worker

    const hydrateRequestId = randomId()
    setStatus('hydrating')
    setSqlError(null)

    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.action === 'hydrate_ok' && data.requestId === hydrateRequestId) {
        setStatus('ready')
        return
      }

      if (data.action === 'hydrate_error' && data.requestId === hydrateRequestId) {
        setSqlError(data.errorMessage)
        setStatus('idle')
        rejectAllPendingRuns(data.errorMessage || 'The SQL environment failed to load.')
        return
      }

      if (data.action === 'run_complete') {
        const pending = pendingRunsRef.current.get(data.requestId)
        if (!pending) return

        pendingRunsRef.current.delete(data.requestId)

        const result: RunResult = {
          runId: data.requestId,
          testsPassed: data.testsPassed,
          testsTotal: data.testsTotal,
          results: data.results,
        }

        pending.resolve(result)
      }
    }

    worker.onerror = (err) => {
      setSqlError(err.message ?? 'Worker error')
      setStatus('idle')
      rejectAllPendingRuns(err.message ?? 'The SQL runner crashed. Run again to retry.')
    }

    const hydrateMsg: WorkerHydrateMessage = {
      action: 'hydrate',
      setupScript,
      requestId: hydrateRequestId,
    }
    worker.postMessage(hydrateMsg)

    return () => {
      worker.terminate()
      workerRef.current = null
      rejectAllPendingRuns('The SQL runner was reset.')
      setStatus('idle')
    }
    // Re-hydrate if the challenge changes (Try Again / new challenge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id, isSql])

  // -------------------------------------------------------------------------
  // Internal run via SQL worker
  // -------------------------------------------------------------------------

  const runViaSql = useCallback(
    (code: string, testCasesToRun: SqlTestCase[]): Promise<RunResult | null> => {
      const worker = workerRef.current
      if (!worker) return Promise.resolve(null)

      return new Promise<RunResult>((resolve, reject) => {
        const requestId = randomId()
        // Local runs are fast; 30s covers the worst pathological query while
        // still guaranteeing the awaiting submit/run handler always settles.
        const timer = setTimeout(() => {
          if (pendingRunsRef.current.delete(requestId)) {
            reject(new Error('The SQL runner timed out. Run again to retry.'))
          }
        }, 30_000)
        pendingRunsRef.current.set(requestId, {
          resolve: (result) => { clearTimeout(timer); resolve(result) },
          reject: (err) => { clearTimeout(timer); reject(err) },
        })

        const msg: WorkerRunMessage = {
          action: 'run',
          userQuery: code,
          testCases: testCasesToRun,
          requestId,
        }
        worker.postMessage(msg)
      })
    },
    []
  )

  // -------------------------------------------------------------------------
  // Internal run via Judge0 (/api/code/run)
  // -------------------------------------------------------------------------

  const runViaJudge0 = useCallback(
    async (code: string, testCaseIds?: string[]): Promise<RunResult | null> => {
      const body: {
        sessionId: string
        code: string
        language: string
        testCaseIds?: string[]
      } = {
        sessionId: attemptId,
        code,
        language,
      }
      if (testCaseIds && testCaseIds.length > 0) {
        body.testCaseIds = testCaseIds
      }

      let res: Response
      try {
        res = await fetch('/api/code/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          // Never let the spinner outlive the server budget (maxDuration=40s);
          // sit just above it so the server's friendly result wins the race.
          signal: AbortSignal.timeout(45_000),
        })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'TimeoutError') {
          throw new Error('The code runner timed out. Give it a moment and run again.')
        }
        throw err
      }

      if (res.status === 401) {
        // Recoverable: the access token lapsed. Surface a friendly message; the
        // workspace's live Supabase client refreshes in the background, so a
        // re-run usually succeeds. Don't crash the workspace.
        throw new Error('Your session timed out. Refreshing — run again in a moment.')
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err?.error ?? `HTTP ${res.status}`)
      }

      return res.json() as Promise<RunResult>
    },
    [attemptId, language]
  )

  // -------------------------------------------------------------------------
  // Public: run(code, testCaseIds?)
  // Runs visible test cases by default; pass testCaseIds to override.
  // -------------------------------------------------------------------------

  const run = useCallback(
    async (code: string, testCaseIds?: string[]): Promise<RunResult | null> => {
      if (status === 'running') return null

      setStatus('running')
      let result: RunResult | null = null

      try {
        if (isSql) {
          const allTestCases = getTestCases(metadata) as SqlTestCase[]
          let casesToRun: SqlTestCase[]

          if (testCaseIds && testCaseIds.length > 0) {
            casesToRun = allTestCases.filter((tc) => testCaseIds.includes(tc.id))
          } else {
            // Default: visible test cases only
            casesToRun = allTestCases.filter((tc) => !tc.hidden)
          }

          result = await runViaSql(code, casesToRun)
        } else {
          result = await runViaJudge0(code, testCaseIds)
        }
      } finally {
        // Always restore to ready even on error
        setStatus('ready')
      }

      if (result) {
        setLastRunResult(result)
        onLastRunResult?.(result)
        onCodeRun?.(result)
      }

      return result
    },
    [status, isSql, metadata, runViaSql, runViaJudge0, onLastRunResult, onCodeRun]
  )

  // -------------------------------------------------------------------------
  // Public: submit(code)
  // Same as run() but always passes ALL test case IDs (visible + hidden).
  // -------------------------------------------------------------------------

  const submit = useCallback(
    async (code: string): Promise<RunResult | null> => {
      if (status === 'running') return null

      setStatus('running')
      let result: RunResult | null = null

      try {
        if (isSql) {
          // Pass all test cases (visible + hidden) to the worker
          const allTestCases = getTestCases(metadata) as SqlTestCase[]
          result = await runViaSql(code, allTestCases)
        } else {
          // Pass all test case IDs explicitly to the server
          const allTestCases = getTestCases(metadata) as AlgorithmicTestCase[]
          const allIds = allTestCases.map((tc) => tc.id)
          result = await runViaJudge0(code, allIds.length > 0 ? allIds : undefined)
        }
      } finally {
        setStatus('ready')
      }

      if (result) {
        setLastRunResult(result)
        onLastRunResult?.(result)
        onCodeRun?.(result)
      }

      return result
    },
    [status, isSql, metadata, runViaSql, runViaJudge0, onLastRunResult, onCodeRun]
  )

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    status,
    lastRunResult,
    sqlError,
    run,
    submit,
  }
}
