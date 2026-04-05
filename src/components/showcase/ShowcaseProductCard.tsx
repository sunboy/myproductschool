import Link from 'next/link'
import type { AutopsyProduct } from '@/lib/types'

interface ShowcaseProductCardProps {
  product: AutopsyProduct
  completedCount?: number
}

export function ShowcaseProductCard({ product, completedCount = 0 }: ShowcaseProductCardProps) {
  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 scale-100 hover:scale-[1.02] block"
    >
      {/* Cover: logo image OR solid color fill */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
      >
        {product.logo_url ? (
          <img
            src={product.logo_url}
            alt={product.name}
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
        ) : (
          <span className="text-6xl">{product.logo_emoji ?? '📦'}</span>
        )}
      </div>

      {/* Industry badge — top left glassmorphism pill */}
      {product.industry && (
        <div className="absolute top-4 left-4">
          <span className="bg-white/70 backdrop-blur-xl border border-white/30 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider text-on-background uppercase">
            {product.industry}
          </span>
        </div>
      )}

      {/* Bottom info panel — glassmorphism */}
      <div className="absolute inset-x-4 bottom-4 p-5 rounded-xl bg-white/70 backdrop-blur-xl border border-white/30">
        <h3 className="text-xl font-headline text-on-background mb-1 leading-tight">{product.name}</h3>
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{product.tagline}</p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-tighter">
            {completedCount > 0
              ? `${completedCount}/${product.decision_count} done`
              : `${product.decision_count} challenges`}
          </span>
          <div className="h-1 w-1 rounded-full bg-primary/30" />
          {completedCount > 0 ? (
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">In Progress</span>
          ) : (
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
              {product.industry ?? 'Autopsy'}
            </span>
          )}
          {(product.story_count ?? 0) > 0 && (
            <>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-tighter">
                {product.story_count} {product.story_count === 1 ? 'story' : 'stories'}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
