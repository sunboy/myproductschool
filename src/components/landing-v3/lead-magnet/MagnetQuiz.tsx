'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  MagnetQuizConfig,
  MagnetResultPayload,
  QuizAnswers,
  QuizOutcome,
  QuizStep,
  toMagnetResultPayload,
} from '@/lib/lead-magnets/quiz-types'
import { useMagnetTracking } from './useMagnetTracking'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_STEP,
  EVENT_MAGNET_QUIZ_COMPLETED,
} from '@/lib/posthog/events'

export interface MagnetQuizProps {
  config: MagnetQuizConfig
  renderResult: (outcome: QuizOutcome, payload: MagnetResultPayload) => React.ReactNode
  /** Optional Start button label. When omitted the quiz begins on the first step immediately. */
  introCta?: string
}

type RevealState = {
  /** The option id the user picked. */
  pickedId: string
  /** Whether the pick was correct. */
  correct: boolean
}

export function MagnetQuiz({ config, renderResult, introCta }: MagnetQuizProps) {
  const { steps, magnet } = config
  const total = steps.length

  const { track, utm } = useMagnetTracking(magnet)

  // When introCta is provided the quiz hasn't started yet.
  const [started, setStarted] = useState(!introCta)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  // Map of step.id -> RevealState for instant-reveal mcq steps.
  const [revealed, setRevealed] = useState<Record<string, RevealState>>({})
  // Map of step.id -> field map for inputs steps (accumulated while the user fills in).
  const [inputDraft, setInputDraft] = useState<Record<string, Record<string, string | number>>>({})
  const [outcome, setOutcome] = useState<{ result: QuizOutcome; payload: MagnetResultPayload } | null>(null)

  // Guard: only fire QUIZ_STARTED once across the whole session.
  const startedEventFired = useRef(false)

  const fireStartedOnce = useCallback(() => {
    if (!startedEventFired.current) {
      startedEventFired.current = true
      track(EVENT_MAGNET_QUIZ_STARTED)
    }
  }, [track])

  // ── Start screen ────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="lm-quiz-step" style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-forest"
          onClick={() => {
            fireStartedOnce()
            setStarted(true)
          }}
        >
          {introCta}
        </button>
      </div>
    )
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (outcome) {
    return (
      <>
        {renderResult(outcome.result, outcome.payload)}
        <StickyCta />
      </>
    )
  }

  const step = steps[stepIndex]
  const completed = stepIndex // number of steps completed so far (0-based)
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const revealForStep = step.kind === 'mcq' ? revealed[step.id] : undefined

  // ── Advance to next step or complete ────────────────────────────────────────
  function advance(updatedAnswers: QuizAnswers) {
    const next = stepIndex + 1

    track(EVENT_MAGNET_QUIZ_STEP, {
      step_id: step.id,
      step_index: stepIndex,
      total_steps: total,
    })

    if (next >= total) {
      // All steps done — derive result.
      const result = config.deriveResult(updatedAnswers)
      const payload = toMagnetResultPayload(config, updatedAnswers, result, utm)
      track(EVENT_MAGNET_QUIZ_COMPLETED, {
        band: result.band.key,
        ...(result.score !== undefined ? { score: result.score } : {}),
      })
      setOutcome({ result, payload })
    } else {
      setStepIndex(next)
    }
  }

  // ── MCQ / picker option click ────────────────────────────────────────────────
  function handleOptionClick(optionId: string) {
    fireStartedOnce()

    if (step.kind === 'mcq' && step.reveal) {
      // Instant-reveal mode: mark the pick, disable all options, show explanation.
      const correct = optionId === step.reveal.correctId
      setRevealed((prev) => ({ ...prev, [step.id]: { pickedId: optionId, correct } }))
      // Store the answer regardless so deriveResult has the data.
      const next = { ...answers, [step.id]: optionId }
      setAnswers(next)
      return
    }

    // No reveal: record answer and auto-advance after brief visual feedback.
    const next = { ...answers, [step.id]: optionId }
    setAnswers(next)
    setTimeout(() => advance(next), 250)
  }

  // ── Inputs field change ──────────────────────────────────────────────────────
  function handleFieldChange(fieldId: string, value: string | number) {
    setInputDraft((prev) => ({
      ...prev,
      [step.id]: { ...(prev[step.id] ?? {}), [fieldId]: value },
    }))
  }

  // All required fields of the current inputs step have a non-empty value.
  function inputsComplete(): boolean {
    if (step.kind !== 'inputs') return false
    const draft = inputDraft[step.id] ?? {}
    return step.fields.every((f) => {
      const v = draft[f.id]
      return v !== undefined && v !== ''
    })
  }

  function handleInputsSubmit() {
    if (!inputsComplete()) return
    fireStartedOnce()
    const draft = inputDraft[step.id] ?? {}
    const next = { ...answers, [step.id]: draft }
    setAnswers(next)
    advance(next)
  }

  function handleBack() {
    if (stepIndex === 0) return
    setStepIndex((i) => i - 1)
  }

  function handleRevealNext() {
    // Only reachable when a reveal step has been answered.
    advance(answers)
  }

  // ── Render step ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Progress bar */}
      <div className="lm-progress" aria-hidden="true">
        <div
          className="lm-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="lm-quiz-step">
        {/* Eyebrow */}
        <p className="lm-quiz-eyebrow">
          Step {stepIndex + 1} of {total}
        </p>

        {/* Back link — visible on steps after the first, hidden once reveal answered */}
        {stepIndex > 0 && !revealForStep && (
          <button type="button" className="lm-quiz-back" onClick={handleBack}>
            Back
          </button>
        )}

        {/* Optional context paragraph */}
        {step.context && (
          <p className="lm-quiz-context">{step.context}</p>
        )}

        {/* Prompt */}
        <p style={{ fontWeight: 700, color: 'var(--ink-1)', marginBottom: 18, lineHeight: 1.4 }}>
          {step.prompt}
        </p>

        {/* ── MCQ ── */}
        {step.kind === 'mcq' && (
          <StepMcq
            step={step}
            reveal={revealForStep}
            selectedId={typeof answers[step.id] === 'string' ? (answers[step.id] as string) : undefined}
            onOptionClick={handleOptionClick}
            onNext={handleRevealNext}
          />
        )}

        {/* ── Picker ── */}
        {step.kind === 'picker' && (
          <StepPicker
            step={step}
            selectedId={typeof answers[step.id] === 'string' ? (answers[step.id] as string) : undefined}
            onOptionClick={handleOptionClick}
          />
        )}

        {/* ── Inputs ── */}
        {step.kind === 'inputs' && (
          <StepInputs
            step={step}
            draft={inputDraft[step.id] ?? {}}
            onFieldChange={handleFieldChange}
            onSubmit={handleInputsSubmit}
            canSubmit={inputsComplete()}
          />
        )}
      </div>

      <StickyCta />
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StepMcqProps {
  step: Extract<QuizStep, { kind: 'mcq' }>
  reveal: RevealState | undefined
  selectedId: string | undefined
  onOptionClick: (id: string) => void
  onNext: () => void
}

function StepMcq({ step, reveal, selectedId, onOptionClick, onNext }: StepMcqProps) {
  const isLocked = Boolean(reveal)

  return (
    <div>
      {step.options.map((opt) => {
        let cls = 'lm-option'
        if (reveal) {
          if (opt.id === step.reveal!.correctId) cls += ' is-correct'
          else if (opt.id === reveal.pickedId && !reveal.correct) cls += ' is-wrong'
        } else if (opt.id === selectedId) {
          cls += ' is-selected'
        }

        return (
          <button
            key={opt.id}
            type="button"
            className={cls}
            disabled={isLocked}
            onClick={() => !isLocked && onOptionClick(opt.id)}
          >
            {opt.text}
          </button>
        )
      })}

      {reveal && (
        <>
          <div className="lm-reveal">
            {step.reveal!.explain}
          </div>
          <button
            type="button"
            className="btn btn-forest"
            style={{ marginTop: 16 }}
            onClick={onNext}
          >
            Next
          </button>
        </>
      )}
    </div>
  )
}

interface StepPickerProps {
  step: Extract<QuizStep, { kind: 'picker' }>
  selectedId: string | undefined
  onOptionClick: (id: string) => void
}

function StepPicker({ step, selectedId, onOptionClick }: StepPickerProps) {
  return (
    <div>
      {step.options.map((opt) => {
        const cls = `lm-option${opt.id === selectedId ? ' is-selected' : ''}`
        return (
          <button
            key={opt.id}
            type="button"
            className={cls}
            onClick={() => onOptionClick(opt.id)}
          >
            <span style={{ fontWeight: 600 }}>{opt.label}</span>
            {opt.sub && (
              <span style={{ display: 'block', color: 'var(--ink-3)', fontSize: 13, marginTop: 2 }}>
                {opt.sub}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

interface StepInputsProps {
  step: Extract<QuizStep, { kind: 'inputs' }>
  draft: Record<string, string | number>
  onFieldChange: (fieldId: string, value: string | number) => void
  onSubmit: () => void
  canSubmit: boolean
}

function StepInputs({ step, draft, onFieldChange, onSubmit, canSubmit }: StepInputsProps) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {step.fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={`lm-field-${field.id}`}
            style={{ display: 'block', color: 'var(--ink-2)', fontSize: 13, marginBottom: 6, fontWeight: 600 }}
          >
            {field.label}
          </label>

          {field.type === 'select' && field.options ? (
            <select
              id={`lm-field-${field.id}`}
              className="lm-input lm-select"
              value={(draft[field.id] as string) ?? ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
            >
              <option value="">{field.placeholder ?? 'Select...'}</option>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`lm-field-${field.id}`}
              type="number"
              className="lm-input"
              placeholder={field.placeholder ?? ''}
              value={(draft[field.id] as string | number) ?? ''}
              onChange={(e) =>
                onFieldChange(
                  field.id,
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            />
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn btn-forest"
        disabled={!canSubmit}
        onClick={onSubmit}
        style={{ marginTop: 4, opacity: canSubmit ? 1 : 0.45 }}
      >
        See my result
      </button>
    </div>
  )
}

function StickyCta() {
  function scrollToGate() {
    const el = document.getElementById('lm-gate')
    if (!el) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    el.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="lm-sticky-cta" aria-hidden="true">
      <button type="button" className="btn btn-forest" style={{ width: '100%' }} onClick={scrollToGate}>
        See your full result
      </button>
    </div>
  )
}
