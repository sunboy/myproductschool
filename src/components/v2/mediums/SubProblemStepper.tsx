'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { AnalyticsSubProblem, SubProblemKind } from './types'

interface SubProblemStepperProps {
  subProblems: AnalyticsSubProblem[]
  activeIdx: number
  completedIds: Set<string>
  onStepClick?: (idx: number) => void
}

const KIND_ICONS: Record<SubProblemKind, string> = {
  connect:  'database',
  analyze:  'query_stats',
  segment:  'splitscreen',
  skill:    'construction',
}

const KIND_COLORS: Record<SubProblemKind, string> = {
  connect: '#4a7c59',
  analyze: '#1565c0',
  segment: '#ad1457',
  skill:   '#705c30',
}

export function SubProblemStepper({
  subProblems,
  activeIdx,
  completedIds,
  onStepClick,
}: SubProblemStepperProps) {
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevIdxRef = useRef<number>(activeIdx)

  // Animate on step change — GSAP verbatim from FlowStepper
  useEffect(() => {
    if (prevIdxRef.current === activeIdx) return
    const prevIdx = prevIdxRef.current
    prevIdxRef.current = activeIdx

    // 1. Pop the newly completed dot
    const completedDot = dotRefs.current[prevIdx]
    if (completedDot) {
      gsap.timeline()
        .to(completedDot, { scale: 1.35, duration: 0.18, ease: 'power2.out' })
        .to(completedDot, { scale: 1, duration: 0.22, ease: 'elastic.out(1.2, 0.5)' })
    }

    // 2. Fill the connector between prevIdx and activeIdx
    const connector = connectorRefs.current[prevIdx]
    if (connector) {
      gsap.fromTo(connector,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.35, ease: 'power2.inOut', delay: 0.15 }
      )
    }

    // 3. Slide the new active dot in
    const newDot = dotRefs.current[activeIdx]
    if (newDot) {
      gsap.fromTo(newDot,
        { scale: 0.7, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.8)', delay: 0.2 }
      )
    }
  }, [activeIdx])

  // Mount stagger
  useEffect(() => {
    const dots = dotRefs.current.filter(Boolean)
    if (dots.length) {
      gsap.fromTo(dots,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 6 }}>
      {subProblems.map((sp, idx) => {
        const isDone = completedIds.has(sp.id)
        const isCurrent = idx === activeIdx
        const isPending = !isDone && !isCurrent
        const isClickable = isDone && !!onStepClick
        const color = KIND_COLORS[sp.kind]

        function hexToRgb(hex: string) {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return `${r},${g},${b}`
        }

        const dot = (
          <div
            ref={el => { dotRefs.current[idx] = el }}
            style={{
              width: 26, height: 26, borderRadius: 999, flexShrink: 0,
              background: isCurrent ? color : isDone ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
              color: isCurrent || isDone ? '#fff' : 'var(--color-on-surface-variant)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: isCurrent ? `2px solid rgba(${hexToRgb(color)},0.25)` : '2px solid transparent',
              boxShadow: isCurrent ? `0 0 0 4px rgba(${hexToRgb(color)},0.14)` : 'none',
              transition: 'background 250ms, box-shadow 250ms, border-color 250ms',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 500" }}
            >
              {isDone ? 'check' : KIND_ICONS[sp.kind]}
            </span>
          </div>
        )

        return (
          <div key={sp.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={isClickable ? () => onStepClick?.(idx) : undefined}
              disabled={isPending && !isDone}
              title={
                isDone && !isCurrent
                  ? 'Click to review this step'
                  : isPending
                  ? 'Complete previous steps first'
                  : undefined
              }
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: isCurrent ? `rgba(${function() {
                  const r = parseInt(color.slice(1, 3), 16)
                  const g = parseInt(color.slice(3, 5), 16)
                  const b = parseInt(color.slice(5, 7), 16)
                  return `${r},${g},${b}`
                }()},0.08)` : 'transparent',
                border: 'none',
                padding: '4px 8px',
                cursor: isClickable ? 'pointer' : 'default',
                borderRadius: 8,
                transition: 'background 200ms',
              }}
            >
              {dot}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  opacity: isPending ? 0.5 : 1,
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-label)',
                  transition: 'opacity 250ms, color 250ms',
                }}>
                  {sp.title}
                </span>
                {isCurrent && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    color,
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}>
                    In progress
                  </span>
                )}
                {isDone && (
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}>
                    Marked done
                  </span>
                )}
              </div>
            </button>

            {/* Connector line — GSAP animates scaleX (verbatim from FlowStepper) */}
            {idx < subProblems.length - 1 && (
              <div style={{ width: 20, height: 2, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: 999 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--color-outline-variant)', borderRadius: 999 }} />
                <div
                  ref={el => { connectorRefs.current[idx] = el }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--color-primary)',
                    borderRadius: 999,
                    transformOrigin: 'left center',
                    transform: idx < activeIdx ? 'scaleX(1)' : 'scaleX(0)',
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
