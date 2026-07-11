'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Check } from 'lucide-react'
import type { FlowStep } from '@/lib/types'
import { FLOW_MOVES, FLOW_MOVE_ORDER } from '@/lib/flow/moves'

interface FlowStepperProps {
  currentStep: FlowStep
  completedSteps: FlowStep[]
  onStepClick?: (step: FlowStep) => void
  questionIdx?: number
  questionCount?: number
}

// Single source of truth for FLOW move identity. Labels stay in lockstep with
// the dashboard card and skill ladder; the round-4 chrome renders every state
// in the forest scale (done = forest-600, current = forest-800, upcoming =
// hairline) per docs/redesign/previews/round4/flow-workspace.html.
const STEPS: Array<{ id: FlowStep; label: string }> =
  FLOW_MOVE_ORDER.map((key) => ({
    id: key as FlowStep,
    label: FLOW_MOVES[key].label,
  }))

// Short status line under each step title, matching the preview's
// title + subtitle step nodes ("Problem framed" / "Design solution").
const STEP_SUB: Record<string, { done: string; pending: string }> = {
  frame:    { done: 'Problem framed',  pending: 'Frame the problem' },
  list:     { done: 'Options mapped',  pending: 'Map the options' },
  optimize: { done: 'Tradeoff named',  pending: 'Design the tradeoff' },
  win:      { done: 'Case made',       pending: 'Prove it works' },
}

const CONNECTOR_DONE =
  'repeating-linear-gradient(to right, var(--color-forest-600) 0, var(--color-forest-600) 6px, transparent 6px, transparent 12px)'
const CONNECTOR_FADED =
  'repeating-linear-gradient(to right, #d8d3c8 0, #d8d3c8 6px, transparent 6px, transparent 12px)'

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

  // Mount animation - slide entire stepper in
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', minWidth: 0 }}>
      {STEPS.map((step, idx) => {
        const isDone = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isPending = !isDone && !isCurrent
        const isClickable = isDone && !!onStepClick
        const sub = STEP_SUB[step.id]

        const dot = (
          <div
            ref={el => { dotRefs.current[idx] = el }}
            style={{
              width: isCurrent ? 25 : isDone ? 23 : 22,
              height: isCurrent ? 25 : isDone ? 23 : 22,
              borderRadius: 999,
              flexShrink: 0,
              background: isCurrent
                ? 'var(--color-forest-800)'
                : isDone
                  ? 'var(--color-forest-600)'
                  : 'transparent',
              color: isCurrent || isDone ? '#fff' : 'var(--color-ink-muted)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: isPending ? '1.4px solid #c8c2b6' : 'none',
              boxShadow: isCurrent ? '0 0 0 4px rgba(18,59,32,0.12)' : 'none',
              fontSize: isCurrent ? 12.5 : 11.5,
              fontWeight: 700,
              fontFamily: 'var(--font-label)',
              transition: 'background 250ms, box-shadow 250ms, border-color 250ms',
            }}
          >
            {isDone ? <Check size={13} strokeWidth={2.2} /> : idx + 1}
          </div>
        )

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
            <button
              onClick={isClickable ? () => onStepClick(step.id) : undefined}
              title={isDone && !isClickable ? 'Locked. Answers are final once a step is graded.' : undefined}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'transparent', border: 'none',
                padding: '4px 6px',
                cursor: isClickable ? 'pointer' : 'default',
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {dot}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: isPending ? 'var(--color-ink-muted)' : 'var(--color-ink-strong)',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-label)',
                  transition: 'color 250ms',
                }}>
                  {step.label}
                </span>
                {sub && (
                  <span
                    className="hidden min-[1180px]:inline"
                    style={{ fontSize: 11.5, lineHeight: 1.2, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-label)' }}
                  >
                    {isDone ? sub.done : sub.pending}
                  </span>
                )}
                {/* Sub-dots for multi-question steps */}
                {isCurrent && (questionCount ?? 0) > 1 && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                    {Array.from({ length: questionCount! }).map((_, i) => (
                      <div key={i} style={{
                        width: i === questionIdx ? 10 : 5,
                        height: 4,
                        borderRadius: 999,
                        background: 'var(--color-forest-600)',
                        // Past/future dots are dimmer so they read as progress, not tappable controls.
                        opacity: i === questionIdx ? 1 : i < (questionIdx ?? 0) ? 0.35 : 0.18,
                        transition: 'width 200ms, opacity 200ms',
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </button>

            {/* Dashed connector - animated fill via scaleX */}
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, minWidth: 16, height: 2, position: 'relative', overflow: 'hidden', margin: '0 12px' }}>
                {/* Base (unfilled) */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: CONNECTOR_FADED }} />
                {/* Filled layer - GSAP animates scaleX */}
                <div
                  ref={el => { connectorRefs.current[idx] = el }}
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: CONNECTOR_DONE,
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
