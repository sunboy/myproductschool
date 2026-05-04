'use client'

import { useState } from 'react'
import { Md } from '@/components/ui/Md'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { RunResult, GradingFeedback, GradingDimensionKey, SupportedLanguage } from '@/lib/coding/types'

interface CodingFeedbackProps {
  correctness?: RunResult | null
  grading?: GradingFeedback | null
  isLoadingCorrectness?: boolean
  isLoadingGrading?: boolean
  onRetry?: () => void
  onAskHatch?: () => void
  onNextChallenge?: () => void
  submittedCode?: string | null
  language?: SupportedLanguage | string | null
  isSqlMode?: boolean
  correctnessError?: string
  gradingError?: string
}

// Human-readable labels for dimension keys
const DIMENSION_LABELS: Record<GradingDimensionKey, { label: string; icon: string }> = {
  problem_approach: { label: 'Problem Approach', icon: 'psychology' },
  ai_collaboration: { label: 'AI Collaboration', icon: 'smart_toy' },
  code_quality: { label: 'Code Quality', icon: 'code' },
  verification_discipline: { label: 'Verification Discipline', icon: 'verified' },
  interview_communication: { label: 'Interview Communication', icon: 'forum' },
}

const DIMENSION_ORDER: GradingDimensionKey[] = [
  'problem_approach',
  'ai_collaboration',
  'code_quality',
  'verification_discipline',
  'interview_communication',
]

// Score colour helpers
function scoreColor(score: number) {
  if (score >= 4.5) return 'text-primary'
  if (score >= 3) return 'text-tertiary'
  return 'text-error'
}

function scoreBg(score: number) {
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
  if (isSqlMode) return 'SQL query'
  if (!language) return 'Submitted code'
  const labels: Record<string, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    java: 'Java',
    cpp: 'C++',
    go: 'Go',
    sql: 'SQL',
  }
  return `${labels[language] ?? language} submission`
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

function SubmittedSolutionPanel({
  code,
  language,
  isSqlMode,
}: {
  code?: string | null
  language?: SupportedLanguage | string | null
  isSqlMode?: boolean
}) {
  if (!code?.trim()) return null

  return (
    <div className="mb-4 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container-low px-3 py-2">
        <span className="material-symbols-outlined text-[16px] text-primary">
          {isSqlMode ? 'database' : 'code'}
        </span>
        <span className="font-label text-xs font-black uppercase tracking-wider text-on-surface-variant">
          {languageLabel(language, isSqlMode)}
        </span>
      </div>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words bg-surface-container-low px-3 py-3 font-mono text-xs leading-relaxed text-on-surface">
        {code}
      </pre>
    </div>
  )
}

function TestCaseDetails({
  result,
  isSqlMode,
}: {
  result: RunResult['results'][number]
  isSqlMode?: boolean
}) {
  if (result.hidden) return null

  const actual = getDisplayedActual(result)
  const hasDetails = result.input !== undefined ||
    result.expected !== undefined ||
    actual !== undefined ||
    result.matchMode !== undefined ||
    result.errorMessage

  if (!hasDetails) return null

  const defaultOpen = result.status !== 'passed'

  return (
    <details
      open={defaultOpen}
      className="mt-2 rounded-lg border border-outline-variant/70 bg-surface/70"
    >
      <summary className="cursor-pointer px-2.5 py-1.5 font-label text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant">
        Test case details
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
                <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Expected rows
                </p>
                <SqlMiniTable rows={asSqlRows(result.expected)} />
              </div>
            )}
            {actual !== undefined ? (
              <div>
                <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Submitted query output
                </p>
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
                <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Input
                </p>
                <pre className="overflow-x-auto rounded-md bg-surface-container-high px-2 py-1.5 font-mono text-[10.5px] text-on-surface">
                  {prettyJson(result.input)}
                </pre>
              </div>
            )}
            {result.expected !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Expected
                </p>
                <pre className="overflow-x-auto rounded-md bg-surface-container-high px-2 py-1.5 font-mono text-[10.5px] text-on-surface">
                  {prettyJson(result.expected)}
                </pre>
              </div>
            )}
            {actual !== undefined && (
              <div>
                <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Submitted output
                </p>
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

// ── Correctness column ───────────────────────────────────────────────────────

function CorrectnessColumn({
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
        <div className="h-4 w-48 bg-surface-container-high rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-surface-container-high rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-2">
        <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
        <div>
          <p className="text-sm font-label font-medium text-error mb-0.5">
            Couldn&apos;t run tests.
          </p>
          <p className="text-xs text-error/80">{error}</p>
        </div>
      </div>
    )
  }

  if (!correctness) {
    return (
      <div className="text-sm text-on-surface-variant italic">No results yet.</div>
    )
  }

  const allPassed = correctness.testsPassed === correctness.testsTotal
  const passedRatio = `${correctness.testsPassed} of ${correctness.testsTotal}`

  return (
    <div className="space-y-3">
      {/* Summary badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          allPassed
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-error/10 text-error'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          {allPassed ? 'check_circle' : 'cancel'}
        </span>
        <span className="text-sm font-label font-bold">{passedRatio} tests passed</span>
      </div>

      {/* Individual test rows */}
      <div className="space-y-1.5">
        {correctness.results.map((result, index) => {
          const isPassed = result.status === 'passed'
          const isError = result.status === 'error'
          const isTimeout = result.status === 'timeout'
          const label = displayTestLabel(result, index, Boolean(isSqlMode))

          return (
            <div
              key={result.id}
              className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <span
                className={`material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0 ${
                  isPassed ? 'text-primary' : 'text-error'
                }`}
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {isPassed ? 'check_circle' : 'cancel'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-label text-on-surface">
                  {result.hidden ? (
                    <span className="italic text-on-surface-variant">{label} (hidden)</span>
                  ) : (
                    label
                  )}
                </span>
                {/* Error message for visible errors */}
                {!result.hidden && (isError || isTimeout) && result.errorMessage && (
                  <p className="text-[11px] text-error mt-0.5 truncate">{result.errorMessage}</p>
                )}
                <TestCaseDetails result={result} isSqlMode={isSqlMode} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Grading column ───────────────────────────────────────────────────────────

function DimensionAccordion({
  dimensionKey,
  score,
  verdict,
  evidence,
  hole_to_poke,
  how_to_improve,
  index,
}: {
  dimensionKey: GradingDimensionKey
  score: number
  verdict: string
  evidence: string
  hole_to_poke: string
  how_to_improve: string
  index: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { label, icon } = DIMENSION_LABELS[dimensionKey] ?? { label: dimensionKey, icon: 'bar_chart' }
  const colorClass = scoreColor(score)
  const bgClass = scoreBg(score)

  return (
    <div className="rounded-lg border border-outline-variant overflow-hidden">
      {/* Header */}
      <button
        data-testid={`dimension-${dimensionKey}-toggle`}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`material-symbols-outlined text-[16px] ${colorClass}`} aria-hidden="true">
            {icon}
          </span>
          <span className="text-sm font-label font-medium text-on-surface truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-label font-bold px-1.5 py-0.5 rounded ${bgClass}`}>
            {score}/5
          </span>
          <span
            className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 space-y-3 bg-surface-container-low">
            {/* Verdict */}
            <div className="text-sm text-on-surface leading-relaxed"><Md>{verdict}</Md></div>

            {/* Evidence */}
            <div data-testid={`dimension-${dimensionKey}-evidence`}>
              <p className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Evidence
              </p>
              <div className="text-xs text-on-surface-variant leading-relaxed italic"><Md>{evidence}</Md></div>
            </div>

            {/* Hole to poke */}
            {hole_to_poke && (
              <div className="bg-tertiary-container/40 rounded-lg px-3 py-2 flex gap-2">
                <span className="material-symbols-outlined text-tertiary text-[15px] mt-0.5 flex-shrink-0">
                  search
                </span>
                <div className="text-xs text-on-surface-variant leading-relaxed"><Md>{hole_to_poke}</Md></div>
              </div>
            )}

            {/* How to improve */}
            <div data-testid={`dimension-${dimensionKey}-improvement`}>
              <p className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                How to improve
              </p>
              <div className="text-xs text-on-surface leading-relaxed"><Md>{how_to_improve}</Md></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GradingColumn({
  grading,
  isLoading,
  error,
  onAskHatch,
  onRetry,
}: {
  grading?: GradingFeedback | null
  isLoading?: boolean
  error?: string
  onAskHatch?: () => void
  onRetry?: () => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-primary-container rounded-xl">
          <HatchGlyph size={28} state="reviewing" className="text-primary" />
          <div>
            <p className="text-sm font-label font-medium text-on-primary-container">
              Hatch is analysing your session...
            </p>
            <p className="text-xs text-primary">This usually takes 5–15 seconds.</p>
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-surface-container-high rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
          <div>
            <p className="text-sm font-label font-medium text-error mb-0.5">
              Couldn&apos;t generate feedback.
            </p>
            <p className="text-xs text-error/80">
              Your attempt is saved. {error}
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-2 rounded-full bg-surface-container border border-outline-variant text-sm font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Retry grading
          </button>
        )}
      </div>
    )
  }

  if (!grading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <div className="flex items-start gap-2">
          <HatchGlyph size={24} state="listening" className="shrink-0 text-primary" />
          <div>
            <p className="font-label text-sm font-bold text-on-surface">Hatch feedback is pending</p>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Your test results are available. If feedback does not appear, return to the editor, make another run, and submit again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall score header */}
      <div className="flex items-start gap-3 p-3 bg-primary-container rounded-xl">
        <HatchGlyph size={28} state="celebrating" className="text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-xs font-label font-semibold text-on-primary-container uppercase tracking-wide">
              Overall Score
            </p>
            <span className={`text-sm font-label font-bold px-2 py-0.5 rounded-full ${scoreBg(grading.overall_score)}`}>
              {grading.overall_score.toFixed(1)} / 5
            </span>
          </div>
          <div className="text-sm text-on-primary-container leading-relaxed"><Md>{grading.headline}</Md></div>
        </div>
      </div>

      {/* Dimension accordions */}
      <div className="space-y-2">
        {DIMENSION_ORDER.map((key, index) => {
          const dim = grading.dimensions[key]
          if (!dim) return null
          return (
            <DimensionAccordion
              key={key}
              dimensionKey={key}
              score={dim.score}
              verdict={dim.verdict}
              evidence={dim.evidence}
              hole_to_poke={dim.hole_to_poke}
              how_to_improve={dim.how_to_improve}
              index={index + 1}
            />
          )
        })}
      </div>

      {/* Top strength */}
      <div className="bg-primary-container/40 rounded-xl p-3 flex gap-2.5">
        <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">
          star
        </span>
        <div>
          <p className="text-[10px] font-label font-bold uppercase tracking-wider text-primary mb-0.5">
            Top strength
          </p>
          <div className="text-xs text-on-surface leading-relaxed"><Md>{grading.top_strength}</Md></div>
        </div>
      </div>

      {/* Top improvement */}
      <div className="bg-tertiary-container/40 rounded-xl p-3 flex gap-2.5">
        <span className="material-symbols-outlined text-tertiary text-[18px] flex-shrink-0 mt-0.5">
          trending_up
        </span>
        <div>
          <p className="text-[10px] font-label font-bold uppercase tracking-wider text-tertiary mb-0.5">
            Top improvement
          </p>
          <div className="text-xs text-on-surface leading-relaxed"><Md>{grading.top_improvement}</Md></div>
        </div>
      </div>

      {/* What a 5 would look like */}
      <div className="bg-surface-container rounded-xl p-3 flex gap-2.5">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0 mt-0.5">
          emoji_objects
        </span>
        <div>
          <p className="text-[10px] font-label font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">
            What a 5 would look like
          </p>
          <div className="text-xs text-on-surface-variant leading-relaxed"><Md>{grading.what_a_5_would_look_like}</Md></div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {onAskHatch && (
          <button
            onClick={onAskHatch}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-primary text-on-primary text-sm font-label font-semibold hover:bg-primary/90 transition-colors"
            data-testid="hatch-chat-panel"
          >
            <HatchGlyph size={18} state="speaking" className="text-on-primary" />
            Ask Hatch about this
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-full bg-surface-container border border-outline-variant text-sm font-label font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main two-column layout ───────────────────────────────────────────────────

export function CodingFeedback({
  correctness,
  grading,
  isLoadingCorrectness = false,
  isLoadingGrading = false,
  onRetry,
  onAskHatch,
  onNextChallenge,
  submittedCode,
  language,
  isSqlMode = false,
  correctnessError,
  gradingError,
}: CodingFeedbackProps) {
  const allPassed = correctness && correctness.testsTotal > 0 && correctness.testsPassed === correctness.testsTotal

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 shrink-0 rounded-xl border border-outline-variant bg-surface p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`material-symbols-outlined mt-0.5 text-[22px] ${allPassed ? 'text-primary' : 'text-tertiary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {allPassed ? 'verified' : 'rule'}
            </span>
            <div>
              <p className="font-label text-sm font-black text-on-surface">
                {isLoadingGrading ? 'Tests complete. Hatch is reviewing your solution.' : 'Review your result, then choose the next move.'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
                {allPassed
                  ? 'Everything passed. Skim Hatch feedback, then move on or ask for a sharper follow-up.'
                  : 'Use the correctness panel to inspect the failing case, ask Hatch, or return to the editor and rerun.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 font-label text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Back to editor
              </button>
            )}
            {onAskHatch && (
              <button
                type="button"
                onClick={onAskHatch}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-label text-xs font-bold text-on-primary transition-opacity hover:opacity-90"
              >
                <HatchGlyph size={15} state="speaking" className="text-on-primary" />
                Ask Hatch
              </button>
            )}
            {onNextChallenge && (
              <button
                type="button"
                onClick={onNextChallenge}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-fixed px-3 py-1.5 font-label text-xs font-bold text-primary transition-colors hover:bg-primary-container"
              >
                Next challenge
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <SubmittedSolutionPanel code={submittedCode} language={language} isSqlMode={isSqlMode} />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden">
        {/* Left: Correctness column */}
        <div
          className="overflow-y-auto pr-1"
          data-testid="correctness-column"
        >
          <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant mb-3">
            Correctness
          </h3>
          <CorrectnessColumn
            correctness={correctness}
            isLoading={isLoadingCorrectness}
            error={correctnessError}
            isSqlMode={isSqlMode}
          />
        </div>

        {/* Right: Grading column */}
        <div
          className="overflow-y-auto pl-1 border-l border-outline-variant/40"
          data-testid="grading-column"
        >
          <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant mb-3">
            Hatch Grading
          </h3>
          <GradingColumn
            grading={grading}
            isLoading={isLoadingGrading}
            error={gradingError}
            onAskHatch={onAskHatch}
            onRetry={onRetry}
          />
        </div>
      </div>
    </div>
  )
}
