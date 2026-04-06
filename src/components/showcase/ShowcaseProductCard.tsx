import Link from 'next/link'
import type { AutopsyProduct } from '@/lib/types'

interface ShowcaseProductCardProps {
  product: AutopsyProduct
  completedCount?: number
}

export function ShowcaseProductCard({ product, completedCount = 0 }: ShowcaseProductCardProps) {
  const hasStories = (product.story_count ?? 0) > 0

  return (
    <div className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 scale-100 hover:scale-[1.02]">

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
      <div className="absolute inset-x-4 bottom-4 p-5 rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-1">
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
          {hasStories && (
            <>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-tighter">
                {product.story_count} {product.story_count === 1 ? 'story' : 'stories'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover overlay — dark scrim + two action buttons */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
        <Link
          href={`/explore/showcase/${product.slug}`}
          className="w-[80%] text-center bg-primary text-on-primary rounded-full px-4 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          Practice Challenges
        </Link>
        {hasStories && (
          <Link
            href={`/explore/showcase/${product.slug}/stories`}
            className="w-[80%] text-center bg-white/90 text-on-background rounded-full px-4 py-2.5 font-label font-semibold text-sm hover:bg-white transition-colors"
            onClick={e => e.stopPropagation()}
          >
            Hack Stories
          </Link>
        )}
      </div>

    </div>
  )
}
