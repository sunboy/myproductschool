'use client'

// Submission feedback for coding/SQL: a single vertical column that resolves
// top-down in three beats — Verdict → Coach → Evidence. Craft rules (2026-07
// elevation pass): one type scale (display 20-22 Literata / titles 15-600 /
// eyebrows 11-uppercase / mono 13), ONE left alignment rail with a single
// 32px indent for detail, zero tinted fills (color lives in icons and accent
// rules only), and the expected-vs-actual diff merged into one comparison
// table instead of two stacked grids.

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
  /** Generates Hatch's review on demand (feedback is never auto-run on submit). */
  onRequestGrading?: () => void
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

// Shared type-scale fragments (see file header).
const EYEBROW = 'font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant'
const TITLE = 'font-label text-[15px] font-semibold text-on-surface'
const MONO = 'font-mono text-[13px] text-on-surface'

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

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function displayTestLabel(result: RunResult['results'][number], index: number, isSqlMode: boolean) {
  const raw = result.label.replace(/\s*\(hidden\)\s*$/i, '').trim()
  if (!isGenericTestLabel(raw, index)) return capitalize(raw)
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

// ── The failure diff: ONE comparison table, not two spreadsheets ─────────────

function rowKey(row: Record<string, unknown>, keyCol: string): string {
  return String(row[keyCol] ?? '')
}

function formatValueCols(row: Record<string, unknown>, cols: string[]): string {
  if (cols.length === 1) return String(row[cols[0]] ?? '')
  return cols.map((c) => `${c}=${row[c] ?? ''}`).join(', ')
}

function SqlComparison({ expected, actual }: { expected: Record<string, unknown>[]; actual?: Record<string, unknown>[] }) {
  const columns = Array.from(new Set(expected.flatMap((row) => Object.keys(row))))
  if (columns.length === 0) return null
  const keyCol = columns[0]
  const valueCols = columns.slice(1)
  const hasActual = actual !== undefined
  const actualRows = actual ?? []
  const matchedActual = new Set<number>()

  const rows = expected.map((exp) => {
    const key = rowKey(exp, keyCol)
    const matchIdx = actualRows.findIndex((a, i) => !matchedActual.has(i) && rowKey(a, keyCol) === key)
    if (matchIdx >= 0) matchedActual.add(matchIdx)
    const act = matchIdx >= 0 ? actualRows[matchIdx] : null
    const expText = formatValueCols(exp, valueCols.length > 0 ? valueCols : [keyCol])
    const actText = act ? formatValueCols(act, valueCols.length > 0 ? valueCols : [keyCol]) : null
    return { key, expText, actText, match: actText !== null && actText === expText }
  })
  const extras = actualRows.filter((_, i) => !matchedActual.has(i))
  const matchedCount = rows.filter((r) => r.actText !== null).length

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant">
            <th className={`${EYEBROW} py-1.5 pr-4 text-left`}>{keyCol}</th>
            <th className={`${EYEBROW} py-1.5 pr-4 text-left`}>Expected</th>
            {hasActual && <th className={`${EYEBROW} py-1.5 text-left`}>Yours</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-outline-variant/40 last:border-0">
              <td className={`${MONO} whitespace-nowrap py-1.5 pr-4`}>{row.key}</td>
              <td className={`${MONO} py-1.5 pr-4`}>{row.expText}</td>
              {hasActual && (
                <td className={`py-1.5 font-mono text-[13px] ${row.actText === null || !row.match ? 'text-error' : 'text-on-surface'}`}>
                  {row.actText ?? '— missing'}
                </td>
              )}
            </tr>
          ))}
          {extras.map((row, i) => (
            <tr key={`extra-${i}`} className="border-b border-outline-variant/40 last:border-0">
              <td className={`${MONO} whitespace-nowrap py-1.5 pr-4`}>{rowKey(row, keyCol)}</td>
              <td className="py-1.5 pr-4 font-mono text-[13px] text-on-surface-variant">— not expected</td>
              <td className="py-1.5 font-mono text-[13px] text-error">{formatValueCols(row, valueCols.length > 0 ? valueCols : [keyCol])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasActual && (
        <p className="mt-2 font-body text-[13px] font-medium text-on-surface-variant">
          You returned {matchedCount} of {expected.length} expected {expected.length === 1 ? 'row' : 'rows'}
          {extras.length > 0 ? `, plus ${extras.length} unexpected.` : '.'}
        </p>
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

  const failed = result.status !== 'passed'

  return (
    <details open={defaultOpen ?? failed} className="mt-3">
      <summary className={`${EYEBROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        Expected vs yours
        {result.matchMode && (
          <span className="ml-2 normal-case tracking-normal text-on-surface-variant/70">
            match: {result.matchMode.replaceAll('_', ' ')}
          </span>
        )}
      </summary>
      <div
        className="mt-2 bg-surface-container-low px-4 py-3"
        style={{ borderLeft: failed ? '3px solid var(--color-error)' : '3px solid var(--color-outline-variant)' }}
      >
        {isSqlMode && result.expected !== undefined ? (
          <SqlComparison
            expected={asSqlRows(result.expected)}
            actual={actual !== undefined ? asSqlRows(actual) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {result.input !== undefined && (
              <div>
                <p className={`${EYEBROW} mb-1`}>Input</p>
                <pre className={`${MONO} overflow-x-auto`}>{prettyJson(result.input)}</pre>
              </div>
            )}
            {result.expected !== undefined && (
              <div>
                <p className={`${EYEBROW} mb-1`}>Expected</p>
                <pre className={`${MONO} overflow-x-auto`}>{prettyJson(result.expected)}</pre>
              </div>
            )}
            {actual !== undefined && (
              <div>
                <p className={`${EYEBROW} mb-1`}>Yours</p>
                <pre className={`overflow-x-auto font-mono text-[13px] ${failed ? 'text-error' : 'text-on-surface'}`}>{prettyJson(actual)}</pre>
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
      <div className="flex items-start gap-2.5 py-2">
        <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">error</span>
        <div>
          <p className={`${TITLE} text-error`}>Couldn&apos;t run tests.</p>
          <p className="mt-0.5 font-body text-[13px] text-on-surface-variant">{error}</p>
        </div>
      </div>
    )
  }

  if (!correctness) return null

  const allPassed = correctness.testsPassed === correctness.testsTotal
  const ordered = [...correctness.results].sort((a, b) => (a.status === 'passed' ? 1 : 0) - (b.status === 'passed' ? 1 : 0))

  return (
    <div data-testid="correctness-column">
      <div className="flex items-center gap-3 pb-4">
        <span
          className={`material-symbols-outlined text-[24px] ${allPassed ? 'text-primary' : 'text-error'}`}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          {allPassed ? 'check_circle' : 'cancel'}
        </span>
        <h2 className="font-headline text-[20px] font-semibold text-on-surface">
          {correctness.testsPassed} of {correctness.testsTotal} tests passing
        </h2>
      </div>

      <div className="space-y-6">
        {ordered.map((result) => {
          const index = correctness.results.indexOf(result)
          const isPassed = result.status === 'passed'
          const label = displayTestLabel(result, index, Boolean(isSqlMode))
          return (
            <div key={result.id} className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined mt-px flex-shrink-0 text-[20px] ${isPassed ? 'text-primary' : 'text-error'}`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {isPassed ? 'check_circle' : 'cancel'}
              </span>
              <div className="min-w-0 flex-1">
                <span className={TITLE}>
                  {label}
                  {result.hidden && (
                    <span className="ml-2 rounded-full border border-outline-variant px-1.5 py-px font-label text-[11px] text-on-surface-variant">
                      hidden
                    </span>
                  )}
                </span>
                {!result.hidden && result.errorMessage && (
                  <p className="text-error mt-1 font-mono text-[13px]">{result.errorMessage}</p>
                )}
                <TestCaseDetails result={result} isSqlMode={isSqlMode} defaultOpen={isPassed ? false : undefined} />
              </div>
            </div>
          )
        })}
      </div>
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
    <div>
      <p className={`${TITLE} pb-3`}>What Hatch saw</p>
      <div className="divide-y divide-outline-variant/40 border-y border-outline-variant/60">
        {grading.score_breakdown && (
          <div className="flex items-start gap-3 py-2.5">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-on-surface-variant">rule</span>
            <p className="font-body text-[13px] leading-relaxed text-on-surface">
              <span className="font-label font-semibold">Correctness&nbsp;·&nbsp;</span>
              {grading.score_breakdown.correctness.tests_passed}/{grading.score_breakdown.correctness.tests_total} tests.{' '}
              <span className="text-on-surface-variant">{grading.score_breakdown.correctness.summary}</span>
            </p>
          </div>
        )}

        {present.map((key) => {
          const dim = grading.dimensions[key]!
          const isFocus = dim.score === lowest && dim.score < 4
          const dotColor = dim.score >= 4.5 ? 'bg-primary' : dim.score >= 3 ? 'bg-tertiary' : 'bg-error/80'
          return (
            <details key={key}>
              <summary className="flex cursor-pointer items-start gap-3 py-2.5 list-none [&::-webkit-details-marker]:hidden">
                <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                <p className="flex-1 font-body text-[13px] leading-relaxed text-on-surface">
                  <span className="font-label font-semibold">{DIMENSION_LABELS[key] ?? key}{isFocus ? ' (focus)' : ''}&nbsp;·&nbsp;</span>
                  <span className="text-on-surface-variant">{dim.verdict}</span>
                </p>
                <span className="ml-1 shrink-0 font-label text-[13px] font-semibold text-on-surface-variant tabular-nums">
                  {dim.score.toFixed(1)}
                </span>
              </summary>
              <div className="space-y-1.5 pb-2.5 pl-8">
                {dim.evidence && (
                  <FeedbackText className="text-[13px] leading-relaxed text-on-surface-variant">{dim.evidence}</FeedbackText>
                )}
                {dim.how_to_improve && (
                  <FeedbackText className="text-[13px] leading-relaxed text-on-surface">{dim.how_to_improve}</FeedbackText>
                )}
              </div>
            </details>
          )
        })}

        {grading.top_improvement && (
          <div className="flex items-start gap-3 py-2.5">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">arrow_forward</span>
            <div className="min-w-0 flex-1">
              <span className="font-label text-[13px] font-semibold text-on-surface">Next rep</span>
              <FeedbackText className="text-[13px] leading-relaxed text-on-surface">{grading.top_improvement}</FeedbackText>
            </div>
          </div>
        )}

        {grading.what_a_5_would_look_like && (
          <details>
            <summary className={`${EYEBROW} cursor-pointer py-2.5 list-none [&::-webkit-details-marker]:hidden`}>
              What a 5 would look like
            </summary>
            <FeedbackText className="pb-2.5 pl-8 text-[13px] leading-relaxed text-on-surface-variant">
              {grading.what_a_5_would_look_like}
            </FeedbackText>
          </details>
        )}
      </div>
    </div>
  )
}

// ── Buttons: ONE filled primary, ghost secondaries ───────────────────────────

function PrimaryButton({ onClick, children, testId }: { onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-label text-[15px] font-semibold text-on-primary transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  )
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2.5 font-label text-[13px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
    >
      {children}
    </button>
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
  onRequestGrading,
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
      <div className="w-full space-y-8 px-6 pb-12 pt-2">

        {/* Top row: Next challenge, weighted by whether there's a verdict to move on from. */}
        {onNextChallenge && (
          <div className="flex items-center justify-end border-b border-outline-variant/60 pb-3">
            <button
              type="button"
              onClick={onNextChallenge}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-label text-[13px] font-semibold transition-colors ${
                grading && allPassed
                  ? 'bg-primary text-on-primary hover:opacity-90'
                  : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
              }`}
            >
              Next challenge
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Beat 1 — correctness, the instant truth */}
        <CorrectnessLead
          correctness={correctness}
          isLoading={isLoadingCorrectness}
          error={correctnessError}
          isSqlMode={isSqlMode}
        />

        {/* Beat 2 — Hatch's slot: invite → review card → verdict, same card family */}
        {isLoadingGrading ? (
          <div className="space-y-4">
            <HatchReviewCard phases={isSqlMode ? SQL_REVIEW_PHASES : CODING_REVIEW_PHASES} />
            <div className="flex flex-wrap items-center gap-2">
              {onAskHatch && hasFailures && (
                <PrimaryButton onClick={onAskHatch} testId="ask-hatch-banner">
                  <HatchImage size={16} state="speaking" />
                  The failing case, explained
                </PrimaryButton>
              )}
              {onRetry && (
                <GhostButton onClick={onRetry}>
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Back to editor
                </GhostButton>
              )}
            </div>
          </div>
        ) : gradingError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 py-2">
              <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">error</span>
              <div>
                <p className={`${TITLE} text-error`}>Couldn&apos;t generate feedback.</p>
                <p className="mt-0.5 font-body text-[13px] text-on-surface-variant">Hatch could not score this attempt. Your test results are above.</p>
                <p className="mt-1 font-body text-[12px] text-on-surface-variant/70" title={gradingError}>{gradingError}</p>
              </div>
            </div>
            {(onRetryGrading ?? onRetry) && (
              <PrimaryButton onClick={(onRetryGrading ?? onRetry)!}>Retry grading</PrimaryButton>
            )}
          </div>
        ) : grading ? (
          <div className="space-y-6">
            <VerdictBand
              headline={grading.headline}
              raw={grading.overall_score}
              scale={5}
              actions={
                <>
                  {onAskHatch && (
                    <PrimaryButton onClick={onAskHatch} testId="hatch-chat-panel">
                      <HatchImage size={16} state="speaking" />
                      {allPassed ? 'Ask Hatch about this' : 'Fix it with Hatch'}
                    </PrimaryButton>
                  )}
                  {onRetry && (
                    <GhostButton onClick={onRetry}>
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      Back to editor
                    </GhostButton>
                  )}
                </>
              }
            />

            {/* Beat 3 — what Hatch saw */}
            <WhatHatchSaw grading={grading} />

            {grading.top_strength && (
              <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 13 }}>
                <span className={EYEBROW}>Top strength</span>
                <FeedbackText className="mt-1 text-[13px] leading-relaxed text-on-surface">{grading.top_strength}</FeedbackText>
              </div>
            )}
          </div>
        ) : onRequestGrading ? (
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container p-6"
            style={{ borderLeft: '4px solid var(--color-outline-variant)' }}
          >
            <div className="flex items-center gap-3">
              <HatchImage size={40} state="listening" />
              <div>
                <p className={TITLE}>Want Hatch&apos;s read on this?</p>
                <p className="mt-1 font-body text-[13px] leading-relaxed text-on-surface-variant">
                  A score, the reasoning behind it, and the one thing to fix next.
                </p>
              </div>
            </div>
            <PrimaryButton onClick={onRequestGrading} testId="request-grading">
              <HatchImage size={16} state="speaking" />
              Get Hatch&apos;s feedback
            </PrimaryButton>
          </div>
        ) : (
          <div className="flex items-start gap-3 py-2">
            <HatchImage size={28} state="listening" />
            <div>
              <p className={TITLE}>No Hatch review for this attempt</p>
              <p className="mt-1 font-body text-[13px] leading-relaxed text-on-surface-variant">
                Your test results are above. Feedback was not requested on this submission.
              </p>
            </div>
          </div>
        )}

        {/* Evidence — the query echo lives one tap away, not above the fold. */}
        {submittedCode?.trim() && (
          <details className="border-t border-outline-variant/60 pt-3">
            <summary className={`${EYEBROW} flex cursor-pointer items-center gap-2 list-none [&::-webkit-details-marker]:hidden`}>
              <span className="material-symbols-outlined text-[15px]">{isSqlMode ? 'database' : 'code'}</span>
              {languageLabel(language, isSqlMode)}
            </summary>
            <pre className={`${MONO} mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words bg-surface-container-low px-4 py-3 leading-relaxed`}>
              {submittedCode}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
