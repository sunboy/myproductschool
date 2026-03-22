'use client'

import { useState } from 'react'
import { VocabCard } from '@/components/vocabulary/VocabCard'
import type { Concept } from '@/lib/types'

const FILTER_CHIPS = ['All', 'Growth', 'Engagement', 'Retention', 'Strategy', 'Metrics']

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-headline text-3xl text-on-surface">Product 75</h1>
        <p className="text-on-surface-variant">75 concepts every product thinker should know</p>
      </div>

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
          {filtered.map(concept => (
            <div key={concept.id} className="mb-4">
              <VocabCard
                term={concept.title}
                definition={concept.definition}
                insight={concept.example ? concept.example.slice(0, 100) : undefined}
                isMastered={masteredIds.has(concept.id)}
                onToggleMastered={() => toggleMastered(concept.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
