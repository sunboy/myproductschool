'use client'

import { useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type Discipline } from '@/components/challenges/DisciplineTabStrip'
import { FilterDropdownBar, type FilterState } from '@/components/challenges/FilterDropdownBar'
import { ActiveFilterPills } from '@/components/challenges/ActiveFilterPills'
import { FilterBottomSheet } from '@/components/challenges/FilterBottomSheet'
import { AppTooltip } from '@/components/ui/AppTooltip'
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
  tag: [],
  scope: [],
  topic: [],
  technique: [],
  move: [],
  real_interview: false,
}

type FilterKey = keyof FilterState
/** Filter keys whose value is string[] (all except real_interview). */
type ArrayFilterKey = Exclude<FilterKey, 'real_interview'>
type SearchParamReader = Pick<URLSearchParams, 'get' | 'getAll'>
type SearchParamGetter = Pick<URLSearchParams, 'get'>

const ARRAY_FILTER_KEYS = (Object.keys(EMPTY_FILTERS) as FilterKey[]).filter(k => k !== 'real_interview') as ArrayFilterKey[]
const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as FilterKey[]

const DISCIPLINES: Array<{
  key: Discipline
  label: string
  description: string
  icon: string
  accent: string
}> = [
  {
    key: 'all',
    label: 'All practice',
    description: 'Every rep across product, data, systems, SQL, and coding.',
    icon: 'apps',
    accent: '#4a7c59',
  },
  {
    key: 'product_sense',
    label: 'Product sense',
    description: 'MCQs and judgment drills for product-quality thinking.',
    icon: 'psychology',
    accent: '#4a7c59',
  },
  {
    key: 'system_design',
    label: 'System design',
    description: 'Architecture prompts, tradeoffs, scale, and context.',
    icon: 'hub',
    accent: '#7a5c2e',
  },
  {
    key: 'data_modeling',
    label: 'Data modeling',
    description: 'Schema, entities, analytics thinking, and durable models.',
    icon: 'account_tree',
    accent: '#5b6f4d',
  },
  {
    key: 'sql',
    label: 'SQL',
    description: 'Live query execution with real interview-style datasets.',
    icon: 'database',
    accent: '#5a3a7c',
  },
  {
    key: 'algorithm',
    label: 'Coding',
    description: 'DSA practice for implementation speed and correctness.',
    icon: 'data_object',
    accent: '#3a5a7c',
  },
]

const ROLE_VALUE_MAP: Record<string, string> = {
  SWE: 'swe',
  'Tech Lead': 'tech_lead',
  EM: 'em',
  'ML Eng': 'ml_eng',
  'Data Eng': 'data_eng',
  DevOps: 'devops',
  'Founding Eng': 'founding_eng',
  PM: 'pm',
  Designer: 'designer',
  'Data Scientist': 'data_scientist',
}

const DIFFICULTY_VALUE_MAP: Record<string, string> = {
  Staff: 'staff_plus',
  'Staff+': 'staff_plus',
  Warmup: 'warmup',
  Standard: 'standard',
  Advanced: 'advanced',
}

const SCOPE_VALUE_MAP: Record<string, string> = {
  'Single Service': 'single_service',
  Distributed: 'distributed',
  'Multi-Region': 'multi_region',
}

function isDiscipline(value: string | null): value is Discipline {
  return DISCIPLINES.some((discipline) => discipline.key === value)
}

function readFilterValues(searchParams: SearchParamReader, key: FilterKey): string[] {
  const values = searchParams
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(values))
}

function writeFilterValues(params: URLSearchParams, key: FilterKey, values: string[]) {
  if (values.length === 0) {
    params.delete(key)
    return
  }

  params.set(key, values.join(','))
}

function normalizeValue(value: string) {
  return value.toLowerCase().replace(/[-\s]+/g, '_')
}

function getDiscipline(searchParams: SearchParamGetter): Discipline {
  const discipline = searchParams.get('discipline')
  const legacyType = searchParams.get('type')

  if (isDiscipline(discipline)) return discipline
  if (isDiscipline(legacyType)) return legacyType
  return 'all'
}

function matchesDiscipline(challenge: ChallengeWithDomain, discipline: Discipline) {
  if (discipline === 'all') return true
  if (discipline === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(challenge.challenge_type ?? '')
  return challenge.challenge_type === discipline
}

function matchesSecondaryFilters(challenge: ChallengeWithDomain, filters: FilterState) {
  if (filters.paradigm.length > 0) {
    const selectedParadigms = filters.paradigm.map(normalizeValue)
    const challengeParadigm = normalizeValue(challenge.paradigm ?? '')
    if (!selectedParadigms.includes(challengeParadigm)) return false
  }

  if (filters.difficulty.length > 0) {
    const selectedDifficulties = filters.difficulty.map((difficulty) => (
      DIFFICULTY_VALUE_MAP[difficulty] ?? normalizeValue(difficulty)
    ))
    if (!selectedDifficulties.includes(challenge.difficulty)) return false
  }

  if (filters.role.length > 0) {
    const selectedRoles = filters.role.map((role) => ROLE_VALUE_MAP[role] ?? normalizeValue(role))
    const challengeRoles = (challenge.relevant_roles ?? []).map(normalizeValue)
    if (!selectedRoles.some((role) => challengeRoles.includes(role))) return false
  }

  if (filters.company.length > 0) {
    const selectedCompanies = filters.company.map(normalizeValue)
    const challengeCompanies = (challenge.company_tags ?? []).map(normalizeValue)
    if (!selectedCompanies.some((company) => challengeCompanies.includes(company))) return false
  }

  if (filters.tag.length > 0) {
    const selectedTags = filters.tag.map(normalizeValue)
    const challengeTags = (challenge.tags ?? []).map(normalizeValue)
    if (!selectedTags.some((tag) => challengeTags.includes(tag))) return false
  }

  if (filters.scope.length > 0) {
    if (challenge.challenge_type !== 'system_design') return false

    const selectedScopes = filters.scope.map((scope) => SCOPE_VALUE_MAP[scope] ?? normalizeValue(scope))
    const challengeScope = (challenge as unknown as { metadata?: Record<string, unknown> | null }).metadata?.scope
    if (typeof challengeScope !== 'string' || !selectedScopes.includes(challengeScope)) return false
  }

  if (filters.topic.length > 0) {
    const challengeTopics = challenge.topic_tags ?? []
    if (!filters.topic.some((t) => challengeTopics.includes(t))) return false
  }

  if (filters.technique.length > 0) {
    const challengeTechniques = challenge.technique_tags ?? []
    if (!filters.technique.some((t) => challengeTechniques.includes(t))) return false
  }

  if (filters.move.length > 0) {
    const challengeMoves = (challenge.move_tags ?? []) as string[]
    const selectedMoves = filters.move.map(m => m.toLowerCase())
    if (!selectedMoves.some((m) => challengeMoves.includes(m))) return false
  }

  if (filters.real_interview) {
    if (!challenge.is_real_interview) return false
  }

  return true
}

export function FilteredChallengesView({ challenges, paradigms }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const searchString = searchParams.toString()
  const parsedParams = useMemo(() => new URLSearchParams(searchString), [searchString])

  const discipline = getDiscipline(parsedParams)

  const filters = useMemo<FilterState>(() => ({
    paradigm: readFilterValues(parsedParams, 'paradigm'),
    difficulty: readFilterValues(parsedParams, 'difficulty'),
    role: readFilterValues(parsedParams, 'role'),
    company: readFilterValues(parsedParams, 'company'),
    tag: readFilterValues(parsedParams, 'tag'),
    scope: readFilterValues(parsedParams, 'scope'),
    topic: readFilterValues(parsedParams, 'topic'),
    technique: readFilterValues(parsedParams, 'technique'),
    move: readFilterValues(parsedParams, 'move'),
    real_interview: parsedParams.get('real_interview') === '1',
  }), [parsedParams])

  const listView = parsedParams.get('view') !== 'grid'
  const returnHref = `${pathname}${searchString ? `?${searchString}` : ''}`

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchString)
    mutator(params)

    const nextSearch = params.toString()
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false })
  }

  function handleDisciplineChange(nextDiscipline: Discipline) {
    updateParams((params) => {
      params.delete('type')
      if (nextDiscipline === 'all') params.delete('discipline')
      else params.set('discipline', nextDiscipline)

      if (nextDiscipline !== 'system_design') params.delete('scope')
    })
  }

  function handleFilterChange(nextFilters: FilterState) {
    updateParams((params) => {
      ARRAY_FILTER_KEYS.forEach((key) => writeFilterValues(params, key, nextFilters[key] as string[]))
      if (nextFilters.real_interview) params.set('real_interview', '1')
      else params.delete('real_interview')
      if (getDiscipline(params) !== 'system_design') params.delete('scope')
    })
  }

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => (
      matchesDiscipline(challenge, discipline) && matchesSecondaryFilters(challenge, filters)
    ))
  }, [challenges, discipline, filters])

  const disciplineCounts = useMemo(() => {
    const counts = new Map<Discipline, number>()

    DISCIPLINES.forEach((entry) => {
      counts.set(
        entry.key,
        challenges.filter((challenge) => (
          matchesDiscipline(challenge, entry.key) && matchesSecondaryFilters(challenge, filters)
        )).length,
      )
    })

    return counts
  }, [challenges, filters])

  function handleRemoveFilter(key: keyof FilterState, value: string) {
    if (key === 'real_interview') {
      handleFilterChange({ ...filters, real_interview: false })
    } else {
      const current = filters[key] as string[]
      handleFilterChange({ ...filters, [key]: current.filter((v) => v !== value) })
    }
  }

  function handleClearAll() {
    updateParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key))
    })
  }

  function handleToggleView() {
    updateParams((params) => {
      if (listView) params.set('view', 'grid')
      else params.delete('view')
    })
  }

  return (
    <div className="flex flex-col -mx-6">
      <section className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {DISCIPLINES.map((entry) => {
            const active = discipline === entry.key
            const count = disciplineCounts.get(entry.key) ?? 0

            return (
              <AppTooltip
                key={entry.key}
                label={entry.description}
                side="bottom"
                className="flex"
              >
                <button
                  type="button"
                  onClick={() => handleDisciplineChange(entry.key)}
                  aria-pressed={active}
                  title={entry.description}
                  className={[
                    'group flex min-h-[88px] w-full flex-col justify-between rounded-lg border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active
                      ? 'border-primary bg-primary-fixed text-primary shadow-[0_10px_24px_-18px_rgba(51,82,58,0.75)]'
                      : 'border-outline-variant/55 bg-surface-container-low text-on-surface hover:-translate-y-0.5 hover:border-outline hover:bg-surface-container',
                  ].join(' ')}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className="material-symbols-outlined text-[19px] leading-none"
                      style={{
                        color: active ? 'var(--color-primary)' : entry.accent,
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {entry.icon}
                    </span>
                    <span
                      className={[
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold font-label tabular-nums',
                        active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </span>
                  <span className="space-y-0.5">
                    <span className="block truncate font-headline text-[13px] font-bold leading-tight text-current">
                      {entry.label}
                    </span>
                    <span className="line-clamp-2 block text-[10.5px] leading-tight text-on-surface-variant">
                      {entry.description}
                    </span>
                  </span>
                </button>
              </AppTooltip>
            )
          })}
        </div>
      </section>

      {/* Filter dropdown bar */}
      <FilterDropdownBar
        discipline={discipline}
        filters={filters}
        onChange={handleFilterChange}
        resultCount={filteredChallenges.length}
        onOpenMobileSheet={() => setMobileSheetOpen(true)}
        listView={listView}
        onToggleView={handleToggleView}
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
        onChange={handleFilterChange}
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
                algorithm: 'Coding',
              }
              const colors: Record<string, string> = {
                product_sense: 'text-primary',
                system_design: 'text-tertiary',
                data_modeling: 'text-secondary',
                sql: 'text-[#5a3a7c]',
                algorithm: 'text-[#3a5a7c]',
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
                      type="button"
                      onClick={() => handleDisciplineChange(disc as Discipline)}
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
                      returnHref={returnHref}
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
              returnHref={returnHref}
            />
          </div>
        )}
      </div>
    </div>
  )
}
