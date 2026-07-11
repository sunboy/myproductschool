import Link from 'next/link'
import {
  Grid2x2, Box, Database, Lightbulb, BrainCircuit, Users,
  ChevronDown, ArrowRight, Bookmark,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getFeaturedChallenges,
  getChallengeCounts,
  type CountDiscipline,
} from '@/lib/data/challenges'
import { getStudyPlanSummaries, getEnrolledPlans } from '@/lib/data/study-plans'
import { getHotChallenges } from '@/lib/data/dashboard'
import { getAutopsyCompanies } from '@/lib/autopsies/queries'
import { getReadableAppCompanies } from '@/lib/autopsies/app-library'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { difficultyLabel } from '@/lib/utils'
import { getCompanyLabel } from '@/lib/data/taxonomy'
import { formatCompany } from '@/lib/format/company'
import { HatchImage } from '@/components/redesign/HatchImage'
import { DisciplineTile, type Discipline as TileDiscipline } from '@/components/redesign/DisciplineTile'
import { disciplineFor } from '@/components/redesign/dashboard/discipline'
import type { ChallengeWithDomain } from '@/lib/types'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const AUTOPSY_BRAND_ACCENTS: Record<string, string> = {
  netflix: '#e50914',
  airbnb: '#ff5a5f',
  amazon: '#ff9900',
  dropbox: '#0061ff',
  slack: '#611f69',
  uber: '#000000',
  'uber-eats': '#06c167',
  openai: '#10a37f',
}

function brandAccentFor(name: string): string | null {
  const key = name.toLowerCase().replace(/\s+/g, '-')
  return AUTOPSY_BRAND_ACCENTS[key] ?? null
}

const DISCIPLINE_TABS: Array<{ key: CountDiscipline; label: string; icon: typeof Box }> = [
  { key: 'all', label: 'All', icon: Grid2x2 },
  { key: 'system_design', label: 'System Design', icon: Box },
  { key: 'product_sense', label: 'Product Sense', icon: Lightbulb },
  { key: 'sql', label: 'SQL', icon: Database },
  { key: 'data_modeling', label: 'Data Modeling', icon: Grid2x2 },
  { key: 'algorithm', label: 'Coding/DSA', icon: BrainCircuit },
]

interface CuratedChallenge {
  id: string
  title: string
  slug: string | null
  difficulty: string
  challenge_type: string
  company_tags: string[] | null
  topic_tags: string[] | null
  technique_tags: string[] | null
}

interface CompanyChallengeGroup {
  company: string
  challenges: CuratedChallenge[]
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  const activeDiscipline: CountDiscipline =
    (resolvedSearchParams.discipline as CountDiscipline) ?? 'all'

  const adminClient = userId ? createAdminClient() : null

  const [
    counts,
    featuredChallenges,
    studyPlansRaw,
    enrolledPlans,
    autopsyCompaniesRaw,
    hotChallenges,
    profileLead,
  ] = await Promise.all([
    getChallengeCounts(),
    getFeaturedChallenges(),
    getStudyPlanSummaries(6),
    userId ? getEnrolledPlans(userId) : Promise.resolve([]),
    getAutopsyCompanies().catch(() => []),
    getHotChallenges(),
    loadHeroLead(userId, adminClient),
  ])

  const realInterviewGroups = await loadRealInterviewGroups(adminClient)

  const autopsyHubs = getReadableAppCompanies(autopsyCompaniesRaw)
  const studyPlansBySlug = new Map(studyPlansRaw.map(p => [p.slug, p]))
  const enrolledSlugs = new Set(enrolledPlans.map(p => p.slug))
  const shelfPlans = [
    ...enrolledPlans,
    ...studyPlansRaw.filter(p => !enrolledSlugs.has(p.slug)),
  ].slice(0, 3)

  return (
    <main data-tour-target="practice-hero" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
      <CatalogHero lead={profileLead} />

      <DisciplineTabs counts={counts} active={activeDiscipline} />
      <FilterRow />

      <FeaturedPractice
        challenges={featuredChallenges}
        weakestMove={profileLead.weakestMove}
        interviewDate={profileLead.interviewDate}
      />

      <div className="mt-6 grid grid-cols-1 gap-3.5 lg:grid-cols-4">
        <StudyPlansShelf plans={shelfPlans} studyPlansBySlug={studyPlansBySlug} enrolledSlugs={enrolledSlugs} />
        <AutopsiesShelf hubs={autopsyHubs.slice(0, 3)} />
        <RealInterviewsShelf groups={realInterviewGroups} />
        <TrendingShelf challenges={hotChallenges} />
      </div>
    </main>
  )
}

/* ────────────────────────────────────────────────────────────────────────
 * Hero lead: same real signals the dashboard hero uses (weekly goal from
 * user_streaks, weakest move from move_levels, active plan from
 * user_study_plans) so the catalog hero is grounded, not decorative.
 * ──────────────────────────────────────────────────────────────────────── */
async function loadHeroLead(userId: string | null, adminClient: ReturnType<typeof createAdminClient> | null) {
  const empty = {
    displayName: 'there',
    weakestMove: 'frame',
    weakestMoveLevel: null as number | null,
    weakestMoveProgress: null as number | null,
    weeklyDone: 0,
    weeklyGoal: 5,
    activePlanTitle: null as string | null,
    activePlanSlug: null as string | null,
    interviewDate: null as string | null,
  }
  if (!userId || !adminClient) return empty

  const supabase = await createClient()
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = localDate(weekStart)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekEndStr = localDate(weekEnd)

  const [{ data: profile }, { data: moveLevelsData }, { data: streakRows }, { data: activePlanRow }] = await Promise.all([
    supabase.from('profiles').select('display_name, interview_date').eq('id', userId).single(),
    adminClient.from('move_levels').select('move, level, progress_pct').eq('user_id', userId).order('xp', { ascending: true }),
    adminClient.from('user_streaks').select('date, completed').eq('user_id', userId).gte('date', weekStartStr).lte('date', weekEndStr),
    adminClient
      .from('user_study_plans')
      .select('study_plans(slug, title)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const moveLevels = (moveLevelsData ?? []) as { move: string; level: number; progress_pct: number }[]
  const weakest = moveLevels[0] ?? null
  const weeklyDone = (streakRows ?? []).filter(r => r.completed).length
  const activePlan = (activePlanRow?.study_plans as unknown as { slug: string; title: string } | null) ?? null

  return {
    displayName: profile?.display_name ?? 'there',
    weakestMove: weakest?.move ?? 'frame',
    weakestMoveLevel: weakest?.level ?? null,
    weakestMoveProgress: weakest?.progress_pct ?? null,
    weeklyDone,
    weeklyGoal: 5,
    activePlanTitle: activePlan?.title ?? null,
    activePlanSlug: activePlan?.slug ?? null,
    interviewDate: profile?.interview_date ?? null,
  }
}

async function loadRealInterviewGroups(adminClient: ReturnType<typeof createAdminClient> | null): Promise<CompanyChallengeGroup[]> {
  const client = adminClient ?? createAdminClient()
  try {
    const { data } = await client
      .from('challenges')
      .select('id, title, slug, difficulty, challenge_type, company_tags, topic_tags, technique_tags')
      .eq('is_published', true)
      .eq('is_real_interview', true)
      .not('company_tags', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(200)
    const rows = (data ?? []) as CuratedChallenge[]
    const counts = new Map<string, CuratedChallenge[]>()
    for (const c of rows) {
      for (const company of c.company_tags ?? []) {
        if (!counts.has(company)) counts.set(company, [])
        counts.get(company)!.push(c)
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3)
    const seenIds = new Set<string>()
    return sorted
      .map(([company, challenges]) => {
        const unique = challenges.filter(c => {
          if (seenIds.has(c.id)) return false
          seenIds.add(c.id)
          return true
        })
        return { company, challenges: unique }
      })
      .filter(g => g.challenges.length > 0)
  } catch {
    return []
  }
}

/* ──────────────────────────────────────────────────────────────────────── */

function CatalogHero({ lead }: { lead: Awaited<ReturnType<typeof loadHeroLead>> }) {
  const weakestLabel = capitalize(lead.weakestMove)
  const headlineHasSignal = lead.weakestMoveLevel !== null
  const title = headlineHasSignal
    ? `${weakestLabel} is your weakest move. The picks below work on it.`
    : `Pick up where the practice gym leaves off.`

  return (
    <section
      data-hatch-target="practice-hero"
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl px-5 py-5 text-white sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:gap-5"
      style={{
        background: 'linear-gradient(120deg, var(--color-forest-950) 0%, var(--color-forest-850) 55%, var(--color-forest-800) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-24 h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(30,71,45,.55) 0%, rgba(30,71,45,0) 70%)' }}
      />

      <div className="relative z-10 min-w-0 flex-[1.15]">
        <div className="mb-2 text-[13px] font-bold text-white/88">Welcome back, {lead.displayName}</div>
        <h1 className="mb-3.5 max-w-[460px] font-headline text-[24px] font-semibold leading-[1.22] text-[#f9faf5] sm:text-[26px]">
          {highlightWord(title, weakestLabel)}
        </h1>
        <div className="flex flex-wrap gap-2.5">
          <HeroChip label="Weekly goal" value={`${lead.weeklyDone} of ${lead.weeklyGoal} sessions`} />
          {lead.weakestMoveLevel !== null && (
            <HeroChip label="Weakest move" value={`${weakestLabel} Lv${lead.weakestMoveLevel}${lead.weakestMoveProgress !== null ? ` · ${lead.weakestMoveProgress}%` : ''}`} />
          )}
          {lead.activePlanTitle && (
            <HeroChip label="Current plan" value={lead.activePlanTitle} />
          )}
        </div>
      </div>

      <div className="relative z-10 hidden shrink-0 self-end lg:block">
        <HatchImage state="thinking" size={128} priority className="drop-shadow-[0_14px_28px_rgba(0,0,0,.35)]" />
      </div>

      <div className="relative z-10 w-full shrink-0 rounded-xl bg-note-mint px-[14px] py-3 lg:w-[190px]">
        <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-forest-800">
          <HatchImage state="avatar" size={16} className="rounded-full" />
          Hatch says
        </div>
        <div className="mb-2.5 text-[11.5px] leading-[1.4] text-ink-strong">
          {hatchHeroMessage(lead)}
        </div>
        {lead.activePlanSlug ? (
          <Link
            href={`/explore/plans/${lead.activePlanSlug}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-forest-600 px-2.5 py-2 text-[11.5px] font-extrabold text-white no-underline"
          >
            Resume plan
          </Link>
        ) : (
          <Link
            href="/challenges?difficulty=easy"
            className="inline-flex w-full items-center justify-center rounded-lg bg-forest-600 px-2.5 py-2 text-[11.5px] font-extrabold text-white no-underline"
          >
            Start an easy rep
          </Link>
        )}
      </div>
    </section>
  )
}

function hatchHeroMessage(lead: Awaited<ReturnType<typeof loadHeroLead>>): string {
  const weakestLabel = capitalize(lead.weakestMove)
  if (lead.weakestMoveLevel !== null) {
    return `${weakestLabel} is the gap right now. The featured picks below drill exactly that.`
  }
  return 'Start with an easy rep and Hatch will start reading your weak moves.'
}

function highlightWord(headline: string, word: string): React.ReactNode {
  const idx = headline.toLowerCase().indexOf(word.toLowerCase())
  if (idx === -1) return headline
  const before = headline.slice(0, idx)
  const match = headline.slice(idx, idx + word.length)
  const after = headline.slice(idx + word.length)
  return (
    <>
      {before}
      <span className="hl-word">{match}</span>
      {after}
    </>
  )
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
      <div className="leading-[1.2]">
        <div className="text-[10px] font-bold text-white/65">{label}</div>
        <div className="text-[12.5px] font-extrabold tabular-nums text-white">{value}</div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */

function DisciplineTabs({ counts, active }: { counts: Record<CountDiscipline, number>; active: CountDiscipline }) {
  return (
    <nav data-tour-target="explore-paths" className="mt-5 flex items-center gap-5 overflow-x-auto border-b border-hairline">
      {DISCIPLINE_TABS.map(tab => {
        const Icon = tab.icon
        const isActive = tab.key === active
        const href = tab.key === 'all' ? '/challenges' : `/challenges?discipline=${tab.key}`
        return (
          <Link
            key={tab.key}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-[2.5px] py-2.5 text-[13.5px] font-bold no-underline ${
              isActive ? 'border-forest-700 text-forest-700' : 'border-transparent text-ink-muted'
            }`}
          >
            <Icon size={16} strokeWidth={1.8} className={isActive ? 'text-forest-600' : 'opacity-80'} />
            {tab.label}
            <span className="ml-0.5 tabular-nums text-[11px] font-semibold text-ink-muted">
              {counts[tab.key]}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function FilterRow() {
  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
      <FilterLink href="/challenges?difficulty=easy" label="Easy" />
      <FilterLink href="/challenges?difficulty=medium" label="Medium" />
      <FilterLink href="/challenges?difficulty=hard" label="Hard" />
      <FilterLink href="/challenges?real_interview=1" label="Real interviews" />
      <div className="flex-1" />
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-secondary bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-secondary no-underline"
      >
        Open full filters
        <ChevronDown size={13} strokeWidth={1.8} />
      </Link>
    </div>
  )
}

function FilterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-secondary bg-card-alt px-3.5 py-2 text-[12.5px] font-bold text-ink-secondary no-underline"
    >
      {label}
    </Link>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */

function FeaturedPractice({
  challenges,
  weakestMove,
  interviewDate,
}: {
  challenges: ChallengeWithDomain[]
  weakestMove: string
  interviewDate: string | null
}) {
  if (challenges.length === 0) return null
  const cards = challenges.slice(0, 4)

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="m-0 text-[18px] font-bold text-ink-strong">Picked for you</h2>
          <div className="mt-0.5 text-[12.5px] text-ink-muted">
            Curated picks across disciplines
          </div>
        </div>
        <Link href="/challenges" className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-extrabold text-forest-700 no-underline">
          View all
          <ArrowRight size={13} strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(challenge => (
          <FeaturedCard
            key={challenge.id}
            challenge={challenge}
            weakestMove={weakestMove}
            interviewDate={interviewDate}
          />
        ))}
      </div>
    </div>
  )
}

function reasonFor(challenge: ChallengeWithDomain, weakestMove: string, interviewDate: string | null): string {
  const companies = (challenge as unknown as { company_tags?: string[] | null }).company_tags ?? []
  if (challenge.is_real_interview && companies.length > 0) {
    const label = getCompanyLabel(companies[0]) ?? formatCompany(companies[0])
    return interviewDate
      ? `Asked in real ${label} loops. Your mock interview is coming up.`
      : `Asked in real ${label} interview loops.`
  }
  const moveTags = (challenge as unknown as { move_tags?: string[] | null }).move_tags ?? []
  if (moveTags.includes(weakestMove)) {
    return `A ${capitalize(weakestMove)}-heavy scenario, and ${capitalize(weakestMove)} is your weakest move.`
  }
  return `Editorially picked for this week's practice rotation.`
}

function FeaturedCard({
  challenge,
  weakestMove,
  interviewDate,
}: {
  challenge: ChallengeWithDomain
  weakestMove: string
  interviewDate: string | null
}) {
  const discipline = disciplineFor(challenge.challenge_type, challenge.domain?.title)
  const label = DISCIPLINE_EYEBROW[discipline]
  const minutes = (challenge as unknown as { estimated_minutes?: number | null }).estimated_minutes
  const meta = [difficultyLabel(challenge.difficulty), minutes ? `${minutes} min` : null].filter(Boolean).join(' · ')

  return (
    <Link
      href={challengePath(challenge)}
      className="flex flex-col rounded-xl border border-hairline bg-card-bright p-4 no-underline shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <DisciplineTile discipline={discipline} className="size-11" />
        <Bookmark size={16} strokeWidth={1.7} className="text-ink-muted" />
      </div>
      <div className={`mb-2 font-label text-[10.5px] font-bold uppercase tracking-[0.06em] ${DISCIPLINE_EYEBROW_CLASS[discipline]}`}>
        {label}
      </div>
      <div className="mb-2.5 min-h-[40px] text-[15px] font-bold leading-[1.32] text-ink-strong">
        {challenge.title}
      </div>
      {meta && <div className="mb-2.5 text-[12px] font-medium tabular-nums text-ink-muted">{meta}</div>}
      <div className="mb-3.5 min-h-[44px] border-t border-hairline pt-2.5 text-[12px] leading-[1.45] text-ink-secondary">
        {reasonFor(challenge, weakestMove, interviewDate)}
      </div>
      <span className="mt-auto flex w-full items-center justify-center rounded-lg bg-forest-950 py-2.5 text-[13px] font-bold text-white">
        Start now
      </span>
    </Link>
  )
}

const DISCIPLINE_EYEBROW: Record<TileDiscipline, string> = {
  'system-design': 'System Design',
  'product-sense': 'Product Sense',
  'data-modeling': 'Data Modeling',
  sql: 'SQL',
  'ai-ml': 'AI / ML',
}

const DISCIPLINE_EYEBROW_CLASS: Record<TileDiscipline, string> = {
  'system-design': 'text-sd-fg',
  'product-sense': 'text-ps-fg',
  'data-modeling': 'text-dm-fg',
  sql: 'text-sql-fg',
  'ai-ml': 'text-aiml-fg',
}

/* ──────────────────────────────────────────────────────────────────────── */

function ShelfCard({ title, href, viewAllLabel = 'View all', sub, children }: {
  title: string
  href: string
  viewAllLabel?: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-card-bright p-4">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="m-0 text-[15.5px] font-bold text-ink-strong">{title}</h3>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-forest-700 no-underline">
          {viewAllLabel}
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      {sub && <div className="mb-3 text-[11.5px] font-medium text-ink-muted">{sub}</div>}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

function ShelfRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-[44px] items-center gap-2.5 border-t border-hairline py-2 no-underline first:border-t-0"
    >
      {children}
    </Link>
  )
}

function StudyPlansShelf({
  plans,
  studyPlansBySlug,
  enrolledSlugs,
}: {
  plans: Array<{ slug: string; title: string; item_count?: number; progress_percentage?: number }>
  studyPlansBySlug: Map<string, { title: string; challenge_count?: number | null }>
  enrolledSlugs: Set<string>
}) {
  if (plans.length === 0) return null
  const primaryEnrolled = plans.find(p => enrolledSlugs.has(p.slug) && typeof p.progress_percentage === 'number')

  return (
    <ShelfCard
      title="Study Plans"
      href="/explore/plans"
      sub={primaryEnrolled ? `Your plan is ${Math.round(primaryEnrolled.progress_percentage ?? 0)}% complete` : 'Sequenced practice paths'}
    >
      {plans.map(plan => {
        const isEnrolled = enrolledSlugs.has(plan.slug)
        const challengeCount = plan.item_count ?? studyPlansBySlug.get(plan.slug)?.challenge_count ?? null
        return (
          <ShelfRow key={plan.slug} href={`/explore/plans/${plan.slug}`}>
            <span
              aria-hidden
              className={isEnrolled ? 'size-3 shrink-0 rounded-full bg-forest-600 shadow-[0_0_0_3px_var(--color-sd-bg)]' : 'size-2.5 shrink-0 rounded-full border-[1.4px] border-hairline'}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-bold leading-[1.3] text-ink-strong">{plan.title}</span>
              <span className="mt-0.5 block text-[10.5px] font-medium text-ink-muted">
                {isEnrolled ? 'Enrolled' : challengeCount ? `${challengeCount} challenges` : 'Not started'}
              </span>
            </span>
            {isEnrolled && typeof plan.progress_percentage === 'number' && (
              <span className="shrink-0 text-right">
                <span className="block text-[10.5px] font-medium tabular-nums text-ink-muted">{Math.round(plan.progress_percentage)}%</span>
                <span className="mt-1 block h-1 w-11 overflow-hidden rounded-full bg-hairline">
                  <span className="block h-full rounded-full bg-forest-600" style={{ width: `${Math.min(100, Math.round(plan.progress_percentage))}%` }} />
                </span>
              </span>
            )}
          </ShelfRow>
        )
      })}
    </ShelfCard>
  )
}

function AutopsiesShelf({ hubs }: { hubs: Array<{ slug: string; name: string; stories: unknown[] }> }) {
  if (hubs.length === 0) return null
  return (
    <ShelfCard title="Product Autopsies" href="/explore/autopsies" sub="Real products taken apart, stage by stage">
      {hubs.map(hub => {
        const accent = brandAccentFor(hub.name)
        const storyCount = hub.stories.length
        return (
          <ShelfRow key={hub.slug} href={`/explore/autopsies/${hub.slug}`}>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[11.5px] font-bold"
                style={accent ? { color: accent } : undefined}
              >
                {accent ? hub.name : <span className="text-ink-secondary">{hub.name}</span>}
              </span>
              <span className="block text-[12.5px] font-bold leading-[1.3] text-ink-strong">Decoded</span>
              {storyCount > 0 && (
                <span className="mt-0.5 block text-[10.5px] font-medium text-ink-muted">
                  {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                </span>
              )}
            </span>
          </ShelfRow>
        )
      })}
    </ShelfCard>
  )
}

function RealInterviewsShelf({ groups }: { groups: CompanyChallengeGroup[] }) {
  if (groups.length === 0) return null
  return (
    <ShelfCard title="Real Interviews" href="/challenges?real_interview=1" sub="Questions asked in real loops, grouped by company">
      {groups.map(group => {
        const label = getCompanyLabel(group.company) ?? formatCompany(group.company)
        const accent = brandAccentFor(label)
        const topChallenge = group.challenges[0]
        return (
          <ShelfRow
            key={group.company}
            href={topChallenge ? challengePath(topChallenge) : `/challenges?company=${group.company}`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-bold" style={accent ? { color: accent } : undefined}>
                {label}
              </span>
              <span className="mt-0.5 block text-[10.5px] font-medium text-ink-muted">System design</span>
            </span>
            <span className="shrink-0 rounded-full border-[1.5px] border-forest-700 bg-sd-bg px-2 py-0.5 text-[10.5px] font-bold text-forest-700">
              {group.challenges.length} {group.challenges.length === 1 ? 'Q' : 'Qs'}
            </span>
          </ShelfRow>
        )
      })}
    </ShelfCard>
  )
}

function TrendingShelf({ challenges }: { challenges: Array<{ id: string; slug?: string | null; title: string; challenge_type?: string | null; display_number?: number | null; attempts: number; domain?: string | null }> }) {
  if (challenges.length === 0) return null
  return (
    <ShelfCard title="Trending" href="/cohort" viewAllLabel="Leaderboard">
      <div className="mb-2.5 -mt-1 inline-block rounded-lg border border-note-teal-border bg-note-teal px-2.5 py-1.5 text-[11.5px] font-medium text-[#2c5f58]">
        Most attempts in the last 7 days
      </div>
      {challenges.slice(0, 5).map((challenge, index) => (
        <ShelfRow key={challenge.id} href={challengePath(challenge)}>
          <span className="w-[18px] shrink-0 text-[13px] font-bold tabular-nums text-ink-muted">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-bold leading-[1.3] text-ink-strong">{challenge.title}</span>
            {challenge.domain && (
              <span className="mt-0.5 block text-[10.5px] font-medium text-ink-muted">{challenge.domain}</span>
            )}
          </span>
          <span className="shrink-0 text-[10.5px] font-medium tabular-nums text-ink-muted">
            {challenge.attempts} {challenge.attempts === 1 ? 'attempt' : 'attempts'}
          </span>
        </ShelfRow>
      ))}
    </ShelfCard>
  )
}
