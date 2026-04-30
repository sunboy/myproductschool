'use client'

import { useState } from 'react'
import { Md } from '@/components/ui/Md'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { RunResult, GradingFeedback, GradingDimensionKey } from '@/lib/coding/types'

interface CodingFeedbackProps {
  correctness?: RunResult | null
  grading?: GradingFeedback | null
  isLoadingCorrectness?: boolean
  isLoadingGrading?: boolean
  onRetry?: () => void
  onAskHatch?: () => void
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

// ── Correctness column ───────────────────────────────────────────────────────

function CorrectnessColumn({
  correctness,
  isLoading,
  error,
}: {
  correctness?: RunResult | null
  isLoading?: boolean
  error?: string
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
        {correctness.results.map((result) => {
          const isPassed = result.status === 'passed'
          const isError = result.status === 'error'
          const isTimeout = result.status === 'timeout'

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
                    <span className="italic text-on-surface-variant">{result.label} (hidden)</span>
                  ) : (
                    result.label
                  )}
                </span>
                {/* Error message for visible errors */}
                {!result.hidden && (isError || isTimeout) && result.errorMessage && (
                  <p className="text-[11px] text-error mt-0.5 truncate">{result.errorMessage}</p>
                )}
                {/* Expected / Got for visible failures */}
                {!result.hidden && result.status === 'failed' && result.expected !== undefined && (
                  <div className="mt-1 text-[10px] font-mono space-y-0.5">
                    <div>
                      <span className="text-on-surface-variant">Expected: </span>
                      <span className="text-primary">{JSON.stringify(result.expected)}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Got: </span>
                      <span className="text-error">{JSON.stringify(result.actual)}</span>
                    </div>
                  </div>
                )}
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
    return <div className="text-sm text-on-surface-variant italic">Grading not available yet.</div>
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
  correctnessError,
  gradingError,
}: CodingFeedbackProps) {
  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
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
  )
}
