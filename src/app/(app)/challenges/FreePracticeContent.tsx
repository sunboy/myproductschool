import { getChallenges, getFeaturedChallenges } from '@/lib/data/challenges'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeSearch } from './ChallengeSearch'
import { HatchPick } from './HatchPick'
import { FilteredChallengesView } from './FilteredChallengesView'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'

export interface FreePracticeContentProps {
  searchParams: Promise<{
    company?: string
    difficulty?: string
    discipline?: string
    paradigm?: string
    q?: string
    role?: string
    scope?: string
    tab?: string
    tag?: string
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
    (resolvedSearchParams.discipline && resolvedSearchParams.discipline !== 'all') ||
    (resolvedSearchParams.type && resolvedSearchParams.type !== 'all')
  )

  const [challenges, featuredChallenges] = await Promise.all([
    getChallenges({ q }),
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

      {/* Featured Challenges — only when editorially pinned challenges exist and no search query */}
      {featuredChallenges.length > 0 && !hasActiveFilters && (
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
