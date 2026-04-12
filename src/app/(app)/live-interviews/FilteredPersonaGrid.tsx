'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'
import StartInterviewButton from './StartInterviewButton'

const FILTER_ROLES = ['All', 'PM', 'SWE', 'Data Eng', 'ML Eng'] as const
type FilterRole = typeof FILTER_ROLES[number]

function matchesFilter(persona: LiveInterviewPersona, filter: FilterRole): boolean {
  if (filter === 'All') return true
  if (filter === 'Data Eng') return persona.role === 'Data Engineer'
  if (filter === 'ML Eng') return persona.role === 'ML Engineer'
  return persona.role === filter
}

const DIFFICULTY_DOT: Record<LiveInterviewPersona['difficulty'], string> = {
  standard: '#4a7c59',
  advanced: '#f59e0b',
  staff_plus: '#ef4444',
}

const DIFFICULTY_LABEL: Record<LiveInterviewPersona['difficulty'], string> = {
  standard: 'Standard',
  advanced: 'Advanced',
  staff_plus: 'Staff+',
}

const DIFFICULTY_CHIP: Record<LiveInterviewPersona['difficulty'], string> = {
  standard: 'bg-primary-fixed text-on-primary-container',
  advanced: 'bg-tertiary-container text-on-tertiary-container',
  staff_plus: 'bg-error/10 text-error',
}

const SCENARIO_DIFFICULTY_DOT: Record<string, string> = {
  warmup: '#4a7c59',
  standard: '#4a7c59',
  advanced: '#f59e0b',
  staff_plus: '#ef4444',
}

interface FilteredPersonaGridProps {
  personas: LiveInterviewPersona[]
  scenarios?: ScenarioBrief[]
}

export default function FilteredPersonaGrid({ personas, scenarios = [] }: FilteredPersonaGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterRole>('All')
  const [selected, setSelected] = useState<LiveInterviewPersona>(personas[0])
  const [showScenarios, setShowScenarios] = useState(false)

  const filtered = personas.filter(p => matchesFilter(p, activeFilter))
  const activePersona = selected ?? filtered[0]

  const relevantScenarios = scenarios.filter(s => {
    if (!activePersona) return false
    if (s.relevantRoles.length === 0) return true
    const roleKey = activePersona.role.toLowerCase().replace(/\s+/g, '_')
    return s.relevantRoles.some(
      r => r.toLowerCase().replace(/\s+/g, '_') === roleKey
        || r.toLowerCase() === activePersona.role.toLowerCase()
    )
  })

  function selectPersona(p: LiveInterviewPersona) {
    setSelected(p)
    setShowScenarios(false)
  }

  if (!activePersona) return null

  return (
    <div className="flex flex-row gap-0 rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low min-h-[480px]">

      {/* ── Left: Roster Strip ───────────────────────────── */}
      <div className="shrink-0 flex flex-col min-h-0 border-r border-outline-variant/30" style={{ width: '260px' }}>

        {/* Role filter */}
        <div className="px-4 pt-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
          {FILTER_ROLES.map(role => (
            <button
              key={role}
              onClick={() => setActiveFilter(role)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-label font-semibold transition-all',
                activeFilter === role
                  ? 'bg-on-surface text-inverse-on-surface'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Roster list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {filtered.map(persona => {
            const isActive = activePersona.slug === persona.slug
            const dotColor = DIFFICULTY_DOT[persona.difficulty]
            return (
              <button
                key={persona.slug}
                onClick={() => selectPersona(persona)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                  isActive
                    ? 'bg-surface-container border-r-2 border-primary'
                    : 'hover:bg-surface-container/60 border-r-2 border-transparent'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[18px] shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-on-surface-variant'
                  )}
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  {persona.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isActive ? 'text-on-surface' : 'text-on-surface-variant')}>
                    {persona.companyName}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate font-label">{persona.role}</p>
                </div>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
              </button>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-10 font-label">
              No interviewers for this role yet.
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Detail Pane ─────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col overflow-hidden">

        {/* Ambient icon backdrop */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden
        >
          <span
            className="material-symbols-outlined text-primary/[0.04]"
            style={{ fontSize: '280px', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
          >
            {activePersona.icon}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4 p-7 flex-1 min-h-0">

          {/* Company + role */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined text-primary text-[22px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                {activePersona.icon}
              </span>
              <span className="font-label text-sm font-bold text-on-surface-variant">{activePersona.companyName}</span>
            </div>

            <h2 className="font-headline text-3xl font-extrabold text-on-surface leading-tight" style={{ textWrap: 'balance' } as React.CSSProperties}>
              {activePersona.role} round
            </h2>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-label font-bold px-3 py-1 rounded-full', DIFFICULTY_CHIP[activePersona.difficulty])}>
                {DIFFICULTY_LABEL[activePersona.difficulty]}
              </span>
              <span className="text-xs text-on-surface-variant font-label flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>schedule</span>
                ~{activePersona.estimatedMins} min
              </span>
            </div>
          </div>

          {/* CTA section — near the top */}
          {!showScenarios ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                <div>
                  <p className="text-sm font-label font-bold text-on-surface">Free-form interview</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Luma picks the scenario</p>
                </div>
                <StartInterviewButton companyId={activePersona.companyId} roleId={activePersona.role} />
              </div>

              {relevantScenarios.length > 0 && (
                <button
                  onClick={() => setShowScenarios(true)}
                  className="w-full text-sm text-primary font-label font-semibold py-2 hover:opacity-80 transition-opacity flex items-center justify-center gap-1"
                >
                  Or pick a specific scenario
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col flex-1 gap-2 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">Pick a scenario</span>
                <button
                  onClick={() => setShowScenarios(false)}
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors font-label"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary-fixed/40 border border-primary/15 shrink-0">
                <div>
                  <p className="text-sm font-label font-semibold text-on-surface">Free-form</p>
                  <p className="text-[11px] text-on-surface-variant">Luma picks</p>
                </div>
                <StartInterviewButton companyId={activePersona.companyId} roleId={activePersona.role} />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                {relevantScenarios.map(scenario => {
                  const dot = SCENARIO_DIFFICULTY_DOT[scenario.difficulty] ?? '#4a7c59'
                  const diffLabel = scenario.difficulty === 'staff_plus' ? 'Staff+' : scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)
                  return (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                          <span className="text-[11px] font-label text-on-surface-variant">{diffLabel} · ~{scenario.estimatedMinutes} min</span>
                        </div>
                        <p className="text-sm font-label font-semibold text-on-surface truncate">{scenario.title}</p>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{scenario.scenarioQuestion}</p>
                      </div>
                      <div className="shrink-0">
                        <StartInterviewButton companyId={activePersona.companyId} roleId={activePersona.role} challengeId={scenario.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Interview style quote — below CTAs */}
          {activePersona.interviewStyle && (
            <blockquote className="border-l-2 border-primary/30 pl-3 mt-auto">
              <p className="text-sm text-on-surface-variant italic leading-relaxed">
                {activePersona.interviewStyle}
              </p>
            </blockquote>
          )}
        </div>
      </div>
    </div>
  )
}
