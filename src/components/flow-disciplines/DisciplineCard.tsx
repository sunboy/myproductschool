'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ALL_DISCIPLINES } from '@/lib/data/flow-framework'
import type { DisciplineId } from '@/lib/data/flow-framework/types'
import type { Discipline } from '@/lib/data/flow-framework/types'

interface DisciplineCardProps {
  initialDiscipline?: DisciplineId
  autoRotate?: boolean
  rotationIntervalMs?: number
  onClick?: (currentDiscipline: DisciplineId) => void
  className?: string
}

const NODE_XS = [45, 165, 285, 405]
const STEP_LABELS = ['F', 'L', 'O', 'W']

export function DisciplineCard({
  initialDiscipline = 'product_sense',
  autoRotate = true,
  rotationIntervalMs = 28000,
  onClick,
  className = '',
}: DisciplineCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pulseGlowRef = useRef<SVGCircleElement>(null)
  const pulseCoreRef = useRef<SVGCircleElement>(null)
  const pulseTrailRef = useRef<SVGCircleElement>(null)
  const breathingTweenRef = useRef<gsap.core.Tween | null>(null)
  const pulseTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initialIdx = ALL_DISCIPLINES.findIndex(d => d.id === initialDiscipline)
  const initialResolvedIdx = Math.max(0, initialIdx)
  const initialResolvedDiscipline = ALL_DISCIPLINES[initialResolvedIdx]
  const [currentIdx, setCurrentIdx] = useState(Math.max(0, initialIdx))
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [reasoningText, setReasoningText] = useState(initialResolvedDiscipline.learnerExplanation.stepMeanings.F)
  const [isVisible, setIsVisible] = useState(true)
  const currentIdxRef = useRef(currentIdx)
  currentIdxRef.current = currentIdx

  const currentDiscipline: Discipline = ALL_DISCIPLINES[currentIdx]
  const activeStep = currentDiscipline.steps[activeStepIdx] ?? currentDiscipline.steps[0]

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const burstNode = useCallback((stepIdx: number, discipline: Discipline) => {
    if (prefersReducedMotion()) return
    const step = discipline.steps[stepIdx] ?? discipline.steps[0]
    setActiveStepIdx(stepIdx)
    setReasoningText(discipline.learnerExplanation.stepMeanings[step.id])
  }, [prefersReducedMotion])

  useEffect(() => {
    const step = currentDiscipline.steps[activeStepIdx] ?? currentDiscipline.steps[0]
    setReasoningText(currentDiscipline.learnerExplanation.stepMeanings[step.id])
  }, [activeStepIdx, currentDiscipline])

  const buildPulseTimeline = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (prefersReducedMotion()) return null

    const gsap = (window as typeof window & { gsap?: typeof import('gsap').gsap }).gsap
    if (!gsap) return null

    const glow = pulseGlowRef.current
    const core = pulseCoreRef.current
    const trail = pulseTrailRef.current
    if (!glow || !core || !trail) return null

    let cycleCount = 0

    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        cycleCount++
        if (cycleCount >= 2) {
          cycleCount = 0
          setCurrentIdx(prev => {
            const next = (prev + 1) % ALL_DISCIPLINES.length
            return next
          })
        }
      },
    })

    tl.set([glow, core, trail], { attr: { cx: NODE_XS[0], cy: 45 } })
    tl.call(() => burstNode(0, ALL_DISCIPLINES[currentIdxRef.current]))
    tl.to({}, { duration: 3.0 })

    for (let i = 1; i < 4; i++) {
      const stepIdx = i
      tl.to([glow, core], {
        attr: { cx: NODE_XS[stepIdx] },
        duration: 1.8,
        ease: 'power2.inOut',
      })
      tl.to(trail, {
        attr: { cx: NODE_XS[stepIdx] },
        duration: 2.0,
        ease: 'power3.out',
      }, '<0.05')
      tl.call(() => burstNode(stepIdx, ALL_DISCIPLINES[currentIdxRef.current]))
      tl.to({}, { duration: 3.0 })
    }

    tl.to([glow, core, trail], { opacity: 0, duration: 0.25, ease: 'power2.in' })
    tl.set([glow, core, trail], { attr: { cx: NODE_XS[0], cy: 45 } })
    tl.to([glow, core], { opacity: 1, duration: 0.25, ease: 'power2.out' })
    tl.to(trail, { opacity: 0.5, duration: 0.25, ease: 'power2.out' }, '<')

    return tl
  }, [burstNode, prefersReducedMotion])

  // GSAP init
  useEffect(() => {
    if (typeof window === 'undefined') return

    let gsapLoaded = false

    const initGSAP = async () => {
      const gsapInstance = (window as typeof window & { gsap?: typeof import('gsap').gsap }).gsap
      if (!gsapInstance || gsapLoaded) return
      gsapLoaded = true

      if (cardRef.current && !prefersReducedMotion()) {
        breathingTweenRef.current = gsapInstance.to(cardRef.current, {
          scale: 1.006,
          duration: 4.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      }

      setTimeout(() => {
        pulseTimelineRef.current = buildPulseTimeline()
      }, 400)
    }

    // GSAP is loaded via CDN in the card layout / or we can import it
    const checkGSAP = setInterval(() => {
      if ((window as typeof window & { gsap?: unknown }).gsap) {
        clearInterval(checkGSAP)
        initGSAP()
      }
    }, 100)

    // Also try importing
    import('gsap').then(({ gsap }) => {
      ;(window as typeof window & { gsap?: unknown }).gsap = gsap
      clearInterval(checkGSAP)
      if (!gsapLoaded) initGSAP()
    }).catch(() => {})

    return () => {
      clearInterval(checkGSAP)
      breathingTweenRef.current?.kill()
      pulseTimelineRef.current?.kill()
    }
  }, [buildPulseTimeline, prefersReducedMotion])

  // Hover/focus: slow pulse
  useEffect(() => {
    if (pulseTimelineRef.current) {
      pulseTimelineRef.current.timeScale(isHovered || isFocused ? 0.4 : 1)
    }
  }, [isHovered, isFocused])

  // Auto-rotate timer (separate from pulse, as fallback / sync)
  useEffect(() => {
    if (!autoRotate || prefersReducedMotion()) return
    if (isHovered || isFocused) return

    rotationTimerRef.current = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % ALL_DISCIPLINES.length)
        setIsVisible(true)
      }, 300)
    }, rotationIntervalMs)

    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current)
    }
  }, [autoRotate, rotationIntervalMs, isHovered, isFocused, prefersReducedMotion])

  const handleClick = () => {
    onClick?.(currentDiscipline.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label="Open FLOW discipline map"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`relative rounded-[18px] cursor-pointer overflow-hidden select-none transition-shadow duration-500 ${className}`}
      style={{
        background: 'linear-gradient(155deg, #1f362d 0%, #2d4a3e 60%, #18302a 100%)',
        border: '1px solid rgba(212, 165, 116, 0.18)',
        boxShadow: isHovered
          ? '0 0 0 1px rgba(212, 165, 116, 0.08), 0 30px 80px -30px rgba(0,0,0,0.85), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 0 0 1px rgba(212, 165, 116, 0.04), 0 30px 80px -30px rgba(0,0,0,0.85), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        width: '100%',
        minHeight: 0,
        padding: '22px 32px 20px',
        willChange: 'transform',
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          left: '10%',
          right: '10%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.5), transparent)',
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-[18px] pointer-events-none transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(212, 165, 116, 0.45) 0%, transparent 55%)',
          opacity: isHovered ? 0.35 : 0,
        }}
      />

      {/* Indicator dots — top right */}
      <div className="absolute top-4 right-6 flex gap-1.5 items-center z-10">
        {ALL_DISCIPLINES.map((d, i) => (
          <div
            key={d.id}
            className="rounded-full transition-all duration-500"
            style={{
              width: 5,
              height: 5,
              background: i === currentIdx ? '#d4a574' : 'rgba(212, 165, 116, 0.22)',
              boxShadow: i === currentIdx ? '0 0 8px rgba(212, 165, 116, 0.45), 0 0 2px #d4a574' : 'none',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center" style={{ minHeight: 168 }}>
        {/* Left: explanation column */}
        <div className="flex flex-col justify-center shrink-0 md:w-[35%]" style={{ paddingRight: 16 }}>
          <div
            className="font-label font-medium uppercase mb-2"
            style={{
              fontFamily: 'monospace',
              fontSize: 9.5,
              color: '#d4a574',
              letterSpacing: '2px',
              opacity: 0.85,
            }}
          >
            FLOW across disciplines
          </div>
          <div
            className="font-headline font-medium transition-opacity duration-300"
            style={{
              fontSize: 25,
              color: '#f5f0e6',
              letterSpacing: 0,
              lineHeight: 1.05,
              opacity: isVisible ? 1 : 0,
            }}
          >
            One reasoning loop. Different interview arenas.
          </div>
          <div
            className="mt-3 transition-opacity duration-300"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(245, 240, 230, 0.68)',
              opacity: isVisible ? 1 : 0,
            }}
          >
            <span style={{ color: '#ffc580', fontWeight: 700 }}>{currentDiscipline.name}:</span>{' '}
            {currentDiscipline.learnerExplanation.plainPurpose}
          </div>
        </div>

        {/* Right: circuit + reasoning */}
        <div className="flex flex-col flex-1 min-w-0" style={{ paddingLeft: 8 }}>
          {/* FLOW circuit */}
          <div className="relative w-full" style={{ height: 110 }}>
            <svg
              ref={svgRef}
              viewBox="0 0 450 118"
              preserveAspectRatio="xMidYMid meet"
              width="100%"
              height="100%"
              aria-hidden="true"
              style={{ overflow: 'visible', display: 'block' }}
            >
              <defs>
                <radialGradient id="dc-pulseGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="35%" stopColor="#ffc580" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#d4a574" stopOpacity="0" />
                </radialGradient>
                <filter id="dc-softGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="3" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="dc-strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>

              {/* Fiber optic line */}
              <line x1="45" y1="45" x2="405" y2="45" stroke="#d4a574" strokeWidth="8" opacity="0.10" filter="url(#dc-softGlow)" />
              <line x1="45" y1="45" x2="405" y2="45" stroke="#d4a574" strokeWidth="2" opacity="0.42" />
              <line x1="45" y1="45" x2="405" y2="45" stroke="#fff8e8" strokeWidth="0.6" opacity="0.55" />

              {/* Pulse elements */}
              <circle ref={pulseTrailRef} cx="45" cy="45" r="28" fill="url(#dc-pulseGrad)" opacity="0.5" filter="url(#dc-strongGlow)" />
              <circle ref={pulseGlowRef} cx="45" cy="45" r="18" fill="url(#dc-pulseGrad)" />
              <circle ref={pulseCoreRef} cx="45" cy="45" r="4.4" fill="#fff8e8" />

              {/* Nodes */}
              {NODE_XS.map((x, i) => (
                <g key={i}>
                  <circle
                    cx={x}
                    cy="45"
                    r="30"
                    fill="#1f362d"
                    stroke={activeStepIdx === i ? '#ffc580' : '#d4a574'}
                    strokeWidth={activeStepIdx === i ? '2' : '1.4'}
                    opacity={activeStepIdx === i ? '1' : '0.78'}
                  />
                  <text
                    x={x}
                    y="53"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="22"
                    fontWeight="700"
                    fill={activeStepIdx === i ? '#ffc580' : '#d4a574'}
                    letterSpacing="0.5"
                  >
                    {STEP_LABELS[i]}
                  </text>
                </g>
              ))}

              {/* Step labels under nodes */}
              {[
                { x: NODE_XS[0], label: 'FRAME' },
                { x: NODE_XS[1], label: 'LIST' },
                { x: NODE_XS[2], label: 'OPTIMIZE' },
                { x: NODE_XS[3], label: 'WIN' },
              ].map(({ x, label }) => (
                <text
                  key={label}
                  x={x}
                  y="93"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="16"
                  fontWeight="600"
                  fill="#d4a574"
                  opacity={activeStep?.name.toUpperCase() === label ? '0.95' : '0.68'}
                  letterSpacing="1.5"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>

          {/* Step meaning */}
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: '#f5f0e6',
              minHeight: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span className="transition-opacity duration-300" style={{ opacity: isVisible ? 0.88 : 0 }}>
              <span style={{ color: '#ffc580', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: 1.2 }}>
                {activeStep.name}
              </span>
              <span style={{ color: 'rgba(245,240,230,0.45)' }}> - </span>
              {reasoningText}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 mt-5 flex flex-wrap justify-between gap-3 items-center"
        style={{
          fontFamily: 'monospace',
          fontSize: 9.5,
          color: 'rgba(245, 240, 230, 0.55)',
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
        }}
      >
        <div className="flex gap-2 items-center">
          <span>SOURCES</span>
          <span style={{ color: '#d4a574', opacity: 0.72 }}>→</span>
          <span>SKILLS</span>
          <span style={{ color: '#d4a574', opacity: 0.72 }}>→</span>
          <span>FLOW MOVES</span>
        </div>
        <div
          className="flex items-center gap-1.5 transition-all duration-300"
          style={{ color: '#d4a574', gap: isHovered ? 10 : 6 }}
        >
          <span>OPEN MAP</span>
          <svg
            width="14"
            height="9"
            viewBox="0 0 14 9"
            fill="none"
            style={{ transform: isHovered ? 'translateX(2px)' : 'none', transition: 'transform 0.3s ease' }}
          >
            <path
              d="M1 4.5H13M13 4.5L9.5 1M13 4.5L9.5 8"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
