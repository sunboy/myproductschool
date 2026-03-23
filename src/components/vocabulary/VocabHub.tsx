'use client'

import { useState } from 'react'
import { VocabCard } from '@/components/vocabulary/VocabCard'
import type { Concept } from '@/lib/types'

const FILTER_CHIPS = ['All', 'Growth', 'Engagement', 'Retention', 'Strategy', 'Metrics']

function getMockMastery(index: number): { level: number; label: string } {
  const levels = [
    { level: 0, label: 'Not started' },
    { level: 1, label: 'Seen once' },
    { level: 2, label: 'Needs practice' },
    { level: 3, label: 'Reviewing' },
    { level: 4, label: 'Mastered' },
  ]
  return levels[index % 5]
}

interface VocabHubProps {
  concepts: Concept[]
}

export function VocabHub({ concepts }: VocabHubProps) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set())

  const masteredCount = masteredIds.size
  const totalCount = Math.max(concepts.length, 75)

  const filtered = concepts.filter(c => {
    const matchesSearch =
      search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.definition.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      activeFilter === 'All' ||
      c.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
      c.definition.toLowerCase().includes(activeFilter.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const toggleMastered = (id: string) => {
    setMasteredIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Mock "Due for Review" concepts — pick first 3 that need practice (level 1 or 2)
  const dueForReview = concepts
    .map((c, i) => ({ concept: c, mastery: getMockMastery(i) }))
    .filter(({ mastery }) => mastery.level === 1 || mastery.level === 2)
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-headline text-3xl text-on-surface">Product 75</h1>
        <p className="text-on-surface-variant">75 concepts every product thinker should know</p>
      </div>

      {/* Due for Review */}
      {dueForReview.length > 0 && (
        <div className="mb-6">
          <h2 className="font-headline text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-xl">schedule</span>
            Due for Review
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dueForReview.map(({ concept }) => (
              <div
                key={concept.id}
                className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-on-surface text-sm truncate">{concept.title}</p>
                  <p className="text-xs text-on-surface-variant truncate">{concept.definition}</p>
                </div>
                <span className="shrink-0 text-xs font-label font-semibold px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded-full whitespace-nowrap">
                  Due today
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips + search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`rounded-full px-4 py-1.5 text-sm font-label transition-colors ${
                activeFilter === chip
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <input
          placeholder="Search concepts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-surface-container rounded-full px-4 py-2 text-sm w-full max-w-sm border border-outline-variant focus:border-primary outline-none"
        />
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 hidden md:flex flex-col gap-4 shrink-0">
          <div>
            <p className="font-headline text-sm font-semibold text-on-surface mb-2">Daily Goal</p>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((masteredCount / totalCount) * 100, 100)}%` }}
              />
            </div>
            <p className="text-on-surface-variant text-sm">{masteredCount} / {totalCount} mastered</p>
          </div>
          <div className="flex-1" />
          <button className="bg-tertiary text-on-tertiary rounded-full w-full px-4 py-2 text-sm font-semibold font-label">
            Take Quiz
          </button>
        </aside>

        {/* Masonry grid */}
        <div className="flex-1 columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filtered.map((concept, index) => (
            <div key={concept.id} className="mb-4">
              <VocabCard
                term={concept.title}
                definition={concept.definition}
                insight={concept.example ? concept.example.slice(0, 100) : undefined}
                isMastered={masteredIds.has(concept.id)}
                onToggleMastered={() => toggleMastered(concept.id)}
                mastery={getMockMastery(index)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
