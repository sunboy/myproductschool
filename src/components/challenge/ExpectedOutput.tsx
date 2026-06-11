'use client'

import { useState } from 'react'

/**
 * Expected Output for SQL challenges, derived from the visible (non-hidden) test cases'
 * expected_rows. Zero content authoring: the table stays correct as test cases change.
 * Mirrors SampleDataPreview's accordion + table styling.
 */

export interface ExpectedOutputTestCase {
  id?: string
  label?: string
  description?: string
  hidden?: boolean
  is_hidden?: boolean
  match_mode?: string
  expected_rows?: Record<string, unknown>[]
}

interface ExpectedOutputProps {
  test_cases: ExpectedOutputTestCase[]
  maxRows?: number
}

function matchModeNote(matchMode: string | undefined): string | null {
  switch (matchMode) {
    case 'exact_unordered':
      return 'Rows may be returned in any order.'
    case 'exact_ordered':
      return 'Row order matters.'
    default:
      return null
  }
}

function OutputTable({ rows, maxRows }: { rows: Record<string, unknown>[]; maxRows: number }) {
  const visible = rows.slice(0, maxRows)
  const columns = Object.keys(visible[0] ?? {})
  if (columns.length === 0) {
    return <div className="text-xs text-on-surface-variant italic px-2 py-1">Empty result set.</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-container-high">
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-1.5 text-left font-label font-semibold text-on-surface whitespace-nowrap border-b border-outline-variant/40"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-low">
              {columns.map((col) => (
                <td key={col} className="px-3 py-1.5 text-on-surface-variant whitespace-nowrap">
                  {row[col] === null || row[col] === undefined ? 'NULL' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="text-[10px] text-on-surface-variant px-3 py-1.5">
          Showing {maxRows} of {rows.length} rows.
        </div>
      )}
    </div>
  )
}

export function ExpectedOutput({ test_cases, maxRows = 6 }: ExpectedOutputProps) {
  const visibleCases = (test_cases ?? []).filter(
    (tc) => !(tc.hidden ?? tc.is_hidden) && Array.isArray(tc.expected_rows) && tc.expected_rows.length >= 0,
  )
  const [openIdx, setOpenIdx] = useState(0)

  if (visibleCases.length === 0) return null

  return (
    <div className="space-y-2" data-testid="expected-output">
      {visibleCases.map((tc, idx) => {
        const isOpen = openIdx === idx
        const note = matchModeNote(tc.match_mode)
        const label = tc.label ?? tc.description ?? `Test case ${idx + 1}`
        return (
          <div key={tc.id ?? idx} className="border border-outline-variant rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container hover:bg-surface-container-high transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[15px] text-primary">output</span>
                <span className="text-xs font-label font-semibold text-on-surface truncate">{label}</span>
                <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                  ({tc.expected_rows?.length ?? 0} rows)
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <OutputTable rows={tc.expected_rows ?? []} maxRows={maxRows} />
                {note && (
                  <div className="text-[10px] text-on-surface-variant px-3 py-1.5 border-t border-outline-variant/30">
                    {note}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
