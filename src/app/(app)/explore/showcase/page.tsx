import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { getShowcaseProducts } from '@/lib/data/showcase'
import { ShowcaseProductCard } from '@/components/showcase/ShowcaseProductCard'

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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-6">
        <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
        <span
          className="material-symbols-outlined text-sm"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
        >
          chevron_right
        </span>
        <span className="text-on-surface font-medium">Product Autopsies</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Product Autopsies</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Trace the real decisions behind products you use every day.
        </p>
      </div>

      {/* Luma banner */}
      <div className="flex items-start gap-4 bg-primary-container/40 border border-primary/20 rounded-2xl p-4 mb-6">
        <LumaGlyph state="speaking" size={40} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-label font-bold text-primary uppercase tracking-widest mb-1">Luma&apos;s Take</p>
          <p className="text-sm text-on-surface">
            Every shipped product hides a decision tree. I&apos;ve traced the non-obvious ones — the calls that look obvious in hindsight but weren&apos;t at the time.
          </p>
        </div>
      </div>

      {/* Industry filter pills (Phase 1: visual only) */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
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

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">
          No products available yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map(product => (
            <ShowcaseProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
