import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'
import { ProductIQCard } from '@/components/analytics/ProductIQCard'
import { StreakRingCard } from '@/components/analytics/StreakRingCard'
import { DimensionMicroCard } from '@/components/analytics/DimensionMicroCard'
import { RecentChallengesTable } from '@/components/analytics/RecentChallengesTable'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { FeedbackDimension, DIMENSION_LABELS } from '@/lib/types'

interface ProgressPageProps {
  searchParams: Promise<{ period?: string }>
}

const PERIODS = ['7d', '30d', '90d', 'All'] as const
type Period = typeof PERIODS[number]

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const { period: rawPeriod } = await searchParams
  const activePeriod: Period = (PERIODS as readonly string[]).includes(rawPeriod ?? '') ? (rawPeriod as Period) : '30d'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const summary = await getUserAnalyticsSummary(user.id)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Header Section — matches Stitch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-headline font-extrabold text-on-surface" style={{ letterSpacing: '-0.02em' }}>Progress</h1>
          <p className="text-sm text-on-surface-variant font-body">Curating your product performance artifacts.</p>
        </div>
        <div className="flex bg-surface-variant rounded-full p-1 border border-outline-variant/20">
          {PERIODS.map(p => (
            <Link
              key={p}
              href={`/progress?period=${p}`}
              className={`px-4 py-1 text-xs font-semibold rounded-full transition-all ${
                p === activePeriod
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-white/50'
              }`}
            >
              {p}
            </Link>
          ))}
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

        {/* Luma insight strip */}
        <div className="col-span-12">
          <div className="bg-primary-fixed rounded-xl p-3 flex items-center gap-3">
            <LumaGlyph size={32} className="text-primary flex-shrink-0" />
            <p className="text-sm text-on-primary-fixed-variant font-body">
              Your Metric Fluency improved 7 points this week — keep it up!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
