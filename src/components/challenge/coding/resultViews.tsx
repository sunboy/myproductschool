'use client'

/**
 * Run-result renderers for the coding workspace TestCasePanel.
 *
 * The SQL table / diff / tabbed views and the algo case view are lifted from
 * src/components/challenge/CodeOutputPanel.tsx (per the rebuild contract §3:
 * lift, don't rewrite). CodeOutputPanel itself stays untouched until the
 * panel swap lands in FlowWorkspace; delete it there if unreferenced after.
 */

import { useEffect, useMemo, useState } from 'react'
import type { RunResult, TestResult } from '@/lib/coding/types'

export function getDisplayedActual(result: TestResult): unknown {
  return result.actual !== undefined ? result.actual : result.output
}

export function asSqlRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

export function formatValue(value: unknown): string {
  if (value === undefined) return '—'
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

// Render a table of SQL rows
export function SqlResultTable({
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

// Diff between expected and actual SQL rows - highlights missing/extra rows
export function SqlRowDiff({
  expected,
  actual,
}: {
  expected: Record<string, unknown>[]
  actual: Record<string, unknown>[]
}) {
  const expectedSet = new Set(expected.map((r) => JSON.stringify(r)))
  const actualSet = new Set(actual.map((r) => JSON.stringify(r)))

  const missing = expected.filter((r) => !actualSet.has(JSON.stringify(r)))
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

export function SqlTabbedResults({ results }: { results: RunResult }) {
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

/**
 * Visible progress for a run in flight. A static spinner reads as "hung";
 * this advances a staged message and an elapsed counter, plus a reassurance
 * line once a run runs long.
 */
export function RunningIndicator() {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const startedAt = Date.now()
    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => clearInterval(interval)
  }, [])

  const seconds = Math.floor(elapsedMs / 1000)
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
