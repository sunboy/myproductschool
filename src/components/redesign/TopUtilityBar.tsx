'use client'

import type { FormEvent, ReactNode, Ref } from 'react'
import { Search, Flame, Zap, Bell, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TopUtilityBarProps {
  /** Placeholder text for the search pill. */
  searchPlaceholder?: string
  onSearchClick?: () => void
  /**
   * Controlled live-search mode: pass all three to render a real `<input>`
   * inside the search pill (submits on Enter) instead of a click-to-navigate
   * button. When omitted, the pill renders as a button (`onSearchClick`).
   */
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchSubmit?: (e: FormEvent<HTMLFormElement>) => void
  searchInputRef?: Ref<HTMLInputElement>
  /**
   * Current streak in days. Per spec §3, the streak/XP cluster is hidden
   * entirely (not zeroed) until the user's first XP event — pass
   * `undefined`/`null` (or omit) to hide it, rather than 0.
   */
  streakDays?: number | null
  /** Longest streak ever, shown as "Best: N" under the streak number. */
  bestStreakDays?: number | null
  /** Total XP. Hidden together with streakDays when absent (first-time state). */
  totalXp?: number | null
  level?: number | null
  onNotificationsClick?: () => void
  hasUnreadNotifications?: boolean
  /** Rendered avatar initial, e.g. "S". */
  avatarInitial: string
  displayName: string
  /** Shows the quiet gold "Pro" chip next to the name (spec §3). */
  isPro?: boolean
  onAvatarClick?: () => void
  /**
   * Extra icon buttons rendered between the XP cluster and the notification
   * bell (e.g. sound mute, take-the-tour). Optional — omit for pages that
   * don't need them.
   */
  endSlot?: ReactNode
  /**
   * Replaces the default avatar trigger + name + chevron with a caller-owned
   * node (e.g. a trigger wrapped in its own dropdown menu). When omitted,
   * the default button fires `onAvatarClick`.
   */
  avatarSlot?: ReactNode
  avatarImageUrl?: string | null
  className?: string
}

/**
 * Top utility bar: search pill (⌘K), streak + XP clusters, bell, avatar menu.
 * Per docs/redesign/round4-codex-direction/spec.md "Shell anatomy" and
 * previews/round4/dashboard.html .topbar block.
 */
export function TopUtilityBar({
  searchPlaceholder = 'Search topics, problems, or interviews...',
  onSearchClick,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchInputRef,
  streakDays,
  bestStreakDays,
  totalXp,
  level,
  onNotificationsClick,
  hasUnreadNotifications,
  avatarInitial,
  displayName,
  isPro,
  onAvatarClick,
  endSlot,
  avatarSlot,
  avatarImageUrl,
  className,
}: TopUtilityBarProps) {
  const showStreak = typeof streakDays === 'number' && streakDays > 0
  const showXp = typeof totalXp === 'number' && totalXp > 0
  const isLiveSearch = onSearchChange !== undefined && onSearchSubmit !== undefined

  return (
    <div className={cn('flex items-center gap-6 border-b border-hairline bg-page-field px-8 py-4', className)}>
      {isLiveSearch ? (
        <form
          onSubmit={onSearchSubmit}
          className="flex max-w-[480px] flex-1 items-center gap-2.5 rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-left text-ink-muted"
        >
          <Search size={16} strokeWidth={1.8} className="shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="flex-1 truncate bg-transparent text-[13.5px] text-ink-strong outline-none placeholder:text-ink-muted"
          />
          <span className="rounded-lg border border-hairline bg-page-field px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">
            ⌘K
          </span>
        </form>
      ) : (
        <button
          type="button"
          onClick={onSearchClick}
          className="flex max-w-[480px] flex-1 items-center gap-2.5 rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-left text-ink-muted"
        >
          <Search size={16} strokeWidth={1.8} className="shrink-0" />
          <span className="flex-1 truncate text-[13.5px] text-ink-muted">{searchPlaceholder}</span>
          <span className="rounded-lg border border-hairline bg-page-field px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">
            ⌘K
          </span>
        </button>
      )}

      <div className="ml-auto flex items-center gap-[22px]">
        {showStreak && (
          <div className="flex items-center gap-1.5">
            <Flame size={16} strokeWidth={1.8} className="shrink-0 text-flame" />
            <span>
              <span className="block text-sm font-extrabold tabular-nums text-ink-strong">
                {streakDays}-day streak
              </span>
              {typeof bestStreakDays === 'number' && (
                <span className="block text-[10.5px] font-semibold tabular-nums text-ink-muted">
                  Best: {bestStreakDays}
                </span>
              )}
            </span>
          </div>
        )}

        {showXp && (
          <div className="flex items-center gap-1.5">
            <Zap size={16} strokeWidth={1.8} className="shrink-0 text-gold" />
            <span>
              <span className="block text-sm font-extrabold tabular-nums text-ink-strong">
                {totalXp!.toLocaleString()} XP
              </span>
              {typeof level === 'number' && (
                <span className="block text-[10.5px] font-semibold tabular-nums text-ink-muted">
                  Level {level}
                </span>
              )}
            </span>
          </div>
        )}

        {endSlot}

        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative flex size-[34px] items-center justify-center rounded-lg border border-hairline bg-white text-ink-secondary"
        >
          <Bell size={17} strokeWidth={1.8} />
          {hasUnreadNotifications && (
            <span className="absolute right-[6px] top-[6px] size-[7px] rounded-full bg-flame" />
          )}
        </button>

        {avatarSlot ?? (
          <button type="button" onClick={onAvatarClick} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary to-secondary-deep text-xs font-extrabold text-white">
              {avatarImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarImageUrl} alt="" className="size-full object-cover" />
              ) : (
                avatarInitial
              )}
            </span>
            <span className="text-[13.5px] font-bold text-ink-strong">{displayName}</span>
            {isPro && (
              <span className="rounded-full border border-gold bg-amber-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.03em] text-forest-950">
                Pro
              </span>
            )}
            <ChevronDown size={14} strokeWidth={2} className="text-ink-secondary" />
          </button>
        )}
      </div>
    </div>
  )
}
