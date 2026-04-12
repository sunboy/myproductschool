'use client'

import { useState } from 'react'
import type { FlowStep } from '@/lib/types'
import type { QuestionRevealRecord } from './FlowWorkspace'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

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

const GRADE_BADGE: Record<string, string> = {
  Outstanding:      'bg-primary text-on-primary',
  Strong:           'bg-tertiary-container text-on-surface',
  Developing:       'bg-secondary-container text-on-secondary-container',
  'Needs Practice': 'bg-surface-container-highest text-on-surface-variant',
}

// Maps quality string → visual treatment
const QUALITY_CONFIG: Record<string, {
  border: string
  bg: string
  badge: string
  badgeText: string
  icon: string
}> = {
  best: {
    border: '#4a7c59',
    bg: 'rgba(74,124,89,0.06)',
    badge: 'bg-primary text-on-primary',
    badgeText: 'Best',
    icon: 'check_circle',
  },
  good_but_incomplete: {
    border: '#705c30',
    bg: 'rgba(112,92,48,0.05)',
    badge: 'bg-tertiary-container text-on-surface',
    badgeText: 'Good',
    icon: 'check_circle',
  },
  surface: {
    border: '#74796e',
    bg: 'rgba(116,121,110,0.05)',
    badge: 'bg-surface-container-high text-on-surface-variant',
    badgeText: 'Surface',
    icon: 'remove_circle',
  },
  plausible_wrong: {
    border: '#b83230',
    bg: 'rgba(184,50,48,0.04)',
    badge: 'bg-error/10 text-error',
    badgeText: 'Misleading',
    icon: 'cancel',
  },
}

const TERRA_PRIMARY = '#4a7c59'

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
  const cfg = QUALITY_CONFIG[quality] ?? QUALITY_CONFIG['surface']

  return (
    <div
      className="rounded-xl p-4 space-y-2.5"
      style={{
        background: isSelected ? cfg.bg : 'transparent',
        border: `1.5px solid ${isSelected ? cfg.border : 'rgba(116,121,110,0.2)'}`,
        opacity: isSelected ? 1 : 0.8,
      }}
    >
      {/* Option header */}
      <div className="flex items-start gap-2.5">
        <span
          className="material-symbols-outlined shrink-0 text-[18px] mt-0.5"
          style={{
            color: isSelected ? cfg.border : 'rgba(116,121,110,0.5)',
            fontVariationSettings: `'FILL' ${quality === 'best' || quality === 'good_but_incomplete' ? 1 : 0}, 'wght' 400`,
          }}
        >
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label text-xs font-semibold text-on-surface-variant">
              {optionLabel}
            </span>
            <span className={`rounded-full px-2 py-0.5 font-label text-[10px] font-semibold ${cfg.badge}`}>
              {cfg.badgeText}
            </span>
            {isSelected && (
              <span className="rounded-full px-2 py-0.5 font-label text-[10px] font-semibold bg-inverse-surface text-inverse-on-surface">
                Your pick
              </span>
            )}
          </div>
          <p className="font-body text-sm text-on-surface mt-1 leading-snug">{optionText}</p>
        </div>
      </div>

      {/* Explanation — always shown */}
      <p className="font-body text-xs text-on-surface-variant leading-relaxed pl-7">{explanation}</p>
      {frameworkHint && (
        <p className="font-body text-xs italic pl-7" style={{ color: TERRA_PRIMARY }}>{frameworkHint}</p>
      )}
    </div>
  )
}

function QuestionBreakdown({ record, questionNumber }: { record: QuestionRevealRecord; questionNumber: number }) {
  const [open, setOpen] = useState(false)

  // Sort options: best first, then good, surface, plausible_wrong
  const QUALITY_ORDER = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong']
  const sorted = [...record.revealedOptions].sort((a, b) => {
    const ai = QUALITY_ORDER.indexOf(a.quality ?? '')
    const bi = QUALITY_ORDER.indexOf(b.quality ?? '')
    return ai - bi
  })

  const selectedOption = record.revealedOptions.find(o => o.id === record.selectedOptionId)
  const selectedQuality = selectedOption?.quality ?? 'surface'
  const isCorrect = selectedQuality === 'best' || selectedQuality === 'good_but_incomplete'
  const selectedCfg = QUALITY_CONFIG[selectedQuality] ?? QUALITY_CONFIG['surface']

  return (
    <div className="space-y-2">
      {/* Clickable question header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left group"
      >
        {/* Number bubble */}
        <div
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-label text-xs font-bold mt-0.5"
          style={{ background: isCorrect ? 'rgba(74,124,89,0.12)' : 'rgba(116,121,110,0.12)', color: isCorrect ? TERRA_PRIMARY : '#74796e' }}
        >
          {questionNumber}
        </div>

        {/* Question text + your-pick badge inline */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <p className="font-body text-sm font-medium text-on-surface leading-snug">{record.questionText}</p>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {/* Selected answer quality pill — visible even when collapsed */}
            <span className={`rounded-full px-2 py-0.5 font-label text-[10px] font-semibold ${selectedCfg.badge}`}>
              {selectedCfg.badgeText}
            </span>
            {/* Chevron */}
            <span
              className="material-symbols-outlined text-on-surface-variant text-[16px] transition-transform duration-200"
              style={{
                fontVariationSettings: "'FILL' 0, 'wght' 400",
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              expand_more
            </span>
          </div>
        </div>
      </button>

      {/* Collapsible options list */}
      {open && (
        <div className="pl-9 space-y-2">
          {sorted.map((opt) => (
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
  const badgeClass = GRADE_BADGE[gradeLabel] ?? GRADE_BADGE['Needs Practice']
  const nextStep = NEXT_STEP[step]

  return (
    <div className="space-y-6">

      {/* ── Step score header ── */}
      <div
        className="rounded-xl p-5 border-t-4 flex items-center justify-between"
        style={{
          borderTopColor: TERRA_PRIMARY,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid rgba(74,124,89,0.12)`,
          borderTop: `4px solid ${TERRA_PRIMARY}`,
          boxShadow: '0 2px 8px rgba(46,50,48,0.06)',
        }}
      >
        <div>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mb-0.5">
            {STEP_NAMES[step]} step
          </p>
          <p className="font-headline text-3xl text-primary">
            {stepScore.toFixed(1)}{' '}
            <span className="text-on-surface-variant text-xl">/ {maxScore.toFixed(1)}</span>
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 font-label text-sm font-semibold shadow-sm ${badgeClass}`}>
          {gradeLabel}
        </span>
      </div>

      {/* ── Luma coaching ── */}
      {roleContext ? (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(74,124,89,0.12)',
            boxShadow: '0 2px 8px rgba(46,50,48,0.06)',
          }}
        >
          <LumaGlyph size={40} state="speaking" className="text-primary shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-body text-sm text-on-surface">{roleContext}</p>
            {careerSignal && (
              <p className="font-body text-xs text-on-surface-variant italic">{careerSignal}</p>
            )}
          </div>
        </div>
      ) : (
        /* Coaching loading skeleton */
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'rgba(255,255,255,0.70)',
            border: '1px solid rgba(74,124,89,0.08)',
          }}
        >
          <LumaGlyph size={40} state="reviewing" className="text-primary shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 rounded bg-surface-container-high animate-pulse w-4/5" />
            <div className="h-3 rounded bg-surface-container-high animate-pulse w-3/5" />
          </div>
        </div>
      )}

      {/* ── Question-by-question rubric breakdown ── */}
      {questionRevealHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              fact_check
            </span>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Question breakdown
            </p>
          </div>

          <div className="space-y-6">
            {questionRevealHistory.map((record, idx) => (
              <QuestionBreakdown key={idx} record={record} questionNumber={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── Reasoning Move ── */}
      {competencySignal && (
        <div
          className="rounded-lg bg-surface-container p-4 border-l-4"
          style={{ borderLeftColor: TERRA_PRIMARY }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-lg">neurology</span>
            <span className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wide">
              Reasoning Move
            </span>
          </div>
          <p className="text-sm font-body text-on-surface">{competencySignal.signal}</p>
          {competencySignal.framework_hint && (
            <p className="text-xs text-on-surface-variant mt-1 italic">{competencySignal.framework_hint}</p>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      <div className="flex justify-end pb-4">
        <button
          onClick={onNext}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          {isLastStep ? 'See Final Results' : `Next: ${nextStep ? STEP_NAMES[nextStep] : ''}`}
        </button>
      </div>
    </div>
  )
}
