import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { CalibrationHero } from './CalibrationHero'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getHotChallenges,
  getLeaderboardPeek,
  getMoveLevel,
} from '@/lib/data/dashboard'
import { getLumaContext } from '@/lib/luma-context'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { NextChallengeCard } from '@/components/dashboard/cards/NextChallengeCard'
import { MoveLevelsCard } from '@/components/dashboard/cards/MoveLevelsCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import type { UserInterview } from '@/lib/data/dashboard'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline font-semibold text-base text-on-surface">FLOW Move Levels</h3>
        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">lock</span>
          Unlocks after calibration
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 opacity-40 blur-[1px] pointer-events-none select-none">
        {moves.map(move => (
          <div key={move} className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-on-surface-variant">lock</span>
            </div>
            <div className="text-xs font-bold text-on-surface">{move}</div>
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
  const [hotChallenges, leaderboard, moveLevels] = await Promise.all([
    getHotChallenges(),
    userId ? getLeaderboardPeek(userId) : [],
    userId ? getMoveLevel(userId) : [],
  ])

  // Fetch personalized Quick Take and Next Challenge via admin client
  // (mirrors the logic in /api/challenges/quick-take and /api/challenges/next)
  const adminClient = createAdminClient()

  // Quick Take: use quick_take_prompts (not the legacy challenge_prompts table)
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayQuickTake } = await adminClient
    .from('quick_take_prompts')
    .select('id, prompt_text, move')
    .gte('created_at', todayStr)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  let quickTakePrompt = todayQuickTake

  if (!quickTakePrompt) {
    // Fall back to any published quick take
    const { data: anyQuickTake } = await adminClient
      .from('quick_take_prompts')
      .select('id, prompt_text, move')
      .eq('is_published', true)
      .limit(1)
      .maybeSingle()
    quickTakePrompt = anyQuickTake ?? null
  }

  // Next Challenge: use /api/challenges/next logic — weakest move targeting
  // Get user's weakest move, completed challenge IDs, and pick a personalized challenge
  let nextChallenge: { id: string; title: string; difficulty: string; domain_id?: string | null; luma_insight?: string | null } | null = null

  if (userId) {
    const [{ data: moveLevelsForNext }, { data: completedAttempts }] = await Promise.all([
      adminClient
        .from('move_levels')
        .select('move, xp')
        .eq('user_id', userId)
        .order('xp', { ascending: true })
        .limit(1),
      adminClient
        .from('challenge_attempts')
        .select('prompt_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
    ])

    const weakestMove = (moveLevelsForNext?.[0]?.move as string) ?? 'frame'
    const completedIds = (completedAttempts ?? []).map((a: { prompt_id: string }) => a.prompt_id)

    let nextQuery = adminClient
      .from('challenge_prompts')
      .select('id, title, difficulty, domain_id')
      .eq('is_published', true)
      .contains('move_tags', [weakestMove])

    if (completedIds.length > 0) {
      nextQuery = nextQuery.not('id', 'in', `(${completedIds.join(',')})`)
    }

    const { data: personalizedNext } = await nextQuery.limit(1).maybeSingle()
    nextChallenge = personalizedNext ?? null
  }

  if (!nextChallenge) {
    // Final fallback: any published challenge
    const { data: fallbackChallenge } = await adminClient
      .from('challenge_prompts')
      .select('id, title, difficulty, domain_id')
      .eq('is_published', true)
      .limit(1)
      .maybeSingle()
    nextChallenge = fallbackChallenge ?? null
  }

  if (userId && isCalibrated) {
    const lumaCtx = await getLumaContext(userId)

    // Attach luma_insight to nextChallenge from weakest FLOW move
    if (nextChallenge && lumaCtx.moveLevels.length > 0) {
      const weakestFlowMove = [...lumaCtx.moveLevels].sort((a, b) => a.level - b.level)[0]
      const moveLabels: Record<string, string> = {
        frame: 'frame',
        list: 'list',
        weigh: 'weigh',
        sell: 'sell',
      }
      const label = moveLabels[weakestFlowMove.move] ?? weakestFlowMove.move
      nextChallenge = { ...nextChallenge, luma_insight: `Your ${label} move is at Level ${weakestFlowMove.level} — this challenge drills exactly that.` }
    }
  }

  const userEntry = (leaderboard as { rank: number; isCurrentUser?: boolean }[]).find(e => e.isCurrentUser)
  const userRank = userEntry?.rank ?? 0

  const interviews: UserInterview[] = interviewDate
    ? [{ id: '0', user_id: userId, company: null, role: null, round: null, interview_date: interviewDate, notes: null, created_at: interviewDate }]
    : []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">

      {/* Luma Greeting Bar */}
      <div className="bg-primary-fixed rounded-2xl p-4 flex flex-wrap items-center gap-4 animate-luma-card">
        <LumaGlyph size={52} state={isCalibrated ? 'idle' : 'celebrating'} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-lg text-on-surface">
            {getPersonalizedGreeting(displayName, streakDays, lastAttemptDate, isCalibrated)}
          </p>
          <p className="text-sm text-on-surface-variant">
            {isCalibrated ? getDailyGoalMessage(dailyDone) : "I'm Luma, your product thinking coach. Let's find your starting point."}
          </p>
        </div>
        {isCalibrated && (
          <div className="flex gap-2 flex-shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full text-xs font-label font-bold text-on-surface">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: '#c94b1b' }}>local_fire_department</span>
              {streakDays} days
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full text-xs font-label font-bold text-on-surface">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: '#4a7c59' }}>bolt</span>
              {xpTotal.toLocaleString()} XP
            </span>
          </div>
        )}
      </div>

      {/* State A — Calibrated */}
      {isCalibrated && (
        <>
          {/* Hero row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickTakeCard
              prompt={quickTakePrompt?.prompt_text ?? 'Your PM says DAU dropped 15% overnight. Walk me through how you would diagnose this.'}
              challengeId={quickTakePrompt?.id ?? 'orientation'}
              lumaContext={null}
            />
            <NextChallengeCard
              title={nextChallenge?.title ?? 'Designing a Metric Dashboard for a B2B SaaS Tool'}
              domain="Product Strategy"
              difficulty={nextChallenge?.difficulty ?? 'Medium'}
              challengeId={nextChallenge?.id ?? 'orientation'}
              lumaInsight={nextChallenge?.luma_insight ?? null}
            />
          </div>

          {/* FLOW Move Levels */}
          <MoveLevelsCard levels={moveLevels} />

          {/* Secondary row */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
            <HotChallengesCard challenges={hotChallenges} />
            <LeaderboardPeekCard entries={leaderboard} userRank={userRank} />
          </div>

          {/* Interview Countdown — conditional */}
          {interviewDate && (
            <InterviewCountdownCard interviews={interviews} />
          )}
        </>
      )}

      {/* State B — Uncalibrated */}
      {!isCalibrated && (
        <>
          <CalibrationHero />
          <LockedMoveLevels />
          <HotChallengesCard challenges={hotChallenges} />
        </>
      )}
    </div>
  )
}
