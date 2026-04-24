'use client'

import { useState, useEffect, useRef } from 'react'
import type { InterviewGrade, ChallengeType } from '@/lib/types'

interface InterviewFeedbackProps {
  grade: InterviewGrade
  challengeType: ChallengeType
  onRetry?: () => void
  onBackToCanvas?: () => void
}

function scoreColorClasses(score: number) {
  if (score >= 4) return { ring: 'text-primary', bg: 'bg-primary-container', text: 'text-on-primary-container', badge: 'bg-primary text-on-primary' }
  if (score >= 3) return { ring: 'text-tertiary', bg: 'bg-tertiary-container', text: 'text-on-secondary-container', badge: 'bg-tertiary text-on-primary' }
  return { ring: 'text-error', bg: 'bg-secondary-container', text: 'text-on-secondary-container', badge: 'bg-error text-on-primary' }
}

function scoreLabel(score: number) {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Strong'
  if (score >= 2.5) return 'Solid'
  if (score >= 1.5) return 'Developing'
  return 'Needs Work'
}

// Animated SVG score ring with count-up
function ScoreRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  // r=44 inside a 120×120 viewBox gives 16px margin each side — strokeWidth=10 fits cleanly
  const radius = 44
  const circumference = 2 * Math.PI * radius
  // Start fully offset (arc hidden), animate to final fill
  const [dashOffset, setDashOffset] = useState(circumference)
  const colors = scoreColorClasses(score)
  const startRef = useRef<number | null>(null)
  const duration = 600

  useEffect(() => {
    startRef.current = null
    setDisplayed(0)
    setDashOffset(circumference)
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(parseFloat((eased * score).toFixed(1)))
      setDashOffset(circumference * (1 - eased * (score / 5)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [score, circumference])

  return (
    <div className="flex flex-col items-center gap-2 mx-auto">
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            className="stroke-outline-variant"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            className={`stroke-current ${colors.ring}`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'none' }}
          />
        </svg>
        {/* Score number centered inside ring */}
        <div className="flex flex-col items-center justify-center z-10">
          <span className="font-headline text-3xl font-bold text-on-surface leading-none">
            {displayed.toFixed(1)}
          </span>
          <span className="font-label text-xs text-on-surface-variant">/5</span>
        </div>
      </div>
      {/* Score label badge — outside/below the ring */}
      <span className={`font-label text-xs font-semibold px-3 py-1 rounded-full ${colors.badge}`}>
        {scoreLabel(score)}
      </span>
    </div>
  )
}

// Collapsible dimension tile
function DimensionTile({
  dimKey,
  dim,
  expanded,
  onToggle,
  isLowest,
  index,
}: {
  dimKey: string
  dim: { score: number; verdict: string; evidence: string; hole_to_poke: string; how_to_improve: string }
  expanded: boolean
  onToggle: () => void
  isLowest: boolean
  index: number
}) {
  const colors = scoreColorClasses(dim.score)
  const label = dimKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <button
      aria-expanded={expanded}
      onClick={onToggle}
      className={`w-full text-left rounded-xl p-4 transition-all duration-200 animate-step-enter
        ${expanded
          ? 'bg-surface-container-high border border-primary/30 shadow-sm'
          : 'bg-surface-container-low hover:shadow-sm hover:bg-surface-container'
        }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Compact header — always visible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-headline font-semibold text-base text-on-surface truncate tracking-tight">{label}</p>
          {isLowest && !expanded && (
            <span className="font-label text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-tertiary-container text-on-secondary-container shrink-0 whitespace-nowrap">
              Focus area
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${colors.badge}`}>
            {dim.score}<span className="opacity-60 text-[10px] ml-0.5">/5</span>
          </span>
          <span
            className="material-symbols-outlined text-on-surface-variant text-[16px] transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </div>
      </div>
      <p className={`font-body text-sm text-on-surface mt-1.5 leading-relaxed ${expanded ? 'font-medium' : 'line-clamp-1 text-on-surface-variant'}`}>
        {dim.verdict}
      </p>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
      >
        <div className="pt-4 space-y-3 border-t border-outline-variant/40 mt-3">
          {dim.evidence && (
            <blockquote className="border-l-2 border-outline-variant pl-3 py-0.5">
              <p className="text-xs text-on-surface-variant italic font-body leading-relaxed">
                {dim.evidence}
              </p>
            </blockquote>
          )}
          {dim.hole_to_poke && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-tertiary text-[14px]">warning</span>
                <p className="font-label text-[10px] font-bold uppercase tracking-wider text-tertiary">Watch out</p>
              </div>
              <p className="text-sm text-on-surface font-body leading-relaxed pl-[22px]">{dim.hole_to_poke}</p>
            </div>
          )}
          {dim.how_to_improve && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-primary text-[14px]">lightbulb</span>
                <p className="font-label text-[10px] font-bold uppercase tracking-wider text-primary">How to improve</p>
              </div>
              <p className="text-sm text-on-surface font-body leading-relaxed pl-[22px]">{dim.how_to_improve}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export function InterviewFeedback({ grade, challengeType: _challengeType, onRetry, onBackToCanvas }: InterviewFeedbackProps) {
  const [calloutVisible, setCalloutVisible] = useState(false)

  // Lift expanded state up so parent can collapse grid to 1-col when any tile is open
  const dimEntries = Object.entries(grade.dimensions)
  const lowestKey = [...dimEntries].sort(([, a], [, b]) => a.score - b.score)[0]?.[0] ?? ''
  const [expandedKey, setExpandedKey] = useState<string | null>(lowestKey)
  const anyExpanded = expandedKey !== null

  useEffect(() => {
    const t = setTimeout(() => setCalloutVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto font-body">
      <div className="flex flex-col gap-6 p-5 pb-24">

        {/* ── 1. VERDICT ─────────────────────────────────────── */}
        <div className="flex items-center gap-5 pt-2">
          <div className="shrink-0">
            <ScoreRing score={grade.overall_score} />
          </div>
          <h2 className="font-headline text-xl text-on-surface leading-snug">
            {grade.headline}
          </h2>
        </div>

        {/* ── 2. PATH FORWARD CALLOUTS (above dimensions) ────── */}
        {(grade.top_strength || grade.top_improvement) && (
          <div
            className="space-y-3 transition-all duration-500"
            style={{ opacity: calloutVisible ? 1 : 0, transform: calloutVisible ? 'translateY(0)' : 'translateY(12px)' }}
          >
            {grade.top_strength && (
              <div className="rounded-xl bg-primary-container text-on-primary-container p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">check_circle</span>
                <div>
                  <p className="font-label text-xs font-semibold uppercase tracking-wide mb-1">What you got right</p>
                  <p className="font-body text-sm leading-relaxed">{grade.top_strength}</p>
                </div>
              </div>
            )}
            {grade.top_improvement && (
              <div className="rounded-xl bg-tertiary-container text-on-secondary-container p-4 flex gap-3 items-start">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">arrow_forward</span>
                <div>
                  <p className="font-label text-xs font-semibold uppercase tracking-wide mb-1">Focus next time</p>
                  <p className="font-body text-sm leading-relaxed">{grade.top_improvement}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. DIMENSIONS GRID ─────────────────────────────── */}
        {/* Collapse to 1-col when any tile is expanded so heights stay even */}
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Dimensions
          </p>
          <div className={`grid gap-3 ${anyExpanded ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {dimEntries.map(([key, dim], i) => (
              <DimensionTile
                key={key}
                dimKey={key}
                dim={dim}
                expanded={expandedKey === key}
                onToggle={() => setExpandedKey(prev => prev === key ? null : key)}
                isLowest={key === lowestKey}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. STICKY BOTTOM ACTIONS ───────────────────────── */}
      {(onBackToCanvas || onRetry) && (
        <div className="mt-auto pt-4 sticky bottom-0 bg-surface border-t border-outline-variant px-5 pb-5 flex flex-col gap-2">
          {onBackToCanvas && (
            <button
              onClick={onBackToCanvas}
              className="w-full rounded-full bg-primary text-on-primary font-label font-semibold text-sm py-2.5 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to canvas
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full rounded-full bg-transparent text-on-surface-variant font-label font-semibold text-sm py-2 hover:text-on-surface transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
