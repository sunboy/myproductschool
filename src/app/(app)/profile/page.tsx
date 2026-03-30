import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { DIMENSION_LABELS } from '@/lib/types'
import { getTopDimension } from '@/lib/utils'
import { SkillRadar } from '@/components/profile/SkillRadar'
import { ActivityTimeline } from '@/components/profile/ActivityTimeline'
import { PatternBreakdown } from '@/components/profile/PatternBreakdown'
import { ShareableCard } from '@/components/profile/ShareableCard'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'

function deriveInitials(displayName: string | null | undefined): string {
  if (!displayName) return '?'
  const words = displayName.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const second = words[1]?.[0] ?? ''
  return (first + second).toUpperCase() || '?'
}

function formatAttemptDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [profileResult, analytics] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, plan, role, streak_days, xp_total')
      .eq('id', user.id)
      .single(),
    getUserAnalyticsSummary(user.id),
  ])

  const profile = profileResult.data

  const displayName = profile?.display_name ?? 'Anonymous'
  const role = profile?.role ?? 'Product Thinker'
  const tier = profile?.plan ?? 'free'
  const avatarInitials = deriveInitials(profile?.display_name)

  // Find top dimension
  const topDimension = getTopDimension(analytics.dimensions)
  const topDimensionLabel = DIMENSION_LABELS[topDimension.key as keyof typeof DIMENSION_LABELS] ?? topDimension.key
  const percentile = 28

  const activities = analytics.recent_attempts.map((attempt) => ({
    date: formatAttemptDate(attempt.created_at),
    title: attempt.challenge_title,
    score: attempt.score,
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center flex-shrink-0">
          <span className="font-headline text-xl font-bold text-on-primary-container">
            {avatarInitials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {displayName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-secondary-container text-on-secondary-container rounded-full px-3 py-0.5">
              {role}
            </span>
            <span className="text-xs bg-primary-fixed text-primary rounded-full px-3 py-0.5 capitalize">
              {tier} tier
            </span>
          </div>
        </div>
        <Link
          href="/profile/share"
          className="flex items-center gap-1.5 bg-secondary-container text-on-secondary-container rounded-full px-4 py-2 text-sm font-label font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          Share Profile
        </Link>
      </div>

      {/* 2. ProductIQ Banner */}
      <div className="bg-surface-container rounded-xl p-6 text-center">
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider mb-1">
          ProductIQ
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-headline font-bold text-on-surface">
            {analytics.productiq_score}
          </span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              analytics.productiq_delta >= 0
                ? 'bg-primary/10 text-primary'
                : 'bg-error/10 text-error'
            }`}
          >
            {analytics.productiq_delta >= 0 ? '+' : ''}
            {analytics.productiq_delta}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mt-2">
          Top {percentile}% of product thinkers
        </p>
      </div>

      {/* 3. Skill Radar */}
      <div className="bg-surface-container rounded-xl p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Skill Radar
        </h2>
        <SkillRadar dimensions={analytics.dimensions} />
      </div>

      {/* 4. Luma's Insight */}
      <div className="bg-primary-fixed rounded-xl p-5 flex gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <LumaGlyph size={28} state="speaking" className="text-primary" />
        </div>
        <blockquote className="text-sm text-on-surface leading-relaxed">
          <p className="font-label font-semibold text-primary mb-1">
            Luma&apos;s Insight
          </p>
          Your strongest dimension is <strong>{topDimensionLabel}</strong> at{' '}
          {topDimension.score}/100. You consistently propose actionable next steps
          backed by evidence. Watch for the <em>Metric Recitation</em> pattern
          &mdash; you&apos;ve triggered it 5 times this month. Try anchoring
          metrics in user behavior rather than listing them.
        </blockquote>
      </div>

      {/* 5. Activity Timeline */}
      <div className="bg-surface-container rounded-xl p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Recent Activity
        </h2>
        <ActivityTimeline activities={activities} />
      </div>

      {/* 6. Pattern Breakdown */}
      <div className="bg-surface-container rounded-xl p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Pattern Breakdown
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          Recurring anti-patterns Luma has flagged in your responses
        </p>
        <PatternBreakdown patterns={[]} />
      </div>

      {/* 7. Shareable Card */}
      <div className="bg-surface-container rounded-xl p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Share Your Progress
        </h2>
        <ShareableCard
          name={displayName}
          score={analytics.productiq_score}
          topDimension={topDimensionLabel}
          challengeCount={analytics.total_attempts}
          streak={analytics.streak_days}
          percentile={percentile}
          lumaQuote="Strong recommendation instincts. Keep sharpening your diagnostic framing."
        />
      </div>
    </div>
  )
}
