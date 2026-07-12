'use client'

import { useState, useRef, useCallback } from 'react'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import { useMagnetTracking } from '@/components/landing-v3/lead-magnet/useMagnetTracking'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_COMPLETED,
} from '@/lib/posthog/events'
import { MOCK_INTERVIEW_PROMPTS } from '@/lib/lead-magnets/quizzes/mock'

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

/** Pick the daily prompt by rotating through the three authored prompts. */
function getDailyPromptIndex(): number {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return dayOfYear % MOCK_INTERVIEW_PROMPTS.length
}

export function MockClient() {
  const { track } = useMagnetTracking('mock')

  const promptIndex = getDailyPromptIndex()
  const prompt = MOCK_INTERVIEW_PROMPTS[promptIndex]

  const [answer, setAnswer] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
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
        setHasStarted(true)
        track(EVENT_MAGNET_QUIZ_STARTED)
      }
    },
    [track]
  )

  async function handleSubmit(e: React.FormEvent) {
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
      track(EVENT_MAGNET_QUIZ_COMPLETED, {
        band: data.gradeLabel,
        score: data.quality,
      })
    } catch {
      setErrorMsg('Something went wrong. Check your connection and try again.')
      setStatus('error')
    }
  }

  if (!prompt) return null

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Free product answer grader
            </p>
            <h1>
              Sixty seconds. One answer. Graded the way an interviewer grades it,
              before it costs you an interview.
            </h1>
            <p className="lm-hero-lead">
              Write your answer to a real product situation. Hatch grades it on the same
              rubric used inside the platform and tells you which reasoning move to
              sharpen next.
            </p>
            <ul className="lm-hero-bullets">
              <li>One free grade, no signup required</li>
              <li>Direct coaching on the specific gap in your answer</li>
              <li>The FLOW move your answer is training, and what the full breakdown adds</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { step: '1', text: 'Read the product situation' },
                  { step: '2', text: 'Write your answer in four to six sentences' },
                  { step: '3', text: 'Get a grade and one concrete coaching note' },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span
                      style={{
                        flex: '0 0 24px',
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--forest-soft)',
                        color: 'var(--forest)',
                        fontWeight: 800,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.step}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--ink-1)',
                        fontSize: 14,
                        lineHeight: 1.45,
                        paddingTop: 3,
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The rep ───────────────────────────────────────────────────── */}
      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 680 }}>
          {status !== 'done' ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              {/* Prompt card */}
              <div className="lm-quiz-step">
                <p className="lm-quiz-eyebrow">Today&apos;s product situation</p>
                <p className="lm-quiz-context">{prompt.context}</p>
                <p
                  style={{
                    fontWeight: 700,
                    color: 'var(--ink-1)',
                    fontSize: 16,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {prompt.prompt}
                </p>
              </div>

              {/* Answer textarea */}
              <div className="lm-card" style={{ display: 'grid', gap: 10 }}>
                <label
                  htmlFor="mock-answer"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Your answer
                </label>
                <textarea
                  id="mock-answer"
                  value={answer}
                  onChange={handleAnswerChange}
                  placeholder="Write your answer here. Four to six sentences is the sweet spot."
                  rows={6}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '12px 14px',
                    border: '1px solid var(--line-2)',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg)',
                    color: 'var(--ink-1)',
                    fontSize: 15,
                    lineHeight: 1.55,
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--ink-4)',
                    }}
                  >
                    {answer.length} / {MAX_CHARS}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--ink-4)',
                    }}
                  >
                    Four to six sentences is the sweet spot.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-forest"
                  disabled={status === 'grading' || answer.trim().length < 20}
                  style={{ justifySelf: 'start' }}
                >
                  {status === 'grading' ? 'Grading...' : 'Grade my answer'}
                </button>

                {status === 'error' && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-2)' }}>
                    {errorMsg}
                  </p>
                )}

                {status === 'limit' && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
                    Three free grades a day. The full mock with a four-step breakdown is
                    inside the platform.
                  </p>
                )}
              </div>

              {/* Honeypot */}
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
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Grade result */}
              {result && (
                <>
                  <div className="lm-card">
                    <p className="lm-quiz-eyebrow">Your grade</p>
                    <p
                      className="lm-result-band"
                      style={{ color: GRADE_COLORS[result.gradeLabel] }}
                    >
                      {result.gradeLabel}
                    </p>
                    <p className="lm-result-blurb">{result.coaching}</p>
                  </div>

                  <div className="lm-card">
                    <p className="lm-quiz-eyebrow">The move to train</p>
                    <p
                      style={{
                        fontWeight: 700,
                        color: 'var(--ink-1)',
                        fontSize: 16,
                        margin: '0 0 6px',
                      }}
                    >
                      {MOVE_LABELS[result.move] ?? result.move}
                    </p>
                    <p
                      style={{
                        color: 'var(--ink-2)',
                        fontSize: 14,
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      The full mock breaks your answer into all four FLOW steps and grades
                      each one separately, so you can see exactly where the reasoning
                      held and where it fell apart.
                    </p>
                  </div>

                  {/* Gate */}
                  <div className="lm-card">
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--ink-1)',
                        margin: '0 0 8px',
                      }}
                    >
                      What the full mock adds
                    </p>
                    <ul
                      style={{
                        margin: '0 0 20px',
                        paddingLeft: 18,
                        color: 'var(--ink-2)',
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      <li>Per-move grading across Frame, List, Optimize, and Win</li>
                      <li>Hatch coaching on the exact move you dropped under pressure</li>
                      <li>Strong-answer comparisons so you see the gap, not just the score</li>
                    </ul>
                    <LeadGateForm
                      sourceSlug="mock"
                      mode="signup"
                      title="Get the full four-step breakdown"
                      ctaLabel="Get the full four-step breakdown"
                      signupNext="/challenges"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
