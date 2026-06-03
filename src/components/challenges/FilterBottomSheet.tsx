// src/components/challenges/FilterBottomSheet.tsx
'use client'

import { useEffect, useState } from 'react'
import type { FilterState, ArrayFilterKey } from './FilterDropdownBar'
import type { Discipline } from './DisciplineTabStrip'
import {
  getTopicsForDiscipline,
  getTechniquesForDiscipline,
  type Discipline as TaxonomyDiscipline,
} from '@/lib/data/taxonomy'
import { DIFFICULTY_OPTIONS as PRACTICE_DIFFICULTY_OPTIONS } from '@/lib/practice/difficulty'

/** Maps the UI discipline keys to taxonomy discipline keys. */
const UI_TO_TAXONOMY: Partial<Record<Discipline, TaxonomyDiscipline>> = {
  product_sense: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  sql: 'sql',
  algorithm: 'coding',
}

/** Mobile-friendly type switcher labels. */
const DISCIPLINE_CHIPS: { key: Discipline; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'product_sense', label: 'Product' },
  { key: 'system_design', label: 'Sys Design' },
  { key: 'data_modeling', label: 'Data' },
  { key: 'algorithm', label: 'Coding' },
  { key: 'sql', label: 'SQL' },
]

const STATIC_GROUPS: { key: ArrayFilterKey; label: string; options: string[]; disciplines: Discipline[] }[] = [
  { key: 'paradigm', label: 'Paradigm', options: ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'], disciplines: [] },
  { key: 'difficulty', label: 'Difficulty', options: PRACTICE_DIFFICULTY_OPTIONS.map(o => o.label), disciplines: [] },
  { key: 'role', label: 'Role', options: ['SWE', 'Tech Lead', 'EM', 'ML Eng', 'Data Eng', 'DevOps', 'Founding Eng', 'PM', 'Designer', 'Data Scientist'], disciplines: [] },
  { key: 'company', label: 'Company', options: ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix', 'Uber', 'Amazon', 'Apple'], disciplines: [] },
]

interface Props {
  open: boolean
  discipline: Discipline
  filters: FilterState
  resultCount: number
  onChange: (filters: FilterState) => void
  onClose: () => void
  onClearAll: () => void
  /** Optional: allow changing discipline from within the sheet. */
  onDisciplineChange?: (d: Discipline) => void
}

type ChipTab = 'topics' | 'techniques'

export function FilterBottomSheet({
  open,
  discipline,
  filters,
  resultCount,
  onChange,
  onClose,
  onClearAll,
  onDisciplineChange,
}: Props) {
  const [chipTab, setChipTab] = useState<ChipTab>('topics')

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  const topicOptions = taxonomyDiscipline
    ? getTopicsForDiscipline(taxonomyDiscipline)
    : []
  const techniqueOptions = taxonomyDiscipline
    ? getTechniquesForDiscipline(taxonomyDiscipline)
    : []

  const hasTopic = topicOptions.length > 0
  const hasTechnique = techniqueOptions.length > 0
  const showChipTabs = hasTopic && hasTechnique

  const dynamicGroups: { key: ArrayFilterKey; label: string; options: string[]; disciplines: Discipline[] }[] = []
  // Topic + Technique handled separately via chip cloud above the groups

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

  function toggleTopic(slug: string) {
    const current = filters.topic
    onChange({
      ...filters,
      topic: current.includes(slug) ? current.filter((v) => v !== slug) : [...current, slug],
    })
  }

  function toggleTechnique(slug: string) {
    const current = filters.technique
    onChange({
      ...filters,
      technique: current.includes(slug) ? current.filter((v) => v !== slug) : [...current, slug],
    })
  }

  function toggleRealInterview() {
    onChange({ ...filters, real_interview: !filters.real_interview })
  }

  const activeChipEntries = chipTab === 'topics' ? topicOptions : techniqueOptions
  const activeChipSlugs = chipTab === 'topics' ? filters.topic : filters.technique
  const handleChipToggle = chipTab === 'topics' ? toggleTopic : toggleTechnique

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-inverse-surface rounded-t-2xl flex flex-col max-h-[90vh]">
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

          {/* ── Type switcher (mirroring desktop discipline grid) ── */}
          {onDisciplineChange && (
            <div>
              <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
                Type
              </div>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINE_CHIPS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onDisciplineChange(key)}
                    className={[
                      'rounded-full px-3 py-1 font-label text-xs transition-colors',
                      discipline === key
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-white/10 text-inverse-on-surface hover:bg-white/20',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Topic / Technique chip cloud (discipline-scoped) ── */}
          {(hasTopic || hasTechnique) && (
            <div>
              {/* Tab switcher */}
              {showChipTabs && (
                <div className="flex items-center gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setChipTab('topics')}
                    className={[
                      'font-label text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
                      chipTab === 'topics'
                        ? 'bg-white/20 text-inverse-on-surface'
                        : 'text-inverse-on-surface/50 hover:text-inverse-on-surface',
                    ].join(' ')}
                  >
                    Topics
                    {filters.topic.length > 0 && (
                      <span className="ml-1 bg-primary text-on-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold">
                        {filters.topic.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChipTab('techniques')}
                    className={[
                      'font-label text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
                      chipTab === 'techniques'
                        ? 'bg-white/20 text-inverse-on-surface'
                        : 'text-inverse-on-surface/50 hover:text-inverse-on-surface',
                    ].join(' ')}
                  >
                    Techniques
                    {filters.technique.length > 0 && (
                      <span className="ml-1 bg-primary text-on-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold">
                        {filters.technique.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Chip label (no tab switcher case) */}
              {!showChipTabs && hasTopic && (
                <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
                  Topics
                </div>
              )}
              {!showChipTabs && !hasTopic && hasTechnique && (
                <div className="font-label text-[10px] font-semibold text-inverse-on-surface/50 uppercase tracking-wider mb-2">
                  Techniques
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {activeChipEntries.map((entry) => {
                  const selected = activeChipSlugs.includes(entry.slug)
                  return (
                    <button
                      key={entry.slug}
                      onClick={() => handleChipToggle(entry.slug)}
                      className={[
                        'rounded-full px-3 py-1 font-label text-xs transition-colors',
                        selected
                          ? 'bg-primary text-on-primary font-semibold'
                          : 'bg-white/10 text-inverse-on-surface hover:bg-white/20',
                      ].join(' ')}
                    >
                      {entry.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Standard filter groups ── */}
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
