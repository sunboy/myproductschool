// src/components/challenges/FilterBottomSheet.tsx
'use client'

import { useEffect } from 'react'
import type { FilterState, ArrayFilterKey } from './FilterDropdownBar'
import type { Discipline } from './DisciplineTabStrip'
import { getTopicsForDiscipline, getTechniquesForDiscipline, type Discipline as TaxonomyDiscipline } from '@/lib/data/taxonomy'

/** Maps the UI discipline keys to taxonomy discipline keys. */
const UI_TO_TAXONOMY: Partial<Record<Discipline, TaxonomyDiscipline>> = {
  product_sense: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  sql: 'sql',
  algorithm: 'coding',
}

const STATIC_GROUPS: { key: ArrayFilterKey; label: string; options: string[]; disciplines: Discipline[] }[] = [
  { key: 'paradigm', label: 'Paradigm', options: ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'], disciplines: [] },
  { key: 'scope', label: 'Scope', options: ['Single Service', 'Distributed', 'Multi-Region'], disciplines: ['system_design'] },
  { key: 'difficulty', label: 'Difficulty', options: ['Warmup', 'Standard', 'Advanced', 'Staff+'], disciplines: [] },
  { key: 'role', label: 'Role', options: ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist'], disciplines: [] },
  { key: 'company', label: 'Company', options: ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple'], disciplines: [] },
  { key: 'move', label: 'FLOW Move', options: ['Frame', 'List', 'Optimize', 'Win'], disciplines: ['product_sense'] },
]

interface Props {
  open: boolean
  discipline: Discipline
  filters: FilterState
  resultCount: number
  onChange: (filters: FilterState) => void
  onClose: () => void
  onClearAll: () => void
}

export function FilterBottomSheet({ open, discipline, filters, resultCount, onChange, onClose, onClearAll }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  const topicOptions = taxonomyDiscipline
    ? getTopicsForDiscipline(taxonomyDiscipline).map(t => t.slug)
    : []
  const techniqueOptions = taxonomyDiscipline
    ? getTechniquesForDiscipline(taxonomyDiscipline).map(t => t.slug)
    : []

  const dynamicGroups: { key: ArrayFilterKey; label: string; options: string[]; disciplines: Discipline[] }[] = [
    ...(topicOptions.length > 0 ? [{ key: 'topic' as ArrayFilterKey, label: 'Topic', options: topicOptions, disciplines: [] as Discipline[] }] : []),
    ...(techniqueOptions.length > 0 ? [{ key: 'technique' as ArrayFilterKey, label: 'Technique', options: techniqueOptions, disciplines: [] as Discipline[] }] : []),
  ]

  const allGroups = [...STATIC_GROUPS, ...dynamicGroups]
  const visibleGroups = allGroups.filter(
    (g) => g.disciplines.length === 0 || g.disciplines.includes(discipline)
  )

  function toggle(key: ArrayFilterKey, value: string) {
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-inverse-surface rounded-t-2xl flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="font-label font-bold text-inverse-on-surface text-sm">Filters</span>
          <button onClick={onClearAll} className="font-label text-xs text-inverse-on-surface/60 hover:text-inverse-on-surface">
            Clear all
          </button>
        </div>

        {/* Scrollable groups */}
        <div className="overflow-y-auto flex-1 px-4 pb-4 flex flex-col gap-5">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const selected = (filters[group.key] as string[]).includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(group.key, opt)}
                      className={[
                        'rounded-full px-3 py-1 font-label text-xs transition-colors',
                        selected
                          ? 'bg-primary text-on-primary'
                          : 'bg-white/10 text-inverse-on-surface',
                      ].join(' ')}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Real interview toggle */}
          <div>
            <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
              Source
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleRealInterview}
                className={[
                  'rounded-full px-3 py-1 font-label text-xs transition-colors flex items-center gap-1.5',
                  filters.real_interview
                    ? 'bg-primary text-on-primary'
                    : 'bg-white/10 text-inverse-on-surface',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-xs leading-none">verified</span>
                Real interview only
              </button>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-primary text-on-primary rounded-xl py-3 font-label font-bold text-sm"
          >
            Show {resultCount} results
          </button>
        </div>
      </div>
    </>
  )
}
