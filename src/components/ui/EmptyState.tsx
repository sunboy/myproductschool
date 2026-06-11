import Link from 'next/link'
import { HatchGlyph, type HatchState } from '@/components/shell/HatchGlyph'

/**
 * Shared empty-state treatment for hub pages and list views.
 * Pattern extracted from the Progress page (HatchGlyph + title + hint + optional CTA)
 * so every "nothing here yet" moment looks and reads the same.
 */
export function EmptyState({
  title,
  hint,
  ctaLabel,
  ctaHref,
  hatchState = 'idle',
  compact = false,
}: {
  title: string
  hint?: string
  ctaLabel?: string
  ctaHref?: string
  hatchState?: HatchState
  compact?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-8' : 'py-16'}`}
    >
      <HatchGlyph size={compact ? 34 : 44} state={hatchState} className="text-primary" />
      <div>
        <p className="font-headline text-base font-bold text-on-surface">{title}</p>
        {hint && (
          <p className="mt-1 font-label text-sm text-on-surface-variant">{hint}</p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label text-sm font-bold text-on-primary no-underline transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
