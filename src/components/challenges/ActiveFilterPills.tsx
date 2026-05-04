// src/components/challenges/ActiveFilterPills.tsx
'use client'

import type { FilterState } from './FilterDropdownBar'

type FilterKey = keyof FilterState

interface Props {
  filters: FilterState
  onRemove: (key: FilterKey, value: string) => void
  onClearAll: () => void
}

export function ActiveFilterPills({ filters, onRemove, onClearAll }: Props) {
  const active: { key: FilterKey; value: string }[] = (Object.entries(filters) as [FilterKey, string[]][])
    .flatMap(([key, values]) => values.map((value) => ({ key, value })))

  if (active.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-surface border-b border-outline-variant flex-wrap">
      {active.map(({ key, value }) => (
        <span
          key={`${key}-${value}`}
          title={`${key}: ${value}`}
          className="flex items-center gap-1 bg-primary-fixed text-primary border border-primary/30 rounded-full px-2.5 py-0.5 font-label text-xs"
        >
          {value}
          <button
            onClick={() => onRemove(key, value)}
            className="opacity-60 hover:opacity-100 leading-none"
            aria-label={`Remove ${value} filter`}
          >
            <span className="material-symbols-outlined text-xs leading-none">close</span>
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="font-label text-xs text-primary font-semibold hover:underline px-1"
      >
        Clear all
      </button>
    </div>
  )
}
