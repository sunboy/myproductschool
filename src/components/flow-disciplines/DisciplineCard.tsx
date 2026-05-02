'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { TraditionGlyph } from './shared/TraditionGlyph'
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

const NODE_XS = [40, 145, 251, 356]
const STEP_LABELS = ['F', 'L', 'O', 'W']

export function DisciplineCard({
  initialDiscipline = 'product_sense',
  autoRotate = true,
  rotationIntervalMs = 14000,
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
  const [currentIdx, setCurrentIdx] = useState(Math.max(0, initialIdx))
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [reasoningText, setReasoningText] = useState(ALL_DISCIPLINES[Math.max(0, initialIdx)].steps[0].reasoningMove)
  const [isVisible, setIsVisible] = useState(true)
  const currentIdxRef = useRef(currentIdx)
  currentIdxRef.current = currentIdx

  const currentDiscipline: Discipline = ALL_DISCIPLINES[currentIdx]

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const burstNode = useCallback((stepIdx: number, discipline: Discipline) => {
    if (prefersReducedMotion()) return
    setReasoningText(discipline.steps[stepIdx]?.reasoningMove ?? '')
  }, [prefersReducedMotion])

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

    tl.set([glow, core, trail], { attr: { cx: NODE_XS[0] } })
    tl.call(() => burstNode(0, ALL_DISCIPLINES[currentIdxRef.current]))
    tl.to({}, { duration: 1.3 })

    for (let i = 1; i < 4; i++) {
      const stepIdx = i
      tl.to([glow, core], {
        attr: { cx: NODE_XS[stepIdx] },
        duration: 0.85,
        ease: 'power2.inOut',
      })
      tl.to(trail, {
        attr: { cx: NODE_XS[stepIdx] },
        duration: 0.95,
        ease: 'power3.out',
      }, '<0.05')
      tl.call(() => burstNode(stepIdx, ALL_DISCIPLINES[currentIdxRef.current]))
      tl.to({}, { duration: 1.3 })
    }

    tl.to([glow, core, trail], { opacity: 0, duration: 0.25, ease: 'power2.in' })
    tl.set([glow, core, trail], { attr: { cx: NODE_XS[0] } })
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

  const glyphIds = currentDiscipline.traditions.map(t => t.glyph as 0 | 1 | 2 | 3 | 4 | 5 | 6)

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label="Open FLOW framework explorer"
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
        minHeight: 300,
        padding: '28px 32px 24px',
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

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-5">
        <div className="flex flex-col">
          <div
            className="font-label font-medium uppercase mb-1.5"
            style={{
              fontFamily: 'monospace',
              fontSize: 9.5,
              color: '#d4a574',
              letterSpacing: '2.4px',
              opacity: 0.85,
            }}
          >
            DISCIPLINE
          </div>
          <div
            className="font-headline font-medium transition-opacity duration-300"
            style={{
              fontSize: 26,
              color: '#f5f0e6',
              letterSpacing: '0.3px',
              lineHeight: 1,
              opacity: isVisible ? 1 : 0,
            }}
          >
            {currentDiscipline.name}
          </div>
          <div
            className="mt-2 transition-opacity duration-300"
            style={{
              fontStyle: 'italic',
              fontSize: 12.5,
              color: 'rgba(245, 240, 230, 0.55)',
              opacity: isVisible ? 1 : 0,
            }}
          >
            {currentDiscipline.tagline}
          </div>
        </div>

        {/* Indicator dots */}
        <div className="flex gap-1.5 items-center pt-2.5">
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
      </div>

      {/* Glyph row */}
      <div className="relative z-10 flex justify-center gap-4 mb-2" style={{ height: 26, alignItems: 'center' }}>
        {glyphIds.slice(0, 7).map((glyphIdx, i) => (
          <div
            key={i}
            className="transition-opacity duration-700"
            style={{ opacity: isVisible ? 0.7 : 0 }}
          >
            <TraditionGlyph
              index={glyphIdx}
              size={22}
              className="text-amber-400"
            />
          </div>
        ))}
      </div>

      {/* FLOW circuit */}
      <div className="relative z-10 w-full" style={{ height: 70, margin: '6px 0 14px' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 396 70"
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
          <line x1="40" y1="35" x2="356" y2="35" stroke="#d4a574" strokeWidth="8" opacity="0.10" filter="url(#dc-softGlow)" />
          <line x1="40" y1="35" x2="356" y2="35" stroke="#d4a574" strokeWidth="2" opacity="0.42" />
          <line x1="40" y1="35" x2="356" y2="35" stroke="#fff8e8" strokeWidth="0.6" opacity="0.55" />

          {/* Pulse elements */}
          <circle ref={pulseTrailRef} cx="40" cy="35" r="14" fill="url(#dc-pulseGrad)" opacity="0.5" filter="url(#dc-strongGlow)" />
          <circle ref={pulseGlowRef} cx="40" cy="35" r="9" fill="url(#dc-pulseGrad)" />
          <circle ref={pulseCoreRef} cx="40" cy="35" r="2.2" fill="#fff8e8" />

          {/* Nodes */}
          {NODE_XS.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="35" r="15" fill="#1f362d" stroke="#d4a574" strokeWidth="1.4" />
              <text
                x={x}
                y="39"
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="11"
                fontWeight="500"
                fill="#d4a574"
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
              y="60"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="8"
              fill="#d4a574"
              opacity="0.55"
              letterSpacing="1.5"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* Reasoning text */}
      <div
        className="relative z-10 text-center"
        style={{
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.45,
          color: '#f5f0e6',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
        }}
      >
        <span className="transition-opacity duration-300" style={{ opacity: isVisible ? 0.92 : 0 }}>
          {reasoningText}
        </span>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-5 left-8 right-8 flex justify-between items-center z-10"
        style={{
          fontFamily: 'monospace',
          fontSize: 9.5,
          color: 'rgba(245, 240, 230, 0.55)',
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          paddingTop: 14,
          borderTop: '1px solid rgba(212, 165, 116, 0.18)',
        }}
      >
        <div className="flex gap-2.5 items-center">
          <span>{currentDiscipline.traditions.length} TRADITIONS</span>
          <div
            className="rounded-full"
            style={{ width: 3, height: 3, background: '#d4a574', opacity: 0.7 }}
          />
          <span>{currentDiscipline.competencies.length} COMPETENCIES</span>
        </div>
        <div
          className="flex items-center gap-1.5 transition-all duration-300"
          style={{ color: '#d4a574', gap: isHovered ? 10 : 6 }}
        >
          <span>EXPLORE</span>
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
