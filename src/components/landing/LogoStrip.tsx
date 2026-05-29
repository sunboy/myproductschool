import Link from 'next/link'
import { OUTCOME_PAGES } from '@/lib/seo/outcomes'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const TITLES = {
  'interview-prep': 'Ace product and technical interviews',
  'role-transitions': 'Move from engineer to product-minded builder',
  uplevel: 'Operate at senior/staff level',
  'salary-negotiation': 'Negotiate with proof, not hope',
} as const

export function LogoStrip() {
  return (
    <section id="career-goals" className="mkt-section mkt-outcomes">
      <div className="mkt-section-head">
        <p>Career goals</p>
        <h2>Start from the outcome. Train the judgment behind it.</h2>
        <p>
          The strongest paths are simple to recognize: interview readiness,
          broader scope, role transition, and evidence of level.
        </p>
      </div>

      <div className="mkt-outcome-grid">
        {OUTCOME_PAGES.map((outcome) => {
          return (
            <Link key={outcome.slug} href={outcome.path} className="mkt-outcome-card">
              <div className="mkt-outcome-top">
                <span>{outcome.title}</span>
                <HatchGlyph
                  state={outcome.slug === 'interview-prep' ? 'listening' : outcome.slug === 'uplevel' ? 'challenging' : outcome.slug === 'salary-negotiation' ? 'celebrating' : 'speaking'}
                  size={38}
                />
              </div>
              <h3>{TITLES[outcome.slug]}</h3>
              <p>{outcome.summary}</p>
              <div className="mkt-outcome-mini">
                {outcome.tracks.slice(0, 3).map((track) => (
                  <b key={track}>{track}</b>
                ))}
              </div>
              <small>{outcome.shortTitle}</small>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
