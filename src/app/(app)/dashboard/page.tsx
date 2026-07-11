import Link from 'next/link'
import { cache, Suspense } from 'react'
import { UpgradedBanner } from '@/components/dashboard/UpgradedBanner'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getHotChallenges,
  getLeaderboardPeek,
  getLatestInterview,
} from '@/lib/data/dashboard'
import { getCommunityActivityFeed } from '@/lib/data/community'
import { getEnrolledPlans } from '@/lib/data/study-plans'
import { getCcAnalyticsFrontDoor } from '@/lib/data/cc-analytics-frontdoor'
import { getHatchContext, type HatchUserContext } from '@/lib/hatch-context'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { expandDifficultiesForQuery, type PracticeDifficulty } from '@/lib/practice/difficulty'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { CoachSpineCard } from '@/components/dashboard/cards/CoachSpineCard'
import { AnalyticsLabCard } from '@/components/dashboard/cards/AnalyticsLabCard'
import { UpgradeSponsorCard } from '@/components/dashboard/cards/UpgradeSponsorCard'
import { CadenceRibbon } from '@/components/dashboard/cards/CadenceRibbon'
import { LatestInterviewCard } from '@/components/dashboard/cards/LatestInterviewCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { CommunityActivityCard } from '@/components/dashboard/cards/CommunityActivityCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import { EnrolledPlansCard } from '@/components/dashboard/cards/EnrolledPlansCard'
import { ICON_COLOR_MAP, ICON_MAP } from '@/components/dashboard/cards/AchievementsCard'
import { PausedLoopCard } from '@/components/live-interviews/PausedLoopCard'
import { DisciplineExplorer } from '@/components/flow-disciplines'
import { FeaturedAutopsyCard } from '@/components/dashboard/cards/FeaturedAutopsyCard'
import { getFeaturedAutopsyForDashboard } from '@/lib/autopsies/queries'
import type { UserInterview } from '@/lib/data/dashboard'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'
import { difficultyLabel } from '@/lib/utils'
import { getCuratedFirstRepSlug, FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'
import { ResumeOrStartCard, type ResumeOrStartAction } from '@/components/dashboard/cards/ResumeOrStartCard'

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

// FLOW steps are stored on challenge_attempts.current_step as a move name
// ('frame' | 'list' | 'optimize' | 'win') or 'done'. Map to a 1-based step
// number for the resume card's "Step n of 4" readout.
const FLOW_STEP_ORDER = ['frame', 'list', 'optimize', 'win'] as const
function flowStepNumber(currentStep: string | null | undefined): number | null {
  if (!currentStep) return null
  const idx = FLOW_STEP_ORDER.indexOf(currentStep as (typeof FLOW_STEP_ORDER)[number])
  return idx >= 0 ? idx + 1 : null
}

function moveHatchInsight(
  move: string,
  level: number,
  primaryGoal?: string | null,
): string {
  const goalContext: Record<string, string> = {
    land_pm_adjacent: 'Sharpening product thinking for a PM-adjacent role.',
    level_up_current: 'Leveling up within your current role.',
    ship_better: 'Making sharper product calls day to day.',
    explore: 'Getting a feel for the practice loop.',
  }
  const goalLine = goalContext[primaryGoal ?? ''] ?? null

  let levelLine: string
  if (level <= 2) levelLine = `${capitalize(move)} is the gap right now. This challenge builds the foundation.`
  else if (level <= 5) levelLine = `${capitalize(move)} needs more reps at this difficulty.`
  else levelLine = `${capitalize(move)} is looking solid. This sharpens the edge.`

  return goalLine ? `${goalLine} ${levelLine}` : levelLine
}

function targetDifficulties(
  avgXp: number,
  primaryGoal?: string | null,
  prepTimeline?: string | null,
): string[] {
  if (primaryGoal === 'explore') {
    return expandDifficultiesForQuery(['easy', 'medium'])
  }

  let buckets: PracticeDifficulty[]
  if (avgXp < 100) buckets = ['easy', 'medium']
  else if (avgXp < 300) buckets = ['medium', 'hard']
  else buckets = ['hard']

  const shiftHarder =
    primaryGoal === 'land_pm_adjacent' ||
    primaryGoal === 'level_up_current' ||
    prepTimeline === 'lt_1mo'

  if (shiftHarder) {
    if (buckets[0] === 'easy') buckets = ['medium', 'hard']
    else if (buckets[0] === 'medium' && buckets.length > 1) buckets = ['hard']
  }

  return expandDifficultiesForQuery(buckets)
}

type RawChallenge = {
  id: string
  slug?: string | null
  title: string
  difficulty: string
  display_number?: number | null
  challenge_type?: string | null
  domain?: { title: string }[] | { title: string } | null
}
type NextChallenge = {
  id: string
  slug?: string | null
  title: string
  difficulty: string
  display_number?: number | null
  challenge_type?: string | null
  domainName?: string | null
  hatch_insight?: string | null
}
type AttemptRow = {
  challenge_id: string
  created_at: string
  challenges: { title: string; slug: string | null; challenge_type: string | null } | null
}
type PathStep = { label: string; sub: string; icon: string; done: boolean; active: boolean; href?: string }
type WeekDate = { dayLabel: string; dateLabel: string; completed: boolean; isToday: boolean }

function normalizeChallenge(raw: RawChallenge | null): NextChallenge | null {
  if (!raw) return null
  const d = raw.domain
  const domainName = Array.isArray(d) ? (d[0]?.title ?? null) : (d?.title ?? null)
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    difficulty: raw.difficulty,
    display_number: raw.display_number,
    challenge_type: raw.challenge_type,
    domainName,
  }
}

function withSoftTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>(resolve => {
      timeout = setTimeout(() => resolve(fallback), ms)
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout)
  })
}

async function loadDashboardLeadUncached() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const defaults = {
    userId: user?.id ?? '',
    displayName: 'there',
    streakDays: 0,
    xpTotal: 0,
    isCalibrated: false,
    dailyDone: 0,
    plan: 'free' as string | null,
    allMoveLevels: [] as { move: string; xp: number; level: number; progress_pct: number }[],
    weakestMove: 'frame',
    hatchContext: null as HatchUserContext | null,
  }

  if (!user?.id) return defaults

  const today = new Date().toISOString().split('T')[0]
  const adminClient = createAdminClient()
  const profilePromise = supabase
    .from('profiles')
    .select('display_name, onboarding_completed_at, streak_days, xp_total, plan')
    .eq('id', user.id)
    .single()
  const dailyCountPromise = supabase
    .from('challenge_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today)
  const moveLevelsPromise = adminClient
    .from('move_levels')
    .select('move, xp, level, progress_pct')
    .eq('user_id', user.id)
    .order('xp', { ascending: true })
  const hatchContextPromise = withSoftTimeout<HatchUserContext | null>(getHatchContext(user.id), 1200, null)

  const [{ data: profile }, { count: dailyCount }, { data: moveLevelsData }, hatchContext] = await Promise.all([
    profilePromise,
    dailyCountPromise,
    moveLevelsPromise,
    hatchContextPromise,
  ])
  const allMoveLevels = (moveLevelsData ?? []) as { move: string; xp: number; level: number; progress_pct: number }[]

  return {
    userId: user.id,
    displayName: profile?.display_name ?? 'there',
    streakDays: profile?.streak_days ?? 0,
    xpTotal: profile?.xp_total ?? 0,
    isCalibrated: !!profile?.onboarding_completed_at,
    dailyDone: dailyCount ?? 0,
    plan: profile?.plan ?? 'free',
    allMoveLevels,
    weakestMove: allMoveLevels[0]?.move ?? 'frame',
    hatchContext,
  }
}

async function loadDashboardCoreUncached() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'there'
  let streakDays = 0
  let xpTotal = 0
  let interviewDate: string | null = null
  let isCalibrated = false
  let dailyDone = 0
  let plan: string | null = 'free'
  let primaryGoal: string | null = null
  let prepTimeline: string | null = null
  let roleContext: string | null = null
  let rawDisplayName: string | null = null
  let preferredRoleForFirstRep: string | null = null

  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: profile }, { count: dailyCount }] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, onboarding_completed_at, streak_days, xp_total, interview_date, plan, primary_goal, prep_timeline, role_context, preferred_role')
        .eq('id', user.id)
        .single(),
      supabase
        .from('challenge_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today),
    ])

    rawDisplayName = profile?.display_name ?? null
    displayName = profile?.display_name ?? 'there'
    streakDays = profile?.streak_days ?? 0
    xpTotal = profile?.xp_total ?? 0
    interviewDate = profile?.interview_date ?? null
    isCalibrated = !!profile?.onboarding_completed_at
    dailyDone = dailyCount ?? 0
    plan = profile?.plan ?? 'free'
    primaryGoal = ((profile as Record<string, unknown> | null)?.primary_goal as string | null) ?? null
    prepTimeline = ((profile as Record<string, unknown> | null)?.prep_timeline as string | null) ?? null
    roleContext = ((profile as Record<string, unknown> | null)?.role_context as string | null) ?? null
    preferredRoleForFirstRep = ((profile as Record<string, unknown> | null)?.preferred_role as string | null) ?? null
  }

  const userId = user?.id ?? ''
  const adminClient = createAdminClient()
  const hatchContextPromise = userId
    ? withSoftTimeout<HatchUserContext | null>(getHatchContext(userId), 2200, null)
    : Promise.resolve(null)

  const [hotChallenges, leaderboard, enrolledPlans, latestInterview, communityActivity, featuredAutopsy, activePlanResult] = await Promise.all([
    getHotChallenges(),
    userId ? getLeaderboardPeek(userId, { display_name: rawDisplayName, xp_total: xpTotal }) : [],
    userId ? getEnrolledPlans(userId) : [],
    userId ? getLatestInterview(userId) : null,
    userId ? getCommunityActivityFeed(6) : [],
    getFeaturedAutopsyForDashboard(),
    userId
      ? adminClient
          .from('user_study_plans')
          .select('study_plans(slug)')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const activePlanSlug = (activePlanResult?.data?.study_plans as unknown as { slug: string } | null)?.slug ?? null

  let pausedLoopData: { loop: Record<string, unknown>; rounds: Record<string, unknown>[] } | null = null
  if (userId) {
    try {
      const { data: pausedLoops } = await adminClient
        .from('interview_loops' as string)
        .select('id, user_id, status, created_at, updated_at, scenario_id, company_id, round_count, config')
        .eq('user_id', userId)
        .eq('status', 'paused')
        .order('created_at', { ascending: false })
        .limit(1)

      if (pausedLoops?.length) {
        const { data: rounds } = await adminClient
          .from('loop_rounds' as string)
          .select('id, loop_id, round_index, status, score, feedback_json, created_at, updated_at')
          .eq('loop_id', (pausedLoops[0] as { id: string }).id)
          .order('round_index', { ascending: true })
        pausedLoopData = { loop: pausedLoops[0] as Record<string, unknown>, rounds: rounds ?? [] }
      }
    } catch {
      pausedLoopData = null
    }
  }

  let achievementData: { id: string; name: string; icon: string; unlocked: boolean; color: string }[] = []
  let weekDates: WeekDate[] = []
  let todayAttempts: AttemptRow[] = []

  if (userId) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const todayStr = localDate(now)
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + mondayOffset)
    weekStart.setHours(0, 0, 0, 0)

    const weekDateStrings: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      weekDateStrings.push(localDate(d))
    }

    const [achievementsResult, streakResult, todayAttemptsResult, userAchievements] = await Promise.all([
      adminClient.from('achievement_definitions').select('id, name, icon, xp_reward, criteria_type, criteria_value'),
      adminClient.from('user_streaks').select('date, completed').eq('user_id', userId).gte('date', weekDateStrings[0]).lte('date', weekDateStrings[6]),
      adminClient.from('challenge_attempts').select('challenge_id, created_at, challenges(title, slug, challenge_type)').eq('user_id', userId).eq('status', 'completed').gte('created_at', todayStr).order('created_at', { ascending: true }).limit(10),
      adminClient.from('user_achievements').select('achievement_id').eq('user_id', userId),
    ])

    const unlockedIds = new Set((userAchievements.data ?? []).map(a => a.achievement_id as string))
    achievementData = (achievementsResult.data ?? []).map(def => ({
      id: def.id,
      name: def.name,
      icon: ICON_MAP[def.id] ?? def.icon ?? 'star',
      unlocked: unlockedIds.has(def.id),
      color: ICON_COLOR_MAP[def.id] ?? '#4a7c59',
    }))

    const streakDates = new Set((streakResult.data ?? []).filter(r => r.completed).map(r => r.date as string))
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    weekDates = weekDateStrings.map((d, i) => ({
      dayLabel: DAY_LABELS[i],
      dateLabel: d,
      completed: streakDates.has(d),
      isToday: d === todayStr,
    }))

    todayAttempts = (todayAttemptsResult.data ?? []) as unknown as AttemptRow[]
  }

  let nextChallenge: NextChallenge | null = null
  let allMoveLevels: { move: string; xp: number; level: number; progress_pct: number }[] = []
  let weakestMove = 'frame'
  let quickTakePrompt: { id: string; slug?: string | null; prompt_text: string | null; move_tags: string[] | null } | null = null

  if (userId) {
    const [{ data: moveLevelsData }, { data: completedAttempts }, { data: allQuickTakes }] = await Promise.all([
      adminClient
        .from('move_levels')
        .select('move, xp, level, progress_pct')
        .eq('user_id', userId)
        .order('xp', { ascending: true }),
      adminClient
        .from('challenge_attempts')
        .select('challenge_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      adminClient
        .from('challenges')
        .select('id, slug, prompt_text, move_tags')
        .eq('challenge_type', 'quick_take')
        .eq('is_published', true)
        .order('created_at', { ascending: true }),
    ])

    allMoveLevels = (moveLevelsData ?? []) as { move: string; xp: number; level: number; progress_pct: number }[]
    weakestMove = allMoveLevels[0]?.move ?? 'frame'

    const avgXp = allMoveLevels.length > 0
      ? allMoveLevels.reduce((s, m) => s + m.xp, 0) / allMoveLevels.length
      : 0
    const difficulties = targetDifficulties(avgXp, primaryGoal, prepTimeline)
    const completedIds = new Set((completedAttempts ?? []).map((a: { challenge_id: string }) => a.challenge_id))

    quickTakePrompt =
      (allQuickTakes ?? []).find(c => !completedIds.has(c.id)) ??
      allQuickTakes?.[0] ??
      null

    const completedIdsArr = Array.from(completedIds)

    let nextQuery = adminClient
      .from('challenges')
      .select('id, slug, title, difficulty, display_number, challenge_type, domain:domains(title)')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .contains('move_tags', [weakestMove])
      .in('difficulty', difficulties)

    if (completedIdsArr.length > 0) {
      nextQuery = nextQuery.not('id', 'in', `(${completedIdsArr.join(',')})`)
    }

    const { data: personalizedNext } = await nextQuery.limit(1).maybeSingle()
    nextChallenge = normalizeChallenge(personalizedNext ?? null)

    if (!nextChallenge) {
      let fallbackMoveQuery = adminClient
        .from('challenges')
        .select('id, slug, title, difficulty, domain:domains(title)')
        .eq('is_published', true)
        .neq('challenge_type', 'quick_take')
        .contains('move_tags', [weakestMove])

      if (completedIdsArr.length > 0) {
        fallbackMoveQuery = fallbackMoveQuery.not('id', 'in', `(${completedIdsArr.join(',')})`)
      }
      const { data: fallbackMove } = await fallbackMoveQuery.limit(1).maybeSingle()
      nextChallenge = normalizeChallenge(fallbackMove ?? null)
    }

    if (!nextChallenge && completedIdsArr.length > 0) {
      const anyQuery = adminClient
        .from('challenges')
        .select('id, slug, title, difficulty, domain:domains(title)')
        .eq('is_published', true)
        .neq('challenge_type', 'quick_take')
        .not('id', 'in', `(${completedIdsArr.join(',')})`)

      const { data: anyUncompleted } = await anyQuery.limit(1).maybeSingle()
      nextChallenge = normalizeChallenge(anyUncompleted ?? null)
    }
  }

  if (!nextChallenge) {
    const { data: fallbackChallenge } = await adminClient
      .from('challenges')
      .select('id, slug, title, difficulty, display_number, challenge_type, domain:domains(title)')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .limit(1)
      .maybeSingle()
    nextChallenge = normalizeChallenge(fallbackChallenge ?? null)
  }

  if (nextChallenge && allMoveLevels.length > 0) {
    const weakestLevel = allMoveLevels[0].level ?? 1
    nextChallenge = { ...nextChallenge, hatch_insight: moveHatchInsight(weakestMove, weakestLevel, primaryGoal) }
  }

  // ── Resume-or-start action ────────────────────────────────────────────────
  // The single dominant dashboard CTA. Precedence: (1) resume the most-recent
  // in_progress attempt — these are the 41 stalls the dashboard was blind to;
  // (2) first rep for a brand-new user; (3) the next recommended rep. The
  // resume destination mirrors resume-challenge/route.ts:186 exactly
  // (/workspace/challenges/{id}?resume=1) so the email link and this card point
  // at the same attempt.
  let resumeOrStartAction: ResumeOrStartAction | null = null
  let hasAnyAttempts = false

  if (userId) {
    const { count: attemptCount } = await adminClient
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    hasAnyAttempts = (attemptCount ?? 0) > 0

    // Most-recent in_progress attempt (mirrors resume-challenge/route.ts:66-72).
    const { data: inProgress } = await adminClient
      .from('challenge_attempts')
      .select('challenge_id, current_step, started_at, challenges(title)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (inProgress?.challenge_id) {
      const resumeTitle =
        ((inProgress.challenges as unknown as { title?: string } | null)?.title) ?? 'your challenge'
      resumeOrStartAction = {
        kind: 'resume',
        href: `/workspace/challenges/${inProgress.challenge_id}?resume=1`,
        title: resumeTitle,
        step: flowStepNumber(inProgress.current_step as string | null),
        totalSteps: 4,
      }
    }
  }

  // No in-progress rep → first rep for a brand-new user, else the next rep.
  if (!resumeOrStartAction) {
    if (userId && !hasAnyAttempts) {
      const slug = getCuratedFirstRepSlug(preferredRoleForFirstRep)
      const { data: firstRepRow } = await adminClient
        .from('challenges')
        .select('id, slug, challenge_type, display_number')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
      resumeOrStartAction = {
        kind: 'first',
        href: firstRepRow ? challengePath(firstRepRow) : FIRST_REP_FALLBACK_HREF,
      }
    } else if (nextChallenge) {
      resumeOrStartAction = {
        kind: 'next',
        href: nextChallenge.slug || nextChallenge.id
          ? challengePath(nextChallenge)
          : FIRST_REP_FALLBACK_HREF,
        title: nextChallenge.title,
        difficulty: nextChallenge.difficulty ?? null,
        domain: nextChallenge.domainName ?? null,
        hatchInsight: nextChallenge.hatch_insight ?? null,
      }
    }
  }

  let todaysPathSteps: PathStep[] = []
  let todaysPathCompleted = 0

  if (userId) {
    const doneQuickTake = todayAttempts.some(a => a.challenges?.challenge_type === 'quick_take')
    const doneFlowChallenge = todayAttempts.some(a => a.challenges?.challenge_type !== 'quick_take')

    // Rendered as a pure progress readout — no per-step hrefs. The single
    // dominant action lives in ResumeOrStartCard, so these steps show where the
    // user is in today's loop without adding three competing CTAs.
    todaysPathSteps = [
      {
        label: 'Quick Take',
        sub: '1-min warm-up',
        icon: 'bolt',
        done: doneQuickTake,
        active: !doneQuickTake,
      },
      {
        label: 'Core challenge',
        sub: nextChallenge
          ? `${capitalize(weakestMove)} / ${difficultyLabel(nextChallenge.difficulty)}`
          : 'Pick a challenge',
        icon: 'track_changes',
        done: doneFlowChallenge,
        active: doneQuickTake && !doneFlowChallenge,
      },
      {
        label: 'Reflect',
        sub: "Review Hatch's feedback",
        icon: 'edit_note',
        done: false,
        active: doneFlowChallenge,
      },
    ]
    todaysPathCompleted = todaysPathSteps.filter(s => s.done).length
  }

  const userEntry = (leaderboard as { rank: number; isCurrentUser?: boolean }[]).find(e => e.isCurrentUser)
  const userRank = userEntry?.rank ?? 0
  const interviews: UserInterview[] = interviewDate
    ? [{ id: '0', user_id: userId, company: null, role: null, round: null, interview_date: interviewDate, notes: null, created_at: interviewDate }]
    : []
  const hatchContext = await hatchContextPromise

  return {
    userId,
    displayName,
    streakDays,
    xpTotal,
    interviewDate,
    isCalibrated,
    dailyDone,
    plan,
    roleContext,
    hotChallenges,
    leaderboard,
    enrolledPlans,
    latestInterview,
    communityActivity,
    featuredAutopsy,
    activePlanSlug,
    pausedLoopData,
    achievementData,
    weekDates,
    nextChallenge,
    allMoveLevels,
    weakestMove,
    quickTakePrompt,
    todaysPathSteps,
    todaysPathCompleted,
    userRank,
    interviews,
    hatchContext,
    resumeOrStartAction,
    hasAnyAttempts,
  }
}

const getDashboardLead = cache(loadDashboardLeadUncached)
const getDashboardCore = cache(loadDashboardCoreUncached)

const getAnalyticsFrontDoor = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return null
  return getCcAnalyticsFrontDoor(createAdminClient(), user.id)
})

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7">
      <Suspense fallback={null}>
        <UpgradedBanner />
      </Suspense>

      {/* One dominant action. The hero column leads with the greeting strip and
          the single ResumeOrStartCard; the sidebar carries the upgrade sponsor.
          Everything browsable/social lives below, subordinate to the one rep the
          user should do next. */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.58fr)]">
        <div className="grid min-w-0 content-start gap-4">
          <Suspense fallback={<CoachBriefSkeleton />}>
            <CoachBriefSection />
          </Suspense>
          <Suspense fallback={<ResumeOrStartSkeleton />}>
            <ResumeOrStartSection />
          </Suspense>
        </div>
        <aside className="grid min-w-0 content-start gap-4">
          <Suspense fallback={<SponsorSkeleton />}>
            <SponsorSection />
          </Suspense>
        </aside>
      </section>

      <Suspense fallback={<DashboardBodySkeleton />}>
        <DashboardBodySection />
      </Suspense>
    </main>
  )
}

async function ResumeOrStartSection() {
  const data = await getDashboardCore()
  if (!data.resumeOrStartAction) return null
  return <ResumeOrStartCard action={data.resumeOrStartAction} />
}

async function CoachBriefSection() {
  const data = await getDashboardLead()
  const weakestCompetency = data.hatchContext?.weakestCompetency ?? null
  const competency = weakestCompetency
    ? data.hatchContext?.competencies.find(c => c.competency === weakestCompetency)
    : null

  // The card's own CTA row is suppressed — ResumeOrStartCard directly below is
  // the single dominant action now, so the hero reads as a greeting + streak
  // strip and never competes for the click.
  return (
    <CoachSpineCard
      displayName={data.displayName}
      streakDays={data.streakDays}
      xpTotal={data.xpTotal}
      focusMove={capitalize(data.allMoveLevels[0]?.move ?? 'Frame')}
      focusLevel={data.allMoveLevels[0]?.level ?? 1}
      dailyDone={data.dailyDone}
      isCalibrated={data.isCalibrated}
      weakestCompetency={weakestCompetency}
      competencyScore={competency?.score ?? null}
      competencyTrend={competency?.trend ?? null}
      recentCompletions={data.hatchContext?.recentCompletions.length ?? 0}
      hideActions
    />
  )
}

async function SponsorSection() {
  const [data, analytics] = await Promise.all([
    getDashboardLead(),
    getAnalyticsFrontDoor(),
  ])
  return (
    <UpgradeSponsorCard
      plan={data.plan}
      focusMove={data.allMoveLevels[0]?.move ?? data.weakestMove}
      dailyDone={data.dailyDone}
      analyticsEnabled={analytics?.enabled ?? false}
      analyticsHasAccess={analytics?.hasAccess ?? false}
    />
  )
}

async function AnalyticsLabSection() {
  const data = await getAnalyticsFrontDoor()
  if (!data?.enabled) return null
  return <AnalyticsLabCard data={data} />
}

async function DashboardBodySection() {
  const data = await getDashboardCore()

  return (
    <div className="mt-5 flex flex-col gap-5">
      <section className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.58fr)]">
        <div className="min-w-0 space-y-4">
          <CadenceRibbon
            streakDays={data.streakDays}
            todaysPathSteps={data.todaysPathSteps}
            todaysPathCompleted={data.todaysPathCompleted}
            weekDates={data.weekDates}
          />

          <div className="xl:hidden">
            <Suspense fallback={<AnalyticsLabSkeleton />}>
              <AnalyticsLabSection />
            </Suspense>
          </div>

          {/* QuickTake is the single, visually subordinate warm-up. The full
              "next challenge" action is no longer duplicated here — it lives in
              the dominant ResumeOrStartCard above. */}
          <SectionHeading
            title="Warm up in a minute."
            href="/challenges"
            action="All practice"
          />
          <div id="quick-take" className="scroll-mt-24 max-w-[640px]">
            <QuickTakeCard
              prompt={data.quickTakePrompt?.prompt_text ?? 'Your PM says DAU dropped 15% overnight. Walk me through how you would diagnose this.'}
              challengeId={data.quickTakePrompt?.id ?? 'orientation'}
              hatchContext={null}
            />
          </div>

          {/* FLOW discipline map sits high in the column so it anchors the page
              instead of trailing at the bottom. */}
          <DisciplineExplorer />

          {/* Featured autopsy + latest interview share a row when both exist; a
              single present card spans the full width. Stacks on < xl. */}
          {data.featuredAutopsy && data.latestInterview ? (
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
              <FeaturedAutopsyCard story={data.featuredAutopsy.story} company={data.featuredAutopsy.company} />
              <LatestInterviewCard data={data.latestInterview} compact />
            </div>
          ) : data.featuredAutopsy ? (
            <FeaturedAutopsyCard story={data.featuredAutopsy.story} company={data.featuredAutopsy.company} />
          ) : data.latestInterview ? (
            <LatestInterviewCard data={data.latestInterview} compact />
          ) : null}

          {data.enrolledPlans.length > 0 && (
            <div className="xl:max-w-[640px]">
              <EnrolledPlansCard plans={data.enrolledPlans} />
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="hidden xl:block">
            <Suspense fallback={<AnalyticsLabSkeleton />}>
              <AnalyticsLabSection />
            </Suspense>
          </div>

          {data.pausedLoopData && (
            <PausedLoopCard
              loop={data.pausedLoopData.loop as unknown as InterviewLoop}
              rounds={data.pausedLoopData.rounds as unknown as LoopRound[]}
            />
          )}

          {/* Achievements card hidden for now (2026-06-30) to keep the dashboard
              clean. Re-enable by restoring the AchievementsCard block below. */}
          {/* {data.achievementData.length > 0 && (
            <AchievementsCard
              achievements={data.achievementData}
              unlockedCount={data.achievementData.filter(a => a.unlocked).length}
              totalCount={data.achievementData.length}
            />
          )} */}

          {/* Trending challenges live in the sidebar so the left column's height
              comes down and both columns end closer together. */}
          {data.hotChallenges.length > 0 && (
            <HotChallengesCard challenges={data.hotChallenges} compact limit={4} />
          )}

          <LeaderboardPeekCard entries={data.leaderboard} userRank={data.userRank} />

          <CommunityActivityCard events={data.communityActivity} />

          {data.interviewDate && (data.roleContext === 'engineer_pm_interview' || data.roleContext === 'both') && (
            <InterviewCountdownCard interviews={data.interviews} />
          )}
        </aside>
      </section>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  href,
  action,
}: {
  eyebrow?: string
  title: string
  href?: string
  action?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-3">
      <div>
        {eyebrow && (
          <p className="font-label text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        )}
        <h2 className={`${eyebrow ? 'mt-1' : ''} font-headline text-xl font-bold leading-tight tracking-tight text-on-surface`}>
          {title}
        </h2>
      </div>
      {href && action && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-label font-bold text-on-surface-variant no-underline transition-colors hover:bg-surface-container"
        >
          {action}
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      )}
    </div>
  )
}

function CoachBriefSkeleton() {
  return (
    <div className="min-h-[286px] animate-pulse rounded-[24px] bg-surface-container">
      <div className="h-full min-h-[286px] rounded-[24px] bg-gradient-to-br from-surface-container-high to-surface-container" />
    </div>
  )
}

function SponsorSkeleton() {
  return <div className="h-[196px] animate-pulse rounded-[22px] bg-surface-container" />
}

function ResumeOrStartSkeleton() {
  return <div className="h-[210px] animate-pulse rounded-[24px] bg-surface-container" />
}

function AnalyticsLabSkeleton() {
  return <div className="min-h-[240px] animate-pulse rounded-[22px] bg-surface-container-high" />
}

function DashboardBodySkeleton() {
  return (
    <div className="mt-5 grid gap-5">
      <div className="h-[104px] animate-pulse rounded-[22px] bg-surface-container" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.48fr)]">
        <div className="space-y-4">
          <div className="h-[212px] animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-[122px] animate-pulse rounded-2xl bg-surface-container" />
        </div>
        <div className="space-y-4">
          <div className="h-[188px] animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-[244px] animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </div>
    </div>
  )
}
