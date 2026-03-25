import { LumaGlyph } from '@/components/shell/LumaGlyph'
import Link from 'next/link'

const COMPANIES = [
  { slug: 'google', name: 'Google', challenges: 24, initial: 'G', color: 'bg-blue-100 text-blue-700' },
  { slug: 'meta', name: 'Meta', challenges: 18, initial: 'M', color: 'bg-blue-100 text-blue-600' },
  { slug: 'stripe', name: 'Stripe', challenges: 12, initial: 'S', color: 'bg-purple-100 text-purple-700' },
  { slug: 'amazon', name: 'Amazon', challenges: 15, initial: 'A', color: 'bg-amber-100 text-amber-700' },
  { slug: 'apple', name: 'Apple', challenges: 8, initial: 'A', color: 'bg-gray-100 text-gray-700' },
  { slug: 'uber', name: 'Uber', challenges: 10, initial: 'U', color: 'bg-black/10 text-gray-800' },
]

const MOCK_CHAPTERS = [
  {
    title: 'Product Sense & Logic',
    items: [
      { type: 'challenge', title: 'Improve Google Maps for commuters', status: 'completed', score: 78 },
      { type: 'challenge', title: 'Design a new Google Workspace feature', status: 'completed', score: 65 },
      { type: 'challenge', title: 'Google Search quality metrics', status: 'new', score: null },
    ],
  },
  {
    title: 'Execution & Metrics',
    items: [
      { type: 'challenge', title: 'Define success metrics for YouTube Shorts', status: 'new', score: null },
      { type: 'concept', title: 'North Star Metric', status: 'new', score: null },
      { type: 'challenge', title: 'Investigate Google Ads CTR drop', status: 'new', score: null },
    ],
  },
  {
    title: 'Leadership & Behavioral',
    items: [
      { type: 'challenge', title: 'Cross-team alignment scenario', status: 'locked', score: null },
      { type: 'challenge', title: 'Stakeholder management case', status: 'locked', score: null },
    ],
  },
]

function statusIcon(status: string) {
  if (status === 'completed') return { icon: 'check_circle', cls: 'text-primary' }
  if (status === 'locked') return { icon: 'lock', cls: 'text-on-surface-variant' }
  return { icon: 'radio_button_unchecked', cls: 'text-on-surface-variant' }
}

function chapterCompletionLabel(items: typeof MOCK_CHAPTERS[0]['items']) {
  const done = items.filter(i => i.status === 'completed').length
  return `${done}/${items.length} complete`
}

interface PrepPageProps {
  searchParams: Promise<{ company?: string }>
}

export default async function PrepPage({ searchParams }: PrepPageProps) {
  const params = await searchParams
  const selectedSlug = params.company ?? 'google'
  const selectedCompany = COMPANIES.find(c => c.slug === selectedSlug) ?? COMPANIES[0]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className="material-symbols-outlined text-3xl text-tertiary"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 28" }}
        >
          workspace_premium
        </span>
        <h1 className="font-headline text-2xl text-on-surface">Interview Prep</h1>
      </div>
      <p className="text-on-surface-variant text-sm mb-6 ml-10">
        Select a company. Luma builds your study plan.
      </p>

      {/* Company selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {COMPANIES.map(company => {
          const isSelected = company.slug === selectedSlug
          return (
            <Link
              key={company.slug}
              href={`/prep?company=${company.slug}`}
              className={`flex flex-col items-center gap-1.5 w-28 p-3 rounded-xl border-2 transition-all text-center ${
                isSelected
                  ? 'border-primary bg-primary-fixed'
                  : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-label font-bold ${company.color}`}
              >
                {company.initial}
              </span>
              <span className="text-xs font-label font-semibold text-on-surface leading-tight">
                {company.name}
              </span>
              <span className="text-[10px] text-on-surface-variant">{company.challenges} challenges</span>
            </Link>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Study plan chapters */}
        <div className="lg:col-span-8 space-y-3">
          <h2 className="font-label font-semibold text-on-surface-variant uppercase tracking-widest text-xs mb-3">
            {selectedCompany.name} Study Plan
          </h2>

          {MOCK_CHAPTERS.map((chapter, ci) => {
            const isFirst = ci === 0
            return (
              <details
                key={chapter.title}
                open={isFirst}
                className="bg-surface-container rounded-xl overflow-hidden group"
              >
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-container-high transition-colors list-none">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-base text-on-surface-variant group-open:rotate-90 transition-transform"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      chevron_right
                    </span>
                    <span className="font-label font-semibold text-sm text-on-surface">{chapter.title}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-label">
                    {chapterCompletionLabel(chapter.items)}
                  </span>
                </summary>

                <div className="divide-y divide-outline-variant border-t border-outline-variant">
                  {chapter.items.map((item, ii) => {
                    const { icon, cls } = statusIcon(item.status)
                    const isLocked = item.status === 'locked'
                    return (
                      <div
                        key={ii}
                        className={`flex items-center gap-3 px-4 h-10 ${isLocked ? 'opacity-50' : ''}`}
                      >
                        {/* Status icon */}
                        <span
                          className={`material-symbols-outlined text-base shrink-0 ${cls}`}
                          style={{ fontVariationSettings: `'FILL' ${item.status === 'completed' ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
                        >
                          {icon}
                        </span>

                        {/* Type badge */}
                        <span
                          className={`text-[10px] font-label font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            item.type === 'challenge'
                              ? 'bg-primary text-on-primary'
                              : 'bg-secondary text-on-secondary'
                          }`}
                        >
                          {item.type}
                        </span>

                        {/* Title */}
                        <span className="text-sm text-on-surface truncate flex-1">{item.title}</span>

                        {/* Score */}
                        {item.score !== null && (
                          <span className="text-xs font-label font-semibold text-primary shrink-0">
                            {item.score}%
                          </span>
                        )}

                        {/* Mode pills — only for non-locked challenges */}
                        {item.type === 'challenge' && !isLocked && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Link
                              href="/challenges/c1000000-0000-0000-0000-000000000001"
                              className="text-[10px] font-label font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              Solo
                            </Link>
                            <Link
                              href="/challenges/c1000000-0000-0000-0000-000000000001?mode=live"
                              className="text-[10px] font-label font-semibold px-2 py-0.5 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                              Live
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>

        {/* Right: Sidebar cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Prep Status */}
          <div className="bg-surface-container rounded-xl p-4">
            <h3 className="font-label font-semibold text-sm text-on-surface mb-3">Prep Status</h3>

            {/* Readiness ring (simplified) */}
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#e4e0d8" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#4a7c59"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - 0.32)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-label font-bold text-sm text-primary">
                  32%
                </span>
              </div>
              <div>
                <p className="font-label font-semibold text-on-surface text-sm">Readiness</p>
                <p className="text-xs text-on-surface-variant leading-tight mt-0.5">
                  Ahead of 72% of candidates
                </p>
              </div>
            </div>

            {/* Days countdown */}
            <div className="flex items-center gap-2 bg-surface-container-high rounded-lg px-3 py-2">
              <span
                className="material-symbols-outlined text-base text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                calendar_month
              </span>
              <span className="text-xs text-on-surface">
                <strong className="font-label font-bold text-tertiary">14 days</strong> until your interview
              </span>
            </div>
          </div>

          {/* Luma's Prep Advice */}
          <div className="bg-primary-fixed rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <LumaGlyph size={40} />
              <span className="font-label font-semibold text-sm text-on-surface">
                Luma&apos;s Prep Advice
              </span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              You have 14 days — focus on Product Sense first. Use{' '}
              <strong className="font-semibold text-on-surface">Solo mode</strong> to practice quickly, then switch
              to <strong className="font-semibold text-on-surface">Live mode</strong> in week two to simulate real
              interview pressure. Aim for 3 challenges per day.
            </p>
          </div>

          {/* Community */}
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="material-symbols-outlined text-base text-primary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                group
              </span>
              <h3 className="font-label font-semibold text-sm text-on-surface">Community</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              12 others are currently prepping for {selectedCompany.name}.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 text-xs font-label font-semibold text-primary hover:underline"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                forum
              </span>
              Join the discussion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
