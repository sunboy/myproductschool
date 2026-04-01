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
import { getLumaContextFromNotes } from '@/lib/notes/embeddings'
import { restoreCard } from '@/app/actions/dashboard'
import { DismissibleCard } from '@/components/dashboard/DismissibleCard'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { NextChallengeCard } from '@/components/dashboard/cards/NextChallengeCard'
import { MoveLevelsCard } from '@/components/dashboard/cards/MoveLevelsCard'
import { ProductIQCard } from '@/components/dashboard/cards/ProductIQCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { DiscussionsCard } from '@/components/dashboard/cards/DiscussionsCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { RecentActivityCard } from '@/components/dashboard/cards/RecentActivityCard'
import { NotesCard } from '@/components/dashboard/cards/NotesCard'
import { DashboardActionButtons } from '@/components/dashboard/DashboardActionButtons'

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

const colSpan: Record<string, string> = {
  quick_take: 'lg:col-span-3',
  next_challenge: 'lg:col-span-2',
  move_levels: 'lg:col-span-1',
  productiq: 'lg:col-span-2',
  interview_countdown: 'lg:col-span-1',
  hot_challenges: 'lg:col-span-1',
  discussions: 'lg:col-span-1',
  leaderboard: 'lg:col-span-1',
  notes: 'lg:col-span-1',
  recent_activity: 'lg:col-span-2',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'there'
  let streakDays = 0
  let xpTotal = 0
  let interviewDate: string | null = null

  // Profile data
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at, streak_days, xp_total, interview_date')
      .eq('id', user.id)
      .single()

    displayName = profile?.display_name ?? 'there'
    streakDays = profile?.streak_days ?? 0
    xpTotal = profile?.xp_total ?? 0
    interviewDate = profile?.interview_date ?? null
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
      lumaContext = await getLumaContextFromNotes(userId, 'product thinking')
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

  function renderCard(cardId: string) {
    switch (cardId) {
      case 'quick_take':
        return (
          <QuickTakeCard
            prompt={featuredChallenge.title}
            challengeId={featuredChallenge.id || 'orientation'}
            lumaContext={lumaContext}
          />
        )
      case 'next_challenge':
        return (
          <NextChallengeCard
            title={featuredChallenge.title}
            domain={featuredChallenge.domain}
            difficulty={featuredChallenge.difficulty}
            challengeId={featuredChallenge.id || 'orientation'}
            lumaInsight={lumaContext}
          />
        )
      case 'move_levels':
        return <MoveLevelsCard levels={moveLevels} />
      case 'productiq':
        return (
          <ProductIQCard
            score={productiqScore}
            delta={productiqDelta}
            weeklyActivity={weeklyActivity}
            dimensions={dimensions}
          />
        )
      case 'interview_countdown':
        return <InterviewCountdownCard interviews={interviewDate ? [{ id: '0', user_id: user?.id ?? '', company: null, role: null, round: null, interview_date: interviewDate, notes: null, created_at: interviewDate }] : []} />
      case 'hot_challenges':
        return <HotChallengesCard challenges={hotChallenges} />
      case 'discussions':
        return <DiscussionsCard discussions={discussions} />
      case 'leaderboard':
        return <LeaderboardPeekCard entries={leaderboard} userRank={userRank} />
      case 'notes':
        return <NotesCard notes={userNotes} />
      case 'recent_activity':
        return <RecentActivityCard activities={recentActivity} />
      default:
        return null
    }
  }

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
          <p className="font-headline font-bold text-lg text-on-surface">{getGreeting()}, {displayName}!</p>
          <p className="text-sm text-on-surface-variant">{lumaContext ?? coachingMessage}</p>
        </div>
        <DashboardActionButtons />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((cardId: string) => {
          const card = renderCard(cardId)
          if (!card) return null
          return (
            <div key={cardId} className={colSpan[cardId] ?? 'lg:col-span-1'}>
              <DismissibleCard cardId={cardId}>
                {card}
              </DismissibleCard>
            </div>
          )
        })}
      </div>

      {/* Restore Footer */}
      {dismissedCards.length > 0 && (
        <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-on-surface-variant">
            {dismissedCards.length} card{dismissedCards.length > 1 ? 's' : ''} hidden
          </span>
          {dismissedCards.map((cardId: string) => (
            <form key={cardId} action={restoreCard.bind(null, cardId)}>
              <button
                type="submit"
                className="text-xs px-3 py-1 bg-surface-container-high text-on-surface rounded-full hover:bg-surface-container-highest transition-colors capitalize"
              >
                + {cardId.replace(/_/g, ' ')}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  )
}
