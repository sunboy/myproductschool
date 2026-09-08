import { cache, Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { UpgradedBanner } from '@/components/dashboard/UpgradedBanner'
import type { ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'
import { ContinueLearning } from '@/components/redesign/dashboard/ContinueLearning'
import { DashboardHero } from '@/components/redesign/dashboard/DashboardHero'
import { HatchSuggestionCard } from '@/components/redesign/dashboard/HatchSuggestionCard'
import { LearningGeometry } from '@/components/redesign/LearningGeometry'
import { PracticeAreaGrid } from '@/components/redesign/dashboard/PracticeAreaGrid'
import { ProgressSnapshot, type WeekDay } from '@/components/redesign/dashboard/ProgressSnapshot'
import { QuickTakePanel } from '@/components/redesign/dashboard/QuickTakePanel'
import { canonicalResumeHref, quickTakeForReturningUser, resolveDashboardAction } from '@/components/redesign/dashboard/action'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getEnrolledPlans } from '@/lib/data/study-plans'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { expandDifficultiesForQuery, type PracticeDifficulty } from '@/lib/practice/difficulty'
import { getCuratedFirstRepSlug, getCuratedFirstRepSlugs, FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'
import { getHatchContext, type HatchUserContext } from '@/lib/hatch-context'
import { weakestMoveFrom } from '@/lib/hatch/weakest-move'
import type { StudyPlanWithItems } from '@/lib/types'
import { getAppFlag } from '@/lib/config/app-flags'
import { DashboardV4 } from '@/components/density/dashboard/DashboardV4'
import { getAreaStats, getContinueReading, getEditorialShelf } from '@/lib/data/dashboard-density'
import type { FirstRep } from '@/components/density/dashboard/FirstRepsShelf'
import type { PathCard } from '@/components/density/dashboard/PathsRow'

const WEAKEST_PLAN: Record<string, string> = { frame: 'frame-like-a-pm', list: 'the-list-move', optimize: 'optimize-under-pressure', win: 'win-the-room' }
const WEAKEST_PLAN_NAME: Record<string, string> = { frame: 'Frame like a PM', list: 'The List move', optimize: 'Optimize under pressure', win: 'Win the room' }

async function loadFirstReps(role: string | null): Promise<FirstRep[]> {
  const admin = createAdminClient()
  const slugs = getCuratedFirstRepSlugs(role)
  const { data } = await admin.from('challenges')
    .select('id, slug, title, difficulty, challenge_type, estimated_minutes, scenario_context, prompt_text, technique_tags, move_tags')
    .in('slug', slugs).eq('is_published', true)
  const label: Record<string, string> = { flow: 'Product', freeform: 'Product', algorithm: 'Coding', sql: 'SQL', system_design: 'Design', data_modeling: 'Modeling' }
  return slugs
    .map(s => (data ?? []).find(c => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map(c => ({
      href: challengePath(c),
      title: c.title,
      summary: (c.scenario_context ?? c.prompt_text ?? '').slice(0, 140),
      typeLabel: label[c.challenge_type as string] ?? c.challenge_type ?? '',
      difficulty: String(c.difficulty ?? 'easy').replace(/^./, m => m.toUpperCase()),
      minutes: c.estimated_minutes ?? 10,
      chip: c.technique_tags?.[0] ?? c.move_tags?.[0] ?? 'Start here',
    }))
}

async function fetchHatchPick(userId: string): Promise<{ title: string; reason: string; href: string } | null> {
  const { computeNextChallenge } = await import('@/app/api/challenges/next/logic')
  const r = await computeNextChallenge(userId)
  if (!r?.challenge) return null
  return { title: r.challenge.title, reason: r.reason, href: `/workspace/challenges/${r.challenge.slug ?? r.challenge.id}` }
}

const FLOW_STEP_ORDER = ['frame', 'list', 'optimize', 'win'] as const

type MoveLevel = { move: string; xp: number; level: number; progress_pct: number }
type QuickTake = { id: string; prompt_text: string | null; move_tags: string[] | null }
type PausedInterview = { title: string; href: string; detail: string }
type ChallengeRow = {
  id: string
  slug: string | null
  title: string
  difficulty: string
  display_number: number | null
  challenge_type: string | null
  domain: { title: string } | { title: string }[] | null
}

type DashboardData = {
  displayName: string
  action: ResumeOrStartAction | null
  firstScenario: string | null
  week: WeekDay[]
  streakDays: number
  focusMove: MoveLevel | null
  continuePlan: StudyPlanWithItems | null
  plansUnavailable: boolean
  hatchMessage: string
  hatchPrompt: string
  quickTake: QuickTake | null
  pausedInterview: PausedInterview | null
  // density-v1 extras (unused by the legacy tree, consumed by DashboardV4 branch)
  userId: string | null
  preferredRole: string | null
  onboardingCompletedAt: string | null
  hasAnyAttempts: boolean
  resumeAction: ResumeOrStartAction | null
  weakestMove: string | null
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function flowStepNumber(step: string | null | undefined) {
  if (!step) return null
  const index = FLOW_STEP_ORDER.indexOf(step as (typeof FLOW_STEP_ORDER)[number])
  return index >= 0 ? index + 1 : null
}

function targetDifficulties(avgXp: number, primaryGoal: string | null, prepTimeline: string | null) {
  if (primaryGoal === 'explore') return expandDifficultiesForQuery(['easy', 'medium'])

  let buckets: PracticeDifficulty[]
  if (avgXp < 100) buckets = ['easy', 'medium']
  else if (avgXp < 300) buckets = ['medium', 'hard']
  else buckets = ['hard']

  const moveHarder = primaryGoal === 'land_pm_adjacent' || primaryGoal === 'level_up_current' || prepTimeline === 'lt_1mo'
  if (moveHarder) {
    if (buckets[0] === 'easy') buckets = ['medium', 'hard']
    else if (buckets[0] === 'medium') buckets = ['hard']
  }
  return expandDifficultiesForQuery(buckets)
}

function withSoftTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>(resolve => {
      timer = setTimeout(() => resolve(fallback), ms)
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

function buildWeek(streakRows: Array<{ date: string; completed: boolean }>): WeekDay[] {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const today = localDate(now)
  const monday = new Date(now)
  monday.setDate(now.getDate() + (now.getDay() === 0 ? -6 : 1 - now.getDay()))
  monday.setHours(0, 0, 0, 0)
  const completedDates = new Set(streakRows.filter(row => row.completed).map(row => row.date))
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return labels.map((label, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = localDate(date)
    return { label, completed: completedDates.has(key), today: key === today }
  })
}

function challengeDomain(row: ChallengeRow) {
  return Array.isArray(row.domain) ? row.domain[0]?.title ?? null : row.domain?.title ?? null
}

async function loadDashboard(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return {
      displayName: 'there', action: null, firstScenario: null, week: [], streakDays: 0,
      focusMove: null, continuePlan: null, plansUnavailable: false,
      hatchMessage: 'Choose an area you want to strengthen and I can help you find a starting point.',
      hatchPrompt: 'Help me choose a practice area to start with.',
      quickTake: null,
      pausedInterview: null,
      userId: null, preferredRole: null, onboardingCompletedAt: null,
      hasAnyAttempts: false, resumeAction: null, weakestMove: null,
    }
  }

  const admin = createAdminClient()
  const monday = new Date()
  monday.setDate(monday.getDate() + (monday.getDay() === 0 ? -6 : 1 - monday.getDay()))
  monday.setHours(0, 0, 0, 0)

  const [profileResult, movesResult, attemptsResult, progressResult, inProgressResult, quickTakesResult, pausedInterviewResult, plansResult, hatchContext] = await Promise.all([
    supabase.from('profiles').select('display_name, streak_days, primary_goal, prep_timeline, preferred_role, onboarding_completed_at').eq('id', user.id).single(),
    admin.from('move_levels').select('move, xp, level, progress_pct').eq('user_id', user.id).order('xp', { ascending: true }),
    admin.from('challenge_attempts').select('id, challenge_id, status').eq('user_id', user.id),
    admin.from('user_streaks').select('date, completed').eq('user_id', user.id).gte('date', monday.toISOString().slice(0, 10)),
    admin.from('challenge_attempts').select('challenge_id, current_step, challenges(id, slug, display_number, challenge_type, title, difficulty)').eq('user_id', user.id).eq('status', 'in_progress').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('challenges').select('id, prompt_text, move_tags').eq('challenge_type', 'quick_take').eq('is_published', true).order('created_at', { ascending: true }),
    admin.from('interview_loops' as string).select('id, title').eq('user_id', user.id).eq('status', 'paused').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    getEnrolledPlans(user.id).then(plans => ({ plans, failed: false })).catch(() => ({ plans: [] as StudyPlanWithItems[], failed: true })),
    withSoftTimeout<HatchUserContext | null>(getHatchContext(user.id), 1600, null),
  ])

  const profile = profileResult.data
  const moves = (movesResult.data ?? []) as MoveLevel[]
  const weakestMove = weakestMoveFrom(moves)
  const focusMove = moves.find(move => move.move === weakestMove) ?? moves[0] ?? null
  const completedIds = new Set((attemptsResult.data ?? []).filter(attempt => attempt.status === 'completed').map(attempt => attempt.challenge_id as string))
  const quickTake = ((quickTakesResult.data ?? []) as QuickTake[]).find(item => !completedIds.has(item.id))
    ?? ((quickTakesResult.data ?? []) as QuickTake[])[0]
    ?? null
  const hasAnyAttempts = (attemptsResult.data?.length ?? 0) > 0
  let resumeAction: ResumeOrStartAction | null = null
  let firstAction: ResumeOrStartAction | null = null
  let nextAction: ResumeOrStartAction | null = null
  let firstScenario: string | null = null
  let pausedInterview: PausedInterview | null = null

  const pausedLoop = pausedInterviewResult.data as unknown as { id: string; title: string | null } | null
  if (pausedLoop?.id) {
    const { data: pausedRoundData } = await admin.from('loop_rounds' as string)
      .select('session_id, round_index, discipline')
      .eq('loop_id', pausedLoop.id)
      .eq('status', 'paused')
      .limit(1)
      .maybeSingle()
    const pausedRound = pausedRoundData as unknown as { session_id: string | null; round_index: number; discipline: string | null } | null
    if (pausedRound?.session_id) {
      const discipline = String(pausedRound.discipline ?? '').replaceAll('_', ' ')
      pausedInterview = {
        title: pausedLoop.title ?? 'Interview session',
        href: `/live-interviews/${pausedRound.session_id}?loop_id=${pausedLoop.id}&round_index=${pausedRound.round_index}${pausedRound.discipline ? `&discipline=${pausedRound.discipline}` : ''}`,
        detail: `Round ${Number(pausedRound.round_index) + 1}${discipline ? ` · ${capitalize(discipline)}` : ''}`,
      }
    }
  }

  if (inProgressResult.data?.challenge_id) {
    const challenge = inProgressResult.data.challenges as unknown as { id?: string; slug?: string | null; display_number?: number | null; challenge_type?: string | null; title?: string; difficulty?: string | null } | null
    resumeAction = {
      kind: 'resume',
      href: canonicalResumeHref({
        id: challenge?.id ?? inProgressResult.data.challenge_id,
        slug: challenge?.slug,
        display_number: challenge?.display_number,
        challenge_type: challenge?.challenge_type,
      }),
      title: challenge?.title ?? 'Your current challenge', step: flowStepNumber(inProgressResult.data.current_step as string | null),
      totalSteps: 4, difficulty: challenge?.difficulty ?? null,
    }
  }

  if (!resumeAction && !hasAnyAttempts) {
    const slug = getCuratedFirstRepSlug(profile?.preferred_role ?? null)
    const { data: first } = await admin.from('challenges')
      .select('id, slug, title, difficulty, display_number, challenge_type, scenario_context, domain:domains(title)')
      .eq('slug', slug).eq('is_published', true).maybeSingle()
    firstAction = { kind: 'first', href: first ? challengePath(first) : FIRST_REP_FALLBACK_HREF, title: first?.title ?? null }
    firstScenario = first?.scenario_context ?? null
  }

  if (!resumeAction && hasAnyAttempts) {
    const avgXp = moves.length ? moves.reduce((total, move) => total + move.xp, 0) / moves.length : 0
    const difficulties = targetDifficulties(avgXp, profile?.primary_goal ?? null, profile?.prep_timeline ?? null)
    let nextQuery = admin.from('challenges')
      .select('id, slug, title, difficulty, display_number, challenge_type, domain:domains(title)')
      .eq('is_published', true).neq('challenge_type', 'quick_take').contains('move_tags', [weakestMove]).in('difficulty', difficulties)
    if (completedIds.size) nextQuery = nextQuery.not('id', 'in', `(${Array.from(completedIds).join(',')})`)
    let { data: next } = await nextQuery.limit(1).maybeSingle()

    if (!next) {
      let fallbackQuery = admin.from('challenges')
        .select('id, slug, title, difficulty, display_number, challenge_type, domain:domains(title)')
        .eq('is_published', true).neq('challenge_type', 'quick_take')
      if (completedIds.size) fallbackQuery = fallbackQuery.not('id', 'in', `(${Array.from(completedIds).join(',')})`)
      const fallback = await fallbackQuery.limit(1).maybeSingle()
      next = fallback.data
    }

    if (next) {
      const row = next as ChallengeRow
      nextAction = { kind: 'next', href: challengePath(row), title: row.title, difficulty: row.difficulty, domain: challengeDomain(row) }
    }
  }

  const action = resolveDashboardAction({
    resume: resumeAction,
    first: firstAction,
    next: nextAction,
    hasAnyAttempts,
  })

  const continuePlan = plansResult.plans.find(plan => plan.progress_percentage > 0 && plan.progress_percentage < 100)
    ?? plansResult.plans.find(plan => plan.progress_percentage < 100)
    ?? null
  const focusLabel = capitalize(focusMove?.move ?? weakestMove)
  const weakestCompetency = hatchContext?.weakestCompetency
  const competencyScore = weakestCompetency
    ? hatchContext?.competencies.find(item => item.competency === weakestCompetency)?.score ?? null
    : null

  let hatchMessage: string
  let hatchPrompt: string
  if (action?.kind === 'resume') {
    hatchMessage = `You already have momentum on ${action.title}. I can help you decide how to approach the next step.`
    hatchPrompt = `How should I approach the next step in ${action.title}?`
  } else if (weakestCompetency && competencyScore !== null) {
    hatchMessage = `${focusLabel} is the clearest area to strengthen next. Ask me why today’s challenge fits.`
    hatchPrompt = `Why is today’s challenge a good way to strengthen ${focusLabel}?`
  } else if (continuePlan) {
    hatchMessage = `You can keep moving through ${continuePlan.title}, or ask me to choose a focused challenge for today.`
    hatchPrompt = `Should I continue ${continuePlan.title}, or focus on a different challenge today?`
  } else {
    hatchMessage = 'Tell me what role or interview you are preparing for, and I’ll help you choose a focused challenge.'
    hatchPrompt = 'Help me choose a focused challenge for today.'
  }

  return {
    displayName: profile?.display_name ?? 'there', action, firstScenario,
    week: buildWeek((progressResult.data ?? []) as Array<{ date: string; completed: boolean }>),
    streakDays: profile?.streak_days ?? 0, focusMove, continuePlan,
    plansUnavailable: plansResult.failed, hatchMessage, hatchPrompt,
    quickTake: quickTakeForReturningUser(quickTake?.prompt_text ? quickTake : null, hasAnyAttempts),
    pausedInterview,
    userId: user.id,
    preferredRole: profile?.preferred_role ?? null,
    onboardingCompletedAt: (profile as { onboarding_completed_at?: string | null } | null)?.onboarding_completed_at ?? null,
    hasAnyAttempts, resumeAction, weakestMove,
  }
}

const getDashboard = cache(loadDashboard)

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-5 font-body sm:px-7 sm:py-7 lg:px-9">
      <Suspense fallback={null}><UpgradedBanner /></Suspense>
      <Suspense fallback={<DashboardSkeleton />}><DashboardContent /></Suspense>
    </main>
  )
}

async function DashboardContent() {
  const data = await getDashboard()

  const density = await getAppFlag('ui_density_v1', false)
  if (density && data.userId) {
    const isNewUser = !data.onboardingCompletedAt && !data.hasAnyAttempts
    if (isNewUser) {
      const cookieStore = await cookies()
      if (!cookieStore.get('hp-welcome-seen')) redirect('/welcome')
    }
    const [areaStats, reading, editorial] = await Promise.all([
      getAreaStats(data.userId),
      isNewUser ? null : getContinueReading(data.userId),
      isNewUser ? { featured: null, items: [] } : getEditorialShelf(data.userId),
    ])
    const firstReps = isNewUser ? await loadFirstReps(data.preferredRole) : []
    const pick = !data.resumeAction && !isNewUser ? await fetchHatchPick(data.userId) : null

    const paths: PathCard[] = [
      ...(data.continuePlan ? [{ slug: data.continuePlan.slug, name: data.continuePlan.title, eyebrow: 'Study plan', done: data.continuePlan.completed_count ?? 0, total: data.continuePlan.item_count ?? 0, unit: 'reps' as const }] : []),
      ...(data.weakestMove && WEAKEST_PLAN[data.weakestMove] ? [{ slug: WEAKEST_PLAN[data.weakestMove], name: WEAKEST_PLAN_NAME[data.weakestMove], eyebrow: 'Weakest move', done: 0, total: 8, unit: 'reps' as const }] : []),
    ]

    return (
      <DashboardV4
        displayName={data.displayName}
        isNewUser={isNewUser}
        streakDays={data.streakDays}
        resume={data.action?.kind === 'resume' ? { title: data.action.title, meta: `Step ${data.action.step ?? 1} of ${data.action.totalSteps ?? 4}`, href: data.action.href } : null}
        reading={reading}
        hatchPick={pick}
        hatchMessage={data.hatchMessage}
        hatchPrompts={isNewUser
          ? [{ label: 'Pick my first challenge', prompt: 'Pick my first challenge based on my role.' }, { label: 'Show me around', event: 'start-intro-tour' }]
          : [{ label: data.hatchPrompt, prompt: data.hatchPrompt }, { label: 'Help me choose what to learn next', prompt: 'Help me choose what to learn next based on my recent work and goals.' }]}
        areaStats={areaStats}
        editorial={editorial}
        paths={paths}
        quickTake={data.quickTake?.prompt_text ? { prompt: data.quickTake.prompt_text, challengeId: data.quickTake.id, move: data.quickTake.move_tags?.[0] ?? undefined } : null}
        week={data.week}
        focusMove={data.focusMove?.move ?? null}
        firstReps={firstReps}
        calibrationHref="/welcome"
      />
    )
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className="learning-home-stage">
        <LearningGeometry />
        <div className="learning-welcome">
          <p>{data.action?.kind === 'first' ? 'Welcome' : 'Welcome back'}, {data.displayName}</p>
          <h1>{data.action?.kind === 'first' ? 'Find your' : 'Keep your'}<br /><em>{data.action?.kind === 'first' ? 'next possibility.' : 'curiosity going.'}</em></h1>
          <p>Pick up a good problem, follow a question, and make a little more progress.</p>
        </div>
        <div className="learning-home-primary">
          <DashboardHero displayName={data.displayName} action={data.action} firstScenario={data.firstScenario} />
          <HatchSuggestionCard message={data.hatchMessage} prompt={data.hatchPrompt} />
        </div>
      </section>
      <PracticeAreaGrid />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <ContinueLearning plan={data.continuePlan} unavailable={data.plansUnavailable} pausedInterview={data.pausedInterview} />
          {data.quickTake?.prompt_text && (
            <QuickTakePanel prompt={data.quickTake.prompt_text} challengeId={data.quickTake.id} move={data.quickTake.move_tags?.[0] ?? null} />
          )}
        </div>
        <div className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <ProgressSnapshot week={data.week} streakDays={data.streakDays} focusMove={data.focusMove} />
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-[270px] animate-pulse rounded-[28px] bg-surface-container" />
      <div className="space-y-3"><div className="h-7 w-44 animate-pulse rounded bg-surface-container" /><div className="h-[116px] animate-pulse rounded-2xl bg-surface-container" /></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]"><div className="h-[250px] animate-pulse rounded-2xl bg-surface-container" /><div className="h-[250px] animate-pulse rounded-2xl bg-surface-container" /></div>
    </div>
  )
}
