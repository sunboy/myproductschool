'use client'

import { useState, useEffect } from 'react'
import type { StepResult, StepResultQuestion } from './PostSessionMirror'
import {
  type Verdict,
  VERDICT_LABEL, QUALITY_ORDER, QUALITY_BADGE,
  qualityToVerdict,
} from './flow-constants'

const STEP_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const STEP_TITLES: Record<string, string> = {
  frame: 'Identify the real problem',
  list: 'Map the solution space',
  optimize: 'Choose what to optimize for',
  win: 'Define what winning looks like',
}

const VERDICT_COLORS: Record<Verdict, { text: string; bg: string }> = {
  pass: { text: '#2f7a4a', bg: 'rgba(47,122,74,0.10)' },
  partial: { text: '#c9933a', bg: 'rgba(201,147,58,0.10)' },
  miss: { text: '#b23a2a', bg: 'rgba(178,58,42,0.08)' },
}

interface QuestionPageProps {
  question: StepResultQuestion
  stepResult: StepResult
  isOnly: boolean
}

function QuestionPage({ question, stepResult }: QuestionPageProps) {
  const sorted = [...question.options].sort(
    (a, b) => QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality)
  )

  const selectedOpt = question.options.find(
    o => o.id === question.selectedOptionId || o.option_label === question.selectedOptionId
  )

  const frameworkHint =
    selectedOpt?.framework_hint ??
    stepResult.competency_signal?.framework_hint ??
    stepResult.frameworkHint ??
    null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, lineHeight: 1.5 }}>
        {question.questionText}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(opt => {
          const isPick = opt.id === question.selectedOptionId || opt.option_label === question.selectedOptionId
          const b = QUALITY_BADGE[opt.quality] ?? QUALITY_BADGE.plausible_wrong
          return (
            <div
              key={opt.id}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-outline-faint)',
                background: isPick ? 'rgba(74,124,89,0.06)' : 'var(--color-surface)',
                fontSize: 13, lineHeight: 1.4,
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: 'var(--color-on-surface-variant)',
                minWidth: 18, flexShrink: 0, paddingTop: 1,
              }}>
                {opt.option_label}
              </span>
              <span style={{ flex: 1, color: 'var(--color-on-surface)' }}>
                {opt.option_text}
                {isPick && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', marginLeft: 6 }}>
                    ← your pick
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 99,
                background: b.bg, color: b.color,
                flexShrink: 0, alignSelf: 'flex-start', marginTop: 1,
              }}>
                {b.label}
              </span>
            </div>
          )
        })}
      </div>

      {selectedOpt?.explanation && (
        <div style={{
          background: 'var(--color-surface-container-low)',
          borderRadius: 10, padding: '12px 14px',
          fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.6,
        }}>
          {selectedOpt.explanation}
        </div>
      )}

      {frameworkHint && (
        <div style={{
          background: 'rgba(112,92,48,0.07)',
          border: '1px dashed rgba(112,92,48,0.3)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: '#705c30', lineHeight: 1.5,
          display: 'flex', gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>🧠</span>
          <span>{frameworkHint}</span>
        </div>
      )}
    </div>
  )
}

export interface StepDetailModalProps {
  stepResult: StepResult
  attemptId?: string
  onClose: () => void
}

export function StepDetailModal({ stepResult, attemptId, onClose }: StepDetailModalProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [fetchedQuestions, setFetchedQuestions] = useState<StepResultQuestion[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (stepResult.questions?.length || !attemptId) return
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/attempts/${attemptId}/steps`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const stepQs = data.byStep?.[stepResult.step] ?? []
        setFetchedQuestions(stepQs)
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [attemptId, stepResult.step, stepResult.questions])

  const questions = stepResult.questions?.length ? stepResult.questions : (fetchedQuestions ?? [])
  const verdict = qualityToVerdict(stepResult.quality_label)
  const verdictStyle = VERDICT_COLORS[verdict]
  const isOnly = questions.length <= 1
  const isLast = currentQ === questions.length - 1

  if (loading) return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 20,
        padding: '32px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
        <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Loading question breakdown…
        </p>
      </div>
    </div>
  )

  if (questions.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 20,
        width: '100%', maxWidth: 600,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--color-outline-faint)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--color-primary)', background: 'var(--color-primary-fixed)',
            padding: '3px 10px', borderRadius: 99,
          }}>
            {STEP_LABELS[stepResult.step]}
          </span>
          <span style={{ flex: 1, fontFamily: 'var(--font-headline)', fontSize: 15, color: 'var(--color-on-surface)' }}>
            {STEP_TITLES[stepResult.step]}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
            padding: '3px 9px', borderRadius: 99,
            color: verdictStyle.text, background: verdictStyle.bg,
          }}>
            {VERDICT_LABEL[verdict]}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-surface-container-high)',
              border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--color-on-surface-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Question tab bar — hidden for single-question steps */}
        {!isOnly && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px',
            borderBottom: '1px solid var(--color-outline-faint)',
            background: 'var(--color-surface-container)',
          }}>
            <span style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--color-on-surface-variant)', marginRight: 4, fontWeight: 700,
            }}>
              Question:
            </span>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 99,
                  cursor: 'pointer',
                  color: currentQ === i ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  background: currentQ === i ? 'var(--color-surface)' : 'none',
                  border: currentQ === i ? '1px solid var(--color-outline-faint)' : '1px solid transparent',
                  boxShadow: currentQ === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.12s',
                }}
              >
                Q{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <QuestionPage
            key={currentQ}
            question={questions[currentQ]}
            stepResult={stepResult}
            isOnly={isOnly}
          />
        </div>

        {/* Nav footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--color-outline-faint)',
        }}>
          <button
            onClick={() => setCurrentQ(q => q - 1)}
            disabled={currentQ === 0}
            style={{
              fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 99,
              border: '1.5px solid var(--color-outline-faint)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQ === 0 ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            ← Previous
          </button>
          <button
            onClick={isLast ? onClose : () => setCurrentQ(q => q + 1)}
            style={{
              fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 99,
              background: 'var(--color-primary)', color: '#fff',
              border: '1.5px solid var(--color-primary)',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Close' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
