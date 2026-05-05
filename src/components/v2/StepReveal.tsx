'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { FlowStep } from '@/lib/types'
import type { QuestionRevealRecord } from './FlowWorkspace'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import {
  type Verdict,
  VERDICT_COLOR, VERDICT_BG, VERDICT_LABEL, VERDICT_ICON,
  QUALITY_ORDER, QUALITY_BADGE, STEP_ICONS,
  gradeToVerdict,
} from './flow-constants'

interface StepRevealProps {
  step: FlowStep
  stepScore: number
  maxScore: number
  gradeLabel: string
  roleContext: string
  careerSignal: string
  competencySignal?: {
    primary: string
    signal: string
    framework_hint: string
  } | null
  questionRevealHistory: QuestionRevealRecord[]
  onNext: () => void
  isLastStep: boolean
}

const STEP_NAMES: Record<FlowStep, string> = {
  frame:    'Frame',
  list:     'List',
  optimize: 'Optimize',
  win:      'Win',
}

const NEXT_STEP: Record<FlowStep, FlowStep | null> = {
  frame:    'list',
  list:     'optimize',
  optimize: 'win',
  win:      null,
}


// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  optionLabel,
  optionText,
  quality,
  explanation,
  frameworkHint,
  isSelected,
}: {
  optionLabel: string
  optionText: string
  quality: string
  explanation: string
  frameworkHint?: string
  isSelected: boolean
}) {
  const b = QUALITY_BADGE[quality] ?? QUALITY_BADGE.plausible_wrong

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 12px',
      borderRadius: 10,
      border: '1px solid var(--color-outline-variant)',
      background: isSelected ? `${b.bg}44` : 'var(--color-surface)',
      fontSize: 13, lineHeight: 1.4,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--color-on-surface-variant)',
        minWidth: 18, flexShrink: 0, paddingTop: 1,
      }}>
        {optionLabel}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ flex: 1, color: 'var(--color-on-surface)' }}>{optionText}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {isSelected && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                background: 'var(--color-inverse-surface)', color: 'var(--color-inverse-on-surface)',
              }}>
                YOUR PICK
              </span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 99,
              background: b.bg, color: b.color,
            }}>
              {b.label}
            </span>
          </div>
        </div>
        {explanation && (
          <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', margin: '6px 0 0', lineHeight: 1.5 }}>
            {explanation}
          </p>
        )}
        {frameworkHint && (
          <div style={{
            marginTop: 8,
            background: 'rgba(112,92,48,0.07)',
            border: '1px dashed rgba(112,92,48,0.3)',
            borderRadius: 8, padding: '7px 10px',
            fontSize: 11, color: '#705c30', lineHeight: 1.5,
            display: 'flex', gap: 6,
          }}>
            <span style={{ flexShrink: 0 }}>🧠</span>
            <span>{frameworkHint}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Question breakdown ────────────────────────────────────────────────────────

function QuestionBreakdown({ record, questionNumber }: { record: QuestionRevealRecord; questionNumber: number }) {
  const [open, setOpen] = useState(false)

  const sorted = [...record.revealedOptions].sort((a, b) =>
    QUALITY_ORDER.indexOf(a.quality ?? '') - QUALITY_ORDER.indexOf(b.quality ?? '')
  )

  const selectedOption = record.revealedOptions.find(o => o.id === record.selectedOptionId)
  const selectedQuality = selectedOption?.quality ?? 'surface'
  const b = QUALITY_BADGE[selectedQuality] ?? QUALITY_BADGE.plausible_wrong

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-outline-variant)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
          background: 'none', border: 'none',
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
          background: `${b.bg}88`, color: b.color,
          marginTop: 1,
        }}>
          {questionNumber}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-on-surface)', lineHeight: 1.4, margin: 0 }}>
            {record.questionText}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 1 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              background: b.bg, color: b.color,
            }}>
              {b.label}
            </span>
            <span className="material-symbols-outlined" style={{
              fontSize: 16, color: 'var(--color-on-surface-variant)',
              transition: 'transform 200ms',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              fontVariationSettings: "'FILL' 0, 'wght' 400",
            }}>
              expand_more
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(opt => (
            <OptionCard
              key={opt.id}
              optionLabel={opt.option_label ?? ''}
              optionText={opt.option_text ?? ''}
              quality={opt.quality ?? 'surface'}
              explanation={opt.explanation}
              frameworkHint={opt.framework_hint}
              isSelected={opt.id === record.selectedOptionId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function StepReveal({
  step,
  stepScore,
  maxScore,
  gradeLabel,
  roleContext,
  careerSignal,
  competencySignal,
  questionRevealHistory,
  onNext,
  isLastStep,
}: StepRevealProps) {
  const verdict = gradeToVerdict(gradeLabel)
  const verdictColor = VERDICT_COLOR[verdict]
  const nextStep = NEXT_STEP[step]

  const headerRef = useRef<HTMLDivElement>(null)
  const coachingRef = useRef<HTMLDivElement>(null)
  const breakdownRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = [headerRef.current, coachingRef.current, breakdownRef.current, bottomRef.current].filter(Boolean)
    if (prefersReduced) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    gsap.set(headerRef.current, { opacity: 0, y: -6 })
    gsap.set(coachingRef.current, { opacity: 0, y: 10 })
    gsap.set(breakdownRef.current, { opacity: 0, y: 10 })
    gsap.set(bottomRef.current, { opacity: 0, y: 8 })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4 })
    tl.to(coachingRef.current, { opacity: 1, y: 0, duration: 0.38 }, '-=0.2')
    tl.to(breakdownRef.current, { opacity: 1, y: 0, duration: 0.38 }, '-=0.2')
    tl.to(bottomRef.current, { opacity: 1, y: 0, duration: 0.32 }, '-=0.15')

    return () => { tl.kill() }
  }, [step])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Step score header ── */}
      <div
        ref={headerRef}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 14,
          padding: '16px 20px',
          boxShadow: '0 1px 2px rgba(30,27,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Step pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: VERDICT_BG[verdict], color: verdictColor,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
              {STEP_ICONS[step]}
            </span>
            {STEP_NAMES[step]}
          </div>
          {/* Score */}
          <div>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 700, color: verdictColor, lineHeight: 1 }}>
              {stepScore.toFixed(1)}
            </span>
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: 16, color: 'var(--color-on-surface-variant)', marginLeft: 4 }}>
              / {maxScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Verdict chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', borderRadius: 999,
          background: VERDICT_BG[verdict], color: verdictColor,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {VERDICT_ICON[verdict]}
          </span>
          {VERDICT_LABEL[verdict]}
        </div>
      </div>

      {/* ── Hatch coaching ── */}
      <div
        ref={coachingRef}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 1px 2px rgba(30,27,20,0.04)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <HatchGlyph size={36} state={roleContext ? 'speaking' : 'reviewing'} className="text-primary" />
        </div>
        {roleContext ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 4 }}>
              Hatch's Take
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-on-surface)', margin: 0 }}>{roleContext}</p>
            {careerSignal && (
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
                {careerSignal}
              </p>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="animate-pulse" style={{ height: 10, borderRadius: 6, background: 'var(--color-surface-container-high)', width: '80%' }} />
            <div className="animate-pulse" style={{ height: 10, borderRadius: 6, background: 'var(--color-surface-container-high)', width: '60%' }} />
          </div>
        )}
      </div>

      {/* ── Question breakdown ── */}
      {questionRevealHistory.length > 0 && (
        <div ref={breakdownRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              fact_check
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-on-surface-variant)' }}>
              Question breakdown
            </span>
          </div>
          {questionRevealHistory.map((record, idx) => (
            <QuestionBreakdown key={idx} record={record} questionNumber={idx + 1} />
          ))}
        </div>
      )}

      {/* ── Reasoning Move + CTA ── */}
      <div ref={bottomRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {competencySignal && (
          <div style={{
            background: 'rgba(112,92,48,0.07)',
            border: '1px dashed rgba(112,92,48,0.3)',
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🧠</span>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#705c30' }}>
                Reasoning Move
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-on-surface)', margin: 0, lineHeight: 1.55 }}>
              {competencySignal.signal}
            </p>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
          <button
            onClick={onNext}
            style={{
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 99, padding: '10px 22px',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px -4px rgba(74,124,89,0.45)',
            }}
          >
            {isLastStep ? 'See Final Results' : `Next: ${nextStep ? STEP_NAMES[nextStep] : ''}`}
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
