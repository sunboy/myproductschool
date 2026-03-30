import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'
import {
  getDashboardPreferences,
  getHotChallenges,
  getLatestDiscussions,
  getLeaderboardPeek,
  getUserNotes,
  getMoveLevel,
} from '@/lib/data/dashboard'
import { getLumaContext } from '@/lib/notes/embeddings'
import { getMockQuickTakePrompt } from '@/lib/mock'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const DEFAULT_CARD_ORDER = [
  'quick_take',
  'next_challenge',
  'move_levels',
  'productiq',
  'interview_countdown',
  'hot_challenges',
  'discussions',
  'leaderboard',
  'notes',
  'recent_activity',
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName: string | null = null
  let streakDays = 0
  let xpTotal = 0
  let interviewDate: string | null = null
  let interviewMeta: { company?: string; round?: string } = {}

  // Profile data
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at, streak_days, xp_total, interview_date, interview_meta')
      .eq('id', user.id)
      .single()

    displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null
    streakDays = profile?.streak_days ?? 0
    xpTotal = profile?.xp_total ?? 0
    interviewDate = profile?.interview_date ?? null
    interviewMeta = (profile?.interview_meta as { company?: string; round?: string }) ?? {}
  }

  // Parallel data fetching
  const userId = user?.id ?? ''
  const [
    dashboardPrefs,
    analytics,
    hotChallenges,
    discussions,
    leaderboard,
    userNotes,
    moveLevels,
  ] = await Promise.all([
    userId ? getDashboardPreferences(userId) : null,
    userId ? getUserAnalyticsSummary(userId) : null,
    getHotChallenges(),
    getLatestDiscussions(),
    userId ? getLeaderboardPeek(userId) : [],
    userId ? getUserNotes(userId) : [],
    userId ? getMoveLevel(userId) : [],
  ])

  // Luma context from notes (wrap in try/catch — depends on OpenAI)
  let lumaContext: string | null = null
  if (userId) {
    try {
      lumaContext = await getLumaContext(userId)
    } catch {
      lumaContext = null
    }
  }

  // Featured challenge for Quick Take + Next Challenge
  let featuredChallenge = { id: '', title: 'The Marketplace Retention Loop', domain: 'Product Strategy', difficulty: 'Medium' }
  const { data: challenge } = await supabase
    .from('challenge_prompts')
    .select('id, title, estimated_minutes, domain_id')
    .eq('is_published', true)
    .limit(1)
    .single()

  if (challenge) {
    featuredChallenge = {
      id: challenge.id,
      title: challenge.title,
      difficulty: 'Medium',
      domain: 'Product Strategy',
    }
  }

  // Compute days until interview
  const daysUntilInterview = interviewDate
    ? Math.max(0, Math.ceil((new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  // Coaching message fallback
  const coachingMessage = streakDays > 0
    ? `You're on a ${streakDays}-day streak — keep the momentum going.`
    : 'Build your product instincts one challenge at a time.'

  // ProductIQ data
  const productiqScore = analytics ? Math.round(analytics.productiq_score) : 72
  const productiqDelta = analytics?.productiq_delta ?? 0
  const weeklyActivity = analytics?.weekly_activity ?? [2, 1, 3, 0, 2, 1, 2]
  const dimensions = analytics
    ? [
        { label: 'Diagnostic Accuracy', score: analytics.dimensions.diagnostic_accuracy.score },
        { label: 'Metric Fluency', score: analytics.dimensions.metric_fluency.score },
        { label: 'Framing Precision', score: analytics.dimensions.framing_precision.score },
        { label: 'Recommendation Strength', score: analytics.dimensions.recommendation_strength.score },
      ]
    : [
        { label: 'Diagnostic Accuracy', score: 74 },
        { label: 'Metric Fluency', score: 68 },
        { label: 'Framing Precision', score: 80 },
        { label: 'Recommendation Strength', score: 71 },
      ]

  // Recent activity from analytics
  const recentActivity = (analytics?.recent_attempts ?? [])
    .filter(a => a.status === 'completed')
    .slice(0, 4)
    .map(a => ({
      name: a.challenge_title,
      domain: a.domain,
      score: a.score,
      date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

  // Card visibility
  const cardOrder = (dashboardPrefs?.dashboard_cards ?? DEFAULT_CARD_ORDER) as string[]
  const dismissedCards = (dashboardPrefs?.dismissed_cards ?? []) as string[]
  const visibleCards = cardOrder.filter((id: string) => !dismissedCards.includes(id))

  // Leaderboard user rank
  const userEntry = (leaderboard as { rank: number; isCurrentUser?: boolean }[]).find(e => e.isCurrentUser)
  const userRank = userEntry?.rank ?? 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">

      {/* Stats Strip */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full text-sm font-label font-semibold">
          <span className="material-symbols-outlined text-base">local_fire_department</span>
          {streakDays} day streak
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-label font-semibold">
          <span className="material-symbols-outlined text-base">bolt</span>
          {xpTotal.toLocaleString()} XP
        </span>
        {daysUntilInterview !== null && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-on-surface rounded-full text-sm font-label font-semibold">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            Interview in {daysUntilInterview} days
          </span>
        )}
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-on-surface rounded-full text-sm font-label font-semibold">
          <span className="material-symbols-outlined text-base">target</span>
          3/5 today
        </span>
      </div>

      {/* Greeting Banner */}
      <div className="bg-primary-fixed rounded-xl p-4 flex flex-wrap items-center gap-4 mb-4">
        <LumaGlyph size={48} state="idle" className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-lg text-on-surface">{getGreeting()}{displayName ? `, ${displayName}` : ''}!</p>
          <p className="text-sm text-on-surface-variant">{lumaContext ?? coachingMessage}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/challenges"
            className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-label font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Daily Challenge
          </Link>
          <Link
            href="/challenges"
            className="border border-outline-variant text-on-surface px-4 py-2 rounded-full text-sm font-label font-semibold hover:bg-surface-container transition-colors whitespace-nowrap"
          >
            Resume Learning
          </Link>
        </div>
      </div>

      {/* Bento Grid — client component with resizing + CardPicker */}
      <DashboardGrid
        visibleCards={visibleCards}
        dismissedCards={dismissedCards}
        cardData={{
          notes: userNotes,
          hotChallenges,
          discussions,
          leaderboard: leaderboard as { rank: number; name: string; xp: number; isCurrentUser?: boolean }[],
          userRank,
          moveLevels,
          productiqScore,
          productiqDelta,
          weeklyActivity,
          dimensions,
          featuredChallengeId: featuredChallenge.id,
          featuredChallengeTitle: featuredChallenge.title,
          featuredChallengeDomain: featuredChallenge.domain,
          featuredChallengeDifficulty: featuredChallenge.difficulty,
          interviewDate,
          interviewMeta,
          recentActivity,
          quickTakePrompt: getMockQuickTakePrompt(),
          lumaInsight: lumaContext,
        }}
      />
    </div>
  )
}
