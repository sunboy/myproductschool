'use client'

import { useState, useRef } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import { useMagnetTracking } from '@/components/landing-v3/lead-magnet/useMagnetTracking'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_COMPLETED,
} from '@/lib/posthog/events'

// The four FLOW moves, shown as the rebuild of one weak answer. Content is
// authored (HackProduct voice), not a fabricated company claim. The weak answer
// is the kind of thing engineers actually say in product-sense rounds.

interface Move {
  key: string
  move: string
  weak: string
  rebuilt: string
  why: string
}

const PROMPT =
  'Our team-collaboration app is losing users in the first week. How would you fix the drop-off?'

const WEAK_ANSWER =
  "I'd add better onboarding, maybe a product tour, and send some reminder emails. I'd also improve the UI because it feels cluttered, and add more integrations so it fits into people's workflows."

const MOVES: Move[] = [
  {
    key: 'frame',
    move: 'Frame',
    weak: 'Jumps straight to fixes (tour, emails, UI).',
    rebuilt:
      'First I want to know which drop-off we are solving. A user who never connected their team has a different problem than one who connected it and left. The real blocker is probably that the app is empty until a teammate joins.',
    why: 'Naming the blocker before the fix is the move interviewers wait for. Without it, every solution is a guess.',
  },
  {
    key: 'list',
    move: 'List',
    weak: 'One bundle of ideas, all the same shape.',
    rebuilt:
      'Three structurally different paths: remove the cold-start (seed the workspace with sample content), shorten time-to-value (one real task done in the first session), or change who invites whom (let one person pull a teammate in before setup).',
    why: 'Options that differ in kind, not degree. "Better UI" and "more integrations" are the same move twice.',
  },
  {
    key: 'optimize',
    move: 'Optimize',
    weak: 'No criterion, so no real choice.',
    rebuilt:
      'I would optimize for time-to-first-collaboration, because the value only appears with a second person. That means I accept a thinner solo experience to push the invite earlier. The sacrifice is real and I can defend it.',
    why: 'A tradeoff names what you give up and why it is acceptable. A preference just says one feels better.',
  },
  {
    key: 'win',
    move: 'Win',
    weak: 'Ends without a measurable claim.',
    rebuilt:
      'We will know it worked if week-one retention for invited teammates rises from X to Y within a month, with no drop in solo activation as a guardrail. If retention moves but activation falls, we pushed the invite too early.',
    why: 'A falsifiable success metric with a guardrail. "It should help" is not a result.',
  },
]

export function AnswerFixClient() {
  const [active, setActive] = useState<string>('frame')
  const current = MOVES.find((m) => m.key === active) ?? MOVES[0]

  const { track } = useMagnetTracking('answer-fix')

  // Track which moves the visitor has viewed (first interaction fires quiz_started).
  const viewedMoves = useRef<Set<string>>(new Set())
  const quizStartedRef = useRef(false)
  const quizCompletedRef = useRef(false)

  function handleMoveSelect(key: string) {
    setActive(key)

    if (!quizStartedRef.current) {
      quizStartedRef.current = true
      track(EVENT_MAGNET_QUIZ_STARTED)
    }

    viewedMoves.current.add(key)

    if (!quizCompletedRef.current && viewedMoves.current.size === MOVES.length) {
      quizCompletedRef.current = true
      track(EVENT_MAGNET_QUIZ_COMPLETED, {
        band: 'answer-fix',
        movesViewed: MOVES.length,
      })
    }
  }

  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow"><span className="dot" />Answer repair</p>
            <h1>Turn a rambling product answer into one that sounds like a decision.</h1>
            <p className="lm-hero-lead">
              Most engineers lose product-sense rounds not on ideas but on structure. Watch one
              real answer get rebuilt move by move, and see exactly what each rebuild does
              differently.
            </p>
            <ul className="lm-hero-bullets">
              <li>The four moves that turn a list of ideas into a decision</li>
              <li>The exact line interviewers wait for, and when</li>
              <li>A reusable structure you can run under pressure</li>
            </ul>
          </div>
          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ marginBottom: 8 }}>The question</p>
              <p style={{ color: 'var(--ink-1)', fontWeight: 700, lineHeight: 1.4 }}>{PROMPT}</p>
              <p className="lm-gate-sub" style={{ margin: '16px 0 6px' }}>A typical answer</p>
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.5, fontSize: 15 }}>{WEAK_ANSWER}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-section lm-section-alt">
        <div className="shell">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HatchGlyph size={40} state="speaking" className="text-primary" />
            <h2 style={{ margin: 0 }}>Rebuild it, one move at a time.</h2>
          </div>
          <p className="lm-section-sub" style={{ marginTop: 8 }}>
            Tap each move to see how the same answer gets sharper.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '20px 0' }}>
            {MOVES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`btn ${active === m.key ? 'btn-forest' : ''}`}
                style={
                  active === m.key
                    ? undefined
                    : { background: 'var(--paper)', color: 'var(--ink-1)', border: '1px solid var(--line-2)' }
                }
                onClick={() => handleMoveSelect(m.key)}
              >
                {m.move}
              </button>
            ))}
          </div>

          <div className="lm-card">
            <p className="eyebrow"><span className="dot" />{current.move}</p>
            <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
              <div>
                <p className="lm-gate-sub" style={{ margin: '0 0 4px' }}>What the weak answer does</p>
                <p style={{ color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>{current.weak}</p>
              </div>
              <div style={{ padding: 16, background: 'var(--forest-soft)', borderRadius: 'var(--r-md)' }}>
                <p className="lm-gate-sub" style={{ margin: '0 0 4px', color: 'var(--forest-2)' }}>Rebuilt</p>
                <p style={{ color: 'var(--ink-1)', margin: 0, lineHeight: 1.55 }}>{current.rebuilt}</p>
              </div>
              <div>
                <p className="lm-gate-sub" style={{ margin: '0 0 4px' }}>Why it scores higher</p>
                <p style={{ color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>{current.why}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-section">
        <div className="shell" style={{ maxWidth: 640 }}>
          <h2>Get the structure you can run in any round.</h2>
          <p className="lm-section-sub" style={{ marginBottom: 20 }}>
            The printable four-move answer structure plus the three reasoning templates strong
            candidates lean on when the question gets hard.
          </p>
          <LeadGateForm
            sourceSlug="answer-fix"
            mode="gate"
            magnetResult={{ magnet: 'answer-fix', version: 1, movesViewed: viewedMoves.current.size }}
            title="Send me the answer structure"
            subtitle="A printable four-move structure and three reasoning templates, in your inbox in seconds."
            ctaLabel="Get the structure"
            postUnlockCtaLabel="Practice it on a real challenge"
            signupNext="/challenges"
          >
            <p className="eyebrow"><span className="dot" />Unlocked</p>
            <h3 style={{ fontFamily: 'var(--v3-font-display)', fontSize: 22, margin: '8px 0 12px', color: 'var(--ink-1)' }}>
              The four-move answer structure
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-1)', lineHeight: 1.7 }}>
              <li><strong>Frame:</strong> name the blocker behind the symptom before any fix.</li>
              <li><strong>List:</strong> generate options that differ in kind, not degree.</li>
              <li><strong>Optimize:</strong> pick a criterion and name what you give up.</li>
              <li><strong>Win:</strong> a falsifiable metric with a guardrail and a timeline.</li>
            </ul>
            <p style={{ color: 'var(--ink-2)', marginTop: 14, fontSize: 14 }}>
              Your printable answer structure with reasoning templates is in your inbox.
            </p>
          </LeadGateForm>
        </div>
      </section>
    </>
  )
}
