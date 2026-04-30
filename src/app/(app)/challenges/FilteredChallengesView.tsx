'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DisciplineTabStrip, type Discipline } from '@/components/challenges/DisciplineTabStrip'
import { CodingSubTabStrip, type CodingSubDiscipline } from '@/components/challenges/CodingSubTabStrip'
import { FilterDropdownBar, type FilterState } from '@/components/challenges/FilterDropdownBar'
import { ActiveFilterPills } from '@/components/challenges/ActiveFilterPills'
import { FilterBottomSheet } from '@/components/challenges/FilterBottomSheet'
import { LockedChallengeGrid } from './LockedChallengeGrid'
import type { ChallengeWithDomain } from '@/lib/types'

interface Props {
  challenges: ChallengeWithDomain[]
  paradigms: Record<string, string>
}

const EMPTY_FILTERS: FilterState = {
  paradigm: [],
  difficulty: [],
  role: [],
  company: [],
  scope: [],
}

export function FilteredChallengesView({ challenges, paradigms }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [discipline, setDiscipline] = useState<Discipline>('all')
  const [codingSub, setCodingSub] = useState<CodingSubDiscipline>(
    (searchParams.get('sub') as CodingSubDiscipline) ?? 'sql'
  )
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [listView, setListView] = useState(false)

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      // Discipline filter
      if (discipline === 'product_sense' && !['flow', 'freeform', 'quick_take'].includes(c.challenge_type ?? '')) return false
      if (discipline === 'system_design' && c.challenge_type !== 'system_design') return false
      if (discipline === 'data_modeling' && c.challenge_type !== 'data_modeling') return false
      if (discipline === 'coding') {
        if (codingSub === 'sql' && c.challenge_type !== 'sql') return false
        if (codingSub === 'algorithm' && c.challenge_type !== 'algorithm') return false
      }

      // Paradigm filter
      if (filters.paradigm.length > 0) {
        const mappedParadigms = filters.paradigm.map((p) => p.toLowerCase().replace(/-/g, '_'))
        const challengeParadigm = (c.paradigm ?? '').toLowerCase().replace(/-/g, '_')
        if (!mappedParadigms.includes(challengeParadigm)) return false
      }

      // Difficulty filter
      if (filters.difficulty.length > 0) {
        const diffMap: Record<string, string> = {
          'Staff+': 'staff_plus',
          'Warmup': 'warmup',
          'Standard': 'standard',
          'Advanced': 'advanced',
        }
        if (!filters.difficulty.some((d) => (diffMap[d] ?? d.toLowerCase()) === c.difficulty)) return false
      }

      // Scope filter (system_design only)
      if (filters.scope.length > 0 && c.challenge_type === 'system_design') {
        const scopeMap: Record<string, string> = {
          'Single Service': 'single_service',
          'Distributed': 'distributed',
          'Multi-Region': 'multi_region',
        }
        const challengeScope = (c as unknown as { metadata?: Record<string, string> | null }).metadata?.scope
        if (!filters.scope.some((s) => scopeMap[s] === challengeScope)) return false
      }

      return true
    })
  }, [challenges, discipline, codingSub, filters])

  function handleRemoveFilter(key: keyof FilterState, value: string) {
    setFilters((f) => ({ ...f, [key]: f[key].filter((v) => v !== value) }))
  }

  function handleClearAll() {
    setFilters(EMPTY_FILTERS)
  }

  function handleCodingSubChange(sub: CodingSubDiscipline) {
    setCodingSub(sub)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sub', sub)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col -mx-6">
      {/* Discipline tab strip — full-bleed */}
      <DisciplineTabStrip active={discipline} onChange={setDiscipline} />

      {/* Coding sub-tab strip (SQL / Algorithms) */}
      {discipline === 'coding' && (
        <CodingSubTabStrip active={codingSub} onChange={handleCodingSubChange} />
      )}

      {/* Filter dropdown bar */}
      <FilterDropdownBar
        discipline={discipline}
        filters={filters}
        onChange={setFilters}
        resultCount={filteredChallenges.length}
        onOpenMobileSheet={() => setMobileSheetOpen(true)}
        listView={listView}
        onToggleView={() => setListView((v) => !v)}
      />

      {/* Active filter pills */}
      <ActiveFilterPills
        filters={filters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Mobile bottom sheet */}
      <FilterBottomSheet
        open={mobileSheetOpen}
        discipline={discipline}
        filters={filters}
        resultCount={filteredChallenges.length}
        onChange={setFilters}
        onClose={() => setMobileSheetOpen(false)}
        onClearAll={handleClearAll}
      />

      {/* Results */}
      <div className="px-6 pt-4">
        {filteredChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="font-headline text-base font-bold text-on-surface">No challenges match those filters</p>
            <button
              onClick={handleClearAll}
              className="text-sm text-primary font-bold hover:underline font-label"
            >
              Clear all filters
            </button>
          </div>
        ) : discipline === 'all' ? (
          <div className="flex flex-col gap-8">
            {(['product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm'] as const).map((disc) => {
              const labels: Record<string, string> = {
                product_sense: 'Product Sense',
                system_design: 'System Design',
                data_modeling: 'Data Modeling',
                sql: 'SQL',
                algorithm: 'Algorithms',
              }
              const colors: Record<string, string> = {
                product_sense: 'text-primary',
                system_design: 'text-tertiary',
                data_modeling: 'text-secondary',
                sql: 'text-primary',
                algorithm: 'text-tertiary',
              }
              const discChallenges = filteredChallenges.filter((c) => {
                if (disc === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(c.challenge_type ?? '')
                return c.challenge_type === disc
              })
              if (discChallenges.length === 0) return null
              const discParadigms: Record<string, string> = {}
              discChallenges.forEach((c) => { discParadigms[c.id] = paradigms[c.id] ?? 'Traditional' })
              const preview = discChallenges.slice(0, 6)
              const previewParadigms: Record<string, string> = {}
              preview.forEach((c) => { previewParadigms[c.id] = paradigms[c.id] ?? 'Traditional' })
              return (
                <section key={disc} className="flex flex-col gap-3">
                  <div className={`font-label font-bold text-sm flex items-center gap-2 ${colors[disc]}`}>
                    {labels[disc]}
                    <button
                      onClick={() => {
                        if (disc === 'sql' || disc === 'algorithm') {
                          setDiscipline('coding')
                          setCodingSub(disc)
                        } else {
                          setDiscipline(disc as Discipline)
                        }
                      }}
                      className="font-label text-xs text-on-surface-variant font-normal hover:underline"
                    >
                      see all {discChallenges.length} →
                    </button>
                  </div>
                  <div className={listView ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
                    <LockedChallengeGrid
                      challenges={preview}
                      paradigms={previewParadigms}
                      listView={listView}
                    />
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className={listView ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
            <LockedChallengeGrid
              challenges={filteredChallenges}
              paradigms={paradigms}
              listView={listView}
            />
          </div>
        )}
      </div>
    </div>
  )
}
