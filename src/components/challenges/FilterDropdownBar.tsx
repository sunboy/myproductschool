// src/components/challenges/FilterDropdownBar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { Discipline } from './DisciplineTabStrip'

export interface FilterState {
  paradigm: string[]
  difficulty: string[]
  role: string[]
  company: string[]
  scope: string[]   // system design only
}

const PARADIGM_OPTIONS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native']
const DIFFICULTY_OPTIONS = ['Warmup', 'Standard', 'Advanced', 'Staff+']
const ROLE_OPTIONS = ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist']
const COMPANY_OPTIONS = ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple']
const SCOPE_OPTIONS = ['Single Service', 'Distributed', 'Multi-Region']

type FilterKey = keyof FilterState

interface DropdownDef {
  key: FilterKey
  label: string
  options: string[]
  disciplines: Discipline[]  // which discipline tabs show this dropdown; empty = all
}

const DROPDOWNS: DropdownDef[] = [
  { key: 'paradigm', label: 'Paradigm', options: PARADIGM_OPTIONS, disciplines: [] },
  { key: 'scope', label: 'Scope', options: SCOPE_OPTIONS, disciplines: ['system_design'] },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS, disciplines: [] },
  { key: 'role', label: 'Role', options: ROLE_OPTIONS, disciplines: [] },
  { key: 'company', label: 'Company', options: COMPANY_OPTIONS, disciplines: [] },
]

interface Props {
  discipline: Discipline
  filters: FilterState
  onChange: (filters: FilterState) => void
  resultCount: number
  onOpenMobileSheet: () => void
  listView: boolean
  onToggleView: () => void
}

function MultiSelectDropdown({
  label, options, selected, onToggle,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasSelection = selected.length > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-label text-xs whitespace-nowrap transition-colors',
          hasSelection
            ? 'border-primary bg-primary-fixed text-primary font-semibold'
            : 'border-outline-variant bg-surface text-on-surface-variant hover:border-outline',
        ].join(' ')}
      >
        {label}
        {hasSelection && <span className="bg-primary text-on-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{selected.length}</span>}
        <span className="material-symbols-outlined text-sm leading-none">expand_more</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 min-w-40 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-label text-on-surface hover:bg-surface-container-low text-left"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                {selected.includes(opt) && <span className="material-symbols-outlined text-on-primary text-[10px] leading-none">check</span>}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterDropdownBar({ discipline, filters, onChange, resultCount, onOpenMobileSheet, listView, onToggleView }: Props) {
  const visibleDropdowns = DROPDOWNS.filter(
    (d) => d.disciplines.length === 0 || d.disciplines.includes(discipline)
  )

  function toggle(key: FilterKey, value: string) {
    const current = filters[key]
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  return (
    <>
      {/* Desktop filter row */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container-low border-b border-outline-variant flex-wrap">
        <span className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Filter:</span>
        {visibleDropdowns.map((d) => (
          <MultiSelectDropdown
            key={d.key}
            label={d.label}
            options={d.options}
            selected={filters[d.key]}
            onToggle={(v) => toggle(d.key, v)}
          />
        ))}
        <div className="flex-1" />
        <span className="font-label text-xs text-on-surface-variant">{resultCount} results</span>
        <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
          <button
            onClick={() => listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${!listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="Grid view"
          >
            <span className="material-symbols-outlined text-sm leading-none">grid_view</span>
          </button>
          <button
            onClick={() => !listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="List view"
          >
            <span className="material-symbols-outlined text-sm leading-none">view_list</span>
          </button>
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant">
        <button
          onClick={onOpenMobileSheet}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface font-label text-xs font-semibold text-on-surface"
        >
          <span className="material-symbols-outlined text-sm leading-none">tune</span>
          Filter
        </button>
        <div className="flex-1" />
        <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
          <button
            onClick={() => listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${!listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-sm leading-none">grid_view</span>
          </button>
          <button
            onClick={() => !listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-sm leading-none">view_list</span>
          </button>
        </div>
        <span className="font-label text-xs text-on-surface-variant">{resultCount}</span>
      </div>
    </>
  )
}
