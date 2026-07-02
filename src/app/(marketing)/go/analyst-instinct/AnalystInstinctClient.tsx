'use client'

import { useState } from 'react'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import { useMagnetTracking } from '@/components/landing-v3/lead-magnet/useMagnetTracking'
import {
  EVENT_MAGNET_QUIZ_STARTED,
  EVENT_MAGNET_QUIZ_COMPLETED,
} from '@/lib/posthog/events'

// ── Investigation replay data ─────────────────────────────────────────────────
// Eight moves that mirror the investigation arc shown in the Claude Code
// analytics session: from schema reconnaissance to a defensible finding.

const REPLAY_MOVES = [
  {
    index: 0,
    label: 'List tables',
    command: 'SHOW TABLES IN analytics_prod;',
    output:
      'events, sessions, revenue_events, user_properties, funnel_steps … (14 tables)',
    note: 'Start with the full map, not a guess. You need to know what data exists before you decide what to chase.',
  },
  {
    index: 1,
    label: 'Read the schema',
    command: 'DESCRIBE revenue_events;',
    output:
      'event_ts TIMESTAMP, user_id STRING, amount_usd FLOAT, platform STRING, region STRING, plan_tier STRING …',
    note: 'Schema tells you which dimensions are queryable. Platform and region are both present, which means segmentation is available without a join.',
  },
  {
    index: 2,
    label: 'Rank the drop',
    command:
      'SELECT DATE(event_ts) AS day, SUM(amount_usd) AS revenue FROM revenue_events WHERE event_ts >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) GROUP BY 1 ORDER BY 1;',
    output:
      'Revenue stable through June 3. Drops 34% on June 4. Partially recovers June 6. Still down 19% vs. prior 4-week average.',
    note: 'Quantify before you segment. A 34% single-day drop is a discrete event, not a trend, which changes what you look for next.',
  },
  {
    index: 3,
    label: 'Segment by device',
    command:
      "SELECT platform, SUM(amount_usd) AS revenue FROM revenue_events WHERE DATE(event_ts) = '2026-06-04' GROUP BY 1 ORDER BY 2 DESC;",
    output: 'web: $41,200  |  ios: $9,800  |  android: $1,100',
    note: 'Web is carrying the bulk of the drop. iOS held. Android is negligible in absolute terms. This is a web-side event.',
  },
  {
    index: 4,
    label: 'Check funnel steps',
    command:
      "SELECT step_name, COUNT(*) AS entries, AVG(conversion_rate) AS cvr FROM funnel_steps WHERE platform = 'web' AND DATE(created_at) BETWEEN '2026-06-03' AND '2026-06-04' GROUP BY 1;",
    output:
      'checkout_start: cvr 0.71 → 0.68 (−4%)  |  payment_confirm: cvr 0.88 → 0.52 (−41%)',
    note: 'Most of the funnel held. The payment confirmation step collapsed. That is the mechanism, not the cause.',
  },
  {
    index: 5,
    label: 'Correlate with deploys',
    command:
      "SELECT deploy_ts, service, commit_sha, author FROM deploy_log WHERE deploy_ts BETWEEN '2026-06-03 20:00' AND '2026-06-04 08:00' ORDER BY deploy_ts;",
    output:
      '2026-06-03 23:41 UTC — payments-service — a3f91c2 — e.nguyen  (payment processor SDK bump v2.1 → v2.4)',
    note: 'One deploy, one service, one author, the night before the drop. The SDK version bump is the prime suspect.',
  },
  {
    index: 6,
    label: 'Validate the hypothesis',
    command:
      "SELECT COUNT(*) AS errors, error_code FROM payment_errors WHERE DATE(created_at) = '2026-06-04' AND platform = 'web' GROUP BY error_code ORDER BY 1 DESC LIMIT 5;",
    output:
      'CARD_DECLINED_GENERIC: 1,842  |  3DS_CHALLENGE_FAILED: 973  |  TIMEOUT: 204',
    note: '3DS_CHALLENGE_FAILED spiked on June 4. That error code is specific to the 3D Secure flow, which the SDK v2.4 changed. The hypothesis holds.',
  },
  {
    index: 7,
    label: 'Land the finding',
    command: '-- Summary report',
    output:
      'Root cause: SDK v2.4 broke the 3DS challenge flow on web checkout. Revenue impact: −$14,300 on June 4. Fix: pin payments-service to SDK v2.1, re-test 3DS flow, then upgrade with regression coverage.',
    note: 'A finding without a recommended action is just a description. Name the cause, size the impact, and say what comes next.',
  },
]

// ── What-next options (interactive beat after the replay) ────────────────────

const NEXT_OPTIONS = [
  {
    id: 'a',
    text: 'Check whether the same drop hit mobile or only web',
    reveal:
      'Good instinct. The segmentation already answered this: iOS held steady. The problem is web-only, so investigating mobile would be a detour at this point.',
  },
  {
    id: 'b',
    text: 'Quantify the revenue impact across the full affected window, not just June 4',
    reveal:
      'That is the right next move. June 6 was still down 19% versus the prior average, so the impact extends beyond the single day. Sizing the full window gives the incident report a defensible number.',
  },
  {
    id: 'c',
    text: 'Write a Slack message to the engineering team explaining what happened',
    reveal:
      'Premature. Before communicating, you want the full revenue number and a confirmed fix path. Communicating a hypothesis without the impact size creates confusion, not confidence.',
  },
]

// ── Analyst scorecard (mirrors V3AnalyticsSection) ────────────────────────────

const SCORE_ROWS = [
  { label: 'Framing', value: 9.0, pct: 90 },
  { label: 'Query rigor', value: 8.2, pct: 82 },
  { label: 'Segmentation', value: 7.5, pct: 75 },
  { label: 'Communication', value: 8.6, pct: 86 },
  { label: 'Evidence', value: 9.1, pct: 91 },
  { label: 'Skill', value: 7.8, pct: 78 },
]

// ── Replay component ─────────────────────────────────────────────────────────

function InvestigationReplay({ onStart, onComplete }: { onStart: () => void; onComplete: () => void }) {
  const [currentMove, setCurrentMove] = useState(-1) // -1 = not started
  const [started, setStarted] = useState(false)
  const completed = currentMove >= REPLAY_MOVES.length - 1

  function handleStart() {
    setStarted(true)
    setCurrentMove(0)
    onStart()
  }

  function handleNext() {
    const next = currentMove + 1
    setCurrentMove(next)
    if (next >= REPLAY_MOVES.length - 1) {
      onComplete()
    }
  }

  const visibleMoves = started ? REPLAY_MOVES.slice(0, currentMove + 1) : []
  const activeMove = started ? REPLAY_MOVES[currentMove] : null

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Progress bar */}
      {started && (
        <div className="lm-progress">
          <div
            className="lm-progress-fill"
            style={{ width: `${((currentMove + 1) / REPLAY_MOVES.length) * 100}%` }}
          />
        </div>
      )}

      {/* Stacked completed moves */}
      {visibleMoves.slice(0, -1).map((move) => (
        <div
          key={move.index}
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)',
            border: '1px solid var(--line-1)',
            opacity: 0.75,
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span
              style={{
                flex: '0 0 22px',
                height: 22,
                borderRadius: '50%',
                background: 'var(--forest)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {move.index + 1}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--ink-1)', fontSize: 14 }}>
              {move.label}
            </span>
          </div>
          <code
            style={{
              display: 'block',
              fontSize: 12,
              color: 'var(--ink-3)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {move.command}
          </code>
        </div>
      ))}

      {/* Active move card */}
      {activeMove && (
        <div className="lm-card" style={{ borderColor: 'var(--forest)' }}>
          <p className="lm-quiz-eyebrow">
            Move {activeMove.index + 1} of {REPLAY_MOVES.length}
          </p>
          <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink-1)', margin: '0 0 14px' }}>
            {activeMove.label}
          </p>

          <div
            style={{
              background: 'var(--dark)',
              borderRadius: 'var(--r-md)',
              padding: '12px 14px',
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--forest-bright)',
                margin: '0 0 6px',
              }}
            >
              Query
            </p>
            <code
              style={{
                display: 'block',
                fontSize: 13,
                color: '#e8e4d9',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {activeMove.command}
            </code>
          </div>

          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)',
              padding: '12px 14px',
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                margin: '0 0 6px',
              }}
            >
              Result
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-1)', margin: 0, lineHeight: 1.55 }}>
              {activeMove.output}
            </p>
          </div>

          <div className="lm-reveal" style={{ marginTop: 0, marginBottom: 16 }}>
            <strong style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
              Why this move
            </strong>
            {activeMove.note}
          </div>

          {completed ? (
            <p
              style={{
                fontWeight: 700,
                color: 'var(--forest)',
                fontSize: 15,
                margin: 0,
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              Finding landed. Investigation complete.
            </p>
          ) : (
            <button type="button" className="btn btn-forest lm-gate-cta" onClick={handleNext}>
              Next move <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}

      {/* Start state */}
      {!started && (
        <div className="lm-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: '0 0 20px', lineHeight: 1.55 }}>
            A 34% revenue drop surfaced on June 4. The analyst starts with zero assumptions and
            eight moves to find the cause.
          </p>
          <button type="button" className="btn btn-amber lm-gate-cta" onClick={handleStart}>
            Start the replay <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── What-next interactive beat ────────────────────────────────────────────────

function WhatNext() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <p className="lm-quiz-eyebrow">Your turn</p>
        <p style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink-1)', margin: '0 0 8px' }}>
          What would you investigate next?
        </p>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          The root cause is confirmed. Pick the move that makes the most sense at this point in the
          investigation.
        </p>
      </div>

      <div>
        {NEXT_OPTIONS.map((opt) => (
          <div key={opt.id}>
            <button
              type="button"
              className={`lm-option${selected === opt.id ? ' is-selected' : ''}`}
              onClick={() => setSelected(opt.id)}
              disabled={selected !== null && selected !== opt.id}
            >
              {opt.text}
            </button>
            {selected === opt.id && (
              <div className="lm-reveal">
                {opt.reveal}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Analyst scorecard ─────────────────────────────────────────────────────────

function AnalystScorecard() {
  const overall = 8.4

  return (
    <div className="lm-card">
      <p className="lm-quiz-eyebrow">Sample analyst scorecard</p>
      <p style={{ fontWeight: 700, fontSize: 20, color: 'var(--ink-1)', margin: '0 0 4px' }}>
        Scored on the judgment, not the syntax.
      </p>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
        Every live investigation session produces a scorecard across six dimensions. The grade
        reflects decision quality at each step, not whether the SQL was tidy.
      </p>

      {SCORE_ROWS.map((row) => (
        <div key={row.label} className="lm-score-row">
          <span className="lm-score-label">{row.label}</span>
          <span className="lm-score-val">{row.value}</span>
          <div className="lm-score-bar">
            <div className="lm-score-fill" style={{ width: `${row.pct}%` }} />
          </div>
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 16,
          marginTop: 8,
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--ink-1)', fontSize: 15 }}>Overall</span>
        <span style={{ fontWeight: 800, color: 'var(--forest)', fontSize: 24 }}>
          {overall} <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 14 }}>/ 10</span>
        </span>
      </div>
    </div>
  )
}

// ── Main client export ────────────────────────────────────────────────────────

export function AnalystInstinctClient() {
  const { track } = useMagnetTracking('analyst-instinct')
  const [replayStarted, setReplayStarted] = useState(false)
  const [replayDone, setReplayDone] = useState(false)

  function handleReplayStart() {
    if (!replayStarted) {
      setReplayStarted(true)
      track(EVENT_MAGNET_QUIZ_STARTED)
    }
  }

  function handleReplayComplete() {
    setReplayDone(true)
    track(EVENT_MAGNET_QUIZ_COMPLETED, { band: 'replay_complete' })
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Claude Code live analyst
            </p>
            <h1>
              Watch an AI analyst investigate a real revenue drop, move by move. Then take the
              wheel.
            </h1>
            <p className="lm-hero-lead">
              The replay shows how the investigation unfolds across eight moves. Once it lands the
              finding, the wheel is yours: run your own live investigation against real data, with
              Hatch coaching every query.
            </p>
            <ul className="lm-hero-bullets">
              <li>
                The full eight-move replay, from schema reconnaissance to a defensible root-cause
                finding
              </li>
              <li>
                A scorecard that grades judgment at each step, not whether the SQL compiled cleanly
              </li>
              <li>
                A live investigation session where you direct the analyst and Hatch coaches the
                moves in real time
              </li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How this works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  {
                    step: '1',
                    text: 'Watch the eight-move replay against a real revenue dataset',
                  },
                  {
                    step: '2',
                    text: 'Make one judgment call after the finding lands',
                  },
                  {
                    step: '3',
                    text: 'Drive your own live investigation with Hatch coaching every move',
                  },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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

      {/* ── Investigation replay ──────────────────────────────────── */}
      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 720 }}>
          <p className="eyebrow">
            <span className="dot" />
            The replay
          </p>
          <h2>Eight moves. One finding.</h2>
          <p className="lm-section-sub" style={{ marginBottom: 32 }}>
            The analyst starts cold: no prior knowledge of the schema, no hint about what broke.
            Each move is a deliberate choice, and the note after it explains why that choice, in
            that order, is what separates a fast investigation from a slow one.
          </p>
          <InvestigationReplay onStart={handleReplayStart} onComplete={handleReplayComplete} />
        </div>
      </section>

      {/* ── What-next interactive beat ────────────────────────────── */}
      {replayDone && (
        <section className="lm-section">
          <div className="shell" style={{ maxWidth: 720 }}>
            <WhatNext />
          </div>
        </section>
      )}

      {/* ── Analyst scorecard ─────────────────────────────────────── */}
      <section className="lm-section" style={replayDone ? {} : { background: 'var(--surface-2)' }}>
        <div className="shell" style={{ maxWidth: 720 }}>
          <AnalystScorecard />
        </div>
      </section>

      {/* ── Signup gate ───────────────────────────────────────────── */}
      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 600, textAlign: 'center' }}>
          <p className="eyebrow" style={{ textAlign: 'center' }}>
            <span className="dot" />
            Ready?
          </p>
          <h2 style={{ marginBottom: 12 }}>Drive your own investigation.</h2>
          <p className="lm-section-sub" style={{ margin: '0 auto 28px' }}>
            Connect to a real dataset, direct the Claude Code analyst, and get a scored scorecard
            when the session ends. No SQL background required to start.
          </p>
          <LeadGateForm
            sourceSlug="analyst-instinct"
            mode="signup"
            title="Drive your own live investigation"
            subtitle="Connect to a real dataset and direct the Claude Code analyst."
            ctaLabel="Drive your own investigation"
            signupNext="/claude-code-analytics"
          />
        </div>
      </section>
    </>
  )
}
