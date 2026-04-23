import Link from 'next/link'
import { Suspense } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { CalibrationHero } from './CalibrationHero'
import { UpgradedBanner } from '@/components/dashboard/UpgradedBanner'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getHotChallenges,
  getLeaderboardPeek,
  getMoveLevel,
} from '@/lib/data/dashboard'
import { getEnrolledPlans } from '@/lib/data/study-plans'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { NextChallengeCard } from '@/components/dashboard/cards/NextChallengeCard'
import { HeroGreeterCard } from '@/components/dashboard/cards/HeroGreeterCard'
import { FlowMoveLevelsCard } from '@/components/dashboard/cards/FlowMoveLevelsCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import { EnrolledPlansCard } from '@/components/dashboard/cards/EnrolledPlansCard'
import { TodaysPathCard } from '@/components/dashboard/cards/TodaysPathCard'
import { AchievementsCard, ICON_COLOR_MAP, ICON_MAP } from '@/components/dashboard/cards/AchievementsCard'
import { StreakCalendarCard } from '@/components/dashboard/cards/StreakCalendarCard'
import type { UserInterview } from '@/lib/data/dashboard'
import { difficultyLabel } from '@/lib/utils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function moveLumaInsight(move: string, level: number): string {
  if (level <= 2) return `You're building your ${move} foundation — this challenge is the right next rep.`
  if (level <= 5) return `Your ${move} move needs reps at this difficulty — push through it.`
  return `Strong overall. This sharpens your ${move} edge.`
}

function targetDifficulties(avgXp: number): string[] {
  if (avgXp < 100) return ['warmup', 'standard']
  if (avgXp < 300) return ['standard', 'advanced']
  return ['advanced', 'staff_plus']
}

type RawChallenge = { id: string; slug?: string | null; title: string; difficulty: string; domain?: { title: string }[] | { title: string } | null }
type NextChallenge = { id: string; slug?: string | null; title: string; difficulty: string; domainName?: string | null; luma_insight?: string | null }

function normalizeChallenge(raw: RawChallenge | null): NextChallenge | null {
  if (!raw) return null
  const d = raw.domain
  const domainName = Array.isArray(d) ? (d[0]?.title ?? null) : (d?.title ?? null)
  return { id: raw.id, slug: raw.slug, title: raw.title, difficulty: raw.difficulty, domainName }
}

function getPersonalizedGreeting(displayName: string, streakDays: number, lastAttemptDate: string | null, isCalibrated: boolean): string {
  const base = getGreeting()
  if (!isCalibrated) return `Welcome, ${displayName}!`
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (streakDays >= 7) return `${base}, ${displayName} — ${streakDays} days strong.`
  if (lastAttemptDate === today) return `${base}, ${displayName}! You're already on a roll today.`
  if (lastAttemptDate === yesterday && streakDays > 1) return `${base}, ${displayName} — don't break your ${streakDays}-day streak.`
  if (!lastAttemptDate || streakDays === 0) return `Welcome back, ${displayName}! Ready to get back into it?`
  return `${base}, ${displayName}!`
}

function getDailyGoalMessage(dailyDone: number): string {
  if (dailyDone === 0) return 'Try a challenge — hit your daily goal of 5.'
  if (dailyDone >= 5) return 'Daily goal hit! You\'re ahead of most learners today.'
  return `${dailyDone} done today, ${5 - dailyDone} to go for your daily goal.`
}


function LockedMoveLevels() {
  const moves = ['Frame', 'List', 'Optimize', 'Win']
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-semibold text-sm text-on-surface">FLOW Levels</h3>
        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-label">
          <span className="material-symbols-outlined text-[13px]">lock</span>
          Unlocks after calibration
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 opacity-30 blur-[1.5px] pointer-events-none select-none">
        {moves.map(move => (
          <div key={move} className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
            </div>
            <div className="text-xs font-bold text-on-surface font-label">{move}</div>
            <div className="h-1 bg-surface-container-highest rounded-full" />
          </div>
        ))}
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
  let lastAttemptDate: string | null = null
  let dailyDone = 0

  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: profile }, { data: lastAttempt }, { count: dailyCount }] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, onboarding_completed_at, streak_days, xp_total, interview_date')
        .eq('id', user.id)
        .single(),
      supabase
        .from('challenge_attempts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('challenge_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today),
    ])

    displayName = profile?.display_name ?? 'there'
    streakDays = profile?.streak_days ?? 0
    xpTotal = profile?.xp_total ?? 0
    interviewDate = profile?.interview_date ?? null
    isCalibrated = !!profile?.onboarding_completed_at
    lastAttemptDate = lastAttempt?.created_at ? lastAttempt.created_at.split('T')[0] : null
    dailyDone = dailyCount ?? 0
  }

  const userId = user?.id ?? ''
  const adminClient = createAdminClient()

  const [hotChallenges, leaderboard, moveLevels, enrolledPlans] = await Promise.all([
    getHotChallenges(),
    userId ? getLeaderboardPeek(userId) : [],
    userId ? getMoveLevel(userId) : [],
    userId ? getEnrolledPlans(userId) : [],
  ])

  // ── Right-rail data: achievements + streak (fetched early, path built after challenges) ──
  let achievementData: { id: string; name: string; icon: string; unlocked: boolean; color: string }[] = []
  let weekDates: { dayLabel: string; dateLabel: string; completed: boolean; isToday: boolean }[] = []
  type AttemptRow = { challenge_id: string; created_at: string; challenges: { title: string; slug: string | null; challenge_type: string | null } | null }
  let todayAttempts: AttemptRow[] = []

  if (userId && isCalibrated) {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + mondayOffset)
    weekStart.setHours(0, 0, 0, 0)

    const weekDateStrings: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      weekDateStrings.push(d.toISOString().split('T')[0])
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
    const difficulties = targetDifficulties(avgXp)
    const completedIds = new Set((completedAttempts ?? []).map((a: { challenge_id: string }) => a.challenge_id))

    quickTakePrompt =
      (allQuickTakes ?? []).find(c => !completedIds.has(c.id)) ??
      allQuickTakes?.[0] ??
      null

    const completedIdsArr = Array.from(completedIds)

    // 1. Same move + right difficulty band
    let nextQuery = adminClient
      .from('challenges')
      .select('id, slug, title, difficulty, domain:domains(title)')
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
      .select('id, slug, title, difficulty, domain:domains(title)')
      .eq('is_published', true)
      .neq('challenge_type', 'quick_take')
      .limit(1)
      .maybeSingle()
    nextChallenge = normalizeChallenge(fallbackChallenge ?? null)
  }

  // Attach rule-based insight from move level data — no AI call
  if (nextChallenge && allMoveLevels.length > 0) {
    const weakestLevel = allMoveLevels[0].level ?? 1
    nextChallenge = { ...nextChallenge, luma_insight: moveLumaInsight(weakestMove, weakestLevel) }
  }

  // ── Build Today's Path (depends on quickTakePrompt + nextChallenge) ──
  let todaysPathSteps: { label: string; sub: string; icon: string; done: boolean; active: boolean; href?: string }[] = []
  let todaysPathCompleted = 0

  if (userId && isCalibrated) {
    const doneQuickTake = todayAttempts.some(a => a.challenges?.challenge_type === 'quick_take')
    const doneFlowChallenge = todayAttempts.some(a => a.challenges?.challenge_type !== 'quick_take')

    todaysPathSteps = [
      {
        label: 'Quick Take',
        sub: '1-min warm-up',
        icon: 'bolt',
        done: doneQuickTake,
        active: !doneQuickTake,
        href: undefined,
      },
      {
        label: 'Core challenge',
        sub: nextChallenge
          ? `${capitalize(weakestMove)} · ${difficultyLabel(nextChallenge.difficulty)}`
          : 'Pick a challenge',
        icon: 'track_changes',
        done: doneFlowChallenge,
        active: doneQuickTake && !doneFlowChallenge,
        href: nextChallenge ? `/workspace/challenges/${nextChallenge.slug ?? nextChallenge.id}` : '/challenges',
      },
      {
        label: 'Reflect',
        sub: "Review Luma's feedback",
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

  const interviews: UserInterview[] = interviewDate
    ? [{ id: '0', user_id: userId, company: null, role: null, round: null, interview_date: interviewDate, notes: null, created_at: interviewDate }]
    : []

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-7">

      <Suspense fallback={null}>
        <UpgradedBanner />
      </Suspense>

      {/* State A — Calibrated */}
      {isCalibrated && (
        <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* Main column */}
          <div className="flex flex-col gap-6 min-w-0">
            <HeroGreeterCard
              displayName={displayName}
              streakDays={streakDays}
              xpTotal={xpTotal}
            />

            {/* Resume / Quick Take row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickTakeCard
                prompt={quickTakePrompt?.prompt_text ?? 'Your PM says DAU dropped 15% overnight. Walk me through how you would diagnose this.'}
                challengeId={quickTakePrompt?.id ?? 'orientation'}
                lumaContext={null}
              />
              <NextChallengeCard
                title={nextChallenge?.title ?? 'Designing a Metric Dashboard for a B2B SaaS Tool'}
                domain={nextChallenge?.domainName ?? 'Product Strategy'}
                difficulty={nextChallenge?.difficulty ?? 'standard'}
                challengeId={nextChallenge?.slug ?? nextChallenge?.id ?? 'orientation'}
                lumaInsight={nextChallenge?.luma_insight ?? null}
              />
            </div>

            {/* FLOW Move Levels */}
            <FlowMoveLevelsCard levels={allMoveLevels} />

            {/* Enrolled Study Plans */}
            {enrolledPlans.length > 0 && <EnrolledPlansCard plans={enrolledPlans} />}

            {/* Secondary row */}
            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
              <HotChallengesCard challenges={hotChallenges} />
              <LeaderboardPeekCard entries={leaderboard} userRank={userRank} />
            </div>

            {/* Interview Countdown — conditional */}
            {interviewDate && (
              <InterviewCountdownCard interviews={interviews} />
            )}
          </div>

          {/* Right rail */}
          <aside className="flex flex-col gap-5">
            {todaysPathSteps.length > 0 && (
              <TodaysPathCard steps={todaysPathSteps} completedCount={todaysPathCompleted} />
            )}
            {achievementData.length > 0 && (
              <AchievementsCard
                achievements={achievementData}
                unlockedCount={achievementData.filter(a => a.unlocked).length}
                totalCount={achievementData.length}
              />
            )}
            {weekDates.length > 0 && (
              <StreakCalendarCard streakDays={streakDays} weekDates={weekDates} />
            )}
          </aside>
        </div>
      )}

      {/* State B — Uncalibrated */}
      {!isCalibrated && (
        <div className="space-y-4">
          {/* Luma Greeting Bar */}
          <div className="bg-primary-fixed rounded-2xl p-5 flex flex-wrap items-center gap-4 animate-luma-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-full opacity-30" style={{ background: 'radial-gradient(ellipse at 100% 50%, rgba(74,124,89,0.3) 0%, transparent 70%)' }} />
            <LumaGlyph size={48} state="celebrating" className="flex-shrink-0 relative" />
            <div className="flex-1 min-w-0 relative">
              <p className="font-headline font-bold text-[17px] text-on-surface leading-tight">
                {getPersonalizedGreeting(displayName, streakDays, lastAttemptDate, false)}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {"I'm Luma, your product thinking coach. Let's find your starting point."}
              </p>
            </div>
          </div>
          <CalibrationHero />
          <LockedMoveLevels />
          <HotChallengesCard challenges={hotChallenges} />
        </div>
      )}
    </div>
  )
}
