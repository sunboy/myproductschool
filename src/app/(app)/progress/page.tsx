import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'
import { ProductIQCard } from '@/components/analytics/ProductIQCard'
import { StreakRingCard } from '@/components/analytics/StreakRingCard'
import { DimensionMicroCard } from '@/components/analytics/DimensionMicroCard'
import { RecentChallengesTable } from '@/components/analytics/RecentChallengesTable'
import { FeedbackDimension, DIMENSION_LABELS } from '@/lib/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const summary = await getUserAnalyticsSummary(user.id)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section — matches Stitch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-headline font-extrabold text-on-surface" style={{ letterSpacing: '-0.02em' }}>Your Analytics</h1>
          <p className="text-sm text-on-surface-variant font-body">Curating your product performance artifacts.</p>
        </div>
        <div className="flex bg-surface-variant rounded-full p-1 border border-outline-variant/20">
          <button className="px-4 py-1 text-xs font-semibold rounded-full text-on-surface-variant hover:bg-white/50 transition-all">7d</button>
          <button className="px-5 py-1 text-xs font-semibold rounded-full bg-primary text-white shadow-sm">30d</button>
          <button className="px-4 py-1 text-xs font-semibold rounded-full text-on-surface-variant hover:bg-white/50 transition-all">90d</button>
          <button className="px-4 py-1 text-xs font-semibold rounded-full text-on-surface-variant hover:bg-white/50 transition-all">All</button>
        </div>
      </div>

      {/* Bento Grid Dashboard — 12 column grid matching Stitch */}
      <div className="grid grid-cols-12 gap-4">
        {/* Main ProductIQ Score Card — 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <ProductIQCard
            score={summary.productiq_score}
            delta={summary.productiq_delta}
            weeklyActivity={summary.weekly_activity}
            totalAttempts={summary.total_attempts}
            dimensions={summary.dimensions}
          />
        </div>

        {/* Secondary Score Card — 4 cols, tertiary container */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <StreakRingCard
            streakDays={summary.streak_days}
            totalAttempts={summary.total_attempts}
            productiqScore={summary.productiq_score}
          />
        </div>

        {/* 4 Dimension Micro Cards — 3 cols each */}
        {(Object.entries(summary.dimensions) as [FeedbackDimension, { score: number; delta: number; sparkline: number[] }][]).map(([key, dim]) => (
          <div key={key} className="col-span-12 md:col-span-6 lg:col-span-3">
            <DimensionMicroCard
              label={DIMENSION_LABELS[key] ?? key}
              score={dim.score}
              delta={dim.delta}
              sparkline={dim.sparkline}
            />
          </div>
        ))}

        {/* Full-width Recent Challenges Table */}
        <div className="col-span-12">
          <RecentChallengesTable attempts={summary.recent_attempts} />
        </div>
      </div>
    </div>
  )
}
