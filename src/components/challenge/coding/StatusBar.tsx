'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CodingStatusBarProps {
  /** Autosave state: 'saving' while a write is in flight, 'saved' after. */
  saveState: 'idle' | 'saving' | 'saved'
  /** When the last successful autosave landed. Renders "just now" / "2m ago". */
  savedAt?: Date | null
  /** Display name of the active language (e.g. "Python", "SQL"). */
  language?: string
  /** Last run summary; absent before the first run. */
  lastRun?: { testsPassed: number; testsTotal: number } | null
  /** Exit flow: renders an "End session" cell when provided. Edits are already
   *  autosaved, so leaving is safe; the handler routes back out of the workspace. */
  onEndSession?: () => void
  className?: string
}

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')

function relativeTime(from: Date, now: number): string {
  const seconds = Math.floor((now - from.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="rounded border border-hairline bg-page-field px-1 py-px font-label text-[10.5px] font-bold text-ink-secondary"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}

/**
 * Bottom status bar for the coding workspace (round-4 ref): autosave state,
 * the real run/submit shortcuts, last run summary, active language. Every
 * cell is backed by real workspace state; cells without data do not render.
 */
export function CodingStatusBar({
  saveState,
  savedAt,
  language,
  lastRun,
  onEndSession,
  className,
}: CodingStatusBarProps) {
  // Tick once a minute so "just now" ages honestly without re-render storms.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const mod = IS_MAC ? '⌘' : 'Ctrl'

  return (
    <div
      className={cn(
        'flex h-9 shrink-0 items-center gap-4 border-t border-hairline bg-card-bright px-3.5',
        className
      )}
      data-testid="coding-status-bar"
    >
      {/* Autosave */}
      <span className="flex items-center gap-1.5">
        {saveState === 'saving' ? (
          <>
            <span
              className="material-symbols-outlined animate-spin text-[14px] text-ink-muted"
              aria-hidden="true"
            >
              progress_activity
            </span>
            <span className="font-label text-[11.5px] font-semibold text-ink-secondary">Saving…</span>
          </>
        ) : saveState === 'saved' || savedAt ? (
          <>
            <span className="flex size-[15px] items-center justify-center rounded-full bg-forest-600 text-white">
              <Check size={9} strokeWidth={2.6} />
            </span>
            <span className="font-label text-[11.5px] font-semibold text-ink-secondary">
              Auto-saved{savedAt ? ` ${relativeTime(savedAt, now)}` : ''}
            </span>
          </>
        ) : (
          <span className="font-label text-[11.5px] font-semibold text-ink-muted">
            Edits save automatically
          </span>
        )}
      </span>

      {/* Shortcuts */}
      <span className="hidden items-center gap-3 md:flex">
        <span className="flex items-center gap-1.5 font-label text-[11.5px] font-semibold text-ink-muted">
          Run <ShortcutKeys keys={[mod, "'"]} />
        </span>
        <span className="flex items-center gap-1.5 font-label text-[11.5px] font-semibold text-ink-muted">
          Submit <ShortcutKeys keys={[mod, '⏎']} />
        </span>
      </span>

      <span className="ml-auto flex items-center gap-4">
        {/* Last run */}
        {lastRun && (
          <span
            className={cn(
              'font-label text-[11.5px] font-bold tabular-nums',
              lastRun.testsTotal > 0 && lastRun.testsPassed === lastRun.testsTotal
                ? 'text-forest-600'
                : 'text-error'
            )}
          >
            {lastRun.testsPassed}/{lastRun.testsTotal} tests passing
          </span>
        )}

        {/* Language */}
        {language && (
          <span className="flex items-center gap-1.5 font-label text-[11.5px] font-semibold text-ink-secondary">
            <span className="size-1.5 rounded-full bg-forest-600" aria-hidden="true" />
            {language}
          </span>
        )}

        {/* End session — edits are autosaved, so leaving is safe. */}
        {onEndSession && (
          <button
            type="button"
            onClick={onEndSession}
            className="rounded-lg border border-hairline px-2.5 py-1 font-label text-[11.5px] font-bold text-ink-secondary transition-colors hover:bg-page-field hover:text-ink-strong"
            data-testid="coding-end-session"
          >
            End session
          </button>
        )}
      </span>
    </div>
  )
}
