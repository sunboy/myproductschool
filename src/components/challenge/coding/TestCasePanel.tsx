'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { RunResult, TestCase, TestResult } from '@/lib/coding/types'
import {
  RunningIndicator,
  SqlTabbedResults,
  asSqlRows,
  formatValue,
  getDisplayedActual,
  SqlResultTable,
  SqlRowDiff,
} from './resultViews'

export interface TestCasePanelProps {
  /** Visible test cases from challenge metadata (hidden already filtered out). */
  testCases: TestCase[]
  results?: RunResult | null
  status: 'idle' | 'running' | 'done' | 'error'
  isSqlMode: boolean
  errorMessage?: string
  /** Count of metadata test cases where hidden === true (run on submit only). */
  hiddenCount: number
  /** Console collapse: header stays, body hides. */
  collapsed?: boolean
  onToggleCollapse?: () => void
}

type PanelTab = 'cases' | 'results'

function statusDotClass(status: TestResult['status'] | undefined): string {
  switch (status) {
    case 'passed':
      return 'bg-forest-600'
    case 'failed':
    case 'error':
    case 'no_solution':
      return 'bg-error'
    case 'timeout':
      return 'bg-tertiary'
    default:
      return 'bg-hairline-strong'
  }
}

function statusChip(result: TestResult): { label: string; className: string } {
  switch (result.status) {
    case 'passed':
      return { label: 'Passed', className: 'bg-forest-600/10 text-forest-600' }
    case 'failed':
      return { label: 'Failed', className: 'bg-error/10 text-error' }
    case 'error':
      return { label: 'Error', className: 'bg-error/10 text-error' }
    case 'timeout':
      return { label: 'Timed out', className: 'bg-tertiary-container/40 text-tertiary' }
    case 'no_solution':
      return { label: 'No solution', className: 'bg-error/10 text-error' }
  }
}

function inputPreview(testCase: TestCase): string {
  const raw = testCase.args.map((arg) => JSON.stringify(arg)).join(', ')
  return raw.length > 60 ? `${raw.slice(0, 57)}…` : raw
}

function formatInput(testCase: TestCase, result?: TestResult): string {
  if (testCase.args.length > 0) {
    // Compact one-line-per-arg formatting: pretty-printed JSON put every array
    // element on its own line, which rendered "[1,3,5,7,9]" as a 7-line column
    // in the narrow detail pane.
    return testCase.args.map((arg) => JSON.stringify(arg)).join('\n')
  }
  if (result?.input !== undefined) return formatValue(result.input)
  return '—'
}

/**
 * Tabbed console panel for the coding workspace (round-4 ref): a Test Cases
 * tab with a per-case list + detail pane, and a Run Results tab with the
 * run-level summary and the lifted SQL/algo result views. There is no
 * Custom Input tab: the runner executes stored test cases only.
 */
export function TestCasePanel({
  testCases,
  results,
  status,
  isSqlMode,
  errorMessage,
  hiddenCount,
  collapsed = false,
  onToggleCollapse,
}: TestCasePanelProps) {
  const [tab, setTab] = useState<PanelTab>('cases')
  const [selectedId, setSelectedId] = useState<string>(testCases[0]?.id ?? '')

  const resultById = useMemo(() => {
    const map = new Map<string, TestResult>()
    for (const r of results?.results ?? []) map.set(r.id, r)
    return map
  }, [results])

  // On a completed run: select the first failing case so the detail pane
  // opens on the thing to fix. SQL runs jump to Run Results, where the row
  // tables and diff live.
  const runId = results?.runId
  useEffect(() => {
    if (!runId || status !== 'done') return
    if (isSqlMode) {
      setTab('results')
      return
    }
    const firstFailing = testCases.find((tc) => {
      const r = resultById.get(tc.id)
      return r !== undefined && r.status !== 'passed'
    })
    if (firstFailing) setSelectedId(firstFailing.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on run completion only
  }, [runId, status, isSqlMode])

  // Keep the selection valid when the case list changes (part switch).
  useEffect(() => {
    if (testCases.length > 0 && !testCases.some((tc) => tc.id === selectedId)) {
      setSelectedId(testCases[0].id)
    }
  }, [testCases, selectedId])

  const selectedCase = testCases.find((tc) => tc.id === selectedId) ?? testCases[0]
  const selectedResult = selectedCase ? resultById.get(selectedCase.id) : undefined
  const allPassed = results != null && results.testsTotal > 0 && results.testsPassed === results.testsTotal

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card-bright" data-testid="test-case-panel">
      {/* Header: tabs + run summary + collapse */}
      <div
        className={cn(
          'flex h-10 shrink-0 items-center gap-1 bg-card-bright px-2.5',
          !collapsed && 'border-b border-hairline'
        )}
      >
        {([
          ['cases', 'Test Cases'],
          ['results', 'Run Results'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-lg px-2.5 py-1 font-label text-[12.5px] font-bold transition-colors',
              tab === key
                ? 'bg-forest-800 text-white'
                : 'text-ink-secondary hover:bg-page-field hover:text-ink-strong'
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2">
          {results && status !== 'running' && (
            <span
              key={results.runId}
              className={cn(
                'animate-fade-in font-label text-xs font-bold tabular-nums',
                allPassed ? 'text-forest-600' : 'text-error'
              )}
            >
              {results.testsPassed} / {results.testsTotal} passed
            </span>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex size-6 items-center justify-center rounded text-ink-secondary transition-colors hover:bg-page-field hover:text-ink-strong"
              title={collapsed ? 'Expand console' : 'Collapse console'}
              aria-label={collapsed ? 'Expand console' : 'Collapse console'}
              data-testid="console-collapse-button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {collapsed ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </span>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === 'cases' ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="grid min-h-0 flex-1 grid-cols-[minmax(170px,240px)_1fr]">
                {/* Case list */}
                <div className="min-h-0 overflow-y-auto border-r border-hairline bg-page-field p-2">
                  {testCases.length === 0 ? (
                    <p className="px-1 py-2 text-xs text-ink-secondary">
                      This challenge runs its tests on submit only.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {testCases.map((tc) => {
                        const r = resultById.get(tc.id)
                        const selected = selectedCase?.id === tc.id
                        return (
                          <button
                            key={tc.id}
                            type="button"
                            onClick={() => setSelectedId(tc.id)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors',
                              selected
                                ? 'border-forest-600 bg-card-bright'
                                : 'border-transparent hover:bg-card-bright'
                            )}
                            data-testid={`test-case-row-${tc.id}`}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'size-2 shrink-0 rounded-full transition-colors duration-150',
                                statusDotClass(r?.status)
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-label text-xs font-bold text-ink-strong">
                                {tc.label}
                              </span>
                              {tc.args.length > 0 && (
                                <span className="block truncate font-mono text-[10.5px] text-ink-secondary">
                                  {inputPreview(tc)}
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Case detail */}
                <div className="min-h-0 overflow-y-auto p-3">
                  {!selectedCase ? (
                    <p className="text-sm text-ink-secondary">
                      Select a test case to inspect its input and expected output.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-label text-[13px] font-bold text-ink-strong">
                          {selectedCase.label}
                        </span>
                        {selectedResult && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 font-label text-[11px] font-bold',
                              statusChip(selectedResult).className
                            )}
                          >
                            {statusChip(selectedResult).label}
                          </span>
                        )}
                        {selectedResult?.durationMs !== undefined && (
                          <span className="font-label text-[11px] text-ink-muted tabular-nums">
                            {selectedResult.durationMs}ms
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="mb-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                          Input
                        </p>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-container-high px-3 py-2.5 text-xs">
                          {formatInput(selectedCase, selectedResult)}
                        </pre>
                      </div>

                      <div>
                        <p className="mb-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                          Expected output
                        </p>
                        {isSqlMode ? (
                          <SqlResultTable rows={asSqlRows(selectedCase.expected)} />
                        ) : (
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-container-high px-3 py-2.5 text-xs">
                            {formatValue(selectedCase.expected)}
                          </pre>
                        )}
                      </div>

                      {selectedResult && getDisplayedActual(selectedResult) !== undefined && (
                        <div>
                          <p className="mb-1.5 font-label text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                            Your output
                          </p>
                          {isSqlMode ? (
                            <div className="space-y-2">
                              <SqlResultTable rows={asSqlRows(getDisplayedActual(selectedResult))} />
                              {selectedResult.status !== 'passed' && (
                                <SqlRowDiff
                                  expected={asSqlRows(selectedCase.expected)}
                                  actual={asSqlRows(getDisplayedActual(selectedResult))}
                                />
                              )}
                            </div>
                          ) : (
                            <pre
                              className={cn(
                                'overflow-x-auto whitespace-pre-wrap rounded-lg px-3 py-2.5 text-xs transition-colors duration-150',
                                selectedResult.status === 'passed'
                                  ? 'bg-surface-container-high'
                                  : 'bg-error/10'
                              )}
                            >
                              {formatValue(getDisplayedActual(selectedResult))}
                            </pre>
                          )}
                        </div>
                      )}

                      {selectedResult?.errorMessage && (
                        <div className="rounded-lg border border-error/20 bg-error/10 px-3 py-2">
                          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-error">
                            {selectedResult.errorMessage}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {hiddenCount > 0 && (
                <div className="shrink-0 border-t border-hairline px-3 py-1.5">
                  <p className="font-label text-[11px] font-semibold text-ink-muted">
                    +{hiddenCount} hidden {hiddenCount === 1 ? 'test runs' : 'tests run'} on submit
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-y-auto">
              {status === 'running' && <RunningIndicator />}

              {status === 'idle' && (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/40">
                    play_circle
                  </span>
                  <p className="font-label text-sm text-on-surface-variant">
                    Run your code to see results against the visible tests.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="px-3 py-3">
                  <div className="flex items-start gap-2 rounded border border-error/20 bg-error/10 px-3 py-2.5">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-error">error</span>
                    <div>
                      <p className="mb-0.5 font-label text-sm font-medium text-error">Execution failed</p>
                      <p className="text-xs text-error/80">{errorMessage ?? 'Unknown error. Try again.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'done' && results && results.results.length > 0 && (
                isSqlMode ? (
                  <SqlTabbedResults key={results.runId} results={results} />
                ) : (
                  <AlgoRunSummary key={results.runId} results={results} />
                )
              )}

              {status === 'done' && (!results || results.results.length === 0) && (
                <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span className="font-label text-sm">No test results available.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Run-level summary for algorithm runs: banner + per-case rows. Keyed on
 *  runId by the caller so each completed run fades in (no layout shift). */
function AlgoRunSummary({ results }: { results: RunResult }) {
  const visible = results.results.filter((r) => !r.hidden)
  const hiddenInRun = results.results.length - visible.length
  const allPassed = results.testsTotal > 0 && results.testsPassed === results.testsTotal

  return (
    <div className="animate-fade-in flex flex-col">
      <div
        className={cn(
          'mx-3 mt-3 rounded-lg px-3 py-2.5',
          allPassed ? 'note-mint' : 'border border-error/20 bg-error/10'
        )}
      >
        <p
          className={cn(
            'font-label text-sm font-bold tabular-nums',
            allPassed ? 'text-ink-strong' : 'text-error'
          )}
        >
          {results.testsPassed} / {results.testsTotal} tests passed
        </p>
        {!allPassed && (
          <p className="mt-0.5 text-xs text-ink-secondary">
            Open a failing case in the Test Cases tab to compare expected against your output.
          </p>
        )}
      </div>

      <div className="mt-2">
        {visible.map((r) => {
          const chip = statusChip(r)
          return (
            <div key={r.id} className="flex items-center gap-2 border-b border-hairline px-3 py-2 last:border-0">
              <span
                aria-hidden="true"
                className={cn('size-2 shrink-0 rounded-full transition-colors duration-150', statusDotClass(r.status))}
              />
              <span className="min-w-0 flex-1 truncate font-label text-xs font-bold text-ink-strong">{r.label}</span>
              {r.durationMs !== undefined && (
                <span className="font-label text-[11px] text-ink-muted tabular-nums">{r.durationMs}ms</span>
              )}
              <span className={cn('rounded-full px-2 py-0.5 font-label text-[11px] font-bold', chip.className)}>
                {chip.label}
              </span>
            </div>
          )
        })}
        {hiddenInRun > 0 && (
          <p className="px-3 py-2 font-label text-[11px] font-semibold text-ink-muted">
            {hiddenInRun} hidden {hiddenInRun === 1 ? 'test' : 'tests'} graded without exposing {hiddenInRun === 1 ? 'its' : 'their'} input.
          </p>
        )}
      </div>
    </div>
  )
}
