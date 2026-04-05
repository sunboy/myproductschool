'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShowcaseChallengeCard } from './ShowcaseChallengeCard'
import { FlowWorkspace } from '@/components/v2/FlowWorkspace'
import { useShowcaseProgress } from '@/lib/showcase/useShowcaseProgress'
import type { AutopsyProductDetail } from '@/lib/types'
import { StoryCard } from '@/components/autopsy/StoryCard'

interface ShowcaseDetailClientProps {
  product: AutopsyProductDetail
}

export function ShowcaseDetailClient({ product }: ShowcaseDetailClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const { getAttempt } = useShowcaseProgress(product.slug, product.decisions.length)

  return (
    <div className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] flex overflow-hidden pb-16 md:pb-0">

      {/* LEFT PANE */}
      <aside className="w-[380px] shrink-0 flex flex-col border-r border-outline-variant/40">

        {/* Sticky header */}
        <div className="flex-shrink-0 p-4 border-b border-outline-variant/30">
          <Link
            href="/explore/showcase"
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              arrow_back
            </span>
            Product Autopsies
          </Link>

          {/* Product identity row */}
          <div className="mt-3 flex items-center gap-3">
            {product.logo_url ? (
              <img
                src={product.logo_url}
                alt={product.name}
                className="w-10 h-10 rounded-xl bg-white shadow-sm object-contain p-1 shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-xl shrink-0">
                {product.logo_emoji ?? '📦'}
              </span>
            )}
            <div>
              <h1 className="font-headline text-lg font-bold text-on-surface">{product.name}</h1>
              {product.tagline && (
                <p className="text-xs text-on-surface-variant">{product.tagline}</p>
              )}
            </div>
          </div>

          {/* Challenge count label */}
          <p className="mt-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            {product.decisions.length} challenges — pick one to start
          </p>
        </div>

        {/* Hack Stories section */}
        {product.stories && product.stories.length > 0 && (
          <div className="flex-shrink-0 px-3 pt-3 space-y-2 border-b border-outline-variant/20 pb-3">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label px-1">
              Hack Stories ({product.stories.length})
            </p>
            {product.stories.map(story => (
              <StoryCard key={story.id} story={story} productSlug={product.slug} coverColor={product.cover_color} />
            ))}
          </div>
        )}

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {product.decisions.map((decision, i) => (
            <ShowcaseChallengeCard
              key={decision.id}
              decision={decision}
              challenge={decision.challenge}
              index={i}
              isActive={selectedIndex === i}
              isExpanded={expandedIndex === i}
              attempt={getAttempt(i)}
              onSelect={() => {
                setSelectedIndex(i)
                setExpandedIndex(null)
              }}
              onToggleExpand={() => setExpandedIndex(expandedIndex === i ? null : i)}
            />
          ))}
        </div>
      </aside>

      {/* RIGHT PANE */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {product.decisions[selectedIndex]?.challenge?.challenge_id ? (
          <FlowWorkspace
            key={selectedIndex}
            mode="api"
            challengeId={product.decisions[selectedIndex].challenge.challenge_id!}
            initialRoleId="swe"
            onExit={() => {
              if (selectedIndex < product.decisions.length - 1) {
                setSelectedIndex(prev => prev + 1)
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-on-surface-variant text-sm font-body">
            Challenge not available
          </div>
        )}
      </div>

    </div>
  )
}
