'use client'

import { useState } from 'react'

interface SampleDataPreviewProps {
  sample_data_preview: Record<string, Record<string, unknown>[]>
  maxRows?: number
}

function SampleTable({ tableName, rows }: { tableName: string; rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-xs text-on-surface-variant italic px-2 py-1">No sample data.</div>
    )
  }

  const columns = Object.keys(rows[0])

  return (
    <div className="overflow-x-auto" data-testid={`sample-table-${tableName}`}>
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
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-outline-variant/30 hover:bg-surface-container-low"
            >
              {columns.map((col) => (
                <td key={col} className="px-3 py-1.5 text-on-surface-variant whitespace-nowrap">
                  {String(row[col] ?? 'NULL')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface AccordionItemProps {
  tableName: string
  rows: Record<string, unknown>[]
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ tableName, rows, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-container hover:bg-surface-container-high transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-primary">table_rows</span>
          <span className="text-xs font-label font-semibold text-on-surface">{tableName}</span>
          <span className="text-[10px] text-on-surface-variant">({rows.length} rows)</span>
        </div>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Content */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <SampleTable tableName={tableName} rows={rows} />
        </div>
      </div>
    </div>
  )
}

export function SampleDataPreview({
  sample_data_preview,
  maxRows = 5,
}: SampleDataPreviewProps) {
  const tableNames = Object.keys(sample_data_preview)
  const [openTables, setOpenTables] = useState<Set<string>>(() => new Set([tableNames[0]]))

  if (tableNames.length === 0) {
    return (
      <div className="text-sm text-on-surface-variant italic">No sample data available.</div>
    )
  }

  const toggle = (name: string) => {
    setOpenTables((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  return (
    <div className="space-y-2" data-testid="sample-data-preview">
      {tableNames.map((tableName) => {
        const rawRows = sample_data_preview[tableName]
        // Filter out placeholder strings like "..." that appear in spec examples
        const rows = rawRows
          .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
          .slice(0, maxRows)

        return (
          <AccordionItem
            key={tableName}
            tableName={tableName}
            rows={rows}
            isOpen={openTables.has(tableName)}
            onToggle={() => toggle(tableName)}
          />
        )
      })}
    </div>
  )
}
