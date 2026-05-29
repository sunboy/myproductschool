import { getChallenges, getFeaturedChallenges } from '@/lib/data/challenges'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeSearch } from './ChallengeSearch'
import { HatchPick } from './HatchPick'
import { FilteredChallengesView } from './FilteredChallengesView'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { BillingUsageFromProfile } from '@/components/billing/BillingUsageFromProfile'

export interface FreePracticeContentProps {
  searchParams: Promise<{
    company?: string
    difficulty?: string
    discipline?: string
    move?: string
    paradigm?: string
    q?: string
    real_interview?: string
    role?: string
    scope?: string
    tab?: string
    tag?: string
    technique?: string
    topic?: string
    type?: string
    view?: string
  }>
}

const PARADIGM_DISPLAY: Record<string, string> = {
  traditional: 'Traditional',
  ai_assisted: 'AI-Assisted',
  agentic: 'Agentic',
  ai_native: 'AI-Native',
}

function getParadigmLabel(paradigm?: string | null): string {
  return (paradigm && PARADIGM_DISPLAY[paradigm]) ?? 'Traditional'
}

export async function FreePracticeContent({ searchParams }: FreePracticeContentProps) {
  const resolvedSearchParams = await searchParams
  const { q } = resolvedSearchParams
  const hasActiveFilters = Boolean(
    q ||
    resolvedSearchParams.paradigm ||
    resolvedSearchParams.role ||
    resolvedSearchParams.difficulty ||
    resolvedSearchParams.company ||
    resolvedSearchParams.tag ||
    resolvedSearchParams.scope ||
    resolvedSearchParams.topic ||
    resolvedSearchParams.technique ||
    resolvedSearchParams.real_interview ||
    resolvedSearchParams.move ||
    (resolvedSearchParams.discipline && resolvedSearchParams.discipline !== 'all') ||
    (resolvedSearchParams.type && resolvedSearchParams.type !== 'all')
  )

  // Featured row is suppressed when any non-discipline filter is active
  const hasNonDisciplineFilter = Boolean(
    q ||
    resolvedSearchParams.paradigm ||
    resolvedSearchParams.role ||
    resolvedSearchParams.difficulty ||
    resolvedSearchParams.company ||
    resolvedSearchParams.tag ||
    resolvedSearchParams.scope ||
    resolvedSearchParams.topic ||
    resolvedSearchParams.technique ||
    resolvedSearchParams.real_interview ||
    resolvedSearchParams.move ||
    (resolvedSearchParams.type && resolvedSearchParams.type !== 'all')
  )

  // Multi-select filters arrive comma-joined from the client URL writer.
  // For SSR we filter on the FIRST value only (the URL hash hydration on the
  // client then narrows further client-side). This keeps server queries simple
  // while still returning a relevant first page.
  const firstOf = (v: string | undefined) => v?.split(',')[0]?.trim() || undefined

  const [challenges, featuredChallenges] = await Promise.all([
    getChallenges({
      q,
      topic: firstOf(resolvedSearchParams.topic),
      technique: firstOf(resolvedSearchParams.technique),
      difficulty: resolvedSearchParams.difficulty,
      paradigm: resolvedSearchParams.paradigm,
      role: resolvedSearchParams.role,
      company: resolvedSearchParams.company,
      // Client URL writer uses '1' (see writeFilterValues in FilteredChallengesView);
      // accept both '1' and 'true' for forward compat with any external link or test.
      real_interview: resolvedSearchParams.real_interview === '1' || resolvedSearchParams.real_interview === 'true',
      move_tag: firstOf(resolvedSearchParams.move),
      type: resolvedSearchParams.type,
    }),
    getFeaturedChallenges(),
  ])

  const paradigmMap: Record<string, string> = {}
  challenges.forEach((c) => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-4">
        <AppBreadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Practice' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="font-headline text-3xl font-bold leading-tight text-on-surface">
            Practice
          </h1>
          <ChallengeSearch total={challenges.length} />
        </div>
      </div>

      {/* Hatch's Pick */}
      <HatchPick />

      <BillingUsageFromProfile className="mb-6" />

      {/* Featured Challenges - only when editorially pinned challenges exist and no search query */}
      {featuredChallenges.length > 0 && !hasNonDisciplineFilter && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}>star</span>
              <h2 className="font-headline text-[22px] font-[500] text-on-surface m-0">Featured</h2>
            </div>
            <span className="text-[12px] text-on-surface-variant font-label">Curated picks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredChallenges.map((challenge) => (
              <ChallengeCard
                key={`featured-${challenge.id}`}
                challenge={challenge}
                paradigm={getParadigmLabel(challenge.paradigm)}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/20 mt-6 mb-6" />
        </div>
      )}

      {/* Discipline tabs + contextual filter dropdowns + challenge grid */}
      <FilteredChallengesView challenges={challenges} paradigms={paradigmMap} />
    </div>
  )
}
