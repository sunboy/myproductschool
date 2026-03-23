import { MOCK_PROFILE_DATA, MOCK_ANALYTICS_SUMMARY } from '@/lib/mock-data'
import { ShareableCard } from '@/components/profile/ShareableCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My ProductIQ | HackProduct',
  description: 'See my ProductIQ score on HackProduct',
  openGraph: {
    title: 'My ProductIQ Score',
    description: 'ProductIQ: 72.4 — Top 28% of product thinkers',
  },
}

export default function SharePage() {
  const profile = MOCK_PROFILE_DATA
  const analytics = MOCK_ANALYTICS_SUMMARY

  // Find top dimension
  const topDimension = Object.entries(analytics.dimensions).reduce(
    (best, [key, val]) =>
      val.score > best.score ? { key, score: val.score } : best,
    { key: '', score: 0 }
  )
  const dimensionLabels: Record<string, string> = {
    diagnostic_accuracy: 'Diagnostic Accuracy',
    metric_fluency: 'Metric Fluency',
    framing_precision: 'Framing Precision',
    recommendation_strength: 'Recommendation Strength',
  }
  const topDimensionLabel = dimensionLabels[topDimension.key] ?? topDimension.key

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ShareableCard
          name={profile.name}
          score={analytics.productiq_score}
          topDimension={topDimensionLabel}
          challengeCount={analytics.total_attempts}
          streak={analytics.streak_days}
          percentile={28}
          lumaQuote="Strong recommendation instincts. Keep sharpening your diagnostic framing."
        />
      </div>
    </div>
  )
}
