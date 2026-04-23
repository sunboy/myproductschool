'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'
import StartInterviewButton from './StartInterviewButton'

const FILTER_ROLES = ['All', 'PM', 'SWE', 'Data Eng', 'ML Eng'] as const
type FilterRole = typeof FILTER_ROLES[number]

const LEFT_PAGE_SIZE = 15
const RIGHT_PAGE_SIZE = 10

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

function PaginationBar({
  page,
  pageSize,
  total,
  onPrev,
  onNext,
}: {
  page: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const start = page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)
  const isFirst = page === 0
  const isLast = end >= total

  if (total <= pageSize) return null

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-outline-variant/20 shrink-0">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="p-1 rounded-lg disabled:opacity-30 hover:bg-surface-container transition-colors"
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
          chevron_left
        </span>
      </button>
      <span className="text-xs text-on-surface-variant font-label">
        {start}–{end} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={isLast}
        className="p-1 rounded-lg disabled:opacity-30 hover:bg-surface-container transition-colors"
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
          chevron_right
        </span>
      </button>
    </div>
  )
}

export default function FilteredPersonaGrid({ personas, scenarios = [] }: FilteredPersonaGridProps) {
  const [rightFilter, setRightFilter] = useState<FilterRole>('All')
  const [selected, setSelected] = useState<LiveInterviewPersona>(personas[0])
  const [leftPage, setLeftPage] = useState(0)
  const [rightPage, setRightPage] = useState(0)

  // Deduplicate by companyId — one entry per company, left panel shows all
  const seen = new Set<string>()
  const deduped = personas.filter(p => {
    if (seen.has(p.companyId)) return false
    seen.add(p.companyId)
    return true
  })

  const activePersona = selected ?? deduped[0]

  const leftPagedItems = deduped.slice(leftPage * LEFT_PAGE_SIZE, (leftPage + 1) * LEFT_PAGE_SIZE)

  const relevantScenarios = scenarios.filter(s => {
    if (!activePersona) return false
    if (s.relevantRoles.length === 0) return true
    const roleKey = activePersona.role.toLowerCase().replace(/\s+/g, '_')
    return s.relevantRoles.some(
      r => r.toLowerCase().replace(/\s+/g, '_') === roleKey
        || r.toLowerCase() === activePersona.role.toLowerCase()
    )
  })

  const filteredScenarios = relevantScenarios.filter(s =>
    rightFilter === 'All' ? true : s.relevantRoles.some(r => matchesFilter({ role: r } as LiveInterviewPersona, rightFilter))
  )

  const rightPagedScenarios = filteredScenarios.slice(rightPage * RIGHT_PAGE_SIZE, (rightPage + 1) * RIGHT_PAGE_SIZE)

  function selectPersona(p: LiveInterviewPersona) {
    setSelected(p)
    setRightPage(0)
  }

  function handleRightFilterChange(f: FilterRole) {
    setRightFilter(f)
    setRightPage(0)
  }

  if (!activePersona) return null

  return (
    <div className="flex flex-row gap-0 rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">

      {/* ── Left: Company Roster ───────────────────────────── */}
      <div className="shrink-0 flex flex-col border-r border-outline-variant/30" style={{ width: '260px' }}>
        <div className="overflow-y-auto px-3 py-3 space-y-1.5">
          {leftPagedItems.map(persona => {
            const isActive = activePersona.companyId === persona.companyId
            const dotColor = DIFFICULTY_DOT[persona.difficulty]
            return (
              <button
                key={persona.companyId}
                onClick={() => selectPersona(persona)}
                style={{
                  background: isActive ? 'var(--color-surface-container-high)' : 'var(--color-surface-container)',
                  borderRadius: 12,
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                  transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1), border-color 150ms',
                  transform: isActive ? 'none' : undefined,
                  width: '100%',
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-left group',
                  !isActive && 'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-4px_rgba(30,27,20,0.15)]'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[18px] shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                  )}
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  {persona.icon}
                </span>
                <p className={cn(
                  'flex-1 min-w-0 text-sm font-semibold truncate transition-colors',
                  isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'
                )}>
                  {persona.companyName}
                </p>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
              </button>
            )
          })}

          {deduped.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-10 font-label">
              No interviewers for this role yet.
            </p>
          )}
        </div>

        <PaginationBar
          page={leftPage}
          pageSize={LEFT_PAGE_SIZE}
          total={deduped.length}
          onPrev={() => setLeftPage(p => Math.max(0, p - 1))}
          onNext={() => setLeftPage(p => p + 1)}
        />
      </div>

      {/* ── Right: Scenarios Pane ─────────────────────────────────── */}
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
        <div className="relative z-10 flex flex-col">

          {/* Role filter pills — filters the scenario list */}
          <div className="px-5 pt-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
            {FILTER_ROLES.map(role => (
              <button
                key={role}
                onClick={() => handleRightFilterChange(role)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-label font-semibold transition-all',
                  rightFilter === role
                    ? 'bg-on-surface text-inverse-on-surface'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Scenario list — capped to RIGHT_PAGE_SIZE rows */}
          <div className="px-5 pb-3 space-y-1.5">

            {/* Free-form card — always at top, color-coded */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary-fixed/50 border border-primary/20">
              <div>
                <p className="text-sm font-label font-bold text-on-surface">Free-form interview</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Luma picks the scenario</p>
              </div>
              <StartInterviewButton companyId={activePersona.companyId} roleId={activePersona.role} companyName={activePersona.companyName} />
            </div>

            {/* Paginated scenario rows */}
            {rightPagedScenarios.map(scenario => {
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
                    <StartInterviewButton companyId={activePersona.companyId} roleId={activePersona.role} challengeId={scenario.id} companyName={activePersona.companyName} />
                  </div>
                </div>
              )
            })}

            {filteredScenarios.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-6 font-label">
                No specific scenarios for this role yet.
              </p>
            )}
          </div>

          <PaginationBar
            page={rightPage}
            pageSize={RIGHT_PAGE_SIZE}
            total={filteredScenarios.length}
            onPrev={() => setRightPage(p => Math.max(0, p - 1))}
            onNext={() => setRightPage(p => p + 1)}
          />
        </div>
      </div>
    </div>
  )
}
