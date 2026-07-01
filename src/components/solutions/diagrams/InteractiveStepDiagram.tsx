'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { InteractiveStepDiagram as SteppedSpec } from '@/lib/solutions/schema'
import { trackEvent } from '@/lib/posthog/client'
import { ArrayStage } from './stages/ArrayStage'
import { PipelineStage } from './stages/PipelineStage'
import { FlowStage } from './stages/FlowStage'
import { GridStage } from './stages/GridStage'
import { SequenceStage } from './stages/SequenceStage'
import { ExecutionStage } from './stages/ExecutionStage'

interface Props {
  spec: SteppedSpec
  /** Final-state render with no motion (prefers-reduced-motion). */
  reducedMotion: boolean
  /** Fires whenever the active step changes, so Hatch can see where the learner is. */
  onStepChange?: (step: { index: number; title: string; decision?: string }) => void
}

const AUTOPLAY_MS = 1800

const PILL_TONE: Record<NonNullable<SteppedSpec['steps'][number]['pills']>[number]['tone'] & string, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--color-surface-container-high)', fg: 'var(--color-on-surface-variant)' },
  good: { bg: 'var(--color-primary-fixed)', fg: 'var(--color-primary)' },
  warn: { bg: 'var(--color-tertiary-container)', fg: 'var(--color-on-surface)' },
  active: { bg: 'var(--color-primary)', fg: 'var(--color-on-primary)' },
}

/**
 * Stepped, manually-navigable diagram. Owns the step cursor and controls; the
 * view for each step is resolved purely from base + steps[i].delta (no
 * accumulation), so jumping to a step is identical to stepping there and the
 * stage, explanation, pills, and decision stay in lockstep by construction.
 *
 * Reserves max-extent height up front so advancing never reflows. Autoplay is
 * gated on reduced motion. Step tabs are a real tablist with arrow-key nav and
 * the explanation card is an aria-live region so changes are announced.
 */
export function InteractiveStepDiagram({ spec, reducedMotion, onStepChange }: Props) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const lastReported = useRef(-1)

  const total = spec.steps.length
  const step = spec.steps[current]

  // Report the active step upward (for Hatch awareness), once per change.
  useEffect(() => {
    if (lastReported.current === current) return
    lastReported.current = current
    onStepChange?.({ index: current, title: step.title, decision: step.decision })
  }, [current, step.title, step.decision, onStepChange])

  const goTo = useCallback((index: number, source: 'manual' | 'autoplay') => {
    const next = Math.max(0, Math.min(total - 1, index))
    setCurrent(next)
    trackEvent('solution_step_advanced', { index: next, total, source, base: spec.base.kind })
    if (next === total - 1) {
      trackEvent('solution_walkthrough_completed', { total, base: spec.base.kind })
    }
  }, [total, spec.base.kind])

  const stop = useCallback(() => setPlaying(false), [])

  // Autoplay tick.
  useEffect(() => {
    if (!playing) return
    if (current >= total - 1) { setPlaying(false); return }
    const t = setTimeout(() => goTo(current + 1, 'autoplay'), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [playing, current, total, goTo])

  // Impression once on mount.
  useEffect(() => {
    trackEvent('solution_diagram_viewed', { kind: 'stepped', base: spec.base.kind, steps: total })
  }, [spec.base.kind, total])

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stop(); goTo(current + 1, 'manual') }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stop(); goTo(current - 1, 'manual') }
    else if (e.key === 'Home') { e.preventDefault(); stop(); goTo(0, 'manual') }
    else if (e.key === 'End') { e.preventDefault(); stop(); goTo(total - 1, 'manual') }
  }

  const renderStage = () => {
    if (spec.base.kind === 'array' && step.delta.base === 'array') {
      return <ArrayStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    if (spec.base.kind === 'pipeline' && step.delta.base === 'pipeline') {
      return <PipelineStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    if (spec.base.kind === 'flow' && step.delta.base === 'flow') {
      return <FlowStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    if (spec.base.kind === 'grid' && step.delta.base === 'grid') {
      return <GridStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    if (spec.base.kind === 'sequence' && step.delta.base === 'sequence') {
      return <SequenceStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    if (spec.base.kind === 'execution' && step.delta.base === 'execution') {
      return <ExecutionStage base={spec.base} delta={step.delta} reducedMotion={reducedMotion} />
    }
    // Unknown/future base: fail soft to nothing rather than crash, so an
    // unrecognized stepped shape never breaks an existing solution.
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {/* Stage */}
      <div style={{ minWidth: 0 }}>{renderStage()}</div>

      {/* Lesson board: step tabs + explanation card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Walkthrough steps"
          onKeyDown={onTabKeyDown}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {spec.steps.map((s, i) => {
            const active = i === current
            return (
              <button
                key={i}
                role="tab"
                type="button"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => { stop(); goTo(i, 'manual') }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: active ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                  color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-label)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                    color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                    fontSize: 10,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* Explanation card. min-height reserves space so advancing never reflows. */}
        <div
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 132,
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
            {step.title}
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.55, color: 'var(--color-on-surface-variant)' }}>
            {step.explanation}
          </p>
          {(step.decision || step.pills?.length) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {step.decision && (
                <span style={{
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  fontFamily: 'var(--font-label)',
                  fontSize: 12,
                  fontWeight: 800,
                }}>
                  {step.decision}
                </span>
              )}
              {step.pills?.map((pill, i) => {
                const tone = PILL_TONE[pill.tone ?? 'neutral']
                return (
                  <span key={i} style={{
                    padding: '5px 9px',
                    borderRadius: 999,
                    background: tone.bg,
                    color: tone.fg,
                    fontFamily: 'var(--font-label)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    {pill.label} = {pill.value}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ControlButton label="Previous step" disabled={current === 0} onClick={() => { stop(); goTo(current - 1, 'manual') }} />
          {!reducedMotion && (
            <ControlButton
              label={playing ? 'Pause' : 'Auto-play steps'}
              primary
              onClick={() => setPlaying((p) => !p)}
            />
          )}
          <ControlButton label="Next step" disabled={current === total - 1} onClick={() => { stop(); goTo(current + 1, 'manual') }} />
          <ControlButton label="Start over" disabled={current === 0 && !playing} onClick={() => { stop(); goTo(0, 'manual') }} />
        </div>
      </div>
    </div>
  )
}

function ControlButton({ label, onClick, disabled, primary }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 38,
        padding: '0 14px',
        borderRadius: 999,
        border: `1.5px solid ${primary ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
        background: primary ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
        color: primary ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontFamily: 'var(--font-label)',
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {label}
    </button>
  )
}
