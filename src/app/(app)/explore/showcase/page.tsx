import { getShowcaseProducts } from '@/lib/data/showcase'
import { ShowcaseGridClient } from '@/components/showcase/ShowcaseGridClient'

export default async function ShowcasePage() {
  const products = await getShowcaseProducts()

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">

        {/* Editorial header */}
        <div className="mb-12 space-y-2">
          <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Curated Discovery</span>
          <h2 className="text-5xl font-headline text-on-background">Product Autopsies</h2>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            No products available yet.
          </div>
        ) : (
          <ShowcaseGridClient products={products} />
        )}

        {/* Editorial footer */}
        <footer className="py-16 border-t border-outline-variant/20 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <div className="max-w-md">
              <h4 className="font-headline italic text-3xl text-on-background mb-4">
                Trace the decisions behind products you use every day.
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Every shipped product hides a decision tree. We&apos;ve traced the non-obvious ones — the calls that look obvious in hindsight but weren&apos;t at the time.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant/40 uppercase">
                {products.length} Products Curated
              </span>
              <div className="h-px w-24 bg-primary/20" />
            </div>
          </div>
        </footer>

    </div>
  )
}
