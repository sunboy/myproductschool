// src/components/challenges/FilterDropdownBar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { Discipline } from './DisciplineTabStrip'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { getTopicsForDiscipline, getTechniquesForDiscipline, type Discipline as TaxonomyDiscipline } from '@/lib/data/taxonomy'

/** Maps the UI discipline keys (from DisciplineTabStrip) to the taxonomy discipline keys.
 *  'all' has no taxonomy equivalent; 'algorithm' maps to 'coding'. */
const UI_TO_TAXONOMY: Partial<Record<Discipline, TaxonomyDiscipline>> = {
  product_sense: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  sql: 'sql',
  algorithm: 'coding',
}

export interface FilterState {
  paradigm: string[]
  difficulty: string[]
  role: string[]
  company: string[]
  tag: string[]
  scope: string[]       // system design only
  topic: string[]       // controlled-vocabulary topic slugs
  technique: string[]   // controlled-vocabulary technique slugs
  move: string[]        // FLOW move — product_sense only
  real_interview: boolean
}

/** Keys whose value is string[] (the majority). */
export type ArrayFilterKey = Exclude<keyof FilterState, 'real_interview'>
/** All filter keys. */
export type FilterKey = keyof FilterState

const PARADIGM_OPTIONS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native']
const FLOW_MOVE_OPTIONS = ['Frame', 'List', 'Optimize', 'Win']
const DIFFICULTY_OPTIONS = ['Warmup', 'Standard', 'Advanced', 'Staff+']
const ROLE_OPTIONS = ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist']
const COMPANY_OPTIONS = ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple']
const SCOPE_OPTIONS = ['Single Service', 'Distributed', 'Multi-Region']

interface DropdownDef {
  key: ArrayFilterKey
  label: string
  /** Static options list. When undefined, options are computed dynamically from the active discipline. */
  options?: string[]
  disciplines: Discipline[]  // which discipline tabs show this dropdown; empty = all
}

const DROPDOWNS: DropdownDef[] = [
  { key: 'paradigm', label: 'Paradigm', options: PARADIGM_OPTIONS, disciplines: [] },
  { key: 'scope', label: 'Scope', options: SCOPE_OPTIONS, disciplines: ['system_design'] },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS, disciplines: [] },
  { key: 'role', label: 'Role', options: ROLE_OPTIONS, disciplines: [] },
  { key: 'company', label: 'Company', options: COMPANY_OPTIONS, disciplines: [] },
  { key: 'topic', label: 'Topic', options: undefined, disciplines: [] },
  { key: 'technique', label: 'Technique', options: undefined, disciplines: [] },
  { key: 'move', label: 'FLOW Move', options: FLOW_MOVE_OPTIONS, disciplines: ['product_sense'] },
]

const DROPDOWN_HELP: Record<FilterKey, string> = {
  paradigm: 'Choose the operating mode: classic product work, AI-assisted, agentic, or AI-native.',
  difficulty: 'Match the rep to your current energy: warmup through Staff+ pressure.',
  role: 'Show scenarios calibrated to the job you are aiming for.',
  company: 'Practice with the product and systems style of specific companies.',
  tag: 'Narrow practice to a topic tag from a challenge.',
  scope: 'System design only: narrow the architecture scale before you start.',
  topic: 'Filter by a specific topic area (e.g. caching, arrays, pricing).',
  technique: 'Filter by a problem-solving technique (e.g. two-pointers, cache-aside).',
  move: 'Filter by FLOW move: Frame, List, Optimize, or Win.',
  real_interview: 'Show only challenges sourced from confirmed real interview questions.',
}

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
  label, options, selected, onToggle, helpText,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; helpText?: string
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
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={helpText ?? label}
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

  // Compute discipline-aware topic + technique options
  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  const topicOptions = taxonomyDiscipline
    ? getTopicsForDiscipline(taxonomyDiscipline).map(t => t.slug)
    : [] // 'all' — too broad to show a meaningful topic list
  const techniqueOptions = taxonomyDiscipline
    ? getTechniquesForDiscipline(taxonomyDiscipline).map(t => t.slug)
    : []

  function resolveOptions(d: DropdownDef): string[] {
    if (d.key === 'topic') return topicOptions
    if (d.key === 'technique') return techniqueOptions
    return d.options ?? []
  }

  function toggleArray(key: ArrayFilterKey, value: string) {
    const current = filters[key] as string[]
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  function toggleRealInterview() {
    onChange({ ...filters, real_interview: !filters.real_interview })
  }

  return (
    <>
      {/* Desktop filter row */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-container-low border-b border-outline-variant flex-wrap">
        <span className="font-label text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Filter:</span>
        {visibleDropdowns.map((d) => {
          const opts = resolveOptions(d)
          if (opts.length === 0) return null // hide topic/technique when discipline=all
          return (
            <AppTooltip key={d.key} label={DROPDOWN_HELP[d.key]} side="bottom">
              <MultiSelectDropdown
                key={d.key}
                label={d.label}
                options={opts}
                selected={filters[d.key] as string[]}
                onToggle={(v) => toggleArray(d.key, v)}
                helpText={DROPDOWN_HELP[d.key]}
              />
            </AppTooltip>
          )
        })}

        {/* Real interview toggle */}
        <AppTooltip label={DROPDOWN_HELP.real_interview} side="bottom">
          <button
            type="button"
            onClick={toggleRealInterview}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-label text-xs whitespace-nowrap transition-colors',
              filters.real_interview
                ? 'border-primary bg-primary-fixed text-primary font-semibold'
                : 'border-outline-variant bg-surface text-on-surface-variant hover:border-outline',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-sm leading-none">verified</span>
            Real interview
          </button>
        </AppTooltip>
        <div className="flex-1" />
        <span className="font-label text-xs text-on-surface-variant">{resultCount} results</span>
        <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${!listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="Grid view: visual cards for browsing"
            aria-label="Grid view"
          >
            <span className="material-symbols-outlined text-sm leading-none">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => !listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="List view: dense scan mode"
            aria-label="List view"
          >
            <span className="material-symbols-outlined text-sm leading-none">view_list</span>
          </button>
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant">
        <button
          type="button"
          onClick={onOpenMobileSheet}
          title="Open filters"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface font-label text-xs font-semibold text-on-surface"
        >
          <span className="material-symbols-outlined text-sm leading-none">tune</span>
          Filter
        </button>
        <div className="flex-1" />
        <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${!listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="Grid view"
            aria-label="Grid view"
          >
            <span className="material-symbols-outlined text-sm leading-none">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => !listView && onToggleView()}
            className={`px-2 py-1.5 flex items-center transition-colors ${listView ? 'bg-primary-fixed text-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'}`}
            title="List view"
            aria-label="List view"
          >
            <span className="material-symbols-outlined text-sm leading-none">view_list</span>
          </button>
        </div>
        <span className="font-label text-xs text-on-surface-variant">{resultCount}</span>
      </div>
    </>
  )
}
