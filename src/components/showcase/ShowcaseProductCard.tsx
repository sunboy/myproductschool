import Link from 'next/link'
import type { AutopsyProduct } from '@/lib/types'

interface ShowcaseProductCardProps {
  product: AutopsyProduct
}

export function ShowcaseProductCard({ product }: ShowcaseProductCardProps) {
  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      className="group bg-surface-container rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all block"
    >
      {/* Colored header strip — Mobbin-style visual identity */}
      <div
        className="h-16 w-full"
        style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
      />

      {/* Emoji logo — overlaps bottom of the header strip */}
      <div className="px-4 -mt-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-background shadow-sm border border-outline-variant/40"
        >
          {product.logo_emoji ?? '📦'}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pb-4 pt-2">
        <h3 className="font-headline text-base font-bold text-on-surface">{product.name}</h3>
        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{product.tagline}</p>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3">
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-0.5 text-[10px] font-bold font-label">
            {product.decision_count} decisions
          </span>
          <span
            className="material-symbols-outlined text-base text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  )
}
