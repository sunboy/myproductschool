'use client'

// DimensionCard — the ONE dimension accordion for every feedback surface.
// Replaces FeedbackAccordion (FLOW), DimensionAccordion (coding), and
// DimensionTile (canvas). One data contract, one Terra treatment: score dot
// + label + verdict when closed; evidence, the hole to poke, and the next
// move when open. The lowest-scoring dimension can carry a focus flag and
// starts expanded.

import { useState } from 'react'
import { FeedbackText } from '@/components/ui/FeedbackText'
import { normalizeToTen, gradeBand, bandClasses, type ScoreScale } from '@/lib/feedback/score'

export interface DimensionCardProps {
  label: string
  raw: number
  scale: ScoreScale
  verdict?: string | null
  evidence?: string | null
  holeToPoke?: string | null
  howToImprove?: string | null
  /** Marks the weakest dimension: amber flag + expanded by default. */
  focus?: boolean
  defaultOpen?: boolean
}

export function DimensionCard({
  label, raw, scale, verdict, evidence, holeToPoke, howToImprove, focus = false, defaultOpen,
}: DimensionCardProps) {
  const [open, setOpen] = useState(defaultOpen ?? focus)
  const score = normalizeToTen(raw, scale)
  const band = gradeBand(score)
  const colors = bandClasses(band)
  const hasBody = !!(evidence || holeToPoke || howToImprove)

  return (
    <div className={`rounded-xl border ${focus ? 'border-tertiary/50 bg-tertiary-container/10' : 'border-outline-variant bg-surface-container-lowest'} overflow-hidden`}>
      <button
        onClick={() => hasBody && setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        disabled={!hasBody}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${colors.ring.replace('text-', 'bg-')}`} />
        <span className="font-label text-sm font-bold text-on-surface min-w-0 truncate">{label}</span>
        {focus && (
          <span className="font-label text-[10px] font-bold uppercase tracking-wide text-tertiary bg-tertiary-container/40 rounded-full px-2 py-0.5 shrink-0">
            Focus area
          </span>
        )}
        <span className={`ml-auto font-headline text-sm font-bold shrink-0 ${colors.text}`}>
          {score.toFixed(1)}
          <span className="font-label text-[10px] text-on-surface-variant font-medium">/10</span>
        </span>
        {hasBody && (
          <span className="material-symbols-outlined text-on-surface-variant shrink-0" style={{ fontSize: 18 }}>
            {open ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </button>
      {!open && verdict && (
        <p className="px-4 pb-3 -mt-1 font-body text-xs text-on-surface-variant leading-relaxed line-clamp-2">
          {verdict}
        </p>
      )}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {verdict && <FeedbackText className="font-body text-sm text-on-surface leading-relaxed">{verdict}</FeedbackText>}
          {evidence && (
            <div className="rounded-lg bg-surface-container px-3 py-2.5">
              <p className="font-label text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">From your work</p>
              <FeedbackText className="font-body text-xs text-on-surface leading-relaxed">{evidence}</FeedbackText>
            </div>
          )}
          {holeToPoke && (
            <div className="rounded-lg bg-tertiary-container/20 px-3 py-2.5">
              <p className="font-label text-[10px] font-bold uppercase tracking-wide text-tertiary mb-1">The hole to poke</p>
              <FeedbackText className="font-body text-xs text-on-surface leading-relaxed">{holeToPoke}</FeedbackText>
            </div>
          )}
          {howToImprove && (
            <div className="rounded-lg bg-primary-fixed/30 px-3 py-2.5">
              <p className="font-label text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Next move</p>
              <FeedbackText className="font-body text-xs text-on-surface leading-relaxed">{howToImprove}</FeedbackText>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
