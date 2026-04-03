import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { getShowcaseProducts } from '@/lib/data/showcase'
import { ShowcaseGridClient } from '@/components/showcase/ShowcaseGridClient'

const INDUSTRY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Dev Tools', value: 'developer-tools' },
  { label: 'Fintech', value: 'fintech' },
  { label: 'Design', value: 'design-tools' },
]

export default async function ShowcasePage() {
  const products = await getShowcaseProducts()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Hero section */}
      <div className="bg-gradient-to-b from-primary-fixed/40 via-primary-fixed/10 to-transparent rounded-3xl px-8 py-10 mb-8 border border-primary/10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
          <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
          >
            chevron_right
          </span>
          <span className="text-on-surface font-medium">Product Autopsies</span>
        </nav>

        <h1 className="font-headline text-4xl font-bold text-on-surface">Product Autopsies</h1>
        <p className="text-base text-on-surface-variant mt-2">
          Trace the real decisions behind products you use every day.
        </p>

        {/* Search input */}
        <div className="relative mt-6 w-full max-w-md">
          <span
            className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
            readOnly
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          {INDUSTRY_FILTERS.map((filter, i) => (
            <button
              key={filter.value}
              className={
                i === 0
                  ? 'bg-primary text-on-primary rounded-full px-4 py-1.5 text-xs font-label font-semibold'
                  : 'bg-surface-container text-on-surface-variant rounded-full px-4 py-1.5 text-xs font-label hover:bg-surface-container-high transition-colors'
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat bar */}
      <div className="flex items-center gap-6 px-2 mb-6 text-sm">
        <span>
          <span className="font-bold text-on-surface">{products.length} products</span>
          <span className="text-on-surface-variant ml-1">curated</span>
        </span>
        <span className="text-outline-variant">·</span>
        <span>
          <span className="font-bold text-on-surface">3 challenges each</span>
          <span className="text-on-surface-variant ml-1">per product</span>
        </span>
        <span className="text-outline-variant">·</span>
        <span>
          <span className="font-bold text-on-surface">Real decisions</span>
          <span className="text-on-surface-variant ml-1">no fluff</span>
        </span>
      </div>

      {/* Grid section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          {products.length} PRODUCTS
        </span>
        <div className="flex-1 h-px bg-outline-variant/30" />
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">
          No products available yet.
        </div>
      ) : (
        <ShowcaseGridClient products={products} />
      )}

      {/* Luma banner */}
      <div className="flex items-start gap-4 bg-primary-container/40 border border-primary/20 rounded-2xl p-4 mt-8">
        <LumaGlyph state="speaking" size={40} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-label font-bold text-primary uppercase tracking-widest mb-1">Luma&apos;s Take</p>
          <p className="text-sm text-on-surface">
            Every shipped product hides a decision tree. I&apos;ve traced the non-obvious ones — the calls that look obvious in hindsight but weren&apos;t at the time.
          </p>
        </div>
      </div>

    </div>
  )
}
