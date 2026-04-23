import Link from 'next/link'
import { getAllConcepts } from '@/lib/data/concepts'
import { getDomains } from '@/lib/data/domains'

// Map domain titles to display categories and dot colors
const CATEGORY_COLORS: Record<string, string> = {
  'Product Strategy': 'bg-blue-400',
  'User Research': 'bg-amber-400',
  'Metrics & Analytics': 'bg-emerald-400',
  'Prioritization': 'bg-purple-400',
  'Go-to-Market': 'bg-primary-container',
}

const CATEGORY_LABELS: Record<string, string> = {
  'Product Strategy': 'Acquisition',
  'User Research': 'Retention',
  'Metrics & Analytics': 'Monetization',
  'Prioritization': 'Engagement',
  'Go-to-Market': 'Growth',
}

const CATEGORY_BAR_COLORS: Record<string, string> = {
  Acquisition: 'bg-blue-400',
  Retention: 'bg-amber-400',
  Monetization: 'bg-emerald-400',
  Engagement: 'bg-purple-400',
  Growth: 'bg-primary-container',
}

export default async function Product75Page() {
  const [domains, concepts] = await Promise.all([
    getDomains(),
    getAllConcepts(),
  ])

  // Build a domain lookup
  const domainMap = new Map(domains.map(d => [d.id, d]))

  // Take the first 75 concepts (or all if fewer)
  const product75 = concepts.slice(0, 75)

  // Simulate mastery: mark roughly every other concept as mastered for display
  const masteredCount = Math.floor(product75.length * 0.43)
  const masteredSet = new Set(product75.slice(0, masteredCount).map(c => c.id))

  // Learning-in-progress: a few concepts are "in progress"
  const inProgressSet = new Set(
    product75
      .filter(c => !masteredSet.has(c.id))
      .slice(0, Math.floor(product75.length * 0.15))
      .map(c => c.id)
  )

  // Category breakdown stats
  const categoryStats: Record<string, { total: number; mastered: number }> = {}
  for (const concept of product75) {
    const domain = domainMap.get(concept.domain_id)
    const cat = domain ? (CATEGORY_LABELS[domain.title] ?? domain.title) : 'Other'
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, mastered: 0 }
    categoryStats[cat].total++
    if (masteredSet.has(concept.id)) categoryStats[cat].mastered++
  }

  const progressPct = Math.round((masteredCount / 75) * 100)

  return (
    <div className="flex max-w-[1440px] mx-auto px-8 py-10 gap-10">
      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header Section */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="font-headline text-[36px] font-[800] leading-none text-on-surface">
                Product{' '}
                <span className="bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">
                  75
                </span>
              </h1>
              <p className="font-body text-on-surface-variant mt-1 text-sm tracking-wide">
                The essential product vocabulary
              </p>
            </div>
            <div className="text-right">
              <span className="font-label text-xs uppercase tracking-widest font-bold text-primary mb-2 block">
                {masteredCount} of 75 mastered
              </span>
              <div className="w-64 h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filter Row */}
        <section className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative">
            <input
              className="bg-surface-container-lowest border-none rounded-full pl-10 pr-6 py-2.5 text-sm ghost-border focus:ring-2 focus:ring-primary/20 w-72 transition-all editorial-shadow"
              placeholder="Search concept..."
              type="text"
              readOnly
            />
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">
              search
            </span>
          </div>
          <div className="flex items-center bg-surface-container-low p-1 rounded-full ghost-border">
            <button className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all bg-primary-container text-on-primary">
              All
            </button>
            <button className="px-5 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Acquisition
            </button>
            <button className="px-5 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Retention
            </button>
            <button className="px-5 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Monetization
            </button>
            <button className="px-5 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Engagement
            </button>
          </div>
          <div className="h-6 w-px bg-outline-variant/30 mx-2" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
              Status
            </span>
            <button className="px-3 py-1 rounded-full text-xs font-bold border border-primary/20 text-primary bg-primary/5">
              All
            </button>
            <button className="px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant/70 hover:bg-surface-container transition-colors">
              Mastered
            </button>
            <button className="px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant/70 hover:bg-surface-container transition-colors">
              Learning
            </button>
          </div>
        </section>

        {/* Concept List */}
        <section className="space-y-1">
          {product75.map((concept, idx) => {
            const domain = domainMap.get(concept.domain_id)
            const categoryLabel = domain
              ? (CATEGORY_LABELS[domain.title] ?? domain.title)
              : 'Other'
            const dotColor = domain
              ? (CATEGORY_COLORS[domain.title] ?? 'bg-outline-variant')
              : 'bg-outline-variant'
            const isMastered = masteredSet.has(concept.id)
            const isInProgress = inProgressSet.has(concept.id)

            // First row gets hover-state styling as in Stitch
            const isHoverPreview = idx === 0

            return (
              <Link
                key={concept.id}
                href={`/vocabulary/${concept.id}`}
                className={`group bg-surface-container-lowest h-16 rounded-md flex items-center px-6 gap-6 ghost-border transition-all cursor-pointer ${
                  isHoverPreview
                    ? '-translate-y-[2px] border-l-4 border-l-primary ring-1 ring-primary/10 editorial-shadow'
                    : 'hover:bg-surface-container-low hover:-translate-y-[1px]'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isMastered ? (
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      check_circle
                    </span>
                  ) : isInProgress ? (
                    <span
                      className="material-symbols-outlined text-amber-500"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      incomplete_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-outline-variant">
                      circle
                    </span>
                  )}
                </div>

                {/* Category dot */}
                <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />

                {/* Title + description */}
                <div className="flex-1 flex items-baseline gap-4 min-w-0">
                  <h3 className="font-headline font-semibold text-[16px] text-on-surface min-w-[140px] flex-shrink-0">
                    {concept.title}
                  </h3>
                  <p className="font-body text-on-surface-variant text-[14px] truncate">
                    {concept.definition}
                  </p>
                </div>

                {/* Category chip + chevron */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    {categoryLabel}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              </Link>
            )
          })}
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="w-[280px] flex-shrink-0 space-y-6 hidden lg:block">
        <div className="sticky top-24">
          {/* Category Breakdown */}
          <div className="bg-surface-container-lowest rounded-lg p-6 ghost-border editorial-shadow">
            <h4 className="font-headline font-bold text-lg text-on-surface mb-6">
              Category Breakdown
            </h4>
            <div className="space-y-5">
              {Object.entries(categoryStats).map(([cat, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0
                const barColor = CATEGORY_BAR_COLORS[cat] ?? 'bg-outline-variant'
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tighter text-on-surface-variant">
                      <span>{cat}</span>
                      <span className="text-primary">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Luma's Tip */}
          <div className="mt-6 bg-secondary-container rounded-lg p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[120px]">diamond</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-on-secondary-container/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-on-secondary-container text-lg"
                  style={{ fontVariationSettings: "'opsz' 20" }}
                >
                  auto_awesome
                </span>
              </div>
              <h4 className="font-headline font-bold text-on-secondary-container">
                Luma&apos;s Tip
              </h4>
            </div>
            <p className="font-body text-sm leading-relaxed text-on-secondary-container/80">
              Focus on{' '}
              <span className="font-bold text-on-secondary-container">Engagement</span>{' '}
              next &mdash; it will help with your challenge scores.
            </p>
            <button className="mt-4 w-full bg-on-secondary-container text-secondary-container font-bold py-2 rounded-md text-xs uppercase tracking-widest hover:bg-on-secondary-container/90 transition-colors">
              View Engagement
            </button>
          </div>

          {/* Decorative image / quote */}
          <div className="mt-6 h-48 rounded-lg overflow-hidden ghost-border editorial-shadow relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="scholarly desk"
              className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEUhMnv8NXhmN6hFSiFUyZF8NJ4LWGdhqJQSpwzrgyskA3QVyML2dXNVSTp0QOMQCu_qERg11BEEYbEIq6T7AYmR4PD7ldCJBueYBjFee3XzNPSOQ5o6Y5YA-rgXqVDzke-S4FS1lIO6AW1OZ7YTupkqhk08c5yXNo5XMXgEQm1-6TA2uh_HGrBPnYQXsB3eMaHrfY843Pq9TZL1mflqjp21CfwQa16C0ENUPlKdH8_wtv1PWDfZic-44WH1Tj2PC2DCXuOHYGH5_y"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="font-headline italic text-on-surface-variant text-sm">
                &ldquo;Knowledge is the only asset that grows when shared.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
