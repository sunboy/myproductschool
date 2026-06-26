import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { UpgradedBanner } from '@/components/dashboard/UpgradedBanner'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getHotChallenges,
  getLeaderboardPeek,
  getLatestInterview,
} from '@/lib/data/dashboard'
import { getEnrolledPlans } from '@/lib/data/study-plans'
import { challengePath, formatChallengeNumber } from '@/lib/challenges/challengeNumber'
import { expandDifficultiesForQuery, type PracticeDifficulty } from '@/lib/practice/difficulty'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { NextChallengeCard } from '@/components/dashboard/cards/NextChallengeCard'
import { FlowMoveLevelsCard } from '@/components/dashboard/cards/FlowMoveLevelsCard'
import { LatestInterviewCard } from '@/components/dashboard/cards/LatestInterviewCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import { EnrolledPlansCard } from '@/components/dashboard/cards/EnrolledPlansCard'
import { AchievementsCard, ICON_COLOR_MAP, ICON_MAP } from '@/components/dashboard/cards/AchievementsCard'
import { PausedLoopCard } from '@/components/live-interviews/PausedLoopCard'
import { BillingDashboardNudge } from '@/components/billing/BillingDashboardNudge'
import { FeaturedAutopsyCard } from '@/components/dashboard/cards/FeaturedAutopsyCard'
import { CoachSpineCard } from '@/components/dashboard/cards/CoachSpineCard'
import { CadenceRibbon } from '@/components/dashboard/cards/CadenceRibbon'
import { AnalyticsLabCard } from '@/components/dashboard/cards/AnalyticsLabCard'
import { getCcAnalyticsFrontDoor } from '@/lib/data/cc-analytics-frontdoor'
import { getFeaturedAutopsyForDashboard } from '@/lib/autopsies/queries'
import { getHatchContext } from '@/lib/hatch-context'
import type { UserInterview } from '@/lib/data/dashboard'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'
import { difficultyLabel } from '@/lib/utils'

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

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

// Returns DB values used by `.in('difficulty', ...)` queries. Expands to the
// union of legacy and canonical strings so the query works pre- and post-R2.
// primary_goal and prep_timeline shift the difficulty band:
//   - land_pm_adjacent / level_up_current → ramp one notch harder
//   - explore → always stay gentle (easy/medium) regardless of XP
//   - prep_timeline 'lt_1mo' → also ramp one notch harder
function targetDifficulties(
  avgXp: number,
  primaryGoal?: string | null,
  prepTimeline?: string | null,
): string[] {
  // explore goal always stays gentle
  if (primaryGoal === 'explore') {
    return expandDifficultiesForQuery(['easy', 'medium'])
  }

  let buckets: PracticeDifficulty[]
  if (avgXp < 100) buckets = ['easy', 'medium']
  else if (avgXp < 300) buckets = ['medium', 'hard']
  else buckets = ['hard']

  // shift harder for goal-driven users or tight timelines
  const shiftHarder =
    primaryGoal === 'land_pm_adjacent' ||
    primaryGoal === 'level_up_current' ||
    prepTimeline === 'lt_1mo'

  if (shiftHarder) {
    if (buckets[0] === 'easy') buckets = ['medium', 'hard']
    else if (buckets[0] === 'medium' && buckets.length > 1) buckets = ['hard']
    // already ['hard'] — no further shift possible
  }

  return expandDifficultiesForQuery(buckets)
}

type RawChallenge = { id: string; slug?: string | null; title: string; difficulty: string; display_number?: number | null; challenge_type?: string | null; domain?: { title: string }[] | { title: string } | null }
type NextChallenge = { id: string; slug?: string | null; title: string; difficulty: string; display_number?: number | null; challenge_type?: string | null; domainName?: string | null; hatch_insight?: string | null }

function normalizeChallenge(raw: RawChallenge | null): NextChallenge | null {
  if (!raw) return null
  const d = raw.domain
  const domainName = Array.isArray(d) ? (d[0]?.title ?? null) : (d?.title ?? null)
  return { id: raw.id, slug: raw.slug, title: raw.title, difficulty: raw.difficulty, display_number: raw.display_number, challenge_type: raw.challenge_type, domainName }
}

function LockOverlay({ children, label = 'Unlocks after calibration' }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative">
      <div className="opacity-40 blur-[1.5px] pointer-events-none select-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-[11px] font-label text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-[13px]">lock</span>
          {label}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
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
  // Raw display name (null when unset) for the leaderboard's "You" fallback,
  // distinct from displayName which coalesces to 'there' for the greeting.
  let rawDisplayName: string | null = null

  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: profile }, { count: dailyCount }] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, onboarding_completed_at, streak_days, xp_total, interview_date, plan, primary_goal, prep_timeline, role_context')
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
    primaryGoal = (profile as Record<string, unknown>)?.primary_goal as string | null ?? null
    prepTimeline = (profile as Record<string, unknown>)?.prep_timeline as string | null ?? null
    roleContext = (profile as Record<string, unknown>)?.role_context as string | null ?? null
  }

  const userId = user?.id ?? ''
  const adminClient = createAdminClient()

  // Anchor feature front door (Zone 3). Resolves access + skills compounded +
  // last scorecard + start/resume challenge. Fails soft to a disabled tile.
  const ccAnalytics = userId
    ? await getCcAnalyticsFrontDoor(adminClient, userId).catch(() => null)
    : null

  // Grounded coach read for the hero (Zone 1). getHatchContext returns the
  // user's six competency scores+trends, weakest competency, and recent
  // completions. Empty/new users fall back gracefully inside CoachSpineCard.
  const hatchContext = userId ? await getHatchContext(userId).catch(() => null) : null
  const weakestCompetency = hatchContext?.weakestCompetency ?? null
  const weakest = weakestCompetency
    ? hatchContext?.competencies.find(c => c.competency === weakestCompetency) ?? null
    : null
  const coachCompetencyScore = weakest ? Math.round(weakest.score) : null
  const coachCompetencyTrend = weakest?.trend ?? null
  const coachOverallLevel = hatchContext?.overallLevel ?? 'Beginner'
  const coachRecentCompletions = hatchContext?.recentCompletions.length ?? 0

  const [hotChallenges, leaderboard, enrolledPlans, latestInterview, featuredAutopsy, activePlanResult] = await Promise.all([
    getHotChallenges(),
    userId ? getLeaderboardPeek(userId, { display_name: rawDisplayName, xp_total: xpTotal }) : [],
    userId ? getEnrolledPlans(userId) : [],
    userId ? getLatestInterview(userId) : null,
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

  // Fetch paused loops for PausedLoopCard
  let pausedLoopData: { loop: Record<string, unknown>; rounds: Record<string, unknown>[] } | null = null
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
    // Don't fail the dashboard if loop fetch errors
  }

  // ── Right-rail data: achievements + streak (fetched early, path built after challenges) ──
  let achievementData: { id: string; name: string; icon: string; unlocked: boolean; color: string }[] = []
  let weekDates: { dayLabel: string; dateLabel: string; completed: boolean; isToday: boolean }[] = []
  type AttemptRow = { challenge_id: string; created_at: string; challenges: { title: string; slug: string | null; challenge_type: string | null } | null }
  let todayAttempts: AttemptRow[] = []

  // Built for any logged-in user. Uncalibrated users have no streak/achievement
  // rows, so the week grid renders all-empty and every achievement shows locked —
  // the genuine empty state, identical to a calibrated-but-inactive user.
  if (userId) {
    const now = new Date()
    // Use local date parts to avoid UTC offset shifting dates
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

    // 1. Same move + right difficulty band
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

    // 2. Fallback: same move, any difficulty
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

    // 3. Fallback: any uncompleted challenge
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

  // 4. Final fallback: any published challenge
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

  // Attach rule-based insight from move level data; no AI call.
  if (nextChallenge && allMoveLevels.length > 0) {
    const weakestLevel = allMoveLevels[0].level ?? 1
    nextChallenge = { ...nextChallenge, hatch_insight: moveHatchInsight(weakestMove, weakestLevel, primaryGoal) }
  }

  // ── Build Today's Path (depends on quickTakePrompt + nextChallenge) ──
  // Built for any logged-in user, calibrated or not. Uncalibrated users have no
  // todayAttempts, so all steps render as not-done (the warm-up empty state).
  let todaysPathSteps: { label: string; sub: string; icon: string; done: boolean; active: boolean; href?: string }[] = []
  let todaysPathCompleted = 0

  if (userId) {
    const doneQuickTake = todayAttempts.some(a => a.challenges?.challenge_type === 'quick_take')
    const doneFlowChallenge = todayAttempts.some(a => a.challenges?.challenge_type !== 'quick_take')

    todaysPathSteps = [
      {
        label: 'Quick Take',
        sub: '1-min warm-up',
        icon: 'bolt',
        done: doneQuickTake,
        active: !doneQuickTake,
        // Quick-takes are answered inline on the dashboard card below, not in
        // the workspace (that route redirects quick_take → /challenges). Anchor
        // to the card so the step lands on something usable.
        href: '/dashboard#quick-take',
      },
      {
        label: 'Core challenge',
        sub: nextChallenge
          ? `${capitalize(weakestMove)} · ${difficultyLabel(nextChallenge.difficulty)}`
          : 'Pick a challenge',
        icon: 'track_changes',
        done: doneFlowChallenge,
        active: doneQuickTake && !doneFlowChallenge,
        href: nextChallenge ? challengePath(nextChallenge) : undefined,
      },
      {
        label: 'Reflect',
        sub: "Review Hatch's feedback",
        icon: 'edit_note',
        done: false,
        active: doneFlowChallenge,
        href: '/progress',
      },
    ]
    todaysPathCompleted = todaysPathSteps.filter(s => s.done).length
  }

  const userEntry = (leaderboard as { rank: number; isCurrentUser?: boolean }[]).find(e => e.isCurrentUser)
  const userRank = userEntry?.rank ?? 0
  // LeaderboardPeekCard self-hides under 3 entries; mirror that here so Trending
  // spans full width instead of leaving a dead 2fr column at 1440.
  const hasLeaderboard = leaderboard.length >= 3

  const interviews: UserInterview[] = interviewDate
    ? [{ id: '0', user_id: userId, company: null, role: null, round: null, interview_date: interviewDate, notes: null, created_at: interviewDate }]
    : []
  // Zone 4: only render cards that have real data to act on.
  const hasPausedLoop = Boolean(pausedLoopData)
  const hasLatestInterview = Boolean(latestInterview)
  const hasEnrolledPlans = enrolledPlans.length > 0
  const hasInterviewCountdown = Boolean(interviewDate && (roleContext === 'engineer_pm_interview' || roleContext === 'both'))
  const hasAchievements = achievementData.length > 0
  const hasZone4 = hasPausedLoop || hasLatestInterview || hasEnrolledPlans || hasInterviewCountdown || hasAchievements

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-7">

      <Suspense fallback={null}>
        <UpgradedBanner />
      </Suspense>

      {/* Single-column zone layout — no dead right rail at 1440px.
          Old grid-cols-[1fr_340px] left a huge empty cream column at wide
          viewports. All cards now fill the full width across four zones. */}
      <div className="flex flex-col gap-7">

        {/* ZONE 1 — Coach Spine: personalized, data-grounded hero.
            getHatchContext is awaited above and its output (weakest competency,
            score, trend) threads into CoachSpineCard. Falls back gracefully
            for new users with no competency data yet. */}
        <CoachSpineCard
          displayName={displayName}
          streakDays={streakDays}
          xpTotal={xpTotal}
          focusMove={capitalize(allMoveLevels[0]?.move ?? 'Frame')}
          focusLevel={allMoveLevels[0]?.level ?? 1}
          dailyDone={dailyDone}
          isCalibrated={isCalibrated}
          sessionHref={nextChallenge ? challengePath(nextChallenge) : '/challenges'}
          studyPlanHref={enrolledPlans.length > 0 ? `/explore/plans/${enrolledPlans[0].slug}` : '/explore/plans'}
          weakestCompetency={weakestCompetency}
          competencyScore={coachCompetencyScore}
          competencyTrend={coachCompetencyTrend}
          overallLevel={coachOverallLevel}
          recentCompletions={coachRecentCompletions}
        />

        <BillingDashboardNudge plan={plan} />

        {/* ZONE 2 — Cadence ribbon: streak week grid + today's path steps merged
            into one full-width horizontal strip (replaces the dead 340px rail). */}
        {userId && (weekDates.length > 0 || todaysPathSteps.length > 0) && (
          <CadenceRibbon
            streakDays={streakDays}
            xpTotal={xpTotal}
            dailyDone={dailyDone}
            todaysPathSteps={todaysPathSteps}
            todaysPathCompleted={todaysPathCompleted}
            weekDates={weekDates}
          />
        )}

        {/* ZONE 3 — The Bench: practice entry points filling the full width. */}
        <div className="flex flex-col gap-5">

          {/* Anchor: Claude Code Analytics front door. Self-hides when the
              feature is off; dominant dark tile when on. */}
          {ccAnalytics?.enabled && <AnalyticsLabCard data={ccAnalytics} />}

          {/* Top row: Quick Take + Next Challenge + Featured Autopsy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div id="quick-take" className="scroll-mt-24">
              <QuickTakeCard
                prompt={quickTakePrompt?.prompt_text ?? 'Your PM says DAU dropped 15% overnight. Walk me through how you would diagnose this.'}
                challengeId={quickTakePrompt?.id ?? 'orientation'}
                hatchContext={null}
              />
            </div>

            {nextChallenge?.domainName ? (
              <NextChallengeCard
                title={nextChallenge.title}
                domain={nextChallenge.domainName}
                difficulty={nextChallenge.difficulty ?? 'standard'}
                challengeId={nextChallenge.slug ?? nextChallenge.id}
                catalogNumber={formatChallengeNumber(nextChallenge.challenge_type, nextChallenge.display_number)}
                hatchInsight={nextChallenge.hatch_insight ?? null}
                activePlanSlug={activePlanSlug}
              />
            ) : (
              <NextChallengeCard
                title="Designing a Metric Dashboard for a B2B SaaS Tool"
                domain="Product Sense"
                difficulty="standard"
                challengeId="orientation"
                hatchInsight={null}
                activePlanSlug={activePlanSlug}
              />
            )}

            {featuredAutopsy ? (
              <FeaturedAutopsyCard story={featuredAutopsy.story} company={featuredAutopsy.company} />
            ) : (
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center p-6 min-h-[160px]">
                <Link
                  href="/explore/autopsies"
                  className="flex flex-col items-center gap-2 text-on-surface-variant text-center no-underline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 0" }}>biotech</span>
                  <span className="text-[13px] font-label font-semibold">Browse Autopsies</span>
                  <span className="text-[11px]">Real product decision trees</span>
                </Link>
              </div>
            )}
          </div>

          {/* FLOW Move Levels — full width, calibration-gated */}
          {isCalibrated ? (
            <FlowMoveLevelsCard levels={allMoveLevels} />
          ) : (
            <LockOverlay>
              <FlowMoveLevelsCard levels={allMoveLevels} />
            </LockOverlay>
          )}

          {/* Hot Challenges + Leaderboard — side by side only when the
              leaderboard has enough entries; otherwise Trending spans full width
              so there is no dead column at wide widths. */}
          {hasLeaderboard ? (
            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5">
              <HotChallengesCard challenges={hotChallenges} />
              <LeaderboardPeekCard entries={leaderboard} userRank={userRank} />
            </div>
          ) : (
            <HotChallengesCard challenges={hotChallenges} />
          )}
        </div>

        {/* ZONE 4 — Continue strip: only render when there is something to act on.
            Streak + today's path live in Zone 2 and are not repeated here. */}
        {hasZone4 && (
          <section aria-label="Continue where you left off">
            <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.12em] text-on-surface-variant mb-3">
              Continue
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {hasPausedLoop && pausedLoopData && (
                <PausedLoopCard
                  loop={pausedLoopData.loop as unknown as InterviewLoop}
                  rounds={pausedLoopData.rounds as unknown as LoopRound[]}
                />
              )}
              {hasLatestInterview && latestInterview && (
                <LatestInterviewCard data={latestInterview} />
              )}
              {hasEnrolledPlans && (
                <EnrolledPlansCard plans={enrolledPlans} />
              )}
              {hasInterviewCountdown && (
                <InterviewCountdownCard interviews={interviews} />
              )}
              {hasAchievements && (
                <AchievementsCard
                  achievements={achievementData}
                  unlockedCount={achievementData.filter(a => a.unlocked).length}
                  totalCount={achievementData.length}
                />
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
