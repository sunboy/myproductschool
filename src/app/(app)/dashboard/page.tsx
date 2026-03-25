import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { createClient } from '@/lib/supabase/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Mock recent activity rows
const recentActivity = [
  { name: 'Spotify podcast discovery', domain: 'Product Strategy', score: 78, date: 'Mar 24' },
  { name: 'DoorDash driver retention', domain: 'Growth', score: 64, date: 'Mar 22' },
  { name: 'Airbnb superhost funnel', domain: 'Conversion', score: 51, date: 'Mar 20' },
  { name: 'Duolingo streak mechanics', domain: 'Engagement', score: 82, date: 'Mar 18' },
]

function scoreColor(score: number): string {
  if (score >= 75) return 'text-primary'
  if (score >= 50) return 'text-tertiary'
  return 'text-error'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'there'
  let isOnboarded = false
  let streakDays = 7
  let productiqScore = 72
  let productiqDelta = 2.4
  let weeklyActivity = [2, 1, 3, 0, 2, 1, 2]

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at, streak_days')
      .eq('id', user.id)
      .single()

    displayName = profile?.display_name ?? 'there'
    isOnboarded = !!profile?.onboarding_completed_at
    streakDays = profile?.streak_days ?? 7

    const analytics = await getUserAnalyticsSummary(user.id)
    productiqScore = Math.round(analytics.productiq_score)
    productiqDelta = analytics.productiq_delta
    weeklyActivity = analytics.weekly_activity
  }

  // Fetch a featured challenge
  let featuredChallenge = {
    title: 'The Marketplace Retention Loop',
    difficulty: 'Medium',
    domain: 'Product Strategy',
    slug: '',
  }

  const { data: challenge } = await supabase
    .from('challenge_prompts')
    .select('id, title, estimated_minutes, domain_id')
    .eq('is_published', true)
    .limit(1)
    .single()

  if (challenge) {
    featuredChallenge = {
      title: challenge.title,
      difficulty: 'Medium',
      domain: 'Product Strategy',
      slug: challenge.id,
    }
  }

  // Sparkline bar heights — normalize weeklyActivity to max height of 48px
  const maxActivity = Math.max(...weeklyActivity, 1)
  const sparklineBars = weeklyActivity.map(v => Math.max(4, Math.round((v / maxActivity) * 48)))

  // ProductIQ dimension scores
  const dimensions = [
    { label: 'Diagnostic Accuracy', score: 74 },
    { label: 'Metric Fluency', score: 68 },
    { label: 'Framing Precision', score: 80 },
    { label: 'Recommendation Strength', score: 71 },
  ]

  // Radar SVG — pentagon with 4 axes (using 4 axes)
  const radarDims = [
    { label: 'Diagnostic', value: 74 },
    { label: 'Metrics', value: 68 },
    { label: 'Framing', value: 80 },
    { label: 'Recommendations', value: 71 },
  ]
  const numAxes = radarDims.length
  const cx = 80
  const cy = 80
  const maxR = 60
  const radarPoints = radarDims.map((d, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2
    const r = (d.value / 100) * maxR
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
  const radarPolygon = radarPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Grid ring points at 33%, 66%, 100%
  const gridRings = [0.33, 0.66, 1.0].map(frac =>
    Array.from({ length: numAxes }, (_, i) => {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2
      const r = frac * maxR
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
  )

  // Axis line endpoints
  const axisEndpoints = radarDims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2
    return { x: cx + maxR * Math.cos(angle), y: cy + maxR * Math.sin(angle) }
  })

  // Axis labels placed slightly beyond the ring
  const axisLabels = radarDims.map((d, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2
    const r = maxR + 14
    return {
      label: d.label,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      anchor: (Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end') as 'middle' | 'start' | 'end',
    }
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">

      {/* Row 1 — Compact Luma greeting */}
      <div className="bg-primary-fixed rounded-xl p-3 flex items-center gap-3">
        <LumaGlyph size={40} className="flex-shrink-0" />
        <p className="flex-1 min-w-0 text-sm text-on-surface font-medium truncate">
          {getGreeting()}, {displayName}!{' '}
          {streakDays > 0
            ? `You're on a ${streakDays}-day streak.`
            : "Let's build your product instincts."}
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href="/challenges"
            className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-sm font-label font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Daily Challenge
          </Link>
          <Link
            href="/challenges"
            className="border border-outline-variant text-on-surface px-4 py-1.5 rounded-full text-sm font-label font-semibold hover:bg-surface-container transition-colors whitespace-nowrap"
          >
            Resume Learning
          </Link>
        </div>
      </div>

      {/* Onboarding prompt — compact inline variant */}
      {!isOnboarded && (
        <div className="flex items-center gap-3 p-3 bg-secondary-container rounded-xl">
          <span className="material-symbols-outlined text-on-secondary-container">waving_hand</span>
          <p className="flex-1 text-sm text-on-secondary-container font-medium">
            Welcome! Your first challenge takes ~5 min and sets your baseline.
          </p>
          <Link
            href="/challenges/orientation"
            className="flex-shrink-0 px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Start Orientation
          </Link>
        </div>
      )}

      {/* Row 2 — Bento grid: ProductIQ (2/3) + Luma's Pick (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ProductIQ Score Card */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-label font-bold text-xs uppercase tracking-wider text-outline">ProductIQ Score</h2>
              <span className="text-3xl font-bold text-primary font-headline leading-none">{productiqScore}</span>
              <span className="text-xs font-semibold text-tertiary ml-2">
                {productiqDelta >= 0 ? '+' : ''}{productiqDelta} pts
              </span>
            </div>
          </div>

          {/* Sparkline bar chart */}
          <div className="flex items-end gap-1 h-12">
            {sparklineBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/30"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          {/* 4 dimension mini-bars in 2x2 grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {dimensions.map((dim) => (
              <div key={dim.label} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant truncate">{dim.label}</span>
                  <span className="text-sm font-semibold text-on-surface ml-2">{dim.score}</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Luma's Pick Card */}
        <div className="lg:col-span-1 bg-surface-container rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LumaGlyph size={32} className="flex-shrink-0" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Luma's Pick</span>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <p className="font-semibold text-sm text-on-surface leading-snug">{featuredChallenge.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-tertiary-container text-on-tertiary-container rounded-full text-xs px-2 py-0.5 font-label">
                {featuredChallenge.difficulty}
              </span>
              <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label">
                {featuredChallenge.domain}
              </span>
            </div>
          </div>

          <Link
            href={featuredChallenge.slug ? `/challenges/${featuredChallenge.slug}` : '/challenges'}
            className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity"
          >
            Start Challenge →
          </Link>
        </div>
      </div>

      {/* Row 3 — Recent Activity + Skill Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-2">
          <h2 className="font-headline font-semibold text-base text-on-surface">Recent Activity</h2>

          <div className="flex flex-col">
            {recentActivity.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 h-10 border-b border-outline-variant/20 last:border-0"
              >
                <span className="flex-1 text-sm text-on-surface truncate">{row.name}</span>
                <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label whitespace-nowrap flex-shrink-0">
                  {row.domain}
                </span>
                <span className={`text-sm font-semibold flex-shrink-0 w-8 text-right ${scoreColor(row.score)}`}>
                  {row.score}
                </span>
                <span className="text-xs text-on-surface-variant flex-shrink-0 w-12 text-right">{row.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Radar */}
        <div className="bg-surface-container rounded-xl p-4 flex flex-col items-center gap-3">
          <h2 className="font-headline font-semibold text-base text-on-surface self-start">Skill Radar</h2>

          {/* Pentagon SVG radar */}
          <svg
            viewBox="0 0 160 160"
            className="w-40 h-40"
            aria-label="Skill radar chart"
          >
            {/* Grid rings */}
            {gridRings.map((pts, i) => (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke="#c4c8bc"
                strokeWidth="0.75"
              />
            ))}
            {/* Axis lines */}
            {axisEndpoints.map((ep, i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={ep.x}
                y2={ep.y}
                stroke="#c4c8bc"
                strokeWidth="0.75"
              />
            ))}
            {/* Filled radar shape */}
            <polygon
              points={radarPolygon}
              fill="rgba(74, 124, 89, 0.25)"
              stroke="#4a7c59"
              strokeWidth="1.5"
            />
            {/* Dots at vertices */}
            {radarPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="#4a7c59" />
            ))}
            {/* Axis labels */}
            {axisLabels.map((al, i) => (
              <text
                key={i}
                x={al.x}
                y={al.y}
                textAnchor={al.anchor}
                dominantBaseline="middle"
                fontSize="7"
                fontFamily="Nunito Sans, sans-serif"
                fontWeight="600"
                fill="#4a4e4a"
              >
                {al.label}
              </text>
            ))}
          </svg>

          {/* Top strength chip */}
          <div className="flex items-center gap-2 bg-primary-fixed rounded-full px-3 py-1">
            <LumaGlyph size={20} className="flex-shrink-0" />
            <span className="text-xs text-on-surface font-label">
              Top strength: <span className="font-semibold">Framing Precision</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
