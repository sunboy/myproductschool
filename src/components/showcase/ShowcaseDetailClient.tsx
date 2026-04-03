'use client'
import { useState } from 'react'
import Link from 'next/link'
import { DecisionCard } from './DecisionCard'
import { ChallengeViewer } from './ChallengeViewer'
import type { AutopsyProductDetail } from '@/lib/types'

interface ShowcaseDetailClientProps {
  product: AutopsyProductDetail
}

export function ShowcaseDetailClient({ product }: ShowcaseDetailClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = product.decisions[selectedIndex]

  if (!selected) return null

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* LEFT PANE */}
      <aside className="w-[360px] shrink-0 border-r border-outline-variant/60 flex flex-col overflow-hidden">
        {/* Product header */}
        <div className="p-4 border-b border-outline-variant/30 shrink-0">
          <Link
            href="/explore/showcase"
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors mb-3"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              arrow_back
            </span>
            Product Autopsies
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{product.logo_emoji}</span>
            <div>
              <h1 className="font-headline text-lg font-bold text-on-surface">{product.name}</h1>
              <p className="text-xs text-on-surface-variant">{product.tagline}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            {product.decisions.length} product decisions
          </p>
        </div>

        {/* Decision list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {product.decisions.map((decision, i) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              isSelected={selectedIndex === i}
              onClick={() => setSelectedIndex(i)}
            />
          ))}
        </div>
      </aside>

      {/* RIGHT PANE */}
      <main className="flex-1 overflow-y-auto bg-background">
        <ChallengeViewer
          decision={selected}
          challenge={selected.challenge}
          productName={product.name}
        />
      </main>
    </div>
  )
}
