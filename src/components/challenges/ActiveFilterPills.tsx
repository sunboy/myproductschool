// src/components/challenges/ActiveFilterPills.tsx
'use client'

import { X } from 'lucide-react'
import type { FilterState } from './FilterDropdownBar'

type FilterKey = keyof FilterState

const BOOLEAN_LABELS: Partial<Record<FilterKey, string>> = {
  real_interview: 'Real interview',
  resume: 'Resume only',
}

interface Props {
  filters: FilterState
  onRemove: (key: FilterKey, value: string) => void
  onClearAll: () => void
}

export function ActiveFilterPills({ filters, onRemove, onClearAll }: Props) {
  // Collect active filter entries - boolean toggles carry a display label
  const active: { key: FilterKey; value: string }[] = []
  for (const [k, val] of Object.entries(filters) as [FilterKey, string[] | boolean][]) {
    const booleanLabel = BOOLEAN_LABELS[k]
    if (booleanLabel) {
      if (val === true) active.push({ key: k, value: booleanLabel })
    } else {
      for (const v of val as string[]) active.push({ key: k, value: v })
    }
  }

  if (active.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
      {active.map(({ key, value }) => (
        <span
          key={`${key}-${value}`}
          title={`${key}: ${value}`}
          className="flex items-center gap-1 rounded-full border border-forest-600/30 bg-sd-bg px-2.5 py-0.5 font-label text-xs text-forest-700"
        >
          {value}
          <button
            onClick={() => onRemove(key, value)}
            className="opacity-60 hover:opacity-100 leading-none"
            aria-label={`Remove ${value} filter`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="px-1 font-label text-xs font-semibold text-forest-700 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}
