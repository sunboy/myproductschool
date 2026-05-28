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
  /** Live counts per topic slug, computed from the discipline-scoped challenge set. */
  topicCounts: Record<string, number>
  /** Live counts per technique slug. */
  techniqueCounts: Record<string, number>
}

type ChipTab = 'topics' | 'techniques'

export function TopicChipCloud({ discipline, filters, onChange, topicCounts, techniqueCounts }: Props) {
  const [activeTab, setActiveTab] = useState<ChipTab>('topics')

  const taxonomyDiscipline = UI_TO_TAXONOMY[discipline]
  if (!taxonomyDiscipline) return null // 'all' — nothing to show

  // Only surface chips that actually have challenges behind them for this
  // discipline. A static slug with 0 live challenges (e.g. SQL 'indexes') is a
  // dead chip — hide it. Counts come from the loaded challenge set, not the
  // `topics` table (whose counts are stale/zero for several disciplines).
  const topics = getTopicsForDiscipline(taxonomyDiscipline).filter((t) => (topicCounts[t.slug] ?? 0) > 0)
  const techniques = getTechniquesForDiscipline(taxonomyDiscipline).filter((t) => (techniqueCounts[t.slug] ?? 0) > 0)

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
        {(() => {
          // If the techniques tab is active but empty, fall back to topics.
          const onTechniques = showTabs && activeTab === 'techniques' && techniques.length > 0
          const entries = onTechniques ? techniques : topics
          const counts = onTechniques ? techniqueCounts : topicCounts
          return entries.map((entry) => {
            const isSelected = onTechniques
              ? activeTechniques.includes(entry.slug)
              : activeTopics.includes(entry.slug)

            const handleClick = onTechniques
              ? () => toggleTechnique(entry.slug)
              : () => toggleTopic(entry.slug)

            return (
              <button
                key={entry.slug}
                type="button"
                onClick={handleClick}
                title={'description' in entry ? (entry as { description?: string }).description : undefined}
                className={[
                  'rounded-full px-2.5 py-1 font-label text-[11px] transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
                  isSelected
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-outline-variant/50',
                ].join(' ')}
              >
                {entry.label}
                <span className={isSelected ? 'text-on-primary/70' : 'text-on-surface-variant/60'}>
                  {counts[entry.slug] ?? 0}
                </span>
              </button>
            )
          })
        })()}
      </div>
    </div>
  )
}
