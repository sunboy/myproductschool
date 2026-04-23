'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { FlowStep } from '@/lib/types'

interface FlowStepperProps {
  currentStep: FlowStep
  completedSteps: FlowStep[]
  onStepClick?: (step: FlowStep) => void
  questionIdx?: number
  questionCount?: number
}

const STEPS: Array<{ id: FlowStep; label: string; icon: string; color: string }> = [
  { id: 'frame',    label: 'Frame',    icon: 'center_focus_strong', color: '#4a7c59' },
  { id: 'list',     label: 'List',     icon: 'format_list_bulleted', color: '#6b8275' },
  { id: 'optimize', label: 'Optimize', icon: 'tune',                 color: '#c9933a' },
  { id: 'win',      label: 'Win',      icon: 'emoji_events',         color: '#a878d6' },
]

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function FlowStepper({ currentStep, completedSteps, onStepClick, questionIdx, questionCount }: FlowStepperProps) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep)
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const connectorRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevStepRef = useRef<FlowStep>(currentStep)

  // Animate on step change
  useEffect(() => {
    if (prevStepRef.current === currentStep) return
    const prevIdx = STEPS.findIndex(s => s.id === prevStepRef.current)
    prevStepRef.current = currentStep

    // 1. Pop the newly completed dot (prevIdx)
    const completedDot = dotRefs.current[prevIdx]
    if (completedDot) {
      gsap.timeline()
        .to(completedDot, { scale: 1.35, duration: 0.18, ease: 'power2.out' })
        .to(completedDot, { scale: 1, duration: 0.22, ease: 'elastic.out(1.2, 0.5)' })
    }

    // 2. Fill the connector between prevIdx and currentIdx
    const connector = connectorRefs.current[prevIdx]
    if (connector) {
      gsap.fromTo(connector,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.35, ease: 'power2.inOut', delay: 0.15 }
      )
    }

    // 3. Slide the new active dot in from slight scale-down
    const newDot = dotRefs.current[currentIdx]
    if (newDot) {
      gsap.fromTo(newDot,
        { scale: 0.7, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.8)', delay: 0.2 }
      )
    }
  }, [currentStep, currentIdx])

  // Mount animation — slide entire stepper in
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((step, idx) => {
        const isDone = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isPending = !isDone && !isCurrent
        const isClickable = isDone && !!onStepClick

        const dot = (
          <div
            ref={el => { dotRefs.current[idx] = el }}
            style={{
              width: 26, height: 26, borderRadius: 999, flexShrink: 0,
              background: isCurrent ? step.color : isDone ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
              color: isCurrent || isDone ? '#fff' : 'var(--color-on-surface-variant)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: isCurrent ? `2px solid rgba(${hexToRgb(step.color)},0.25)` : '2px solid transparent',
              boxShadow: isCurrent ? `0 0 0 4px rgba(${hexToRgb(step.color)},0.14)` : 'none',
              transition: 'background 250ms, box-shadow 250ms, border-color 250ms',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 500" }}
            >
              {isDone ? 'check' : step.icon}
            </span>
          </div>
        )

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={isClickable ? () => onStepClick(step.id) : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: 'none',
                padding: '4px 6px',
                cursor: isClickable ? 'pointer' : 'default',
                borderRadius: 8,
              }}
            >
              {dot}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  opacity: isPending ? 0.5 : 1,
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-label)',
                  transition: 'opacity 250ms, color 250ms',
                }}>
                  {step.label}
                </span>
                {/* Sub-dots for multi-question steps */}
                {isCurrent && (questionCount ?? 0) > 1 && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                    {Array.from({ length: questionCount! }).map((_, i) => (
                      <div key={i} style={{
                        width: i === questionIdx ? 10 : 5,
                        height: 4,
                        borderRadius: 999,
                        background: step.color,
                        opacity: i === questionIdx ? 1 : i < (questionIdx ?? 0) ? 0.5 : 0.2,
                        transition: 'width 200ms, opacity 200ms',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </button>

            {/* Connector line — animated fill via scaleX */}
            {idx < STEPS.length - 1 && (
              <div style={{ width: 24, height: 2, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: 999 }}>
                {/* Base (unfilled) */}
                <div style={{ position: 'absolute', inset: 0, background: 'var(--color-outline-variant)', borderRadius: 999 }} />
                {/* Filled layer — GSAP animates scaleX */}
                <div
                  ref={el => { connectorRefs.current[idx] = el }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--color-primary)',
                    borderRadius: 999,
                    transformOrigin: 'left center',
                    transform: idx < currentIdx ? 'scaleX(1)' : 'scaleX(0)',
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
