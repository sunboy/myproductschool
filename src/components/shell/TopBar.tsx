'use client'
import Link from 'next/link'
import { LumaGlyph } from './LumaGlyph'

interface TopBarProps {
  title?: string
  showBack?: boolean
  streakDays?: number
  xpTotal?: number
}

export function TopBar({ title, showBack, streakDays = 0, xpTotal = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant">
      <div className="flex items-center gap-3 px-4 h-14">
        {showBack ? (
          <Link href=".." className="md:hidden p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        ) : (
          <div className="md:hidden">
            <LumaGlyph size={24} className="text-primary" />
          </div>
        )}

        <h1 className="flex-1 font-headline text-lg font-semibold text-on-surface truncate">
          {title ?? 'MyProductSchool'}
        </h1>

        {/* Streak badge */}
        {streakDays > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-tertiary-container rounded-full">
            <span className="material-symbols-filled text-sm text-tertiary">local_fire_department</span>
            <span className="text-xs font-bold text-on-tertiary-container">{streakDays}</span>
          </div>
        )}

        {/* XP badge */}
        {xpTotal > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary-container rounded-full">
            <span className="text-xs font-bold text-on-secondary-container">{xpTotal} XP</span>
          </div>
        )}

        {/* Avatar */}
        <Link href="/profile" className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-on-primary-container">person</span>
        </Link>
      </div>
    </header>
  )
}
