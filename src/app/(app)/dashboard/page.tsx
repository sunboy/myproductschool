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

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'there'
  let isOnboarded = false
  let streakDays = 0
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
    streakDays = profile?.streak_days ?? 0

    const analytics = await getUserAnalyticsSummary(user.id)
    productiqScore = Math.round(analytics.productiq_score)
    productiqDelta = analytics.productiq_delta
    weeklyActivity = analytics.weekly_activity
  }

  // Fetch a featured challenge
  let featuredChallenge = {
    title: 'The Marketplace Retention Loop',
    description: 'Analyze the Cohort data for a hypothetical delivery app and propose 3 structural changes to improve D30 retention.',
    estimatedMinutes: 45,
    slug: '',
  }

  const { data: challenge } = await supabase
    .from('challenge_prompts')
    .select('id, title, prompt_text, estimated_minutes, domain_id')
    .eq('is_published', true)
    .limit(1)
    .single()

  if (challenge) {
    featuredChallenge = {
      title: challenge.title,
      description: challenge.prompt_text.length > 160
        ? challenge.prompt_text.slice(0, 157) + '...'
        : challenge.prompt_text,
      estimatedMinutes: challenge.estimated_minutes,
      slug: challenge.id,
    }
  }

  // Radar chart dimension scores for the visualization
  const radarDimensions = [
    { label: 'Strategic Thinking', value: 85 },
    { label: 'Execution', value: 70 },
    { label: 'Growth', value: 75 },
    { label: 'Empathy', value: 90 },
    { label: 'Data Analysis', value: 65 },
    { label: 'UI Design', value: 72 },
  ]

  // Compute radar polygon points (6 axes, centered at 50,50, max radius 40)
  const radarPoints = radarDimensions.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / radarDimensions.length - Math.PI / 2
    const r = (dim.value / 100) * 40
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`
  }).join(' ')

  const radarDotPositions = radarDimensions.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / radarDimensions.length - Math.PI / 2
    const r = (dim.value / 100) * 40
    return { cx: 50 + r * Math.cos(angle), cy: 50 + r * Math.sin(angle) }
  })

  // Label positions for radar (pushed further out)
  const labelPositions = radarDimensions.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / radarDimensions.length - Math.PI / 2
    const r = 48
    return {
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
      label: dim.label,
      anchor: Math.abs(Math.cos(angle)) < 0.1
        ? 'middle' as const
        : Math.cos(angle) > 0
          ? 'start' as const
          : 'end' as const,
    }
  })

  // Mock community submissions
  const recentSubmissions = [
    {
      id: '1',
      name: 'Marcus J.',
      topic: 'FinTech UX',
      action: 'shared a case study on',
      timeAgo: '2 hours ago',
      comments: 14,
      likes: 42,
      avatar: 'M',
    },
    {
      id: '2',
      name: 'Elena Rose',
      topic: 'Onboarding Flow',
      action: 'asked for feedback on',
      timeAgo: '5 hours ago',
      comments: 28,
      likes: 15,
      avatar: 'E',
    },
  ]

  // Milestone data
  const milestonePhase = 'Phase 2: Mechanics'
  const milestoneLessons = { done: 8, total: 12 }
  const milestonePercent = Math.round((milestoneLessons.done / milestoneLessons.total) * 100)
  const milestoneNext = 'Incentive Structures & Variable Rewards'

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Onboarding banner */}
      {!isOnboarded && (
        <div className="p-6 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-on-primary">
          <div className="flex items-start gap-4">
            <LumaGlyph size={40} className="flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="font-headline text-xl font-bold">Welcome! Let&apos;s find your starting point.</h2>
              <p className="text-on-primary/80 mt-1 text-sm">Your first challenge takes ~5 minutes. Luma will walk you through everything and establish your baseline.</p>
              <Link
                href="/challenges/orientation"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-on-primary text-primary rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Start Orientation
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Greeting Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
            {getFormattedDate()}
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">
            {getGreeting()}, {displayName}.
          </h1>
          <p className="text-secondary mt-3 text-lg max-w-xl font-body">
            Luma here. You&apos;re on a {streakDays > 0 ? `${streakDays}-day streak` : 'fresh start'}. Let&apos;s keep building your product instincts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/progress"
            className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-6 py-3 rounded-xl font-bold transition-colors"
          >
            View Schedule
          </Link>
          <Link
            href="/challenges"
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">play_circle</span>
            Resume Learning
          </Link>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* ProductIQ Score Radar Chart Card */}
        <div className="md:col-span-7 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 editorial-shadow ghost-border flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-8 z-10">
            <div>
              <h3 className="font-label font-bold text-outline uppercase tracking-wider text-xs mb-1">ProductIQ Score</h3>
              <p className="text-sm text-secondary">Based on your last 12 challenges</p>
            </div>
            <div className="text-right">
              <span className="text-6xl font-headline font-bold text-primary-container">{productiqScore}</span>
              <span className="text-sm font-bold text-tertiary block">
                {productiqDelta >= 0 ? '+' : ''}{productiqDelta} pts
              </span>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="flex-grow flex items-center justify-center relative py-10">
            {/* Radial gradient background */}
            <div
              className="absolute inset-0 rounded-full scale-125 opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(74, 124, 89, 0.1) 0%, rgba(74, 124, 89, 0) 70%)' }}
            />
            <div className="relative w-64 h-64 border-2 border-outline-variant/30 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 border border-outline-variant/30 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 border border-outline-variant/30 rounded-full" />
              </div>
              {/* Radar polygon */}
              <svg className="absolute w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                <polygon
                  points={radarPoints}
                  fill="rgba(74, 124, 89, 0.4)"
                  stroke="#4a7c59"
                  strokeWidth="2"
                />
                {radarDotPositions.map((pos, i) => (
                  <circle key={i} cx={pos.cx} cy={pos.cy} r="3" fill="#4a7c59" />
                ))}
              </svg>
              {/* Labels */}
              {labelPositions.map((pos, i) => {
                // Position labels around the circle using absolute positioning
                const style: React.CSSProperties = {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }
                return (
                  <span
                    key={i}
                    className="absolute text-[10px] font-bold uppercase text-outline tracking-tighter whitespace-nowrap"
                    style={style}
                  >
                    {pos.label}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-outline-variant/20 pt-6 z-10">
            <div className="text-center">
              <p className="text-[10px] text-outline font-bold uppercase">Rank</p>
              <p className="font-headline font-bold text-on-surface">Top 12%</p>
            </div>
            <div className="text-center border-x border-outline-variant/20 px-2">
              <p className="text-[10px] text-outline font-bold uppercase">Streaks</p>
              <p className="font-headline font-bold text-on-surface">{streakDays} Days</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-outline font-bold uppercase">Badges</p>
              <p className="font-headline font-bold text-on-surface">24 Unlocked</p>
            </div>
          </div>
        </div>

        {/* Featured Challenge Card */}
        <div className="md:col-span-5 lg:col-span-4 space-y-6">
          <div className="bg-primary-container text-on-primary rounded-xl p-6 relative overflow-hidden h-full flex flex-col ambient-glow">
            {/* Decorative circle */}
            <div className="absolute -top-12 -right-12 w-40 h-40 border-[20px] border-white/10 rounded-full" />
            <span className="bg-white/20 text-white font-bold text-[10px] px-3 py-1 rounded-full mb-4 w-fit uppercase tracking-widest z-10">
              Expert Pick
            </span>
            <h3 className="font-headline text-2xl font-bold text-white leading-tight mb-2 z-10">{featuredChallenge.title}</h3>
            <p className="text-white/80 text-sm mb-6 font-body z-10">
              {featuredChallenge.description}
            </p>
            <div className="mt-auto space-y-4 z-10">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">timer</span>
                {featuredChallenge.estimatedMinutes} min estimated
              </div>
              <Link
                href={featuredChallenge.slug ? `/challenges/${featuredChallenge.slug}` : '/challenges'}
                className="w-full bg-white text-primary-container py-3.5 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
              >
                Start Challenge
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Community Activity — spanning full width, split into 2/3 + 1/3 */}
        <div className="md:col-span-12 lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Submissions */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 editorial-shadow ghost-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl font-bold text-on-surface">Recent Submissions</h2>
              <Link href="/challenges" className="text-primary text-sm font-bold hover:underline">
                View All Community
              </Link>
            </div>
            <div className="space-y-4">
              {recentSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-on-primary-container">{sub.avatar}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {sub.name}{' '}
                      <span className="font-normal text-outline">{sub.action}</span>{' '}
                      {sub.topic}
                    </h4>
                    <p className="text-xs text-outline">
                      {sub.timeAgo} &bull; {sub.comments} comments &bull; {sub.likes} likes
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary flex-shrink-0">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-xl p-8 flex flex-col">
            <h3 className="font-headline text-xl font-bold mb-4">Milestone Progress</h3>
            <div className="flex-grow flex flex-col justify-center">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-tertiary-container text-on-tertiary-container">
                      {milestonePhase}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-tertiary">
                      {milestoneLessons.done}/{milestoneLessons.total} Lessons
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-on-tertiary-fixed-variant/10">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-tertiary"
                    style={{ width: `${milestonePercent}%` }}
                  />
                </div>
                <p className="text-sm font-medium">Next: &ldquo;{milestoneNext}&rdquo;</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-on-tertiary-fixed-variant/10">
              <p className="text-xs opacity-75">Estimated completion</p>
              <p className="font-bold">Next Thursday</p>
            </div>
          </div>
        </div>

      </div>

      {/* Contextual FAB */}
      <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 group">
        <Link
          href="/challenges"
          className="bg-primary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
        </Link>
        <span className="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          New Submission
        </span>
      </div>
    </div>
  )
}
