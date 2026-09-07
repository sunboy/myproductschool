import {
  getChallenges,
  getChallengePreviews,
  getChallengeCounts,
  getChallengeDescriptions,
  normalizeDisciplineParam,
  type ChallengeListFilters,
  type CountDiscipline,
} from '@/lib/data/challenges'
import Link from 'next/link'
import { ChallengeSearch } from './ChallengeSearch'
import { HatchPick } from './HatchPick'
import { FilteredChallengesView } from './FilteredChallengesView'
import { BillingUsageFromProfile } from '@/components/billing/BillingUsageFromProfile'
import { challengeTaskSummary } from '@/lib/challenges/presentation'
import { LearningGeometry } from '@/components/redesign/LearningGeometry'

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
    resume?: string
    role?: string
    scope?: string
    sort?: string
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

  // Multi-select filters arrive comma-joined from the client URL writer.
  // For SSR we filter on the FIRST value only (the URL hash hydration on the
  // client then narrows further client-side). This keeps server queries simple
  // while still returning a relevant first page.
  const firstOf = (v: string | undefined) => v?.split(',')[0]?.trim() || undefined

  const disciplineParam = resolvedSearchParams.discipline ?? resolvedSearchParams.type
  const discipline: CountDiscipline = normalizeDisciplineParam(disciplineParam) ?? 'all'

  const filters: ChallengeListFilters = {
    q,
    topic: firstOf(resolvedSearchParams.topic),
    technique: firstOf(resolvedSearchParams.technique),
    difficulty: resolvedSearchParams.difficulty,
    role: resolvedSearchParams.role,
    company: resolvedSearchParams.company,
    // Client URL writer uses '1' (see writeFilterValues in FilteredChallengesView);
    // accept both '1' and 'true' for forward compat with any external link or test.
    real_interview: resolvedSearchParams.real_interview === '1' || resolvedSearchParams.real_interview === 'true',
  }

  // Discipline chip counts (cheap HEAD counts — no row payload). The initial
  // challenge slice is bounded: the "All practice" overview
  // needs a small preview PER discipline (fetched independently so every section
  // fills, not a global newest-N which skews to recently-authored types); a
  // single discipline fetches its first page. The client lazy-loads the rest.
  const isAll = discipline === 'all'

  const [counts, initialChallenges] = await Promise.all([
    getChallengeCounts(filters),
    isAll
      ? getChallengePreviews(filters, PREVIEW_PER_DISCIPLINE)
      : getChallenges({ ...filters, type: discipline }, { limit: DISCIPLINE_PAGE_SIZE, offset: 0 }),
  ])

  const paradigmMap: Record<string, string> = {}
  initialChallenges.forEach((c) => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  // Grid-view preview cards show a 2-line blurb via challengeTaskSummary, which
  // needs the description columns the lean list query omits. Fetch them only for
  // the rows actually on screen, then precompute the summary so the client
  // receives a plain string map (no heavy text in props). Skill coverage rides
  // this second stage because it divides by the discipline counts fetched above.
  const previewIds = initialChallenges.map(c => c.id)
  const descriptions = await getChallengeDescriptions(previewIds)
  const summaryMap: Record<string, string> = {}
  for (const [id, d] of Object.entries(descriptions)) {
    const summary = challengeTaskSummary(d)
    if (summary) summaryMap[id] = summary
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="learning-page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <LearningGeometry quiet />
        <div>
          <span className="font-label text-xs font-bold uppercase tracking-[0.1em] text-forest-700">Practice</span>
          <h1 className="mt-3">A good problem.<br /><em className="font-normal text-[#aa6d18]">A new perspective.</em></h1>
          <p className="mt-1 max-w-[58ch] text-[16px] leading-[1.45] text-ink-secondary">Search the full catalog, filter by discipline, and open a guided workspace when you are ready.</p>
        </div>
        <Link href="/live-interviews" className="inline-flex shrink-0 items-center justify-center rounded-full border border-forest-800 px-4 py-2.5 text-sm font-bold text-forest-800 transition-colors hover:bg-forest-50">Practice interviews <span aria-hidden className="ml-1.5">→</span></Link>
      </header>

      <div className="flex min-w-0 flex-col gap-4">
        {/* One optional Hatch recommendation, followed immediately by results. */}
        <HatchPick className="w-full" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ChallengeSearch total={counts.all} className="w-full sm:flex-1" />
          {/* Freemium usage meter — compact strip here below lg; lives in the rail on lg+ */}
          <BillingUsageFromProfile className="lg:hidden sm:w-64 sm:flex-shrink-0" />
        </div>

        {/* Discipline chips + filter row + challenge list */}
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
    </div>
  )
}
