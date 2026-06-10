'use client'

import React, { useState, useRef, useCallback } from 'react'
import { INSTANT_HOOKS } from '@/lib/lead-magnets/instant'
import { getLeadMagnet } from '@/lib/lead-magnets/config'
import type {
  MagnetQuizConfig,
  QuizAnswers,
  QuizOutcome,
  QuizStep,
} from '@/lib/lead-magnets/quiz-types'
import { toMagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { useMagnetTracking } from './useMagnetTracking'
import { getStoredUtm } from '@/lib/lead-magnets/utm'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_STEP,
  EVENT_MAGNET_QUIZ_COMPLETED,
  EVENT_MAGNET_GATE_VIEWED,
  EVENT_MAGNET_GATE_SUBMITTED,
  EVENT_MAGNET_CTA_CLICKED,
} from '@/lib/posthog/events'

// ── Per-slug config registry ──────────────────────────────────────────────────
// Lazy-loaded at runtime from the 6 quiz modules.
import { failureModeQuizConfig } from '@/lib/lead-magnets/quizzes/failure-mode'
import { aiPmReadinessConfig } from '@/lib/lead-magnets/quizzes/ai-pm-readiness'
import { spotTheFlawConfig } from '@/lib/lead-magnets/quizzes/spot-the-flaw'
import { switchQuizConfig } from '@/lib/lead-magnets/quizzes/switch'
import { salaryQuizConfig } from '@/lib/lead-magnets/quizzes/salary'
import { teardownQuizConfig } from '@/lib/lead-magnets/quizzes/teardown'

const QUIZ_REGISTRY: Record<string, MagnetQuizConfig> = {
  'failure-mode': failureModeQuizConfig,
  'ai-pm-readiness': aiPmReadinessConfig,
  'spot-the-flaw': spotTheFlawConfig,
  switch: switchQuizConfig,
  salary: salaryQuizConfig,
  teardown: teardownQuizConfig,
}

// Per-slug signup-next destination (signup-mode magnets only).
const SIGNUP_NEXT: Record<string, string> = {
  teardown: '/explore/autopsies',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'hook' | 'quiz' | 'result' | 'capture' | 'unlocked'

type RevealState = { pickedId: string; correct: boolean }

// ── Component ─────────────────────────────────────────────────────────────────

export function InstantMagnet({ slug }: { slug: string }) {
  const hook = INSTANT_HOOKS[slug]
  const quizConfig = QUIZ_REGISTRY[slug]
  const magnet = getLeadMagnet(slug)

  const { track, utm } = useMagnetTracking(slug)

  const steps = quizConfig?.steps ?? []
  const total = steps.length

  const [phase, setPhase] = useState<Phase>('hook')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [revealed, setRevealed] = useState<Record<string, RevealState>>({})
  const [inputDraft, setInputDraft] = useState<Record<string, Record<string, string | number>>>({})
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null)

  // Gate-capture state
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [captureError, setCaptureError] = useState('')
  const [reportUrl, setReportUrl] = useState<string | null>(null)

  const startedEventFired = useRef(false)
  const gateViewedFired = useRef(false)

  const fireStarted = useCallback(() => {
    if (!startedEventFired.current) {
      startedEventFired.current = true
      track(EVENT_MAGNET_QUIZ_STARTED, { variant: 'instant' })
    }
  }, [track])

  // ── Progress bar segment count ──────────────────────────────────────────────
  // Hook + steps + result = total + 2 segments.
  const totalSegments = total + 2
  const filledSegments =
    phase === 'hook' ? 0
    : phase === 'quiz' ? 1 + stepIndex
    : 1 + total  // result / capture / unlocked

  // ── Advance through quiz ────────────────────────────────────────────────────
  function advance(updatedAnswers: QuizAnswers) {
    const step = steps[stepIndex]
    track(EVENT_MAGNET_QUIZ_STEP, {
      source_slug: slug,
      step_id: step.id,
      step_index: stepIndex,
      total_steps: total,
      variant: 'instant',
    })

    const next = stepIndex + 1
    if (next >= total) {
      const result = quizConfig.deriveResult(updatedAnswers)
      track(EVENT_MAGNET_QUIZ_COMPLETED, {
        source_slug: slug,
        band: result.band.key,
        ...(result.score !== undefined ? { score: result.score } : {}),
        variant: 'instant',
      })
      setOutcome(result)
      setPhase('result')
    } else {
      setStepIndex(next)
    }
  }

  // ── Step: MCQ / picker option click ────────────────────────────────────────
  function handleOptionClick(optionId: string) {
    fireStarted()
    const step = steps[stepIndex]
    if (step.kind !== 'mcq' && step.kind !== 'picker') return

    if (step.kind === 'mcq' && step.reveal) {
      const correct = optionId === step.reveal.correctId
      setRevealed((prev) => ({ ...prev, [step.id]: { pickedId: optionId, correct } }))
      setAnswers((prev) => ({ ...prev, [step.id]: optionId }))
      return
    }

    const next = { ...answers, [step.id]: optionId }
    setAnswers(next)
    setTimeout(() => advance(next), 250)
  }

  // ── Step: inputs ────────────────────────────────────────────────────────────
  function handleFieldChange(fieldId: string, value: string | number) {
    setInputDraft((prev) => {
      const step = steps[stepIndex]
      return { ...prev, [step.id]: { ...(prev[step.id] ?? {}), [fieldId]: value } }
    })
  }

  function inputsComplete(): boolean {
    const step = steps[stepIndex]
    if (step.kind !== 'inputs') return false
    const draft = inputDraft[step.id] ?? {}
    return step.fields.every((f) => {
      const v = draft[f.id]
      return v !== undefined && v !== ''
    })
  }

  function handleInputsSubmit() {
    if (!inputsComplete()) return
    fireStarted()
    const step = steps[stepIndex]
    const draft = inputDraft[step.id] ?? {}
    const next = { ...answers, [step.id]: draft }
    setAnswers(next)
    advance(next)
  }

  // ── Step: reveal next ───────────────────────────────────────────────────────
  function handleRevealNext() {
    advance(answers)
  }

  // ── Back ────────────────────────────────────────────────────────────────────
  function handleBack() {
    if (phase === 'quiz') {
      if (stepIndex === 0) {
        setPhase('hook')
      } else {
        setStepIndex((i) => i - 1)
        // Clear reveal for the step we are going back to.
        const prevStep = steps[stepIndex - 1]
        setRevealed((prev) => {
          const next = { ...prev }
          delete next[prevStep.id]
          return next
        })
      }
    }
  }

  // ── Gate: fire viewed event ─────────────────────────────────────────────────
  function ensureGateViewed() {
    if (!gateViewedFired.current) {
      gateViewedFired.current = true
      track(EVENT_MAGNET_GATE_VIEWED, {
        mode: magnet?.capture ?? 'gate',
        variant: 'instant',
      })
    }
  }

  // ── Gate: submit ────────────────────────────────────────────────────────────
  async function handleCaptureSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (captureStatus === 'submitting') return
    setCaptureStatus('submitting')
    setCaptureError('')

    track(EVENT_MAGNET_GATE_SUBMITTED, { variant: 'instant' })

    try {
      const storedUtm = getStoredUtm()
      const payload = outcome
        ? toMagnetResultPayload(quizConfig, answers, outcome, storedUtm)
        : undefined

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source_slug: slug,
          magnet_result: payload,
          website,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setCaptureError(
          data.error === 'Invalid request' ? 'Enter a valid email.' : 'Something went wrong. Try again.',
        )
        setCaptureStatus('error')
        return
      }

      const data = (await res.json()) as { success: boolean; reportUrl?: string | null }
      setReportUrl(data.reportUrl ?? null)
      setPhase('unlocked')
      setCaptureStatus('idle')
    } catch {
      setCaptureError('Something went wrong. Try again.')
      setCaptureStatus('error')
    }
  }

  function openSignupModal(next: string) {
    window.dispatchEvent(
      new CustomEvent('open-auth-modal', { detail: { mode: 'signup', next } }),
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const step = phase === 'quiz' ? steps[stepIndex] : null
  const revealForStep = step?.kind === 'mcq' ? revealed[step.id] : undefined

  const showBack = phase === 'quiz'

  return (
    <div className="lmi-root">
      {/* Top bar */}
      <div className="lmi-top">
        <span className="lmi-brand">HackProduct</span>
        <div className="lmi-progress-track" aria-hidden="true">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`lmi-progress-seg${i < filledSegments ? ' is-filled' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="lmi-body">
        <div className="lmi-screen">

          {/* Back control */}
          {showBack && (
            <button type="button" className="lmi-back" onClick={handleBack} aria-label="Go back">
              ‹ Back
            </button>
          )}

          {/* ── HOOK screen ─────────────────────────────────────────── */}
          {phase === 'hook' && (
            <div className="lmi-hook">
              <p className="lmi-eyebrow">{hook.eyebrow}</p>
              <h1 className="lmi-headline">{hook.headline}</h1>
              <p className="lmi-sub">{hook.sub}</p>
              <button
                type="button"
                className="lmi-cta"
                onClick={() => {
                  fireStarted()
                  setPhase('quiz')
                }}
              >
                {hook.cta}
              </button>
            </div>
          )}

          {/* ── QUIZ step screen ─────────────────────────────────────── */}
          {phase === 'quiz' && step && (
            <InstantStep
              step={step}
              stepIndex={stepIndex}
              total={total}
              reveal={revealForStep}
              selectedId={typeof answers[step.id] === 'string' ? (answers[step.id] as string) : undefined}
              draft={step.kind === 'inputs' ? (inputDraft[step.id] ?? {}) : {}}
              canSubmitInputs={inputsComplete()}
              onOptionClick={handleOptionClick}
              onRevealNext={handleRevealNext}
              onFieldChange={handleFieldChange}
              onInputsSubmit={handleInputsSubmit}
            />
          )}

          {/* ── RESULT screen ────────────────────────────────────────── */}
          {phase === 'result' && outcome && (
            <InstantResult
              outcome={outcome}
              onGetReport={() => {
                if (magnet?.capture === 'signup') {
                  const next = SIGNUP_NEXT[slug] ?? '/dashboard'
                  track(EVENT_MAGNET_CTA_CLICKED, { cta: 'signup', variant: 'instant' })
                  openSignupModal(next)
                } else {
                  ensureGateViewed()
                  setPhase('capture')
                }
              }}
              isSignupMode={magnet?.capture === 'signup'}
            />
          )}

          {/* ── CAPTURE screen (gate-mode) ───────────────────────────── */}
          {phase === 'capture' && (
            <InstantCapture
              slug={slug}
              magnet={magnet}
              email={email}
              website={website}
              status={captureStatus}
              errorMsg={captureError}
              onEmailChange={setEmail}
              onWebsiteChange={setWebsite}
              onSubmit={handleCaptureSubmit}
            />
          )}

          {/* ── UNLOCKED screen ──────────────────────────────────────── */}
          {phase === 'unlocked' && (
            <InstantUnlocked
              reportUrl={reportUrl}
              onSignup={() => {
                track(EVENT_MAGNET_CTA_CLICKED, { cta: 'signup', variant: 'instant' })
                openSignupModal('/dashboard')
              }}
              onReportClick={() => {
                track(EVENT_MAGNET_CTA_CLICKED, { cta: 'report', variant: 'instant' })
              }}
            />
          )}

        </div>
      </div>
    </div>
  )
}

// ── InstantStep ───────────────────────────────────────────────────────────────

interface InstantStepProps {
  step: QuizStep
  stepIndex: number
  total: number
  reveal: RevealState | undefined
  selectedId: string | undefined
  draft: Record<string, string | number>
  canSubmitInputs: boolean
  onOptionClick: (id: string) => void
  onRevealNext: () => void
  onFieldChange: (fieldId: string, value: string | number) => void
  onInputsSubmit: () => void
}

function InstantStep({
  step,
  stepIndex,
  total,
  reveal,
  selectedId,
  draft,
  canSubmitInputs,
  onOptionClick,
  onRevealNext,
  onFieldChange,
  onInputsSubmit,
}: InstantStepProps) {
  const isLocked = Boolean(reveal)

  return (
    <>
      <p className="lmi-step-eyebrow">
        Question {stepIndex + 1} of {total}
      </p>

      {step.context && (
        <p className="lmi-context">{step.context}</p>
      )}

      <p className="lmi-prompt">{step.prompt}</p>

      {/* MCQ */}
      {step.kind === 'mcq' && (
        <>
          <div className="lmi-options">
            {step.options.map((opt) => {
              let cls = 'lmi-option'
              if (reveal) {
                if (opt.id === step.reveal?.correctId) cls += ' is-correct'
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
          </div>

          {reveal && step.reveal && (
            <>
              <div className="lmi-reveal">{step.reveal.explain}</div>
              <button type="button" className="lmi-cta" onClick={onRevealNext}>
                Next
              </button>
            </>
          )}
        </>
      )}

      {/* Picker */}
      {step.kind === 'picker' && (
        <div className="lmi-options">
          {step.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`lmi-option${opt.id === selectedId ? ' is-selected' : ''}`}
              onClick={() => onOptionClick(opt.id)}
            >
              <span className="lmi-picker-label">{opt.label}</span>
              {opt.sub && <span className="lmi-picker-sub">{opt.sub}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Inputs */}
      {step.kind === 'inputs' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {step.fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={`lmi-field-${field.id}`} className="lmi-field-label">
                {field.label}
              </label>

              {field.type === 'select' && field.options ? (
                <select
                  id={`lmi-field-${field.id}`}
                  className="lmi-input lmi-select"
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
                  id={`lmi-field-${field.id}`}
                  type="number"
                  className="lmi-input"
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
            className="lmi-cta"
            disabled={!canSubmitInputs}
            onClick={onInputsSubmit}
            style={{ opacity: canSubmitInputs ? 1 : 0.45 }}
          >
            See my result
          </button>
        </div>
      )}
    </>
  )
}

// ── InstantResult ─────────────────────────────────────────────────────────────

interface InstantResultProps {
  outcome: QuizOutcome
  onGetReport: () => void
  isSignupMode: boolean
}

function InstantResult({ outcome, onGetReport, isSignupMode }: InstantResultProps) {
  const dims = outcome.dimensions?.slice(0, 5) ?? []

  return (
    <div className="lmi-result">
      <div>
        <p className="lmi-eyebrow">Your result</p>
        <p className="lmi-band">{outcome.band.label}</p>
        <p className="lmi-blurb">{outcome.band.blurb}</p>
      </div>

      {dims.length > 0 && (
        <div className="lmi-dims">
          {dims.map((d) => {
            const pct = Math.round((d.value / d.max) * 100)
            return (
              <div key={d.key} className="lmi-dim-row">
                <span className="lmi-dim-label">{d.label}</span>
                <span className="lmi-dim-val">{d.value}/{d.max}</span>
                <div className="lmi-dim-bar">
                  <div className="lmi-dim-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button type="button" className="lmi-cta" onClick={onGetReport}>
        {isSignupMode ? 'Start training free' : 'Get my full report'}
      </button>
    </div>
  )
}

// ── InstantCapture ────────────────────────────────────────────────────────────

interface InstantCaptureProps {
  slug: string
  magnet: ReturnType<typeof getLeadMagnet>
  email: string
  website: string
  status: 'idle' | 'submitting' | 'error'
  errorMsg: string
  onEmailChange: (v: string) => void
  onWebsiteChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

function InstantCapture({
  magnet,
  email,
  website,
  status,
  errorMsg,
  onEmailChange,
  onWebsiteChange,
  onSubmit,
}: InstantCaptureProps) {
  const valueLine =
    magnet?.unlockEmail?.valueBullets?.[0] ??
    'Your personalized report, sent instantly.'

  return (
    <form className="lmi-capture" onSubmit={onSubmit} noValidate>
      <p className="lmi-capture-title">Get your full report</p>
      <p className="lmi-fine">{valueLine}</p>

      <input
        type="email"
        className="lmi-input"
        placeholder="you@work.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        autoComplete="email"
        aria-label="Email address"
      />

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        className="lmi-hp"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => onWebsiteChange(e.target.value)}
        aria-hidden="true"
      />

      {status === 'error' && <p className="lmi-err">{errorMsg}</p>}

      <button type="submit" className="lmi-cta" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send my report'}
      </button>

      <p className="lmi-fine">No spam. Unsubscribe anytime.</p>
    </form>
  )
}

// ── InstantUnlocked ───────────────────────────────────────────────────────────

interface InstantUnlockedProps {
  reportUrl: string | null
  onSignup: () => void
  onReportClick: () => void
}

function InstantUnlocked({ reportUrl, onSignup, onReportClick }: InstantUnlockedProps) {
  return (
    <div className="lmi-unlocked">
      {reportUrl && (
        <a
          href={reportUrl}
          className="lmi-cta"
          onClick={onReportClick}
        >
          Open your full report
        </a>
      )}
      <p className="lmi-unlocked-note">We also sent it to your inbox.</p>
      <button type="button" className="lmi-cta-secondary" onClick={onSignup}>
        Start training free
      </button>
    </div>
  )
}
