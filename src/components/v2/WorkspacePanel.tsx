'use client'

import type { ReactNode } from 'react'

/**
 * The shared workspace panel primitive (visual-clarity overhaul).
 *
 * Every pane in a challenge workspace — problem statement, editor, console,
 * canvas, chat — renders inside one of these so the workspace reads as a set
 * of titled cards floating on a `bg-surface-container-low` canvas instead of
 * edge-to-edge columns joined by hairline borders.
 *
 * Retrofit rule: this WRAPS existing pane JSX. Pane internals are never
 * rewritten to use it; only the container level changes.
 */

interface WorkspacePanelProps {
  /** Material Symbols icon name for the header. */
  icon?: string
  /** Uppercase header label. Omit both icon and title for a headerless card. */
  title?: string
  /** Right-aligned header actions (buttons, chips). */
  actions?: ReactNode
  /** Extra header content between the title and the actions (e.g. tabs). */
  headerExtra?: ReactNode
  /** Applied to the outer card. */
  className?: string
  /** Applied to the body wrapper (defaults to flex-1 min-h-0 overflow-hidden). */
  bodyClassName?: string
  children: ReactNode
}

export function WorkspacePanel({
  icon,
  title,
  actions,
  headerExtra,
  className = '',
  bodyClassName = '',
  children,
}: WorkspacePanelProps) {
  const hasHeader = Boolean(icon || title || actions || headerExtra)
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden flex flex-col min-h-0 ${className}`}
    >
      {hasHeader && (
        <div className="h-9 shrink-0 px-3 flex items-center gap-2 border-b border-outline-variant bg-surface-container-low">
          {icon && (
            <span
              className="material-symbols-outlined text-[15px] text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
            >
              {icon}
            </span>
          )}
          {title && (
            <span className="font-label text-[11px] font-bold uppercase tracking-[0.07em] text-on-surface-variant whitespace-nowrap">
              {title}
            </span>
          )}
          {headerExtra && <div className="flex items-center gap-1 min-w-0 overflow-x-auto">{headerExtra}</div>}
          {actions && <div className="ml-auto flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 overflow-hidden flex flex-col ${bodyClassName}`}>{children}</div>
    </div>
  )
}
