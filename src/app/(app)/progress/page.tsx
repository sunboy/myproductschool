import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'
import { ProductIQCard } from '@/components/analytics/ProductIQCard'
import { StreakRingCard } from '@/components/analytics/StreakRingCard'
import { DimensionMicroCard } from '@/components/analytics/DimensionMicroCard'
import { RecentChallengesTable } from '@/components/analytics/RecentChallengesTable'
import { FeedbackDimension, DIMENSION_LABELS } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const summary = await getUserAnalyticsSummary(user.id)

  // Build heatmap data from weekly_activity (last 91 days)
  const today = new Date()
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (90 - i))
    return {
      date: d.toISOString().split('T')[0],
      count: 0,
    }
  })

  // Overlay real activity from attempts if USE_MOCK_DATA is off — heatmap
  // uses weekly_activity as a 7-day window; full 90-day heatmap is a future
  // enhancement. For now keep the grid structure with zeros so it renders.
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Material Analytics</h1>
          <p className="text-on-surface-variant mt-1">
            Your ProductIQ score integrates 4 core skill dimensions into a composite rating.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-colors text-sm">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Filter
        </button>
      </div>

      {/* Top row: ProductIQ + Streak Ring */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductIQCard
            score={summary.productiq_score}
            delta={summary.productiq_delta}
            weeklyActivity={summary.weekly_activity}
            totalAttempts={summary.total_attempts}
          />
        </div>
        <StreakRingCard
          streakDays={summary.streak_days}
          totalAttempts={summary.total_attempts}
        />
      </div>

      {/* Dimension micro-cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.entries(summary.dimensions) as [FeedbackDimension, { score: number; delta: number; sparkline: number[] }][]).map(([key, dim]) => (
          <DimensionMicroCard
            key={key}
            label={DIMENSION_LABELS[key] ?? key}
            score={dim.score}
            delta={dim.delta}
            sparkline={dim.sparkline}
          />
        ))}
      </div>

      {/* Recent Challenges Table */}
      <RecentChallengesTable attempts={summary.recent_attempts} />

      {/* Activity heatmap */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">Activity</h2>
        <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(day => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? 'challenge' : 'challenges'}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors ${
                      day.count === 0
                        ? 'bg-surface-container-high'
                        : day.count === 1
                          ? 'bg-primary/30'
                          : day.count === 2
                            ? 'bg-primary/60'
                            : 'bg-primary'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant mt-3">Last 13 weeks of challenge activity</p>
        </div>
      </div>

      {/* Luma analytics nudge */}
      <div className="flex gap-3 p-4 bg-primary-fixed rounded-xl">
        <LumaGlyph size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-on-surface-variant">Your analytics dashboard will light up after your first 3 challenges. Every session teaches Luma more about your patterns.</p>
      </div>
    </div>
  )
}
