import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { HatchImage } from '@/components/redesign/HatchImage'

export type NoteTint = 'mint' | 'amber' | 'teal' | 'blush'

const TINT_CLASS: Record<NoteTint, string> = {
  mint: 'note-mint',
  amber: 'note-amber',
  teal: 'note-teal',
  blush: 'note-blush',
}

export interface HatchSaysProps {
  /** One or two sentence message. Must name a specific observation, never generic filler (spec §4). */
  message: ReactNode
  /** Sticky-note tint. Default mint = coach/positive per spec §7. */
  tint?: NoteTint
  ctaLabel?: string
  onCtaClick?: () => void
  /** Applies the -0.6 to -1deg pinned-note rotation. At most one tinted surface per page should rotate (spec §7). */
  rotate?: boolean
  className?: string
}

/**
 * The HatchSays sticky-note bubble: small Hatch avatar + label + message +
 * optional CTA. Per spec "Signature components" #1 and previews/round4/
 * dashboard.html .hatch-says block.
 */
export function HatchSays({ message, tint = 'mint', ctaLabel, onCtaClick, rotate, className }: HatchSaysProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl px-[15px] py-[13px]',
        TINT_CLASS[tint],
        rotate && 'note-tilt',
        className
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-forest-800">
        <HatchImage state="avatar" size={16} className="rounded-full" />
        Hatch says
      </div>
      <div className="mb-2.5 text-xs leading-[1.45] text-ink-strong">{message}</div>
      {ctaLabel && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-[11px] py-1.5 text-[11.5px] font-bold text-white"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
