'use client'

import { useCallback, useRef, useState } from 'react'
import { useMagnetTracking } from '@/components/landing-v3/lead-magnet/useMagnetTracking'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_COMPLETED,
} from '@/lib/posthog/events'
import { MOCK_PROMPTS } from '@/lib/lead-magnets/quizzes/mock'

// The homepage hero's right pane: a live "try one rep" card that grades an
// anonymous answer before any signup wall. Lifted from MockClient
// (src/app/(marketing)/go/mock/MockClient.tsx) and the public, IP-rate-limited
// grader at POST /api/go/mock-grade (Haiku, 3/IP/day, honeypot). The wall
// arrives AFTER value: a graded answer, then "create your free account" to keep
// the result and go deeper. Post-signup the user lands in the same
// written-first-value flow the in-app first rep uses.

const MAX_CHARS = 1200

const MOVE_LABELS: Record<string, string> = {
  frame: 'Frame — diagnosing the real problem',
  list: 'List — mapping the solution space',
  optimize: 'Optimize — picking the right criterion',
  win: 'Win — building a falsifiable recommendation',
}

type GradeLabel = 'Sharp' | 'Solid' | 'Surface' | 'Weak'
type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

interface GradeResult {
  quality: number
  gradeLabel: GradeLabel
  coaching: string
  move: FlowMove
}

const GRADE_COLORS: Record<GradeLabel, string> = {
  Sharp: 'var(--forest)',
  Solid: 'var(--forest-2)',
  Surface: 'var(--amber-2)',
  Weak: 'var(--amber-2)',
}

/** Rotate through the authored prompts by day so the homepage rep changes daily. */
function getDailyPromptIndex(): number {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return dayOfYear % MOCK_PROMPTS.length
}

function openSignup() {
  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))
}

export function V3TryRep() {
  const { track } = useMagnetTracking('mock')

  const prompt = MOCK_PROMPTS[getDailyPromptIndex()]

  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'grading' | 'done' | 'error' | 'limit'>('idle')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const startedRef = useRef(false)

  const handleAnswerChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value.slice(0, MAX_CHARS)
      setAnswer(val)
      if (!startedRef.current && val.trim().length > 0) {
        startedRef.current = true
        track(EVENT_MAGNET_QUIZ_STARTED)
      }
    },
    [track]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (status === 'grading' || !prompt) return
      setStatus('grading')
      setErrorMsg('')

      try {
        const res = await fetch('/api/go/mock-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer, promptId: prompt.id }),
        })

        if (res.status === 429) {
          setStatus('limit')
          return
        }
        if (!res.ok) {
          setErrorMsg('Something went wrong. Try again in a moment.')
          setStatus('error')
          return
        }

        const data = (await res.json()) as GradeResult
        setResult(data)
        setStatus('done')
        track(EVENT_MAGNET_QUIZ_COMPLETED, { band: data.gradeLabel, score: data.quality })
      } catch {
        setErrorMsg('Something went wrong. Check your connection and try again.')
        setStatus('error')
      }
    },
    [answer, prompt, status, track]
  )

  if (!prompt) return null

  if (status === 'done' && result) {
    return (
      <div className="lm-card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <p className="lm-quiz-eyebrow" style={{ margin: '0 0 4px' }}>Your grade</p>
          <p className="lm-result-band" style={{ color: GRADE_COLORS[result.gradeLabel], margin: 0 }}>
            {result.gradeLabel}
          </p>
          <p className="lm-result-blurb" style={{ margin: '8px 0 0' }}>{result.coaching}</p>
        </div>

        <div style={{ borderTop: '1px solid var(--line-2)', paddingTop: 12 }}>
          <p className="lm-quiz-eyebrow" style={{ margin: '0 0 4px' }}>The move to train</p>
          <p style={{ fontWeight: 700, color: 'var(--ink-1)', fontSize: 15, margin: 0 }}>
            {MOVE_LABELS[result.move] ?? result.move}
          </p>
        </div>

        <button type="button" className="btn btn-amber" onClick={openSignup} style={{ justifySelf: 'stretch' }}>
          Create your free account <span aria-hidden>→</span>
        </button>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-4)', textAlign: 'center' }}>
          Keep this result and get the full four-step breakdown.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="lm-card" style={{ display: 'grid', gap: 12 }}>
      <div>
        <p className="lm-quiz-eyebrow" style={{ margin: '0 0 6px' }}>Try one rep, no signup</p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.45, color: 'var(--ink-2)' }}>
          {prompt.context}
        </p>
        <p style={{ fontWeight: 700, color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.4, margin: 0 }}>
          {prompt.prompt}
        </p>
      </div>

      <textarea
        id="try-rep-answer"
        value={answer}
        onChange={handleAnswerChange}
        placeholder="Write your answer here. Four to six sentences is the sweet spot."
        rows={5}
        aria-label="Your answer"
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '11px 13px',
          border: '1px solid var(--line-2)',
          borderRadius: 'var(--r-md)',
          background: 'var(--bg)',
          color: 'var(--ink-1)',
          fontSize: 14,
          lineHeight: 1.55,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button
          type="submit"
          className="btn btn-forest"
          disabled={status === 'grading' || answer.trim().length < 20}
        >
          {status === 'grading' ? 'Grading…' : 'Grade my answer'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{answer.length} / {MAX_CHARS}</span>
      </div>

      {status === 'error' && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-2)' }}>{errorMsg}</p>
      )}
      {status === 'limit' && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
          Three free grades a day. The full mock with a four-step breakdown is inside the platform.{' '}
          <button
            type="button"
            onClick={openSignup}
            style={{ background: 'none', border: 0, padding: 0, color: 'var(--forest)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create a free account
          </button>
          .
        </p>
      )}

      {/* Honeypot — the grader rejects submissions that fill this. */}
      <input
        type="text"
        name="website"
        className="lm-hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        readOnly
      />
    </form>
  )
}
