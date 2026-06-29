import {
  getChallenges,
  getChallengePreviews,
  getFeaturedChallenges,
  getChallengeCounts,
  getChallengeDescriptions,
  isCountDiscipline,
  type ChallengeListFilters,
  type CountDiscipline,
} from '@/lib/data/challenges'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeSearch } from './ChallengeSearch'
import { HatchPick } from './HatchPick'
import { FilteredChallengesView } from './FilteredChallengesView'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { BillingUsageFromProfile } from '@/components/billing/BillingUsageFromProfile'
import { challengeTaskSummary } from '@/lib/challenges/presentation'

/** How many preview cards each discipline section shows in the "All practice" overview. */
const PREVIEW_PER_DISCIPLINE = 6
/** Page size for a single-discipline first load. */
const DISCIPLINE_PAGE_SIZE = 30

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

  // Featured row is suppressed when any non-discipline filter is active
  const hasNonDisciplineFilter = Boolean(
    q ||
    resolvedSearchParams.paradigm ||
    resolvedSearchParams.role ||
    resolvedSearchParams.difficulty ||
    resolvedSearchParams.company ||
    resolvedSearchParams.topic ||
    resolvedSearchParams.technique ||
    resolvedSearchParams.real_interview ||
    (resolvedSearchParams.type && resolvedSearchParams.type !== 'all')
  )

  // Multi-select filters arrive comma-joined from the client URL writer.
  // For SSR we filter on the FIRST value only (the URL hash hydration on the
  // client then narrows further client-side). This keeps server queries simple
  // while still returning a relevant first page.
  const firstOf = (v: string | undefined) => v?.split(',')[0]?.trim() || undefined

  const disciplineParam = resolvedSearchParams.discipline ?? resolvedSearchParams.type
  const discipline: CountDiscipline =
    disciplineParam && isCountDiscipline(disciplineParam) ? disciplineParam : 'all'

  const filters: ChallengeListFilters = {
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
  }

  // Discipline tab counts (cheap HEAD counts — no row payload) + featured row.
  // The initial challenge slice is bounded: the "All practice" overview needs a
  // small preview PER discipline (fetched independently so every section fills,
  // not a global newest-N which skews to recently-authored types); a single
  // discipline fetches its first page. The client lazy-loads the rest.
  const isAll = discipline === 'all'

  const [counts, initialChallenges, featuredChallenges] = await Promise.all([
    getChallengeCounts(filters),
    isAll
      ? getChallengePreviews(filters, PREVIEW_PER_DISCIPLINE)
      : getChallenges({ ...filters, type: discipline }, { limit: DISCIPLINE_PAGE_SIZE, offset: 0 }),
    getFeaturedChallenges(),
  ])

  const paradigmMap: Record<string, string> = {}
  initialChallenges.forEach((c) => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })
  featuredChallenges.forEach((c) => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  // Grid-view preview cards (and featured cards) show a 2-line blurb via
  // challengeTaskSummary, which needs the description columns the lean list query
  // omits. Fetch them only for the rows actually on screen, then precompute the
  // summary so the client receives a plain string map (no heavy text in props).
  const previewIds = Array.from(
    new Set([...initialChallenges.map(c => c.id), ...featuredChallenges.map(c => c.id)]),
  )
  const descriptions = await getChallengeDescriptions(previewIds)
  const summaryMap: Record<string, string> = {}
  for (const [id, d] of Object.entries(descriptions)) {
    const summary = challengeTaskSummary(d)
    if (summary) summaryMap[id] = summary
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 space-y-3">
        <AppBreadcrumbs
          items={[
            { label: 'Practice' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <HatchGlyph size={36} state="listening" className="shrink-0 text-primary" />
            <h1 className="font-headline text-3xl font-bold leading-tight text-on-surface">
              Practice
            </h1>
          </div>
          <ChallengeSearch total={counts.all} />
        </div>
      </div>

      {/* Hatch's Pick + usage meter share one band so the question list sits
          higher. On large screens the meter rides alongside the pick; it stacks
          below on narrow screens. */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="lg:flex-1 lg:min-w-0">
          <HatchPick className="h-full" />
        </div>
        <BillingUsageFromProfile className="lg:w-72 lg:flex-shrink-0" />
      </div>

      {/* Featured Challenges - only when editorially pinned challenges exist and no search query */}
      {featuredChallenges.length > 0 && !hasNonDisciplineFilter && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
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
                summary={summaryMap[challenge.id]}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/20 mt-6 mb-6" />
        </div>
      )}

      {/* Discipline tabs + contextual filter dropdowns + challenge grid */}
      <FilteredChallengesView
        initialChallenges={initialChallenges}
        initialDiscipline={discipline}
        counts={counts}
        paradigms={paradigmMap}
        summaries={summaryMap}
        previewPerDiscipline={PREVIEW_PER_DISCIPLINE}
        pageSize={DISCIPLINE_PAGE_SIZE}
      />
    </div>
  )
}
