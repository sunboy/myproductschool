// src/components/challenges/TopicChipCloud.tsx
'use client'

import { useState } from 'react'
import type { Discipline } from './DisciplineTabStrip'
import {
  getTopicsForDiscipline,
  getTechniquesForDiscipline,
  type Discipline as TaxonomyDiscipline,
} from '@/lib/data/taxonomy'
import type { FilterState } from './FilterDropdownBar'

/** Maps UI discipline keys → taxonomy discipline keys. */
const UI_TO_TAXONOMY: Partial<Record<Discipline, TaxonomyDiscipline>> = {
  product_sense: 'product_sense',
  system_design: 'system_design',
  data_modeling: 'data_modeling',
  sql: 'sql',
  algorithm: 'coding',
}

interface Props {
  discipline: Discipline
  filters: FilterState
  onChange: (filters: FilterState) => void
}

type ChipTab = 'topics' | 'techniques'

export function TopicChipCloud({ discipline, filters, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<ChipTab>('topics')

  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  if (!taxonomyDiscipline) return null // 'all' — nothing to show

  const topics = getTopicsForDiscipline(taxonomyDiscipline)
  const techniques = getTechniquesForDiscipline(taxonomyDiscipline)

  // Don't render if there's nothing to show
  if (topics.length === 0 && techniques.length === 0) return null

  const showTabs = techniques.length > 0

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

  const activeTopics = filters.topic
  const activeTechniques = filters.technique

  return (
    <div className="px-4 py-3 sm:px-6 border-b border-outline-variant bg-surface">
      {/* Tab switcher — only show if both sets have items */}
      {showTabs && (
        <div className="flex items-center gap-1 mb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={[
              'font-label text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
              activeTab === 'topics'
                ? 'bg-primary-fixed text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            Topics
            {activeTopics.length > 0 && (
              <span className="ml-1 bg-primary text-on-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold">
                {activeTopics.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('techniques')}
            className={[
              'font-label text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
              activeTab === 'techniques'
                ? 'bg-primary-fixed text-primary'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
          >
            Techniques
            {activeTechniques.length > 0 && (
              <span className="ml-1 bg-primary text-on-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold">
                {activeTechniques.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chip cloud */}
      <div className="flex flex-wrap gap-1.5">
        {(showTabs ? (activeTab === 'topics' ? topics : techniques) : topics).map((entry) => {
          const isSelected = activeTab === 'topics' || !showTabs
            ? activeTopics.includes(entry.slug)
            : activeTechniques.includes(entry.slug)

          const handleClick = activeTab === 'topics' || !showTabs
            ? () => toggleTopic(entry.slug)
            : () => toggleTechnique(entry.slug)

          return (
            <button
              key={entry.slug}
              type="button"
              onClick={handleClick}
              title={'description' in entry ? (entry as { description?: string }).description : undefined}
              className={[
                'rounded-full px-2.5 py-1 font-label text-[11px] transition-colors whitespace-nowrap',
                isSelected
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-outline-variant/50',
              ].join(' ')}
            >
              {entry.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
