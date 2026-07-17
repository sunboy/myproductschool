'use client'

import { useEffect, useMemo, useState } from 'react'
import type { TestResult, RunResult } from '@/lib/coding/types'

interface CodeOutputPanelProps {
  results?: RunResult | null
  status: 'idle' | 'running' | 'done' | 'error'
  isSqlMode?: boolean
  errorMessage?: string
  /** Console collapse (visual-clarity overhaul): header stays, body hides. */
  collapsed?: boolean
  onToggleCollapse?: () => void
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

// Diff between expected and actual SQL rows - highlights missing/extra rows
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
          <p className="text-xs font-label text-forest-600 mb-1">
            Missing rows ({missing.length}):
          </p>
          <div className="rounded-lg note-mint">
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
            <p className="font-label text-sm font-semibold text-on-surface">Private grader test</p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-on-surface-variant">
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
          <div className="note-mint flex items-start gap-2 p-4">
            <span className="material-symbols-outlined text-[18px] text-forest-600">check_circle</span>
            <div>
              <p className="font-label text-sm font-bold text-ink-strong">Rows match</p>
              <p className="mt-0.5 text-xs text-ink-secondary">No missing or unexpected rows for this test case.</p>
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
      <div className="border-r border-hairline bg-page-field p-2">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="font-label text-[11px] font-bold text-ink-secondary">
            Test cases
          </span>
          <span className="rounded-full bg-card-bright border border-hairline px-1.5 py-0.5 font-label text-[10px] font-bold text-ink-secondary tabular-nums">
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
                    ? 'border-forest-600 bg-card-bright'
                    : 'border-transparent bg-transparent hover:bg-card-bright',
                ].join(' ')}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${passed ? 'text-forest-600' : 'text-error'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-label text-xs font-bold text-ink-strong">{result.label}</span>
                  <span className="block truncate text-[10.5px] font-medium text-ink-secondary">
                    {result.hidden ? 'Private' : result.status}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden bg-card-bright">
        <div className="flex shrink-0 items-center gap-1 border-b border-hairline bg-card-bright px-3 py-2">
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
                'rounded-lg px-2.5 py-1 font-label text-xs font-bold transition-colors',
                activeTab === key
                  ? 'bg-forest-800 text-white'
                  : 'text-ink-secondary hover:bg-page-field hover:text-ink-strong',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
          {selectedResult && (
            <span className="ml-auto truncate font-label text-xs text-ink-muted">
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

// LeetCode-style case navigation for algorithm results (visual-clarity inc. 5):
// Case chips with status dots + a Testcase | Result tab pair. Hidden test
// cases stay summarized (their inputs are not exposed). SQL mode keeps its
// own master-detail below.
function AlgoTabbedResults({ results }: { results: RunResult }) {
  const visible = results.results.filter((r) => !r.hidden)
  const hiddenCount = results.results.length - visible.length
  const [activeIdx, setActiveIdx] = useState(0)
  const [view, setView] = useState<'testcase' | 'result'>('result')
  const active = visible[Math.min(activeIdx, Math.max(0, visible.length - 1))]

  const fmt = (v: unknown) =>
    v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v, null, 2)

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">visibility_off</span>
        <span className="text-sm font-label">
          All {results.results.length} test cases are hidden. {results.testsPassed}/{results.testsTotal} passed.
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* View tabs + case chips */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 flex-wrap border-b border-hairline">
        <div className="flex items-center gap-1">
          {(['testcase', 'result'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-label font-bold transition-colors ${
                view === v
                  ? 'bg-forest-800 text-white'
                  : 'text-ink-secondary hover:bg-page-field'
              }`}
            >
              {v === 'testcase' ? 'Testcase' : 'Result'}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-hairline" />
        <div className="flex items-center gap-1 flex-wrap">
          {visible.map((r, i) => {
            const isActive = i === activeIdx
            const passed = r.status === 'passed'
            return (
              <button
                key={r.id}
                onClick={() => setActiveIdx(i)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-label font-bold transition-colors border ${
                  isActive
                    ? 'border-hairline bg-page-field text-ink-strong'
                    : 'border-transparent text-ink-secondary hover:bg-page-field'
                }`}
                data-testid={`case-chip-${i + 1}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-forest-600' : 'bg-error'}`}
                />
                Case {i + 1}
              </button>
            )
          })}
          {hiddenCount > 0 && (
            <span className="text-[11px] font-label text-ink-muted px-1.5">
              +{hiddenCount} hidden
            </span>
          )}
        </div>
      </div>

      {/* Selected case */}
      <div className="flex-1 overflow-y-auto">
        {active && view === 'testcase' && (
          <div className="px-3 py-3 flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-label font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Input</p>
              <pre className="text-xs bg-surface-container-high rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap">{fmt(active.input)}</pre>
            </div>
            <div>
              <p className="text-[11px] font-label font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Expected output</p>
              <pre className="text-xs bg-surface-container-high rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap">{fmt(active.expected)}</pre>
            </div>
          </div>
        )}
        {active && view === 'result' && (
          <TestResultRow key={active.id} result={active} isSqlMode={false} forceDetails />
        )}
      </div>
    </div>
  )
}

function TestResultRow({ result, isSqlMode, forceDetails = false }: { result: TestResult; isSqlMode: boolean; forceDetails?: boolean }) {
  const isPassed = result.status === 'passed'
  const isFailed = result.status === 'failed'
  const isError = result.status === 'error'
  const isTimeout = result.status === 'timeout'

  const statusIcon = isPassed ? 'check_circle' : isTimeout ? 'timer_off' : 'cancel'
  const statusColor = isPassed ? 'text-forest-600' : 'text-error'

  return (
    <div className="border-b border-hairline last:border-0 py-2.5 px-3">
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
            <span className="italic text-on-surface-variant">{result.label} (private)</span>
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

      {/* For visible failed tests (or the dedicated Result view), show expected vs actual */}
      {(isFailed || forceDetails) && !result.hidden && (
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
  collapsed = false,
  onToggleCollapse,
}: CodeOutputPanelProps) {
  const isRunning = status === 'running'
  const isIdle = status === 'idle'
  const isError = status === 'error'

  return (
    <div
      className="flex flex-col h-full bg-card-bright overflow-hidden"
      data-testid="output-panel"
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-3.5 h-10 bg-card-bright ${collapsed ? '' : 'border-b border-hairline'} flex-shrink-0`}>
        <span className="material-symbols-outlined text-[15px] text-ink-secondary">
          terminal
        </span>
        <span className="text-[12.5px] font-label font-bold text-ink-strong">
          Test results
        </span>
        <span className="ml-auto flex items-center gap-2">
          {results && !isRunning && (
            <span
              className={`text-xs font-label font-bold tabular-nums ${
                results.testsPassed === results.testsTotal
                  ? 'text-forest-600'
                  : 'text-error'
              }`}
            >
              {results.testsPassed} / {results.testsTotal} passed
            </span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="inline-flex items-center justify-center w-6 h-6 rounded text-ink-secondary hover:text-ink-strong hover:bg-page-field transition-colors"
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

      {/* Content */}
      {!collapsed && (
      <div className="flex-1 overflow-y-auto">
        {/* Running state */}
        {isRunning && <RunningIndicator />}

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
          <AlgoTabbedResults key={results.runId} results={results} />
        )}

        {/* No results */}
        {status === 'done' && (!results || results.results.length === 0) && (
          <div className="flex items-center gap-2 px-3 py-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span className="text-sm font-label">No test results available.</span>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

/**
 * Visible progress for a run in flight. A code run can take a few seconds (the
 * runner submits to a shared sandbox, then polls for results), and under load
 * it can take longer. A static spinner reads as "hung"; this advances a staged
 * message and an elapsed counter so the user always sees motion, plus a
 * reassurance line once a run runs long.
 */
function RunningIndicator() {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const startedAt = Date.now()
    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => clearInterval(interval)
  }, [])

  const seconds = Math.floor(elapsedMs / 1000)
  // Staged copy advances with elapsed time so progress is felt, not just spun.
  const stage =
    seconds < 2
      ? 'Submitting your code…'
      : seconds < 6
        ? 'Running tests…'
        : seconds < 14
          ? 'Still running, almost there…'
          : 'The sandbox is busy. Hang tight, this will finish or time out shortly.'

  return (
    <div className="flex flex-col gap-2 px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-forest-600 text-xl animate-spin">
          progress_activity
        </span>
        <span className="text-sm text-on-surface-variant font-label">{stage}</span>
        {seconds >= 1 && (
          <span className="ml-auto text-xs text-on-surface-variant/70 font-label tabular-nums">
            {seconds}s
          </span>
        )}
      </div>
      {/* Indeterminate progress bar — pure motion, no fake percentage. */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
        <div className="h-full w-1/3 animate-[codeRunSlide_1.2s_ease-in-out_infinite] rounded-full bg-forest-600" />
      </div>
      <style jsx>{`
        @keyframes codeRunSlide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}
