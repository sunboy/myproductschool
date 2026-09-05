// src/components/challenges/FilterDropdownBar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { BadgeCheck, Check, ChevronDown, History, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import type { Discipline } from './DisciplineTabStrip'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { getTopicsForDiscipline, getTechniquesForDiscipline, type Discipline as TaxonomyDiscipline } from '@/lib/data/taxonomy'
import { DIFFICULTY_OPTIONS as PRACTICE_DIFFICULTY_OPTIONS } from '@/lib/practice/difficulty'

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
  difficulty: string[]
  role: string[]
  company: string[]
  topic: string[]       // controlled-vocabulary topic slugs
  technique: string[]   // controlled-vocabulary technique slugs
  real_interview: boolean
  /** Show only reps the user has started but not finished. */
  resume: boolean
}

/** Keys whose value is string[] (the majority). */
export type ArrayFilterKey = Exclude<keyof FilterState, 'real_interview' | 'resume'>
/** All filter keys. */
export type FilterKey = keyof FilterState

const DIFFICULTY_OPTIONS = PRACTICE_DIFFICULTY_OPTIONS.map(o => o.label)
export const ROLE_OPTIONS = ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist']
export const COMPANY_OPTIONS = ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple']

interface DropdownDef {
  key: ArrayFilterKey
  label: string
  /** Static options list. When undefined, options are computed dynamically from the active discipline. */
  options?: string[]
  disciplines: Discipline[]  // which discipline tabs show this dropdown; empty = all
  /** Discipline tabs where this dropdown is hidden even though `disciplines` is empty (all). */
  excludeDisciplines?: Discipline[]
}

const DROPDOWNS: DropdownDef[] = [
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS, disciplines: [] },
  { key: 'role', label: 'Role', options: ROLE_OPTIONS, disciplines: [] },
  { key: 'company', label: 'Company', options: COMPANY_OPTIONS, disciplines: [] },
  { key: 'topic', label: 'Topic', options: undefined, disciplines: [] },
  { key: 'technique', label: 'Technique', options: undefined, disciplines: [] },
]

const DROPDOWN_HELP: Record<FilterKey, string> = {
  difficulty: 'Choose a challenge difficulty: Easy, Medium, or Hard.',
  role: 'Show scenarios calibrated to the job you are aiming for.',
  company: 'Practice with the product and systems style of specific companies.',
  topic: 'Filter by a specific topic area (e.g. caching, arrays, pricing).',
  technique: 'Filter by a problem-solving technique (e.g. two-pointers, cache-aside).',
  real_interview: 'Show only challenges sourced from confirmed real interview questions.',
  resume: 'Show only reps you have started but not finished.',
}

/** One selectable option in a multi-select dropdown. `value` is the stored filter
 *  value (a slug for topic/technique); `label` is the human display text; `count`
 *  is the live result count shown alongside (omitted for static dropdowns). */
type DropdownOption = { value: string; label: string; count?: number }

interface Props {
  discipline: Discipline
  filters: FilterState
  onChange: (filters: FilterState) => void
  resultCount: number
  /** Live per-topic counts for the active discipline (drives Topic dropdown options). */
  topicCounts?: Record<string, number>
  /** Live per-technique counts for the active discipline (drives Technique dropdown options). */
  techniqueCounts?: Record<string, number>
  onOpenMobileSheet: () => void
  listView: boolean
  onToggleView: () => void
  /** Grid/list toggle only affects the cross-discipline 'all' view; hidden elsewhere (grouped list is list-only). */
  showViewToggle?: boolean
}

const CHIP_BASE = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-label text-xs whitespace-nowrap transition-colors'
const CHIP_ACTIVE = 'border-forest-600 bg-sd-bg text-forest-700 font-semibold'
const CHIP_IDLE = 'border-hairline bg-card-bright text-ink-secondary hover:border-hairline-strong hover:bg-page-field'

function MultiSelectDropdown({
  label, options, selected, onToggle, helpText,
}: {
  label: string; options: DropdownOption[]; selected: string[]; onToggle: (v: string) => void; helpText?: string
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
    <AppTooltip label={helpText ?? label} side="bottom" disabled={open}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={helpText ?? label}
          className={[CHIP_BASE, hasSelection ? CHIP_ACTIVE : CHIP_IDLE].join(' ')}
        >
          {label}
          {hasSelection && <span className="bg-forest-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{selected.length}</span>}
          <ChevronDown className="size-3.5 shrink-0" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-card-bright border border-hairline rounded-xl shadow-lg z-50 min-w-44 max-h-72 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-label text-ink-strong hover:bg-page-field text-left"
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt.value) ? 'bg-forest-700 border-forest-700' : 'border-hairline-strong'}`}>
                  {selected.includes(opt.value) && <Check className="size-2.5 text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="ml-auto shrink-0 tabular-nums text-ink-muted text-[10px]">{opt.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppTooltip>
  )
}

export function FilterDropdownBar({ discipline, filters, onChange, resultCount, topicCounts = {}, techniqueCounts = {}, onOpenMobileSheet, listView, onToggleView, showViewToggle = true }: Props) {
  const visibleDropdowns = DROPDOWNS.filter(
    (d) =>
      (d.disciplines.length === 0 || d.disciplines.includes(discipline)) &&
      !(d.excludeDisciplines?.includes(discipline))
  )

  // Compute discipline-aware, count-aware topic + technique options. Each option
  // carries its human label and live count; zero-count options are dropped so a
  // dead slug (no live challenges) never shows up — mirroring the old chip cloud.
  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  const topicOptionObjs: DropdownOption[] = taxonomyDiscipline
    ? getTopicsForDiscipline(taxonomyDiscipline)
        .map((t) => ({ value: t.slug, label: t.label, count: topicCounts[t.slug] ?? 0 }))
        .filter((o) => (o.count ?? 0) > 0)
    : [] // 'all' - too broad to show a meaningful topic list
  const techniqueOptionObjs: DropdownOption[] = taxonomyDiscipline
    ? getTechniquesForDiscipline(taxonomyDiscipline)
        .map((t) => ({ value: t.slug, label: t.label, count: techniqueCounts[t.slug] ?? 0 }))
        .filter((o) => (o.count ?? 0) > 0)
    : []

  function resolveOptions(d: DropdownDef): DropdownOption[] {
    if (d.key === 'topic') return topicOptionObjs
    if (d.key === 'technique') return techniqueOptionObjs
    return (d.options ?? []).map((s) => ({ value: s, label: s }))
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

  function toggleResume() {
    onChange({ ...filters, resume: !filters.resume })
  }

  const activeFilterCount = [
    ...Object.entries(filters).filter(([, v]) => Array.isArray(v) && (v as string[]).length > 0),
    ...(filters.real_interview ? [1] : []),
    ...(filters.resume ? [1] : []),
  ].length

  return (
    <>
      {/* Desktop secondary filter bar */}
      <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 flex-wrap rounded-xl border border-hairline bg-card-bright">
        {/* Filter icon label */}
        <SlidersHorizontal className="size-3.5 text-ink-muted mr-0.5 shrink-0" />

        {visibleDropdowns.map((d) => {
          const opts = resolveOptions(d)
          // No live options → hide the dropdown. This also drops Topic/Technique
          // for 'all' (empty taxonomy) and before their counts have loaded.
          if (opts.length === 0) return null
          return (
            <MultiSelectDropdown
              key={d.key}
              label={d.label}
              options={opts}
              selected={filters[d.key] as string[]}
              onToggle={(v) => toggleArray(d.key, v)}
              helpText={DROPDOWN_HELP[d.key]}
            />
          )
        })}

        {/* Real interview pill toggle */}
        <AppTooltip label={DROPDOWN_HELP.real_interview} side="bottom">
          <button
            type="button"
            onClick={toggleRealInterview}
            className={[CHIP_BASE, filters.real_interview ? CHIP_ACTIVE : CHIP_IDLE].join(' ')}
          >
            <BadgeCheck className="size-3.5" />
            Real interview
          </button>
        </AppTooltip>

        {/* Resume-only pill toggle */}
        <AppTooltip label={DROPDOWN_HELP.resume} side="bottom">
          <button
            type="button"
            onClick={toggleResume}
            className={[CHIP_BASE, filters.resume ? CHIP_ACTIVE : CHIP_IDLE].join(' ')}
          >
            <History className="size-3.5" />
            Resume only
          </button>
        </AppTooltip>

        <div className="min-w-0 flex-1" />

        {/* Result count */}
        <span className="shrink-0 font-label text-[11px] text-ink-secondary tabular-nums">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>

        {/* View toggle — segmented control. Only meaningful on the 'all' view;
            single-discipline views render a list-only grouped layout. */}
        {showViewToggle && (
          <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-hairline">
            <button
              type="button"
              onClick={() => listView && onToggleView()}
              className={[
                'px-2 py-1.5 flex items-center transition-colors',
                !listView ? 'bg-sd-bg text-forest-700' : 'bg-card-bright text-ink-secondary hover:bg-page-field',
              ].join(' ')}
              title="Grid view: visual cards for browsing"
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => !listView && onToggleView()}
              className={[
                'px-2 py-1.5 flex items-center transition-colors',
                listView ? 'bg-sd-bg text-forest-700' : 'bg-card-bright text-ink-secondary hover:bg-page-field',
              ].join(' ')}
              title="List view: dense scan mode"
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile filter bar */}
      <div className="flex items-center gap-2 rounded-xl border border-hairline bg-card-bright px-3 py-2 sm:hidden">
        <button
          type="button"
          onClick={onOpenMobileSheet}
          title="Open filters"
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-label text-xs font-semibold transition-colors',
            activeFilterCount > 0 ? CHIP_ACTIVE : 'border-hairline bg-card-bright text-ink-strong',
          ].join(' ')}
        >
          <SlidersHorizontal className="size-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-forest-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1" />
        {showViewToggle && (
          <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-hairline">
            <button
              type="button"
              onClick={() => listView && onToggleView()}
              className={[
                'px-2 py-1.5 flex items-center transition-colors',
                !listView ? 'bg-sd-bg text-forest-700' : 'bg-card-bright text-ink-secondary hover:bg-page-field',
              ].join(' ')}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => !listView && onToggleView()}
              className={[
                'px-2 py-1.5 flex items-center transition-colors',
                listView ? 'bg-sd-bg text-forest-700' : 'bg-card-bright text-ink-secondary hover:bg-page-field',
              ].join(' ')}
              title="List view"
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        )}
        <span className="shrink-0 font-label text-xs text-ink-secondary tabular-nums">{resultCount}</span>
      </div>
    </>
  )
}
