import Link from 'next/link'
import type { AutopsyProduct } from '@/lib/types'

interface ShowcaseProductCardProps {
  product: AutopsyProduct
  completedCount?: number
}

export function ShowcaseProductCard({ product, completedCount }: ShowcaseProductCardProps) {
  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      className="group bg-surface-container rounded-2xl p-5 border-l-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 block"
      style={{ borderLeftColor: product.cover_color ?? '#4a7c59' }}
    >
      {/* Logo row */}
      <div className="mb-4 flex items-center gap-3">
        {product.logo_url ? (
          <img
            src={product.logo_url}
            alt={product.name}
            className="w-11 h-11 rounded-xl bg-white shadow-sm object-contain p-1 shrink-0"
          />
        ) : (
          <span className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-2xl shrink-0">
            {product.logo_emoji ?? '📦'}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-headline text-base font-bold text-on-surface leading-tight">{product.name}</h3>
          {product.industry && (
            <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-label inline-block mt-0.5">
              {product.industry}
            </span>
          )}
        </div>
      </div>

      {/* Tagline */}
      <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">{product.tagline}</p>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          {completedCount !== undefined && completedCount > 0 ? (
            <span className="text-[10px] font-bold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">
              ● {completedCount}/{product.decision_count} done
            </span>
          ) : (
            <span className="text-[10px] text-on-surface-variant font-label">
              {product.decision_count} challenges
            </span>
          )}
        </div>
        <span
          className="material-symbols-outlined text-base text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >
          arrow_forward
        </span>
      </div>
    </Link>
  )
}
