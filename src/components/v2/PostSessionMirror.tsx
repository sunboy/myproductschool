'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

// ── Types ────────────────────────────────────────────────────────────────────

export interface StepResult {
  step: 'frame' | 'list' | 'optimize' | 'win'
  score: number          // 0-3 (max 3)
  quality_label: string  // 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
  confidence: number | null  // 0-3
  reasoning: string      // user's reasoning text (may be empty)
  competency_signal?: {
    primary: string
    signal: string
    framework_hint: string
  }
}

export interface CompetencyDelta {
  competency: string       // e.g. 'motivation_theory', 'cognitive_empathy', etc.
  before: number           // 0-100 score
  after: number            // 0-100 score
  direction: 'up' | 'down' | 'flat'
}

interface PostSessionMirrorProps {
  challengeTitle: string
  totalScore: number       // 0-12 (4 steps × max 3)
  xpAwarded: number
  stepResults: StepResult[]  // exactly 4 items (frame/list/optimize/win)
  competencyDeltas: CompetencyDelta[]  // may be empty initially
  onRunAnother: () => void
  onDashboard: () => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const CONF_LABELS = ['Guessing', 'Not sure', 'Fairly sure', 'Rock solid']

const STEP_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const STEP_COMPETENCIES: Record<string, string> = {
  frame: 'Motivation Theory / Cognitive Empathy',
  list: 'Cognitive Empathy / Creative Execution',
  optimize: 'Taste / Strategic Thinking',
  win: 'Strategic Thinking / Domain Expertise',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCalibrationInsight(counts: {
  confCorrect: number
  confWrong: number
  uncertCorrect: number
  uncertWrong: number
}): string {
  if (counts.confCorrect === 4) return 'Rock solid and right. Your confidence was well-placed.'
  if (counts.confWrong >= 2) return 'You were confident but missed — high-value patterns to revisit.'
  if (counts.uncertCorrect >= 2) return 'You got it right but doubted yourself. Trust the instinct more.'
  if (counts.confCorrect >= 2 && counts.confWrong === 0) return 'Clean calibration — confidence matched accuracy.'
  return 'Mixed signals. Keep practicing to sharpen your calibration.'
}

function formatCompetencyName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

// ── Component ────────────────────────────────────────────────────────────────

export function PostSessionMirror({
  challengeTitle,
  totalScore,
  xpAwarded,
  stepResults,
  competencyDeltas,
  onRunAnother,
  onDashboard,
}: PostSessionMirrorProps) {
  // Score
  const scorePercent = Math.round((totalScore / 12) * 100)
  const scoreLabel =
    scorePercent >= 75 ? 'Sharp' :
    scorePercent >= 50 ? 'Solid' :
    scorePercent >= 25 ? 'Surface' :
    'Needs work'

  // Calibration counts
  const calibCounts = {
    confCorrect:   stepResults.filter(s => (s.confidence ?? 0) >= 2 && s.quality_label === 'best').length,
    confWrong:     stepResults.filter(s => (s.confidence ?? 0) >= 2 && s.quality_label !== 'best').length,
    uncertCorrect: stepResults.filter(s => (s.confidence ?? 0) < 2  && s.quality_label === 'best').length,
    uncertWrong:   stepResults.filter(s => (s.confidence ?? 0) < 2  && s.quality_label !== 'best').length,
  }
  const calibInsight = getCalibrationInsight(calibCounts)
  const calibCells = [
    { count: calibCounts.confCorrect,   label: 'Confident + Right',  accent: 'text-primary' },
    { count: calibCounts.confWrong,     label: 'Confident + Wrong',  accent: 'text-error' },
    { count: calibCounts.uncertCorrect, label: 'Uncertain + Right',  accent: 'text-tertiary' },
    { count: calibCounts.uncertWrong,   label: 'Uncertain + Wrong',  accent: 'text-on-surface-variant' },
  ]

  // ── Refs ──────────────────────────────────────────────────────────────────
  const mirrorRef    = useRef<HTMLElement>(null)
  const heroRef      = useRef<HTMLDivElement>(null)
  const headlineRef  = useRef<HTMLHeadingElement>(null)
  const accentRef    = useRef<HTMLDivElement>(null)
  const calibRef     = useRef<HTMLDivElement>(null)
  const stepsRef     = useRef<HTMLDivElement>(null)
  const patternsRef  = useRef<HTMLDivElement>(null)
  const footerRef    = useRef<HTMLDivElement>(null)

  const counterRefs    = useRef<(HTMLSpanElement | null)[]>([])
  const stepRowRefs    = useRef<(HTMLDivElement | null)[]>([])
  const patternRowRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Set initial hidden states before building timeline
    gsap.set([heroRef.current, calibRef.current, stepsRef.current, footerRef.current], {
      opacity: 0,
      y: 20,
    })
    if (accentRef.current) {
      gsap.set(accentRef.current, { scaleX: 0, transformOrigin: 'left center' })
    }
    if (competencyDeltas.length > 0 && patternsRef.current) {
      gsap.set(patternsRef.current, { opacity: 0, y: 20 })
    }

    const stepRows = stepRowRefs.current.filter(Boolean) as HTMLDivElement[]
    const patternRows = patternRowRefs.current.filter(Boolean) as HTMLDivElement[]

    gsap.set(stepRows, { opacity: 0, y: 8 })
    gsap.set(patternRows, { opacity: 0, y: 8 })

    const tl = gsap.timeline()

    // Hero in
    tl.to(heroRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })

    // Accent bar reveal
    tl.to(accentRef.current, {
      scaleX: 1,
      duration: 0.4,
      ease: 'power2.out',
      transformOrigin: 'left center',
    }, '-=0.2')

    // Calibration section in
    tl.to(calibRef.current, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')

    // Count-up animation for each calibration counter
    calibCells.forEach((cell, i) => {
      const el = counterRefs.current[i]
      if (!el) return
      const proxy = { val: 0 }
      tl.to(proxy, {
        val: cell.count,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = String(Math.round(proxy.val))
        },
      }, '-=0.3')
    })

    // Steps section
    tl.to(stepsRef.current, { opacity: 1, y: 0, duration: 0.4 }, '+=0.1')
    tl.to(stepRows, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, '-=0.2')

    // Patterns section (only if there are deltas)
    if (competencyDeltas.length > 0 && patternsRef.current) {
      tl.to(patternsRef.current, { opacity: 1, y: 0, duration: 0.4 }, '+=0.1')
      tl.to(patternRows, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, '-=0.2')
    }

    // Footer
    tl.to(footerRef.current, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')

    return () => { tl.kill() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      ref={mirrorRef}
      className="w-full min-h-screen bg-background overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">

        {/* ── HERO BLOCK ──────────────────────────────────────────────── */}
        <div ref={heroRef}>
          <p className="font-label text-on-surface-variant text-sm uppercase tracking-widest mb-2">
            Session complete
          </p>

          <div className="flex items-start gap-4 mb-1">
            <div className="flex-1">
              <h1
                ref={headlineRef}
                className="font-headline text-3xl text-on-surface"
              >
                Here&apos;s what moved
              </h1>
            </div>
            <LumaGlyph size={48} state="celebrating" className="text-primary shrink-0" />
          </div>

          {/* Accent bar */}
          <div
            ref={accentRef}
            className="w-10 h-1 bg-primary rounded-full mb-6"
          />

          {/* Challenge title */}
          <p className="font-body text-on-surface-variant mb-4">
            {challengeTitle}
          </p>

          {/* Score badge */}
          <div className="inline-flex items-center gap-3 bg-surface-container rounded-xl px-5 py-3">
            <div className="flex flex-col">
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                Score
              </span>
              <span className="font-headline text-2xl text-on-surface tabular-nums">
                {totalScore}
                <span className="text-on-surface-variant text-base font-body">/12</span>
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/40" />
            <div className="flex flex-col">
              <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                Grade
              </span>
              <span className={`font-headline text-2xl ${
                scorePercent >= 75 ? 'text-primary' :
                scorePercent >= 50 ? 'text-tertiary' :
                'text-on-surface-variant'
              }`}>
                {scoreLabel}
              </span>
            </div>
            {/* Score fill bar */}
            <div className="flex-1 ml-2">
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(4, scorePercent)}%` }}
                />
              </div>
              <p className="font-label text-xs text-on-surface-variant mt-1 text-right">
                {scorePercent}%
              </p>
            </div>
          </div>
        </div>

        {/* ── CALIBRATION MATRIX ─────────────────────────────────────── */}
        <div ref={calibRef}>
          <h2 className="font-headline text-xl text-on-surface mb-4">Calibration</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {calibCells.map((cell, i) => (
              <div
                key={cell.label}
                className="bg-surface-container rounded-xl p-5 flex items-center gap-4"
              >
                <span
                  ref={el => { counterRefs.current[i] = el }}
                  className={`font-headline text-4xl tabular-nums ${cell.accent}`}
                >
                  {cell.count}
                </span>
                <span className="font-body text-sm text-on-surface-variant leading-snug">
                  {cell.label}
                </span>
              </div>
            ))}
          </div>

          <p className="font-body text-sm text-on-surface-variant bg-surface-container-low rounded-lg px-4 py-3 border border-outline-variant/30">
            {calibInsight}
          </p>
        </div>

        {/* ── PER-STEP MENTAL MODELS BREAKDOWN ──────────────────────── */}
        <div ref={stepsRef}>
          <h2 className="font-headline text-xl text-on-surface mb-4">Step by step</h2>

          <div className="flex flex-col gap-3">
            {stepResults.map((result, i) => {
              const isCorrect = result.quality_label === 'best'
              const confLabel = CONF_LABELS[result.confidence ?? 0]

              return (
                <div
                  key={result.step}
                  ref={el => { stepRowRefs.current[i] = el }}
                  className="bg-surface-container rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Step pill */}
                    <span className="bg-primary-container text-on-primary-container rounded-full px-3 py-1 font-label text-sm shrink-0">
                      {STEP_LABELS[result.step] ?? result.step}
                    </span>

                    {/* Result indicator */}
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${isCorrect ? 'text-primary' : 'text-tertiary'}`}
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      {isCorrect ? 'check_circle' : 'cancel'}
                    </span>

                    {/* Score */}
                    <span className="font-label text-sm text-on-surface tabular-nums">
                      {result.score}/3
                    </span>

                    {/* Confidence */}
                    <span className="font-label text-xs text-on-surface-variant bg-surface-container-high rounded-full px-2.5 py-0.5">
                      {confLabel}
                    </span>
                  </div>

                  {/* Competency label */}
                  <p className="font-label text-xs text-on-surface-variant mt-2">
                    {STEP_COMPETENCIES[result.step]}
                  </p>

                  {/* Framework hint */}
                  {result.competency_signal?.framework_hint && (
                    <p className="font-body text-xs italic text-on-surface-variant mt-1.5 border-l-2 border-outline-variant/40 pl-3">
                      {result.competency_signal.framework_hint}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PATTERNS IN MOTION ────────────────────────────────────── */}
        {competencyDeltas.length > 0 && (
          <div ref={patternsRef}>
            <h2 className="font-headline text-xl text-on-surface mb-4">Patterns in motion</h2>

            <div className="flex flex-col gap-3">
              {competencyDeltas.map((delta, i) => {
                const directionChip =
                  delta.direction === 'up'
                    ? { cls: 'bg-primary/10 text-primary', label: '↑ Improving' }
                    : delta.direction === 'down'
                    ? { cls: 'bg-error/10 text-error', label: '↓ Watch this' }
                    : { cls: 'bg-surface-container text-on-surface-variant', label: '→ Holding' }

                const afterColor =
                  delta.direction === 'up'
                    ? 'text-primary'
                    : delta.direction === 'down'
                    ? 'text-tertiary'
                    : 'text-on-surface-variant'

                return (
                  <div
                    key={delta.competency}
                    ref={el => { patternRowRefs.current[i] = el }}
                    className="bg-surface-container rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-label text-sm text-on-surface">
                        {formatCompetencyName(delta.competency)}
                      </span>
                      <span className="font-body text-xs text-on-surface-variant tabular-nums">
                        {delta.before}
                        <span className="mx-1.5 text-outline-variant">→</span>
                        <span className={afterColor}>{delta.after}</span>
                      </span>
                    </div>

                    <span className={`text-xs rounded-full px-2 py-0.5 font-label shrink-0 ${directionChip.cls}`}>
                      {directionChip.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <div
          ref={footerRef}
          className="flex items-center gap-3 pt-4 border-t border-outline-variant flex-wrap"
        >
          {/* XP badge */}
          <span className="bg-tertiary/10 text-tertiary rounded-full px-4 py-1.5 font-label text-sm">
            +{xpAwarded} XP
          </span>

          <div className="flex-1" />

          {/* Run another */}
          <button
            onClick={onRunAnother}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            Run another
          </button>

          {/* Dashboard */}
          <button
            onClick={onDashboard}
            className="bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
          >
            Dashboard
          </button>
        </div>

      </div>
    </section>
  )
}
