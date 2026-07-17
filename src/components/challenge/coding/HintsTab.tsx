'use client'

import { cn } from '@/lib/utils'
import { stripEmDashes } from './GuidanceTab'

export interface HintsTabProps {
  /** Hints already delivered this session, oldest first. */
  hints: string[]
  hintPending: boolean
  onRequestHint: () => void
  className?: string
}

/** Hints tab of the coding Hatch dock (formerly the Hints section of CodingRail). */
export function HintsTab({ hints, hintPending, onRequestHint, className }: HintsTabProps) {
  return (
    <div className={cn('flex flex-col gap-3 overflow-y-auto p-3', className)} data-testid="coding-hints-tab">
      <div className="rounded-xl border border-hairline bg-card-bright p-4">
        <p className="mb-2 text-[13px] font-bold text-ink-strong">Hints</p>
        {hints.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                <span className="text-xs leading-[1.45] text-ink-strong">{stripEmDashes(hint)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-xs leading-normal text-ink-secondary">
            Hatch reads your code and recent runs before it answers, so a hint lands on where you actually are.
          </p>
        )}
        <button
          type="button"
          onClick={onRequestHint}
          disabled={hintPending}
          className={cn(
            'w-full rounded-lg border border-hairline px-3 py-2 font-label text-[12.5px] font-bold transition-colors',
            hintPending
              ? 'cursor-wait text-ink-muted'
              : 'text-forest-800 hover:bg-page-field'
          )}
          data-testid="coding-hint-button"
        >
          {hintPending ? 'Hatch is reading your code…' : 'Show me a hint'}
        </button>
      </div>
    </div>
  )
}
