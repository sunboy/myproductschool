'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import StartInterviewButton from './StartInterviewButton'

const FILTER_ROLES = ['All', 'PM', 'SWE', 'Data Eng', 'ML Eng'] as const
type FilterRole = typeof FILTER_ROLES[number]

function matchesFilter(persona: LiveInterviewPersona, filter: FilterRole): boolean {
  if (filter === 'All') return true
  if (filter === 'Data Eng') return persona.role === 'Data Engineer'
  if (filter === 'ML Eng') return persona.role === 'ML Engineer'
  return persona.role === filter
}

const DIFFICULTY_LABEL: Record<LiveInterviewPersona['difficulty'], string> = {
  standard: 'Standard',
  advanced: 'Advanced',
  staff_plus: 'Staff+',
}

interface FilteredPersonaGridProps {
  personas: LiveInterviewPersona[]
}

export default function FilteredPersonaGrid({ personas }: FilteredPersonaGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterRole>('All')

  const filtered = personas.filter(p => matchesFilter(p, activeFilter))

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_ROLES.map(role => (
          <button
            key={role}
            onClick={() => setActiveFilter(role)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-all',
              activeFilter === role
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Persona grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(persona => (
          <div
            key={persona.slug}
            className="bg-surface-container rounded-xl p-5 border border-outline-variant hover:border-primary cursor-pointer transition-colors flex flex-col gap-3"
          >
            {/* Company header */}
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {persona.icon}
              </span>
              <span className="font-label font-semibold text-on-surface text-sm">{persona.companyName}</span>
            </div>

            {/* Role badge */}
            <div>
              <span className="bg-secondary-container text-on-secondary-container rounded-full text-sm px-3 py-1 font-label">
                {persona.role}
              </span>
            </div>

            {/* Interview style */}
            {persona.interviewStyle && (
              <p className="text-xs text-on-surface-variant leading-snug line-clamp-2">
                {persona.interviewStyle}
              </p>
            )}

            {/* Bottom row */}
            <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
              <span className="bg-surface-container-high text-on-surface-variant rounded-full text-xs px-2.5 py-0.5 font-label">
                {DIFFICULTY_LABEL[persona.difficulty]}
              </span>
              <span className="text-xs text-on-surface-variant">~{persona.estimatedMins} min</span>
              <div className="ml-auto">
                <StartInterviewButton companyId={persona.companyId} roleId={persona.role} />
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-on-surface-variant text-sm">
            No interviews available for this role yet.
          </div>
        )}
      </div>
    </div>
  )
}
