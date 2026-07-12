'use client'

import { cn } from '@/lib/utils'
import { HatchImage } from '@/components/redesign/HatchImage'

export interface CodingRailRunSummary {
  testsPassed: number
  testsTotal: number
}

export interface CodingRailSelfCheck {
  status: 'idle' | 'checking' | 'done'
  /** Hatch's verdict text once status === 'done'. */
  verdict?: string
}

export interface CodingRailProps {
  /** A live Hatch nudge overrides the deterministic phase copy. */
  nudge?: { text: string; onDismiss?: () => void } | null
  /** Last completed run, or null before the first run. */
  lastRun?: CodingRailRunSummary | null
  /** True while a run is in flight (guidance goes quiet on state that is about to change). */
  isRunning?: boolean

  /** Hints already delivered this session, oldest first. */
  hints: string[]
  hintPending: boolean
  onRequestHint: () => void

  /** Real pattern/topic tags from challenge metadata. Section absent when empty. */
  patterns?: string[]

  /** Check-your-approach verdict flow (interpret asserted_finding). Section absent when omitted. */
  selfCheck?: CodingRailSelfCheck
  onRunSelfCheck?: () => void

  /** Learner-declared confidence. Section absent when handler is omitted. */
  confidence?: 'low' | 'medium' | 'high' | null
  onConfidenceChange?: (value: 'low' | 'medium' | 'high') => void

  className?: string
}

/**
 * Deterministic phase copy for the Live guidance panel, from real run state
 * only. Mirrors DesignRail's single-guidance-voice pattern.
 */
function guidanceMessage(lastRun: CodingRailRunSummary | null | undefined, isRunning: boolean): string {
  if (isRunning) {
    return 'Tests are running. Watch which cases fail first, the pattern usually names the bug.'
  }
  if (!lastRun) {
    return 'Read the examples, then run your code against the visible tests. A first run tells you more than another read.'
  }
  if (lastRun.testsTotal > 0 && lastRun.testsPassed === lastRun.testsTotal) {
    return 'All visible tests pass. Check your complexity against the constraints, then submit to run the hidden set.'
  }
  const failing = lastRun.testsTotal - lastRun.testsPassed
  return failing === 1
    ? 'One visible test is failing. Open it and compare the expected output against yours before changing code.'
    : `${failing} visible tests are failing. Start with the simplest failing case and work up.`
}

const CONFIDENCE_OPTIONS: Array<{ value: 'low' | 'medium' | 'high'; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

/**
 * Right rail for the coding workspace (round-4 ref): Live guidance in the
 * page's one tinted note surface (mint = coach), hints with an explicit
 * "Show me a hint" request, real pattern tags, a check-your-approach verdict,
 * and a learner-declared confidence control. Panels follow the DesignRail
 * pattern: 16px padding, 12px gaps (spec §6).
 */
export function CodingRail({
  nudge,
  lastRun,
  isRunning = false,
  hints,
  hintPending,
  onRequestHint,
  patterns,
  selfCheck,
  onRunSelfCheck,
  confidence,
  onConfidenceChange,
  className,
}: CodingRailProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} data-testid="coding-rail">
      {/* Live guidance — the page's one tinted note surface (mint = coach). */}
      <div className="note-mint rounded-xl px-[15px] py-[13px]">
        <div className="mb-1.5 flex items-center justify-between gap-1.5 text-[11.5px] font-bold text-forest-800">
          <span className="flex items-center gap-1.5">
            <HatchImage state="listening" size={18} className="rounded-full" />
            {nudge ? "Hatch's read" : 'Live guidance'}
          </span>
          {nudge?.onDismiss && (
            <button
              type="button"
              onClick={nudge.onDismiss}
              aria-label="Dismiss nudge"
              className="text-ink-secondary hover:text-ink-strong"
            >
              <span className="text-[13px] leading-none">✕</span>
            </button>
          )}
        </div>
        <p className="text-xs leading-[1.45] text-ink-strong">
          {nudge?.text ?? guidanceMessage(lastRun, isRunning)}
        </p>
      </div>

      {/* Hints */}
      <div className="rounded-xl border border-hairline bg-card-bright p-4">
        <p className="mb-2 text-[13px] font-bold text-ink-strong">Hints</p>
        {hints.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                <span className="text-xs leading-[1.45] text-ink-strong">{hint}</span>
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

      {/* Patterns — real metadata tags only */}
      {patterns && patterns.length > 0 && (
        <div className="rounded-xl border border-hairline bg-card-bright p-4">
          <p className="mb-2 text-[13px] font-bold text-ink-strong">Patterns to consider</p>
          <div className="flex flex-wrap gap-1.5">
            {patterns.map((pattern) => (
              <span
                key={pattern}
                className="rounded-full border-[1.5px] border-forest-600/50 px-2.5 py-0.5 font-label text-[11.5px] font-bold text-forest-800"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Check your approach */}
      {selfCheck && onRunSelfCheck && (
        <div className="rounded-xl border border-hairline bg-card-bright p-4">
          <p className="mb-2 text-[13px] font-bold text-ink-strong">Check your approach</p>
          {selfCheck.status === 'done' && selfCheck.verdict ? (
            <p className="mb-3 text-xs leading-[1.45] text-ink-strong">{selfCheck.verdict}</p>
          ) : (
            <p className="mb-3 text-xs leading-normal text-ink-secondary">
              Hatch reads your current code and says whether the approach holds before you spend more time on it.
            </p>
          )}
          <button
            type="button"
            onClick={onRunSelfCheck}
            disabled={selfCheck.status === 'checking'}
            className={cn(
              'w-full rounded-lg border border-hairline px-3 py-2 font-label text-[12.5px] font-bold transition-colors',
              selfCheck.status === 'checking'
                ? 'cursor-wait text-ink-muted'
                : 'text-forest-800 hover:bg-page-field'
            )}
            data-testid="coding-self-check-button"
          >
            {selfCheck.status === 'checking'
              ? 'Hatch is reviewing…'
              : selfCheck.status === 'done'
                ? 'Check again'
                : 'Run self-check'}
          </button>
        </div>
      )}

      {/* Confidence */}
      {onConfidenceChange && (
        <div className="rounded-xl border border-hairline bg-card-bright p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-ink-strong">Confidence</p>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Confidence">
              {CONFIDENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={confidence === option.value}
                  onClick={() => onConfidenceChange(option.value)}
                  className={cn(
                    'rounded-lg px-2 py-1 font-label text-[11.5px] font-bold transition-colors',
                    confidence === option.value
                      ? 'bg-forest-800 text-white'
                      : 'text-ink-secondary hover:bg-page-field hover:text-ink-strong'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-normal text-ink-secondary">
            Say how sure you are before submitting. Calibration is a skill graders notice.
          </p>
        </div>
      )}
    </div>
  )
}
