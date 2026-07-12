import { cache, Suspense } from 'react'
import { Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
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
import { AnalyticsLabCard } from '@/components/dashboard/cards/AnalyticsLabCard'
import { ICON_COLOR_MAP, ICON_MAP } from '@/components/dashboard/cards/AchievementsCard'
import { PausedLoopCard } from '@/components/live-interviews/PausedLoopCard'
import { getFeaturedAutopsyForDashboard } from '@/lib/autopsies/queries'
import type { UserInterview } from '@/lib/data/dashboard'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'
import { getCuratedFirstRepSlug, FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'
import { type ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'
import { DashboardHero } from '@/components/redesign/dashboard/DashboardHero'
import { StatStrip } from '@/components/redesign/StatStrip'
import { FirstWeekStrip } from '@/components/redesign/dashboard/FirstWeekStrip'
import { RecommendedRow, type RecommendedCardData } from '@/components/redesign/dashboard/RecommendedRow'
import { TodaysPathPanel } from '@/components/redesign/dashboard/TodaysPathPanel'
import { QuickTakePanel, QUICK_TAKE_ANCHOR } from '@/components/redesign/dashboard/QuickTakePanel'
import { ThisWeekPanel } from '@/components/redesign/dashboard/ThisWeekPanel'
import { PeersPanel } from '@/components/redesign/dashboard/PeersPanel'
import { FlowMethodRail } from '@/components/redesign/dashboard/FlowMethodRail'
import { QuietInviteRow, QuietInviteRail } from '@/components/redesign/dashboard/QuietInvite'
import { ProTipStrip } from '@/components/redesign/ProTipStrip'
import { difficultyLabel, levelFromXp } from '@/lib/utils'
import { COMPETENCY_LABELS, type Competency } from '@/lib/types'
import type { FocusArea } from '@/components/redesign/dashboard/ThisWeekPanel'

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
type PathStep = { label: string; sub: string; icon: string; done: boolean; active: boolean; href?: string; cta?: string }
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
  // Real week-over-week trend inputs for the stat strip. Stats whose trend
  // cannot be derived from real data (overall progress, total XP) carry no
  // delta line. Spec §4: no invented metrics.
  let weeklyTrends: { solvedThisWeek: number; interviewsThisWeek: number; avgScoreDeltaPct: number | null } = {
    solvedThisWeek: 0,
    interviewsThisWeek: 0,
    avgScoreDeltaPct: null,
  }

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

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)
    const lastWeekStartStr = localDate(lastWeekStart)

    const [achievementsResult, streakResult, todayAttemptsResult, userAchievements, twoWeekAttemptsResult, weekInterviewsResult] = await Promise.all([
      adminClient.from('achievement_definitions').select('id, name, icon, xp_reward, criteria_type, criteria_value'),
      adminClient.from('user_streaks').select('date, completed').eq('user_id', userId).gte('date', weekDateStrings[0]).lte('date', weekDateStrings[6]),
      adminClient.from('challenge_attempts').select('challenge_id, created_at, challenges(title, slug, challenge_type)').eq('user_id', userId).eq('status', 'completed').gte('created_at', todayStr).order('created_at', { ascending: true }).limit(10),
      adminClient.from('user_achievements').select('achievement_id').eq('user_id', userId),
      // Two-week window of completed attempts: this week's solved count plus
      // the this-week-vs-last-week average-score movement for the stat strip.
      adminClient.from('challenge_attempts').select('created_at, total_score, max_score, challenges(challenge_type)').eq('user_id', userId).eq('status', 'completed').gte('created_at', lastWeekStartStr).limit(500),
      adminClient.from('live_interview_sessions').select('ended_at').eq('user_id', userId).eq('status', 'completed').gte('ended_at', weekDateStrings[0]),
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

    type TwoWeekAttempt = {
      created_at: string
      total_score: number | string | null
      max_score: number | string | null
      challenges: { challenge_type: string | null } | { challenge_type: string | null }[] | null
    }
    const twoWeekAttempts = (twoWeekAttemptsResult.data ?? []) as unknown as TwoWeekAttempt[]
    const weekStartStr = weekDateStrings[0]
    const isQuickTakeAttempt = (a: TwoWeekAttempt) => {
      const c = Array.isArray(a.challenges) ? a.challenges[0] : a.challenges
      return c?.challenge_type === 'quick_take'
    }
    // ISO timestamps compare lexicographically against a YYYY-MM-DD prefix.
    const thisWeekRows = twoWeekAttempts.filter(a => a.created_at >= weekStartStr)
    const lastWeekRows = twoWeekAttempts.filter(a => a.created_at < weekStartStr)
    const avgScorePct = (rows: TwoWeekAttempt[]): number | null => {
      const graded = rows
        .map(r => ({ total: Number(r.total_score), max: Number(r.max_score) }))
        .filter(r => Number.isFinite(r.total) && Number.isFinite(r.max) && r.max > 0)
      if (graded.length === 0) return null
      return (graded.reduce((sum, r) => sum + (r.total / r.max) * 100, 0) / graded.length)
    }
    const thisWeekAvg = avgScorePct(thisWeekRows)
    const lastWeekAvg = avgScorePct(lastWeekRows)
    weeklyTrends = {
      solvedThisWeek: thisWeekRows.filter(a => !isQuickTakeAttempt(a)).length,
      interviewsThisWeek: (weekInterviewsResult.data ?? []).length,
      avgScoreDeltaPct:
        thisWeekAvg !== null && lastWeekAvg !== null ? Math.round(thisWeekAvg - lastWeekAvg) : null,
    }
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
  let firstRepScenario: { context: string | null; difficulty: string | null } | null = null

  if (userId) {
    const { count: attemptCount } = await adminClient
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    hasAnyAttempts = (attemptCount ?? 0) > 0

    // Most-recent in_progress attempt (mirrors resume-challenge/route.ts:66-72).
    const { data: inProgress } = await adminClient
      .from('challenge_attempts')
      .select('challenge_id, current_step, started_at, challenges(title, difficulty)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (inProgress?.challenge_id) {
      const resumeChallenge = inProgress.challenges as unknown as { title?: string; difficulty?: string | null } | null
      resumeOrStartAction = {
        kind: 'resume',
        href: `/workspace/challenges/${inProgress.challenge_id}?resume=1`,
        title: resumeChallenge?.title ?? 'your challenge',
        step: flowStepNumber(inProgress.current_step as string | null),
        totalSteps: 4,
        difficulty: resumeChallenge?.difficulty ?? null,
      }
    }
  }

  // No in-progress rep → first rep for a brand-new user, else the next rep.
  if (!resumeOrStartAction) {
    if (userId && !hasAnyAttempts) {
      const slug = getCuratedFirstRepSlug(preferredRoleForFirstRep)
      // Same lookup as before, plus title/scenario/difficulty so the day-0
      // hero can show the curated challenge's real opener verbatim (spec §3
      // first-time rules: "curated challenge, real scenario opener readable
      // in the hero") instead of a generic placeholder.
      const { data: firstRepRow } = await adminClient
        .from('challenges')
        .select('id, slug, challenge_type, display_number, title, difficulty, scenario_context')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
      resumeOrStartAction = {
        kind: 'first',
        href: firstRepRow ? challengePath(firstRepRow) : FIRST_REP_FALLBACK_HREF,
        title: firstRepRow?.title ?? null,
      }
      firstRepScenario = firstRepRow
        ? { context: firstRepRow.scenario_context ?? null, difficulty: firstRepRow.difficulty ?? null }
        : null
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

    // Per-step action buttons (Start/Continue/Review per the round4 preview),
    // each wired to the step's real destination. A step without a live
    // destination gets no button (spec: no stubs). The Quick Take step links
    // to the inline QuickTakePanel card rendered below Today's path (the
    // workspace still redirects quick_take challenge routes to /challenges).
    const lastFlowAttemptToday = [...todayAttempts]
      .reverse()
      .find(a => a.challenges?.challenge_type !== 'quick_take')
    const reflectHref = lastFlowAttemptToday
      ? `/challenges/${lastFlowAttemptToday.challenges?.slug ?? lastFlowAttemptToday.challenge_id}/feedback`
      : undefined
    const coreHref =
      resumeOrStartAction?.kind === 'resume'
        ? resumeOrStartAction.href
        : nextChallenge
          ? challengePath(nextChallenge)
          : undefined

    todaysPathSteps = [
      {
        label: 'Quick Take',
        sub: '1-min warm-up',
        icon: 'bolt',
        done: doneQuickTake,
        active: !doneQuickTake,
        // Anchor of the inline QuickTakePanel below (id="quick-take").
        href: !doneQuickTake && quickTakePrompt?.prompt_text ? '#quick-take' : undefined,
        cta: 'Warm up',
      },
      {
        label: 'Core challenge',
        sub: nextChallenge
          ? `${capitalize(weakestMove)} / ${difficultyLabel(nextChallenge.difficulty)}`
          : 'Pick a challenge',
        icon: 'track_changes',
        done: doneFlowChallenge,
        active: doneQuickTake && !doneFlowChallenge,
        href: doneFlowChallenge ? reflectHref : coreHref,
        cta: doneFlowChallenge
          ? 'Review'
          : resumeOrStartAction?.kind === 'resume'
            ? 'Continue'
            : 'Start',
      },
      {
        label: 'Reflect',
        sub: "Review Hatch's feedback",
        icon: 'edit_note',
        done: false,
        active: doneFlowChallenge,
        href: reflectHref,
        cta: 'Review',
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
    weeklyTrends,
    userRank,
    interviews,
    hatchContext,
    resumeOrStartAction,
    hasAnyAttempts,
    firstRepScenario,
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
    <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 sm:py-5">
      <Suspense fallback={null}>
        <UpgradedBanner />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  )
}

async function DashboardContent() {
  const [lead, core, analytics] = await Promise.all([
    getDashboardLead(),
    getDashboardCore(),
    getAnalyticsFrontDoor(),
  ])

  const isPro = lead.plan === 'pro'
  const isDayZero = !core.hasAnyAttempts && core.resumeOrStartAction?.kind === 'first'
  const weakestCompetency = lead.hatchContext?.weakestCompetency ?? null
  const weakestCompetencyScore = weakestCompetency
    ? lead.hatchContext?.competencies.find(c => c.competency === weakestCompetency)?.score ?? null
    : null
  const weakestMoveLabel = capitalize(core.weakestMove)

  const hatchHeroMessage = isDayZero
    ? "I grade how you reason, not whether you memorized the answer. Write plainly."
    : weakestCompetency && weakestCompetencyScore !== null
    ? `${weakestMoveLabel} is your weakest move at ${weakestCompetencyScore}%. ${
        core.resumeOrStartAction?.kind === 'resume'
          ? 'The step you paused on drills exactly that.'
          : 'This rep drills exactly that.'
      }`
    : core.resumeOrStartAction?.kind === 'resume'
    ? `Pick this back up when you're ready. Hatch is tracking the ${weakestMoveLabel} step.`
    : `${weakestMoveLabel} is the gap right now. This rep builds it.`

  // Weekly-goal ring: sessions this week vs a 5-day goal, derived straight
  // from weekDates (user_streaks.completed per day, already includes today
  // once a rep is logged) — no separate dailyDone layering needed.
  const WEEKLY_GOAL_TARGET = 5
  const weeklyGoal = !isDayZero
    ? { done: core.weekDates.filter(d => d.completed).length, goal: WEEKLY_GOAL_TARGET }
    : null

  // Focus areas = the user's weakest competencies from learner_competencies
  // (via hatchContext), lowest score first. Real data only — no competencies
  // graded yet means the section is absent (spec §4 "no invented metrics").
  const FOCUS_TONES = ['sd', 'ps', 'sql', 'dm'] as const
  const focusAreas: FocusArea[] = (lead.hatchContext?.competencies ?? [])
    .filter(c => c.competency in COMPETENCY_LABELS)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((c, i) => ({
      label: COMPETENCY_LABELS[c.competency as Competency],
      tone: FOCUS_TONES[i % FOCUS_TONES.length],
    }))

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_268px]">
      <div className="flex min-w-0 flex-col gap-5">
        {core.resumeOrStartAction && (
          <DashboardHero
            displayName={lead.displayName}
            action={core.resumeOrStartAction}
            firstRepScenario={
              isDayZero
                ? { context: core.firstRepScenario?.context ?? '', difficulty: core.firstRepScenario?.difficulty ?? null }
                : null
            }
            weeklyGoal={weeklyGoal}
            hatchMessage={hatchHeroMessage}
            hatchCtaLabel={!isDayZero && weakestCompetency ? `See ${weakestMoveLabel} breakdown` : undefined}
            hatchCtaHref={!isDayZero && weakestCompetency ? '/progress/skill-ladder' : undefined}
          />
        )}

        {isDayZero ? (
          <FirstWeekStrip
            steps={[
              { label: 'Do one rep', meta: 'In progress', active: true },
              { label: "Read Hatch's feedback", meta: 'Up next', active: false },
              { label: 'Pick a plan', meta: 'Up next', active: false },
            ]}
          />
        ) : (
          <StatStrip cells={buildStatCells(lead, core)} />
        )}

        <RecommendedRow
          viewAllHref="/challenges"
          cards={buildRecommendedCards(core, isDayZero)}
        />

        {isDayZero ? (
          <QuietInviteRow text="Your week view and cohort appear after your first rep." />
        ) : (
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
            <div className="flex min-w-0 flex-col gap-4">
              <TodaysPathPanel
                steps={core.todaysPathSteps.map(s => ({ label: s.label, sub: s.sub, done: s.done, active: s.active, href: s.href, cta: s.cta }))}
                completed={core.todaysPathCompleted}
              />
              {core.quickTakePrompt?.prompt_text && (
                <QuickTakePanel
                  prompt={core.quickTakePrompt.prompt_text}
                  challengeId={core.quickTakePrompt.id}
                  move={core.quickTakePrompt.move_tags?.[0] ?? null}
                />
              )}
            </div>
            <ThisWeekPanel
              weekDates={core.weekDates}
              streakDays={core.streakDays}
              focusAreas={focusAreas}
              viewPlanHref={core.activePlanSlug ? `/explore/plans/${core.activePlanSlug}` : '/explore/plans'}
            />
            <PeersPanel entries={core.leaderboard} viewLeaderboardHref="/cohort" />
          </div>
        )}

        {core.pausedLoopData && (
          <PausedLoopCard
            loop={core.pausedLoopData.loop as unknown as InterviewLoop}
            rounds={core.pausedLoopData.rounds as unknown as LoopRound[]}
          />
        )}

        <Suspense fallback={<AnalyticsLabSkeleton />}>
          <AnalyticsLabSection preloaded={analytics} />
        </Suspense>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <FlowMethodRail weakestMove={core.weakestMove} learnMoreHref="/explore/plans" />

        {isDayZero && (
          <QuietInviteRail
            title="Skill Ladder"
            text="Your six competencies chart here once Hatch has graded a rep to work from."
          />
        )}

        {!isDayZero && !isPro && (
          <div className="rounded-2xl border border-hairline bg-card-bright p-4">
            <div className="mb-1 text-[13.5px] font-bold text-ink-strong">Free plan</div>
            <p className="text-[12px] leading-[1.5] text-ink-secondary">
              20 challenges, 5 interviews, and 30 gradings a month. Pro removes the caps.
            </p>
          </div>
        )}
      </aside>

      <ProTipStrip
        className="lg:col-span-2"
        lead="Finish, then start."
        tip="A completed rep teaches more than three abandoned ones. Short on time? Finish one step of a paused rep instead of opening a new challenge."
        ctaLabel="Pick a rep"
        ctaHref="/challenges"
      />
    </div>
  )
}

function buildStatCells(
  lead: Awaited<ReturnType<typeof loadDashboardLeadUncached>>,
  core: Awaited<ReturnType<typeof loadDashboardCoreUncached>>,
) {
  const cells: Parameters<typeof StatStrip>[0]['cells'] = []
  const trends = core.weeklyTrends

  // Overall Progress and Total XP carry no trend line: move_levels stores no
  // weekly history and the preview shows Total XP without a delta. Solved,
  // interviews, and avg score derive real this-week movement from the
  // two-week attempt/interview window loaded above.
  const overallProgressPct = core.allMoveLevels.length > 0
    ? Math.round(core.allMoveLevels.reduce((sum, m) => sum + m.progress_pct, 0) / core.allMoveLevels.length)
    : null
  if (overallProgressPct !== null) {
    cells.push({
      key: 'progress',
      label: 'Overall Progress',
      icon: <TrendingUp size={16} strokeWidth={1.7} className="text-forest-600" />,
      value: `${overallProgressPct}%`,
      progressPercent: overallProgressPct,
    })
  }

  cells.push({
    key: 'xp',
    label: 'Total XP',
    icon: <Zap size={16} strokeWidth={1.7} className="text-gold" />,
    value: lead.xpTotal.toLocaleString(),
    // Same derivation as the top utility bar pill — the two must agree.
    valueSuffix: lead.xpTotal > 0 ? `Level ${levelFromXp(lead.xpTotal)}` : undefined,
  })

  const completedCount = lead.hatchContext?.practiceStats.completedChallenges ?? null
  if (completedCount !== null && completedCount > 0) {
    cells.push({
      key: 'solved',
      label: 'Problems Solved',
      icon: <Target size={16} strokeWidth={1.7} className="text-ps-fg" />,
      value: completedCount.toLocaleString(),
      delta: trends.solvedThisWeek > 0 ? `↑ ${trends.solvedThisWeek} this week` : undefined,
    })
  }

  const completedInterviews = lead.hatchContext?.practiceStats.completedLiveInterviews ?? null
  if (completedInterviews !== null && completedInterviews > 0) {
    cells.push({
      key: 'interviews',
      label: 'Mock Interviews',
      icon: <Trophy size={16} strokeWidth={1.7} className="text-sql-fg" />,
      value: completedInterviews.toLocaleString(),
      delta: trends.interviewsThisWeek > 0 ? `↑ ${trends.interviewsThisWeek} this week` : undefined,
    })
  }

  const avgScore = lead.hatchContext?.practiceStats.averageChallengeScore ?? null
  if (avgScore !== null) {
    cells.push({
      key: 'avg-score',
      label: 'Avg. Score',
      icon: <Star size={16} strokeWidth={1.7} className="text-amber" />,
      value: `${Math.round(avgScore)}%`,
      delta:
        trends.avgScoreDeltaPct !== null && trends.avgScoreDeltaPct !== 0
          ? `${trends.avgScoreDeltaPct > 0 ? '↑' : '↓'} ${Math.abs(trends.avgScoreDeltaPct)}% this week`
          : undefined,
    })
  }

  return cells
}

function buildRecommendedCards(
  core: Awaited<ReturnType<typeof loadDashboardCoreUncached>>,
  isDayZero: boolean,
): RecommendedCardData[] {
  const cards: RecommendedCardData[] = []

  if (core.nextChallenge) {
    cards.push({
      key: `next-${core.nextChallenge.id}`,
      href: core.nextChallenge.slug || core.nextChallenge.id ? challengePath(core.nextChallenge) : FIRST_REP_FALLBACK_HREF,
      title: core.nextChallenge.title,
      challengeType: core.nextChallenge.challenge_type ?? null,
      domainName: core.nextChallenge.domainName ?? null,
      difficulty: core.nextChallenge.difficulty,
      reason: isDayZero
        ? 'Picked for engineers starting out'
        : core.nextChallenge.hatch_insight ?? `Picked because ${capitalize(core.weakestMove)} is your weakest move`,
    })
  }

  for (const ch of core.hotChallenges) {
    if (cards.length >= 4) break
    if (core.nextChallenge && ch.id === core.nextChallenge.id) continue
    cards.push({
      key: `hot-${ch.id}`,
      href: challengePath(ch),
      title: ch.title,
      challengeType: ch.challenge_type ?? null,
      domainName: ch.domain,
      metaExtra: ch.domain && ch.domain !== 'General' ? ch.domain : null,
      reason: isDayZero ? 'Picked for engineers starting out' : 'Trending with other engineers this week',
    })
  }

  return cards.slice(0, 4)
}

async function AnalyticsLabSection({ preloaded }: { preloaded: Awaited<ReturnType<typeof getCcAnalyticsFrontDoor>> | null }) {
  if (!preloaded?.enabled) return null
  return <AnalyticsLabCard data={preloaded} />
}

function AnalyticsLabSkeleton() {
  return <div className="min-h-[80px] animate-pulse rounded-2xl bg-surface-container-high" />
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-[240px] animate-pulse rounded-2xl bg-surface-container" />
      <div className="h-[104px] animate-pulse rounded-2xl bg-surface-container" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_268px]">
        <div className="space-y-4">
          <div className="h-[212px] animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-[280px] animate-pulse rounded-2xl bg-surface-container" />
        </div>
        <div className="space-y-4">
          <div className="h-[244px] animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </div>
    </div>
  )
}
