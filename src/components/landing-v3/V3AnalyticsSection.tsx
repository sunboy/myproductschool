'use client'

import Link from 'next/link'
import { LineChart } from 'lucide-react'

function openAnalystSignup() {
  window.dispatchEvent(
    new CustomEvent('open-auth-modal', {
      detail: { mode: 'signup', next: '/claude-code-analytics' },
    }),
  )
}

const SCORE_ROWS = [
  { label: 'Framing', value: 9.0, width: '90%' },
  { label: 'Query rigor', value: 8.2, width: '82%' },
  { label: 'Segmentation', value: 7.5, width: '75%' },
  { label: 'Communication', value: 8.6, width: '86%' },
  { label: 'Evidence', value: 9.1, width: '91%' },
  { label: 'Skill', value: 7.8, width: '78%' },
]

const STEPS = [
  'list tables',
  'read the schema',
  'rank the drop',
  'segment by device',
  'land the finding',
]

export function V3AnalyticsSection() {
  return (
    <section className="analytics-section" id="analytics" aria-labelledby="analytics-heading">
      <div className="shell analytics-shell">
        <div className="analytics-copy">
          <p className="eyebrow">Live AI data analyst · using Claude Code</p>
          <h2 id="analytics-heading">Drive a live AI analyst against real data.</h2>
          <p className="analytics-lead">
            Direct a Claude Code agent against a real dataset. You decide what to chase, it runs
            the queries, Hatch coaches every move. No SQL required to start.
          </p>
          <div className="analytics-cta-row">
            <button type="button" className="btn btn-amber analytics-cta" onClick={openAnalystSignup}>
              Try the live analyst <span aria-hidden>→</span>
            </button>
            <Link className="analytics-secondary" href="/claude-code-analytics">
              See how it works <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-chrome">
            <span className="analytics-dot" aria-hidden />
            <span className="analytics-dot" aria-hidden />
            <span className="analytics-dot" aria-hidden />
            <span className="analytics-url">hackproduct.com/analytics</span>
            <span className="analytics-live">
              <LineChart size={12} aria-hidden /> LIVE
            </span>
          </div>

          <div className="analytics-card-body">
            <div className="analytics-trace">
              {STEPS.map((step, i) => (
                <span key={step} className="analytics-trace-step">
                  {step}
                  {i < STEPS.length - 1 ? <span className="analytics-trace-arrow" aria-hidden> → </span> : null}
                </span>
              ))}
            </div>

            <div className="analytics-scorecard">
              <p className="analytics-scorecard-label">▸ Analyst scorecard</p>
              {SCORE_ROWS.map((row) => (
                <div className="ds-rubric-row" key={row.label}>
                  <span className="ds-rubric-name">{row.label}</span>
                  <span className="ds-rubric-bar"><div style={{ width: row.width }} /></span>
                  <span className="ds-rubric-num">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="analytics-overall">
              <span>▸ Overall</span>
              <span className="ds-score-big">8.4 <small>/ 10</small></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
