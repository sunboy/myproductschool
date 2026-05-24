'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { DISCIPLINES, type DisciplineId } from './disciplines'
import { V3DisciplineScreen } from './V3DisciplineScreen'

const PILL_MESSAGES = ['Maximize interview readiness', 'AI coaching, real reps, and human judgment converge']

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

function HeroForm() {
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')

    if (typeof email === 'string' && email.includes('@')) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="hero-form-success" role="status">
        <CheckIcon />
        <span>You&apos;re in. Check your inbox for your first rep.</span>
      </div>
    )
  }

  return (
    <form className="hero-form" onSubmit={onSubmit}>
      <input
        name="email"
        type="email"
        required
        placeholder="you@work.com"
        aria-label="Work email"
      />
      <button type="submit">
        Get started <span aria-hidden>→</span>
      </button>
    </form>
  )
}

const CYCLE_MS = 5000

export function V3Hero() {
  const [active, setActive] = useState<DisciplineId>('product')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setActive((cur) => {
        const idx = DISCIPLINES.findIndex((d) => d.id === cur)
        return DISCIPLINES[(idx + 1) % DISCIPLINES.length].id
      })
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [paused])

  function selectPill(id: DisciplineId) {
    setPaused(true)
    setActive(id)
  }

  return (
    <section className="hero" id="top">
      <div className="shell hero-inner">
        <div className="hero-left">
          <AnnouncementPill />

          <h1 className="hero-display">
            The AI-native practice system for product and technical judgment.
          </h1>

          <ul className="hero-bullets">
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>One connected loop.</b> Live interviews, Hatch coaching, scoring, autopsies, study plans, code, and canvas practice.</span>
            </li>
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>Real reps, not flashcards.</b> Practice the artifacts, tradeoffs, and communication that real loops actually score.</span>
            </li>
            <li className="hero-bullet">
              <span className="hero-bullet-check"><CheckIcon /></span>
              <span><b>Hatch, your AI coach.</b> Reads your work, catches blind spots, and helps human judgment compound.</span>
            </li>
          </ul>

          <HeroForm />

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
          <V3DisciplineScreen active={active} cycling={!paused} cycleMs={CYCLE_MS} />
        </div>
      </div>
    </section>
  )
}
