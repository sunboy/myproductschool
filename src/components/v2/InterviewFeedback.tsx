'use client'

import { useState, useEffect, useRef } from 'react'
import { ScoreHero, DimensionCard, TakeawayCard } from '@/components/feedback'
import Link from 'next/link'
import type { InterviewGrade, ChallengeType } from '@/lib/types'

interface InterviewFeedbackProps {
  grade: InterviewGrade
  challengeType: ChallengeType
  canvasPngUrl?: string | null
  /** Submitted scene elements (canvas_final_snapshot). Rendered as an SVG preview when no PNG exists. */
  canvasElements?: unknown[] | null
  onRetry?: () => void
  onBackToCanvas?: () => void
  /** Next challenge to attempt (origin-preserving href). Primary "what next" CTA. */
  nextChallengeHref?: string | null
  /** Where "Back to practice" lands (origin-aware hub). */
  backToListHref?: string | null
}

/**
 * Renders the submitted drawing from raw Excalidraw elements via exportToSvg.
 * The PNG upload at submit time fails silently for most attempts, so the
 * persisted scene is the reliable way to show the design.
 */
function CanvasSceneSvg({ elements }: { elements: unknown[] }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('@excalidraw/excalidraw')
      .then(async ({ exportToSvg }) => {
        const svg = await exportToSvg({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          elements: elements as any,
          appState: { exportBackground: true, viewBackgroundColor: '#ffffff' },
          files: null,
        })
        if (cancelled || !hostRef.current) return
        svg.style.width = '100%'
        svg.style.height = 'auto'
        svg.style.maxHeight = '16rem'
        hostRef.current.replaceChildren(svg)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [elements])

  if (failed) return null
  return <div ref={hostRef} className="w-full [&_svg]:mx-auto" />
}



// Animated SVG score ring with count-up

// Collapsible dimension tile

export function InterviewFeedback({ grade, challengeType: _challengeType, canvasPngUrl, canvasElements, onRetry, onBackToCanvas, nextChallengeHref, backToListHref }: InterviewFeedbackProps) {
  const [calloutVisible, setCalloutVisible] = useState(false)

  // Lift expanded state up so parent can collapse grid to 1-col when any tile is open
  const dimEntries = Object.entries(grade.dimensions)
  const lowestKey = [...dimEntries].sort(([, a], [, b]) => a.score - b.score)[0]?.[0] ?? ''

  useEffect(() => {
    const t = setTimeout(() => setCalloutVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto font-body">
      <div className="flex flex-col gap-6 p-5 pb-24">

        {/* ── 1. VERDICT — the shared hero (adds Hatch presence) ── */}
        <div className="pt-2">
          <ScoreHero raw={grade.overall_score} scale={5} headline={grade.headline} />
        </div>

        {/* ── 2. CANVAS SNAPSHOT ─────────────────────────────── */}
        {(canvasPngUrl || (canvasElements && canvasElements.length > 0)) && (
          <div className="rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant px-3 py-2 border-b border-outline-variant">
              Your diagram
            </p>
            {canvasPngUrl ? (
              <img
                src={canvasPngUrl}
                alt="Canvas snapshot"
                className="w-full object-contain max-h-64"
              />
            ) : (
              <CanvasSceneSvg elements={canvasElements!} />
            )}
          </div>
        )}

        {/* ── 3. PATH FORWARD CALLOUTS (above dimensions) ────── */}
        {(grade.top_strength || grade.top_improvement) && (
          <div
            className="space-y-3 transition-all duration-500"
            style={{ opacity: calloutVisible ? 1 : 0, transform: calloutVisible ? 'translateY(0)' : 'translateY(12px)' }}
          >
            {grade.top_strength && <TakeawayCard kind="strength" text={grade.top_strength} />}
            {grade.top_improvement && <TakeawayCard kind="fix" text={grade.top_improvement} />}
          </div>
        )}

        {/* ── 4. DIMENSIONS GRID ─────────────────────────────── */}
        {/* Collapse to 1-col when any tile is expanded so heights stay even */}
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Dimensions
          </p>
          <div className="grid gap-3 grid-cols-1">
            {dimEntries.map(([key, dim]) => (
              <DimensionCard
                key={key}
                label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                raw={dim.score}
                scale={5}
                verdict={dim.verdict}
                evidence={dim.evidence}
                holeToPoke={dim.hole_to_poke}
                howToImprove={dim.how_to_improve}
                focus={key === lowestKey}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. STICKY BOTTOM ACTIONS ───────────────────────── */}
      {(nextChallengeHref || backToListHref || onBackToCanvas || onRetry) && (
        <div className="mt-auto pt-4 sticky bottom-0 bg-surface border-t border-outline-variant px-5 pb-5 flex flex-col gap-2">
          {/* Primary "what next": move forward, not just back. */}
          {nextChallengeHref && (
            <Link
              href={nextChallengeHref}
              className="w-full rounded-full bg-primary text-on-primary font-label font-semibold text-sm py-2.5 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 no-underline"
            >
              Next challenge
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          )}
          <div className="flex gap-2">
            {backToListHref && (
              <Link
                href={backToListHref}
                className="flex-1 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant font-label font-semibold text-sm py-2 hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-1.5 no-underline"
              >
                <span className="material-symbols-outlined text-[17px]">grid_view</span>
                Back to practice
              </Link>
            )}
            {onBackToCanvas && (
              <button
                onClick={onBackToCanvas}
                className="flex-1 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant font-label font-semibold text-sm py-2 hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[17px]">edit</span>
                Back to canvas
              </button>
            )}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full rounded-full bg-transparent text-on-surface-variant font-label font-semibold text-sm py-1.5 hover:text-on-surface transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
