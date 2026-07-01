'use client'

import type { FlowStepsDiagram as FlowStepsSpec } from '@/lib/solutions/schema'

interface Props {
  spec: FlowStepsSpec
  animate: boolean
  /** Final-state render with no motion (prefers-reduced-motion). */
  reducedMotion: boolean
}

/**
 * Vertical reasoning-chain diagram. HTML layout (labels and details need text
 * wrapping) with an SVG spine that draws in as the steps stagger into view.
 */
export function FlowStepsDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Connecting spine */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 13,
          top: 14,
          bottom: 14,
          width: 2,
          background: 'var(--color-outline-variant)',
          transformOrigin: 'top',
          transform: visible ? 'scaleY(1)' : 'scaleY(0)',
          transition: reducedMotion ? 'none' : 'transform 900ms cubic-bezier(0.16,1,0.3,1) 150ms',
        }}
      />
      {spec.steps.map((step, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: reducedMotion ? 'none' : `opacity 450ms ease ${i * 130}ms, transform 450ms cubic-bezier(0.16,1,0.3,1) ${i * 130}ms`,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: 800,
              background: step.emphasis ? 'var(--color-primary)' : 'var(--color-primary-fixed)',
              color: step.emphasis ? 'var(--color-on-primary)' : 'var(--color-primary)',
              border: step.emphasis ? 'none' : '1.5px solid var(--color-primary)',
              zIndex: 1,
            }}
          >
            {i + 1}
          </span>
          <div style={{ minWidth: 0, paddingTop: 3 }}>
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              lineHeight: 1.35,
            }}>
              {step.label}
            </div>
            {step.detail && (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                lineHeight: 1.45,
                color: 'var(--color-on-surface-variant)',
                marginTop: 2,
              }}>
                {step.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
