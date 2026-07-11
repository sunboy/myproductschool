import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { NoteTint } from '@/components/redesign/HatchSays'

const TINT_CLASS: Record<NoteTint, string> = {
  mint: 'note-mint',
  amber: 'note-amber',
  teal: 'note-teal',
  blush: 'note-blush',
}

export interface NoteCardProps {
  tint: NoteTint
  /** Applies the -0.6 to -1deg pinned-note rotation (spec §7). Use on at most one tinted surface per page. */
  rotate?: boolean
  children: ReactNode
  className?: string
  as?: ElementType
}

/**
 * Generic flat sticky-note surface: tint fill + 1px ink-toned border, no
 * shadow. Backs HatchSays/coach notes, callouts, tips, "why" cards, evidence
 * quotes, the current-day/current-step card, and rail panels per spec §7.
 * Rules: max 2-3 tinted surfaces per page; different tints only when they
 * encode different content classes (mint=coach, amber=tip, teal=info,
 * blush=review).
 */
export function NoteCard({ tint, rotate, children, className, as: Component = 'div' }: NoteCardProps) {
  return (
    <Component className={cn(TINT_CLASS[tint], rotate && 'note-tilt', className)}>
      {children}
    </Component>
  )
}
