'use client'

import { useEffect, useState } from 'react'
import { DISCIPLINES, type DisciplineId } from './disciplines'
import { V3TryRep } from './V3TryRep'

const PILL_MESSAGES = ['Practice the interview out loud', 'Product sense, system design, SQL, coding']

function openSignup() {
  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))
}

function AnnouncementPill() {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const tick = setInterval(() => {
      setFading(true)
      const swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % PILL_MESSAGES.length)
        setFading(false)
      }, 320)
      return () => window.clearTimeout(swap)
    }, 3200)
    return () => clearInterval(tick)
  }, [])

  return (
    <div className="hero-pill" role="status" aria-live="polite">
      <span className="hero-pill-dot" aria-hidden />
      <span className={'hero-pill-text' + (fading ? ' fading' : '')}>
        {PILL_MESSAGES[index]}
      </span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function V3Hero() {
  // The discipline tabs are now a labeling affordance ("customize your
  // practice"); the animated demo screen they used to drive was replaced by the
  // live try-a-rep card in the hero-right slot, so there is no auto-cycle.
  const [active, setActive] = useState<DisciplineId>('product')

  function selectPill(id: DisciplineId) {
    setActive(id)
  }

  return (
    <section className="hero" id="top">
      <div className="shell hero-inner">
        <div className="hero-left">
          <AnnouncementPill />

          <h1 className="hero-display">
            You&rsquo;re not bad at this. You&rsquo;re bad at it while someone&rsquo;s watching.
          </h1>

          <ul className="hero-bullets">
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>Interviews test performance, not knowledge.</b> The skill is thinking out loud and defending a call while someone watches.</span>
            </li>
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>Practice the rounds that decide it.</b> Product sense, system design, SQL, coding, and a live AI data analyst you drive with Claude Code.</span>
            </li>
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>Hatch sees how you reason.</b> It names the weak spot and what to fix. Drill sites only say pass or fail.</span>
            </li>
          </ul>

          <div className="hero-cta-row">
            <button type="button" className="btn btn-amber hero-cta" onClick={openSignup}>
              Start free, no card needed <span aria-hidden>→</span>
            </button>
          </div>

          <div className="hero-eyebrow-mini" id="disciplines">GET HANDS-ON · CUSTOMIZE YOUR PRACTICE</div>

          <div className="disc-tabs-inline" role="tablist" aria-label="Choose a discipline">
            {DISCIPLINES.map((d) => (
              <button
                key={d.id}
                role="tab"
                aria-selected={active === d.id}
                className={'disc-tab' + (active === d.id ? ' active' : '')}
                onClick={() => selectPill(d.id)}
                type="button"
              >
                <span className="swatch" style={{ background: d.swatch }} />
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-right">
          <V3TryRep />
        </div>
      </div>
    </section>
  )
}
