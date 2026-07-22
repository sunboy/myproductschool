'use client'

// Submission feedback for coding/SQL: a single vertical column that resolves
// top-down in three beats — Verdict → Coach → Evidence. Correctness is
// instant so it leads; Hatch's review card settles into the verdict in place;
// the query echo and raw test log are disclosures, not headlines.

import { VerdictBand, HatchReviewCard, SQL_REVIEW_PHASES, CODING_REVIEW_PHASES } from '@/components/feedback'
import { FeedbackText } from '@/components/ui/FeedbackText'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { RunResult, GradingFeedback, GradingDimensionKey, SupportedLanguage } from '@/lib/coding/types'

interface CodingFeedbackProps {
  correctness?: RunResult | null
  grading?: GradingFeedback | null
  isLoadingCorrectness?: boolean
  isLoadingGrading?: boolean
  onRetry?: () => void
  /** Re-runs grading on the SAME submission in place (does not start a new attempt). */
  onRetryGrading?: () => void
  onAskHatch?: () => void
  onNextChallenge?: () => void
  submittedCode?: string | null
  language?: SupportedLanguage | string | null
  isSqlMode?: boolean
  correctnessError?: string
  gradingError?: string
}

const DIMENSION_LABELS: Record<GradingDimensionKey, string> = {
  problem_approach: 'Problem approach',
  ai_collaboration: 'Hatch collaboration',
  code_quality: 'Code quality',
  verification_discipline: 'Verification discipline',
  interview_communication: 'Interview communication',
}

const DIMENSION_ORDER: GradingDimensionKey[] = [
  'problem_approach',
  'ai_collaboration',
  'code_quality',
  'verification_discipline',
  'interview_communication',
]

function scoreChipClass(score: number) {
  if (score >= 4.5) return 'bg-primary-container text-on-primary-container'
  if (score >= 3) return 'bg-tertiary-container text-on-tertiary-container'
  return 'bg-error/10 text-error'
}

function getDisplayedActual(result: RunResult['results'][number]): unknown {
  return result.actual !== undefined ? result.actual : result.output
}

function asSqlRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

function compactJson(value: unknown): string {
  try {
    const text = JSON.stringify(value)
    return text.length > 90 ? `${text.slice(0, 87)}...` : text
  } catch {
    return String(value)
  }
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function isGenericTestLabel(label: string, index: number) {
  const normalized = label.trim().toLowerCase()
  return normalized === `test ${index + 1}` ||
    normalized === `test case ${index + 1}` ||
    normalized === `case ${index + 1}` ||
    normalized === `tc${index + 1}`
}

function displayTestLabel(result: RunResult['results'][number], index: number, isSqlMode: boolean) {
  if (!isGenericTestLabel(result.label, index)) return result.label
  if (!isSqlMode && result.input !== undefined) return `Case ${index + 1}: input ${compactJson(result.input)}`
  if (isSqlMode && Array.isArray(result.expected)) {
    const rows = result.expected.length
    return `Case ${index + 1}: ${rows} expected row${rows === 1 ? '' : 's'}`
  }
  return `Case ${index + 1}`
}

function languageLabel(language?: SupportedLanguage | string | null, isSqlMode?: boolean) {
  if (isSqlMode) return 'Your query'
  if (!language) return 'Your code'
  const labels: Record<string, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    java: 'Java',
    cpp: 'C++',
    go: 'Go',
    sql: 'SQL',
  }
  return `Your ${labels[language] ?? language} code`
}

function SqlMiniTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <div className="rounded-md bg-surface-container-high px-2 py-1.5 text-[10.5px] italic text-on-surface-variant">(no rows)</div>
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  return (
    <div className="overflow-x-auto rounded-md border border-outline-variant bg-surface">
      <table className="w-full text-[10.5px]">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-high">
            {columns.map((column) => (
              <th key={column} className="px-2 py-1 text-left font-label font-bold text-on-surface">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, index) => (
            <tr key={index} className="border-b border-outline-variant/40 last:border-0">
              {columns.map((column) => (
                <td key={column} className="whitespace-nowrap px-2 py-1 text-on-surface-variant">
                  {String(row[column] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 6 && (
        <div className="border-t border-outline-variant px-2 py-1 font-label text-[10px] text-on-surface-variant">
          +{rows.length - 6} more rows
        </div>
      )}
    </div>
  )
}

function TestCaseDetails({
  result,
  isSqlMode,
  defaultOpen,
}: {
  result: RunResult['results'][number]
  isSqlMode?: boolean
  defaultOpen?: boolean
}) {
  if (result.hidden) return null

  const actual = getDisplayedActual(result)
  const hasDetails = result.input !== undefined ||
    result.expected !== undefined ||
    actual !== undefined ||
    result.matchMode !== undefined ||
    result.errorMessage

  if (!hasDetails) return null

  return (
    <details
      open={defaultOpen ?? result.status !== 'passed'}
      className="mt-2 rounded-lg border border-outline-variant/70 bg-surface/70"
    >
      <summary className="cursor-pointer px-2.5 py-1.5 font-label text-[11px] font-semibold text-on-surface-variant">
        Expected vs. what you returned
      </summary>
      <div className="space-y-2 border-t border-outline-variant/50 px-2.5 py-2">
        {result.matchMode && (
          <div className="inline-flex rounded-full bg-surface-container-high px-2 py-0.5 font-label text-[10.5px] font-bold text-on-surface-variant">
            Match: {result.matchMode.replaceAll('_', ' ')}
          </div>
        )}

        {isSqlMode ? (
          <div className="grid grid-cols-1 gap-2">
            {result.expected !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-semibold text-on-surface-variant">Expected rows</p>
                <SqlMiniTable rows={asSqlRows(result.expected)} />
              </div>
            )}
            {actual !== undefined ? (
              <div>
                <p className="mb-1 font-label text-[10px] font-semibold text-on-surface-variant">Your query returned</p>
                <SqlMiniTable rows={asSqlRows(actual)} />
              </div>
            ) : (
              <p className="rounded-md bg-surface-container-high px-2 py-1.5 text-[10.5px] italic text-on-surface-variant">
                Row output was not captured for this older attempt.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {result.input !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-semibold text-on-surface-variant">Input</p>
                <pre className="overflow-x-auto rounded-md bg-surface-container-high px-2 py-1.5 font-mono text-[10.5px] text-on-surface">
                  {prettyJson(result.input)}
                </pre>
              </div>
            )}
            {result.expected !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-semibold text-on-surface-variant">Expected</p>
                <pre className="overflow-x-auto rounded-md bg-surface-container-high px-2 py-1.5 font-mono text-[10.5px] text-on-surface">
                  {prettyJson(result.expected)}
                </pre>
              </div>
            )}
            {actual !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-semibold text-on-surface-variant">You returned</p>
                <pre className="overflow-x-auto rounded-md bg-surface-container-high px-2 py-1.5 font-mono text-[10.5px] text-on-surface">
                  {prettyJson(actual)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

// ── Beat 1: correctness lead — the instant truth ─────────────────────────────

function CorrectnessLead({
  correctness,
  isLoading,
  error,
  isSqlMode,
}: {
  correctness?: RunResult | null
  isLoading?: boolean
  error?: string
  isSqlMode?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-32 bg-surface-container-high rounded" />
        <div className="h-9 bg-surface-container-high rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-2">
        <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
        <div>
          <p className="text-sm font-label font-medium text-error mb-0.5">Couldn&apos;t run tests.</p>
          <p className="text-xs text-error/80">{error}</p>
        </div>
      </div>
    )
  }

  if (!correctness) return null

  const allPassed = correctness.testsPassed === correctness.testsTotal
  const failing = correctness.results.filter((r) => r.status !== 'passed')
  const passing = correctness.results.filter((r) => r.status === 'passed')

  return (
    <div className="space-y-2" data-testid="correctness-column">
      <div className="flex items-center gap-2.5">
        <span
          className={`material-symbols-outlined text-[26px] ${allPassed ? 'text-primary' : 'text-error'}`}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          {allPassed ? 'check_circle' : 'cancel'}
        </span>
        <p className="font-headline text-lg font-bold text-on-surface">
          {correctness.testsPassed} of {correctness.testsTotal} tests passing
        </p>
      </div>

      {/* Failing cases carry the weight — expanded and first. */}
      {failing.map((result) => {
        const index = correctness.results.indexOf(result)
        const label = displayTestLabel(result, index, Boolean(isSqlMode))
        return (
          <div key={result.id} className="rounded-xl border border-error/20 bg-error/5 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <span
                className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[16px] text-error"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                cancel
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-label font-semibold text-on-surface">
                  {result.hidden ? <span className="italic text-on-surface-variant">{label} (hidden)</span> : label}
                </span>
                {!result.hidden && result.errorMessage && (
                  <p className="mt-0.5 text-[11px] text-error">{result.errorMessage}</p>
                )}
                <TestCaseDetails result={result} isSqlMode={isSqlMode} />
              </div>
            </div>
          </div>
        )
      })}

      {/* Passing cases fold away — they're confirmation, not news. */}
      {passing.length > 0 && (
        <details className="rounded-xl border border-outline-variant/60 bg-surface-container-low" open={failing.length === 0 && passing.length <= 3}>
          <summary className="cursor-pointer px-3 py-2 font-label text-xs font-semibold text-on-surface-variant">
            {passing.length} passing {passing.length === 1 ? 'case' : 'cases'}
          </summary>
          <div className="space-y-1 border-t border-outline-variant/50 px-3 py-2">
            {passing.map((result) => {
              const index = correctness.results.indexOf(result)
              const label = displayTestLabel(result, index, Boolean(isSqlMode))
              return (
                <div key={result.id} className="flex items-start gap-2 py-1">
                  <span
                    className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[15px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    check_circle
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-label text-on-surface">
                      {result.hidden ? <span className="italic text-on-surface-variant">{label} (hidden)</span> : label}
                    </span>
                    <TestCaseDetails result={result} isSqlMode={isSqlMode} defaultOpen={false} />
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

// ── Beat 3: what Hatch saw — scannable lines, detail on demand ───────────────

function WhatHatchSaw({ grading }: { grading: GradingFeedback }) {
  const present = DIMENSION_ORDER.filter((key) => grading.dimensions[key])
  const lowest = present.length > 0
    ? Math.min(...present.map((key) => grading.dimensions[key]!.score))
    : 0

  return (
    <div className="space-y-1.5">
      <p className="font-label text-sm font-bold text-on-surface">What Hatch saw</p>

      {grading.score_breakdown && (
        <div className="flex items-start gap-2.5 rounded-lg px-2 py-1.5">
          <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant">rule</span>
          <p className="text-xs leading-relaxed text-on-surface">
            <span className="font-label font-semibold">Correctness&nbsp;·&nbsp;</span>
            {grading.score_breakdown.correctness.tests_passed}/{grading.score_breakdown.correctness.tests_total} tests.{' '}
            <span className="text-on-surface-variant">{grading.score_breakdown.correctness.summary}</span>
          </p>
        </div>
      )}

      {present.map((key) => {
        const dim = grading.dimensions[key]!
        const isFocus = dim.score === lowest && dim.score < 4
        return (
          <details key={key} className={`rounded-lg ${isFocus ? 'bg-tertiary-container/25' : ''}`}>
            <summary className="flex cursor-pointer items-start gap-2.5 px-2 py-1.5 list-none [&::-webkit-details-marker]:hidden">
              <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${dim.score >= 4.5 ? 'bg-primary' : dim.score >= 3 ? 'bg-tertiary' : 'bg-error/70'}`} />
              <p className="flex-1 text-xs leading-relaxed text-on-surface">
                <span className="font-label font-semibold">{DIMENSION_LABELS[key] ?? key}&nbsp;·&nbsp;</span>
                <span className="text-on-surface-variant">{dim.verdict}</span>
              </p>
              <span className={`ml-1 shrink-0 rounded-full px-1.5 py-0.5 font-label text-[10px] font-bold ${scoreChipClass(dim.score)}`}>
                {dim.score.toFixed(1)}
              </span>
            </summary>
            <div className="space-y-1.5 px-2 pb-2 pl-6.5">
              {dim.evidence && (
                <FeedbackText className="text-[11px] leading-relaxed text-on-surface-variant">{dim.evidence}</FeedbackText>
              )}
              {dim.how_to_improve && (
                <FeedbackText className="text-[11px] leading-relaxed text-on-surface">
                  {dim.how_to_improve}
                </FeedbackText>
              )}
            </div>
          </details>
        )
      })}

      {grading.top_improvement && (
        <div className="flex items-start gap-2.5 rounded-lg bg-primary-container/25 px-2 py-2">
          <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">arrow_forward</span>
          <div className="min-w-0 flex-1">
            <span className="font-label text-xs font-semibold text-on-surface">Next rep</span>
            <FeedbackText className="text-xs leading-relaxed text-on-surface">{grading.top_improvement}</FeedbackText>
          </div>
        </div>
      )}

      {grading.what_a_5_would_look_like && (
        <details className="rounded-lg">
          <summary className="cursor-pointer px-2 py-1.5 font-label text-[11px] font-semibold text-on-surface-variant">
            What a 5 would look like
          </summary>
          <FeedbackText className="px-2 pb-2 pl-6 text-[11px] leading-relaxed text-on-surface-variant">
            {grading.what_a_5_would_look_like}
          </FeedbackText>
        </details>
      )}
    </div>
  )
}

// ── Main single-column layout ────────────────────────────────────────────────

export function CodingFeedback({
  correctness,
  grading,
  isLoadingCorrectness = false,
  isLoadingGrading = false,
  onRetry,
  onRetryGrading,
  onAskHatch,
  onNextChallenge,
  submittedCode,
  language,
  isSqlMode = false,
  correctnessError,
  gradingError,
}: CodingFeedbackProps) {
  const allPassed = Boolean(correctness && correctness.testsTotal > 0 && correctness.testsPassed === correctness.testsTotal)
  const hasFailures = Boolean(correctness && correctness.testsPassed < correctness.testsTotal)

  return (
    <div className="flex h-full flex-col overflow-y-auto" data-testid="grading-column">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-1 pb-10">

        {/* Quiet top row: Next challenge earns emphasis only once there's a verdict. */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {onNextChallenge && (
            <button
              type="button"
              onClick={onNextChallenge}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-xs font-bold transition-colors ${
                grading && allPassed
                  ? 'border border-primary/30 bg-primary-fixed text-primary hover:bg-primary-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Next challenge
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Beat 1 — correctness, the instant truth */}
        <CorrectnessLead
          correctness={correctness}
          isLoading={isLoadingCorrectness}
          error={correctnessError}
          isSqlMode={isSqlMode}
        />

        {/* Beat 2 — Hatch's slot: review card settles into the verdict in place */}
        {isLoadingGrading ? (
          <>
            <HatchReviewCard phases={isSqlMode ? SQL_REVIEW_PHASES : CODING_REVIEW_PHASES} />
            <div className="flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-2 font-label text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Back to editor
                </button>
              )}
              {onAskHatch && hasFailures && (
                <button
                  type="button"
                  onClick={onAskHatch}
                  data-testid="ask-hatch-banner"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-label text-xs font-bold text-on-primary transition-opacity hover:opacity-90"
                >
                  <HatchImage size={15} state="speaking" />
                  The failing case, explained
                </button>
              )}
            </div>
          </>
        ) : gradingError ? (
          <div className="space-y-3">
            <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <div>
                <p className="text-sm font-label font-medium text-error mb-0.5">Couldn&apos;t generate feedback.</p>
                <p className="text-xs text-error/80">Hatch could not score this attempt. Your test results are above.</p>
                <p className="text-[11px] text-error/60 mt-1" title={gradingError}>{gradingError}</p>
              </div>
            </div>
            {(onRetryGrading ?? onRetry) && (
              <button
                onClick={onRetryGrading ?? onRetry}
                className="w-full py-2 rounded-full bg-surface-container border border-outline-variant text-sm font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Retry grading
              </button>
            )}
          </div>
        ) : grading ? (
          <>
            <VerdictBand
              headline={grading.headline}
              raw={grading.overall_score}
              scale={5}
              actions={
                <>
                  {onAskHatch && (
                    <button
                      type="button"
                      onClick={onAskHatch}
                      data-testid="hatch-chat-panel"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label text-xs font-bold text-on-primary transition-opacity hover:opacity-90"
                    >
                      <HatchImage size={15} state="speaking" />
                      {allPassed ? 'Ask Hatch about this' : 'Fix it with Hatch'}
                    </button>
                  )}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 font-label text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Back to editor
                    </button>
                  )}
                </>
              }
            />

            {/* Beat 3 — what Hatch saw */}
            <WhatHatchSaw grading={grading} />

            {grading.top_strength && (
              <div className="flex items-start gap-2.5 rounded-xl bg-primary-container/30 px-3 py-2.5">
                <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[16px] text-primary">star</span>
                <FeedbackText className="text-xs leading-relaxed text-on-surface">{grading.top_strength}</FeedbackText>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex items-start gap-2">
              <HatchImage size={24} state="listening" />
              <div>
                <p className="font-label text-sm font-bold text-on-surface">Hatch feedback is pending</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  Your test results are above. If feedback does not appear, return to the editor, make another run, and submit again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence — the query echo lives one tap away, not above the fold. */}
        {submittedCode?.trim() && (
          <details className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
            <summary className="flex cursor-pointer items-center gap-2 bg-surface-container-low px-3 py-2 font-label text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-primary">{isSqlMode ? 'database' : 'code'}</span>
              {languageLabel(language, isSqlMode)}
            </summary>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words border-t border-outline-variant bg-surface-container-low px-3 py-3 font-mono text-xs leading-relaxed text-on-surface">
              {submittedCode}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
