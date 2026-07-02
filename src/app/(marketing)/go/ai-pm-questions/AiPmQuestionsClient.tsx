'use client'

import { useState } from 'react'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import { useMagnetTracking } from '@/components/landing-v3/lead-magnet/useMagnetTracking'
import { AI_PM_QUESTIONS, FULL_SET } from '@/lib/lead-magnets/quizzes/ai-pm-questions'
import { EVENT_MAGNET_QUIZ_STARTED } from '@/lib/posthog/events'

const MOVE_LABEL: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

// Three questions from FULL_SET shown as the inline gate preview (ranks 11, 12, 13)
const GATE_PREVIEW = FULL_SET.slice(0, 3)

export function AiPmQuestionsClient() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const { track } = useMagnetTracking('ai-pm-questions')

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size === 0) {
          // First reveal — fire the started event
          track(EVENT_MAGNET_QUIZ_STARTED, { trigger: 'first_reveal' })
        }
        next.add(id)
      }
      return next
    })
  }

  const revealedCount = revealed.size

  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              AI-PM interview prep
            </p>
            <h1>
              Three of these questions expose app-layer thinking in under a minute.
              Interviewers know it. Most candidates do not.
            </h1>
            <p className="lm-hero-lead">
              Ten questions ranked by rejection risk, each tagged by the reasoning move it
              exercises. Tap any card to see what the interviewer is actually scoring.
            </p>
            <ul className="lm-hero-bullets">
              <li>The hidden signal behind each question, not just what it asks on the surface</li>
              <li>Why unready candidates fail it, explained in one sentence</li>
              <li>The full set of 24, plus answer skeletons for the six highest-risk ones</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                What interviewers score
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { move: 'Frame', desc: 'Can you name the problem before you name the fix?' },
                  { move: 'List', desc: 'Do your options differ in kind, not just in degree?' },
                  { move: 'Optimize', desc: 'Can you name the sacrifice, not just the gain?' },
                  { move: 'Win', desc: 'Is your success metric falsifiable?' },
                ].map((item) => (
                  <div
                    key={item.move}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span
                      style={{
                        flex: '0 0 auto',
                        padding: '1px 8px',
                        borderRadius: 'var(--r-xs)',
                        background: 'var(--forest-soft)',
                        color: 'var(--forest)',
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginTop: 2,
                      }}
                    >
                      {item.move}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--ink-1)',
                        fontSize: 14,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 720 }}>
          <h2>The 10 highest-risk questions, ranked</h2>
          <p className="lm-section-sub" style={{ marginBottom: 28 }}>
            Tap a card to see what the interviewer is actually testing.
          </p>

          <div style={{ display: 'grid', gap: 12 }}>
            {AI_PM_QUESTIONS.map((q) => {
              const isOpen = revealed.has(q.id)
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleReveal(q.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'var(--paper)',
                    border: `1px solid ${isOpen ? 'var(--forest)' : 'var(--line-2)'}`,
                    borderRadius: 'var(--r-lg)',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'border-color var(--tr-fast)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        flex: '0 0 28px',
                        height: 28,
                        borderRadius: '50%',
                        background: isOpen ? 'var(--forest)' : 'var(--forest-soft)',
                        color: isOpen ? 'var(--on-forest, #fff)' : 'var(--forest)',
                        fontWeight: 800,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                        transition: 'background var(--tr-fast), color var(--tr-fast)',
                      }}
                    >
                      {q.rank}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: 'var(--ink-1)',
                          fontSize: 15,
                          lineHeight: 1.5,
                        }}
                      >
                        {q.question}
                      </p>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--forest)',
                            background: 'var(--forest-soft)',
                            padding: '2px 8px',
                            borderRadius: 'var(--r-xs)',
                          }}
                        >
                          {MOVE_LABEL[q.move] ?? q.move}
                        </span>
                        {!isOpen && (
                          <span
                            style={{ fontSize: 13, color: 'var(--ink-3)' }}
                          >
                            Tap to see what it tests
                          </span>
                        )}
                      </div>

                      {isOpen && (
                        <div className="lm-reveal" style={{ marginTop: 14 }}>
                          <div
                            style={{
                              padding: '14px 16px',
                              background: 'var(--forest-soft)',
                              borderRadius: 'var(--r-md)',
                              marginBottom: 10,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--forest)',
                                margin: '0 0 5px',
                              }}
                            >
                              What it actually tests
                            </p>
                            <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.55 }}>
                              {q.signal}
                            </p>
                          </div>
                          <div
                            style={{
                              padding: '14px 16px',
                              background: 'var(--amber-soft, var(--surface-2))',
                              borderRadius: 'var(--r-md)',
                              borderLeft: '3px solid var(--amber-2)',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--amber-2)',
                                margin: '0 0 5px',
                              }}
                            >
                              Why unready candidates fail it
                            </p>
                            <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.55 }}>
                              {q.riskNote}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="lm-section">
        <div className="shell" style={{ maxWidth: 680 }}>
          <h2>Open the full set</h2>
          <p className="lm-section-sub" style={{ marginBottom: 24 }}>
            All 24 questions, the answer skeletons for the six that trip up candidates most
            often, and the scoring rubric interviewers map answers onto.
          </p>

          <LeadGateForm
            sourceSlug="ai-pm-questions"
            mode="gate"
            magnetResult={{ magnet: 'ai-pm-questions', version: 1, revealedCount }}
            title="Open the full set"
            subtitle="All 24 questions tagged by the reasoning move they test, answer skeletons for the six highest-risk ones, and the rubric they are scored on."
            ctaLabel="Open the full set"
            postUnlockCtaLabel="Practice on a real AI challenge"
            signupNext="/challenges"
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--ink-1)',
                margin: '0 0 12px',
              }}
            >
              Three more from the full set
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {GATE_PREVIEW.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                    borderLeft: '3px solid var(--line-2)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--forest)',
                      }}
                    >
                      #{q.rank}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--forest)',
                        background: 'var(--forest-soft)',
                        padding: '1px 6px',
                        borderRadius: 'var(--r-xs)',
                      }}
                    >
                      {MOVE_LABEL[q.move] ?? q.move}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.5 }}>
                    {q.question}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--ink-3)', marginTop: 12, fontSize: 13 }}>
              Plus 11 more, answer skeletons, and the scoring rubric.
            </p>
          </LeadGateForm>
        </div>
      </section>
    </>
  )
}
