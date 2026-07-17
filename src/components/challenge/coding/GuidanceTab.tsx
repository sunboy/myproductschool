'use client'

import { cn } from '@/lib/utils'
import { HatchImage } from '@/components/redesign/HatchImage'
import { Md } from '@/components/ui/Md'

export interface CodingRailRunSummary {
  testsPassed: number
  testsTotal: number
}

export interface CodingRailSelfCheck {
  status: 'idle' | 'checking' | 'done'
  /** Hatch's verdict text once status === 'done'. */
  verdict?: string
}

export interface GuidanceTabProps {
  /** A live Hatch nudge overrides the deterministic phase copy. */
  nudge?: { text: string; onDismiss?: () => void } | null
  /** Last completed run, or null before the first run. */
  lastRun?: CodingRailRunSummary | null
  /** True while a run is in flight (guidance goes quiet on state that is about to change). */
  isRunning?: boolean

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

/**
 * Compliance backstop for live Hatch text in the coach panels: the writing
 * style bans em dashes, so any that slip past the model prompt are rewritten
 * to a comma at render time.
 */
export function stripEmDashes(text: string): string {
  return text.replace(/\s*—\s*/g, ', ')
}

type SelfCheckVerdictToken = 'pass' | 'partial' | 'retry'

/** pass=mint / partial=amber / retry=blush chip recipes (spec §7 note tints). */
const VERDICT_CHIP: Record<SelfCheckVerdictToken, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'note-mint text-forest-800' },
  partial: { label: 'Partial', className: 'note-amber text-ink-strong' },
  retry: { label: 'Retry', className: 'note-blush text-ink-strong' },
}

/**
 * The interpret self-check prompt asks Hatch to start its reply with one word:
 * pass / partial / retry. Split that token off so it renders as a styled chip
 * instead of leaking into the body text ("pass One thing worth confirming…").
 */
function parseSelfCheckVerdict(text: string): { token: SelfCheckVerdictToken | null; body: string } {
  const match = /^\s*(pass|partial|retry)\b[\s:,.]*/i.exec(text)
  if (!match) return { token: null, body: text.trim() }
  const body = text.slice(match[0].length).trim()
  return {
    token: match[1].toLowerCase() as SelfCheckVerdictToken,
    // A verdict-only reply keeps the original text as the body rather than
    // rendering an empty pane under the chip.
    body: body || text.trim(),
  }
}

const CONFIDENCE_OPTIONS: Array<{ value: 'low' | 'medium' | 'high'; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

/**
 * Guidance tab of the coding Hatch dock (formerly the top of CodingRail):
 * Live guidance in the page's one tinted note surface (mint = coach), real
 * pattern tags, a check-your-approach verdict, and a learner-declared
 * confidence control.
 */
export function GuidanceTab({
  nudge,
  lastRun,
  isRunning = false,
  patterns,
  selfCheck,
  onRunSelfCheck,
  confidence,
  onConfidenceChange,
  className,
}: GuidanceTabProps) {
  return (
    <div className={cn('flex flex-col gap-3 overflow-y-auto p-3', className)} data-testid="coding-guidance-tab">
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
          {nudge?.text ? stripEmDashes(nudge.text) : guidanceMessage(lastRun, isRunning)}
        </p>
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
            (() => {
              const { token, body } = parseSelfCheckVerdict(stripEmDashes(selfCheck.verdict))
              return (
                <div className="mb-3">
                  {token && (
                    <span
                      className={cn(
                        'mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 font-label text-[11px] font-bold uppercase tracking-[0.05em]',
                        VERDICT_CHIP[token].className
                      )}
                      data-testid="coding-self-check-verdict"
                    >
                      {VERDICT_CHIP[token].label}
                    </span>
                  )}
                  <div className="text-xs leading-[1.45] text-ink-strong">
                    <Md variant="compact" tone="inherit">{body}</Md>
                  </div>
                </div>
              )
            })()
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
