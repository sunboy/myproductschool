'use client'
import Link from 'next/link'
import { LumaGlyph } from './LumaGlyph'

interface TopBarProps {
  title?: string
  showBack?: boolean
  streakDays?: number
  xpTotal?: number
}

export function TopBar({ title: _title, showBack, streakDays = 0, xpTotal = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant">
      <div className="flex items-center gap-3 px-4 h-12">
        {/* Left: back button or logo */}
        {showBack ? (
          <Link href=".." className="md:hidden p-1.5 rounded-lg hover:bg-surface-container transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        ) : (
          <div className="md:hidden flex-shrink-0">
            <LumaGlyph size={24} className="text-primary" />
          </div>
        )}

        {/* Center: search input */}
        <div className="flex-1 flex justify-center">
          <input
            type="text"
            placeholder="Search challenges, concepts..."
            className="w-full max-w-sm bg-surface-container rounded-full px-4 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant outline-none border border-outline-variant focus:border-primary transition-colors"
          />
        </div>

        {/* Right: streak, xp, avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Streak badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-tertiary-container rounded-full">
            <span className="material-symbols-filled text-sm text-tertiary">local_fire_department</span>
            <span className="text-xs font-bold text-on-tertiary-container">{streakDays}</span>
          </div>

          {/* XP badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary-container rounded-full">
            <span className="text-xs font-bold text-on-secondary-container">{xpTotal} XP</span>
          </div>

          {/* Avatar */}
          <Link href="/profile" className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-on-primary-container">person</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
