'use client'

import { useMemo, useState } from 'react'
import type { TestResult, RunResult } from '@/lib/coding/types'

interface CodeOutputPanelProps {
  results?: RunResult | null
  status: 'idle' | 'running' | 'done' | 'error'
  isSqlMode?: boolean
  errorMessage?: string
}

// Render a table of SQL rows
function SqlResultTable({
  rows,
  label,
  className,
}: {
  rows: Record<string, unknown>[]
  label?: string
  className?: string
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className={`text-xs text-on-surface-variant italic ${className ?? ''}`}>
        {label ? `${label}: ` : ''}(no rows)
      </div>
    )
  }
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-label font-medium text-on-surface-variant mb-1">{label}</p>
      )}
      <div className="overflow-x-auto rounded border border-outline-variant" data-testid="sql-result-table">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-1.5 text-left font-label font-semibold text-on-surface whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-outline-variant/40 hover:bg-surface-container-low"
              >
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 text-on-surface-variant whitespace-nowrap">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getDisplayedActual(result: TestResult): unknown {
  return result.actual !== undefined ? result.actual : result.output
}

function asSqlRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

// Diff between expected and actual SQL rows — highlights missing/extra rows
function SqlRowDiff({
  expected,
  actual,
}: {
  expected: Record<string, unknown>[]
  actual: Record<string, unknown>[]
}) {
  const expectedSet = new Set(expected.map((r) => JSON.stringify(r)))
  const actualSet = new Set(actual.map((r) => JSON.stringify(r)))

  // Rows in expected but not actual = missing (green tint)
  const missing = expected.filter((r) => !actualSet.has(JSON.stringify(r)))
  // Rows in actual but not expected = extra (red tint)
  const extra = actual.filter((r) => !expectedSet.has(JSON.stringify(r)))

  if (missing.length === 0 && extra.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      {missing.length > 0 && (
        <div>
          <p className="text-xs font-label text-primary mb-1">
            Missing rows ({missing.length}):
          </p>
          <div className="bg-primary-container/30 rounded border border-primary/20">
            <SqlResultTable rows={missing} />
          </div>
        </div>
      )}
      {extra.length > 0 && (
        <div>
          <p className="text-xs font-label text-error mb-1">
            Unexpected rows ({extra.length}):
          </p>
          <div className="bg-error/10 rounded border border-error/20">
            <SqlResultTable rows={extra} />
          </div>
        </div>
      )}
    </div>
  )
}

type SqlResultTab = 'actual' | 'expected' | 'diff'

function SqlTabbedResults({ results }: { results: RunResult }) {
  const visibleResults = useMemo(
    () => results.results.filter((result) => !result.hidden),
    [results.results],
  )
  const preferredResult = useMemo(
    () => visibleResults.find((result) => result.status !== 'passed') ?? visibleResults[0] ?? results.results[0],
    [results.results, visibleResults],
  )
  const [selectedId, setSelectedId] = useState(preferredResult?.id ?? '')
  const [activeTab, setActiveTab] = useState<SqlResultTab>('actual')

  const selectedResult = results.results.find((result) => result.id === selectedId) ?? preferredResult
  const selectedIsHidden = Boolean(selectedResult?.hidden)
  const actualRows = asSqlRows(selectedResult ? getDisplayedActual(selectedResult) : undefined)
  const expectedRows = asSqlRows(selectedResult?.expected)

  const renderSelectedTab = () => {
    if (!selectedResult) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">info</span>
          Select a test case to inspect its rows.
        </div>
      )
    }

    if (selectedIsHidden) {
      return (
        <div className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface p-4">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility_off</span>
          <div>
            <p className="font-label text-sm font-bold text-on-surface">Hidden test</p>
            <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
              Hatch runs this on submit, but row-level output is hidden so the test cannot be reverse-engineered.
            </p>
          </div>
        </div>
      )
    }

    if (selectedResult.status === 'error') {
      return (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3">
          <p className="font-label text-xs font-bold uppercase tracking-wider text-error">Execution error</p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-error">
            {selectedResult.errorMessage ?? 'The query could not be executed.'}
          </pre>
        </div>
      )
    }

    if (activeTab === 'expected') {
      return <SqlResultTable rows={expectedRows} label="Expected rows" />
    }

    if (activeTab === 'diff') {
      if (selectedResult.status === 'passed') {
        return (
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-container/40 p-4">
            <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            <div>
              <p className="font-label text-sm font-bold text-on-surface">Rows match</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">No missing or unexpected rows for this test case.</p>
            </div>
          </div>
        )
      }
      return (
        <div>
          <p className="mb-2 font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Row differences
          </p>
          <SqlRowDiff expected={expectedRows} actual={actualRows} />
        </div>
      )
    }

    return <SqlResultTable rows={actualRows} label="Your query output" />
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(150px,220px)_1fr]">
      <div className="border-r border-outline-variant bg-surface-container-low p-2">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Test cases
          </span>
          <span className="rounded-full bg-surface px-1.5 py-0.5 font-label text-[10px] font-bold text-on-surface-variant">
            {results.testsPassed}/{results.testsTotal}
          </span>
        </div>
        <div className="space-y-1">
          {results.results.map((result) => {
            const selected = result.id === selectedResult?.id
            const passed = result.status === 'passed'
            const icon = passed ? 'check_circle' : result.status === 'timeout' ? 'timer_off' : result.status === 'error' ? 'error' : 'cancel'
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => setSelectedId(result.id)}
                className={[
                  'flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary-fixed'
                    : 'border-transparent bg-transparent hover:bg-surface-container',
                ].join(' ')}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${passed ? 'text-primary' : 'text-error'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-label text-xs font-bold text-on-surface">{result.label}</span>
                  <span className="block truncate text-[10.5px] text-on-surface-variant">
                    {result.hidden ? 'Hidden' : result.status}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden bg-surface">
        <div className="flex shrink-0 items-center gap-1 border-b border-outline-variant bg-surface-container-low px-3 py-2">
          {([
            ['actual', 'Your output'],
            ['expected', 'Expected'],
            ['diff', 'Diff'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                'rounded-md px-2.5 py-1 font-label text-xs font-bold transition-colors',
                activeTab === key
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
          {selectedResult && (
            <span className="ml-auto truncate font-label text-xs text-on-surface-variant">
              {selectedResult.label}
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {renderSelectedTab()}
        </div>
      </div>
    </div>
  )
}

function TestResultRow({ result, isSqlMode }: { result: TestResult; isSqlMode: boolean }) {
  const isPassed = result.status === 'passed'
  const isFailed = result.status === 'failed'
  const isError = result.status === 'error'
  const isTimeout = result.status === 'timeout'

  const statusIcon = isPassed ? 'check_circle' : isTimeout ? 'timer_off' : 'cancel'
  const statusColor = isPassed ? 'text-primary' : 'text-error'

  return (
    <div className="border-b border-outline-variant/40 last:border-0 py-2.5 px-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-[18px] flex-shrink-0 ${statusColor}`}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          aria-hidden="true"
        >
          {statusIcon}
        </span>
        <span className="text-sm font-label text-on-surface flex-1">
          {result.hidden ? (
            <span className="italic text-on-surface-variant">{result.label} (hidden)</span>
          ) : (
            result.label
          )}
        </span>
        {result.durationMs !== undefined && (
          <span className="text-xs text-on-surface-variant">{result.durationMs}ms</span>
        )}
      </div>

      {/* Error message */}
      {isError && result.errorMessage && (
        <div className="mt-1.5 ml-7">
          <div className="bg-error/10 border border-error/20 rounded px-2 py-1.5">
            <span className="text-xs font-mono text-error">{result.errorMessage}</span>
          </div>
        </div>
      )}

      {/* Timeout message */}
      {isTimeout && (
        <div className="mt-1.5 ml-7">
          <span className="text-xs text-on-surface-variant">Execution timed out</span>
        </div>
      )}

      {/* For visible failed tests, show expected vs actual */}
      {isFailed && !result.hidden && (
        <div className="mt-2 ml-7 space-y-2">
          {isSqlMode ? (
            // SQL: render as tables with diff highlighting
            <div className="space-y-2">
              {result.expected !== undefined && (
                <SqlResultTable
                  rows={result.expected as Record<string, unknown>[]}
                  label="Expected"
                />
              )}
              {getDisplayedActual(result) !== undefined && (
                <SqlResultTable
                  rows={asSqlRows(getDisplayedActual(result))}
                  label="Got"
                />
              )}
              {result.expected !== undefined && getDisplayedActual(result) !== undefined && (
                <SqlRowDiff
                  expected={asSqlRows(result.expected)}
                  actual={asSqlRows(getDisplayedActual(result))}
                />
              )}
            </div>
          ) : (
            // Non-SQL: render as pre blocks
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <p className="font-label font-medium text-on-surface-variant mb-1 not-italic">
                  Expected:
                </p>
                <pre className="bg-surface-container-high rounded px-2 py-1.5 overflow-x-auto text-on-surface whitespace-pre-wrap break-words">
                  {JSON.stringify(result.expected, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-label font-medium text-on-surface-variant mb-1 not-italic">
                  Got:
                </p>
                <pre className="bg-error/10 rounded px-2 py-1.5 overflow-x-auto text-on-surface whitespace-pre-wrap break-words">
                  {JSON.stringify(getDisplayedActual(result), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CodeOutputPanel({
  results,
  status,
  isSqlMode = false,
  errorMessage,
}: CodeOutputPanelProps) {
  const isRunning = status === 'running'
  const isIdle = status === 'idle'
  const isError = status === 'error'

  return (
    <div
      className="flex flex-col h-full bg-surface-container-low border-t border-outline-variant overflow-hidden"
      data-testid="output-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-container border-b border-outline-variant flex-shrink-0">
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
          terminal
        </span>
        <span className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wide">
          Output
        </span>
        {results && !isRunning && (
          <span
            className={`ml-auto text-xs font-label font-semibold ${
              results.testsPassed === results.testsTotal
                ? 'text-primary'
                : 'text-error'
            }`}
          >
            {results.testsPassed} / {results.testsTotal} passed
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Running state */}
        {isRunning && (
          <div className="flex items-center gap-3 px-4 py-6">
            <span className="material-symbols-outlined text-primary text-xl animate-spin">
              progress_activity
            </span>
            <span className="text-sm text-on-surface-variant font-label">Running tests...</span>
          </div>
        )}

        {/* Idle state */}
        {isIdle && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              play_circle
            </span>
            <p className="text-sm text-on-surface-variant font-label">
              Click Run to test your solution
            </p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="px-3 py-3">
            <div className="bg-error/10 border border-error/20 rounded px-3 py-2.5 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">
                error
              </span>
              <div>
                <p className="text-sm font-label font-medium text-error mb-0.5">
                  Execution failed
                </p>
                <p className="text-xs text-error/80">{errorMessage ?? 'Unknown error. Try again.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'done' && results && results.results.length > 0 && isSqlMode && (
          <SqlTabbedResults key={results.runId} results={results} />
        )}

        {status === 'done' && results && results.results.length > 0 && !isSqlMode && (
          <div className="divide-outline-variant/0">
            {results.results.map((result) => (
              <TestResultRow key={result.id} result={result} isSqlMode={isSqlMode} />
            ))}
          </div>
        )}

        {/* No results */}
        {status === 'done' && (!results || results.results.length === 0) && (
          <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span className="text-sm font-label">No test results available.</span>
          </div>
        )}
      </div>
    </div>
  )
}
