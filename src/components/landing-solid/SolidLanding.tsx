'use client'

import Image from 'next/image'
import Link from 'next/link'
import { JetBrains_Mono, Nunito_Sans } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import { CuriosityMenu } from '@/components/landing-solid/CuriosityMenu'
import { ShaderCanvas } from '@/components/landing-solid/ShaderCanvas'

const solidUi = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--solid-font-nunito',
})

const solidMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--solid-font-jetbrains',
})

const DISCIPLINES = [
  {
    key: 'product-sense',
    label: 'Product Sense',
    hatchImg: '/hackproduct-marketing/hatch/hatch-reviewing.png',
    description: 'FLOW-graded scenarios. Frame → List → Optimize → Win.',
    screenshot: '/hackproduct-marketing/screenshots/discipline-product-sense.png',
  },
  {
    key: 'system-design',
    label: 'System Design',
    hatchImg: '/hackproduct-marketing/hatch/hatch-idle.png',
    description: 'Architecture decisions under ambiguity. Draw the trade-off.',
    screenshot: '/hackproduct-marketing/screenshots/discipline-system-design.png',
  },
  {
    key: 'data-modeling',
    label: 'Data Modeling',
    hatchImg: '/hackproduct-marketing/hatch/hatch-listening.png',
    description: 'Schema decisions that reveal your product instincts.',
    screenshot: '/hackproduct-marketing/screenshots/discipline-data-modeling.png',
  },
  {
    key: 'sql',
    label: 'SQL',
    hatchImg: '/hackproduct-marketing/hatch/hatch-listening.png',
    description: 'Query the cohort. Explain the number.',
    screenshot: '/hackproduct-marketing/screenshots/discipline-sql.png',
  },
  {
    key: 'coding',
    label: 'Coding',
    hatchImg: '/hackproduct-marketing/hatch/hatch-reviewing.png',
    description: 'Ship working code. Then defend the design choice.',
    screenshot: '/hackproduct-marketing/screenshots/discipline-coding.png',
  },
]

const TESTIMONIALS = [
  { initial: 'A', name: 'Alex K.', company: 'Stripe', quote: 'Hatch caught the framing gap I kept missing.', outcome: 'Staff PM offer', scoreFrom: '3.1', scoreTo: '8.9', scoreDim: 'Frame' },
  { initial: 'M', name: 'Maya R.', company: 'Linear', quote: 'No other platform made me think about trade-offs this rigorously.', outcome: 'Passed system design round', scoreFrom: '4.2', scoreTo: '8.1', scoreDim: 'Optimize' },
  { initial: 'S', name: 'Sam T.', company: 'Anthropic', quote: 'The FLOW scoring is the only feedback that actually changed how I answer questions.', outcome: 'Landed senior PM role', scoreFrom: '2.8', scoreTo: '7.6', scoreDim: 'Win' },
  { initial: 'K', name: 'Kai N.', company: 'OpenAI', quote: 'I stopped hand-waving after the first week.', outcome: 'Passed all five interview loops', scoreFrom: '3.9', scoreTo: '9.1', scoreDim: 'Frame' },
  { initial: 'P', name: 'Priya V.', company: 'Notion', quote: 'The score breakdown shows exactly where I lost points.', outcome: 'Negotiated 30% salary increase', scoreFrom: '4.5', scoreTo: '8.4', scoreDim: 'List' },
  { initial: 'R', name: 'Rob A.', company: 'Ramp', quote: 'Real scenarios, real coaching. Not another listicle dressed up as a course.', outcome: 'Promotion cycle 3 months early', scoreFrom: '3.3', scoreTo: '8.7', scoreDim: 'Win' },
]

const DIMENSIONS = [
  'Framing', 'Trade-offs', 'Structure', 'Risk awareness', 'Clarity',
  'Decision speed', 'User grounding', 'Bias check', 'Communication', 'Iteration',
]

const FLOW_CARDS = [
  { letter: 'F', title: 'Frame', description: 'Find the job behind the request before chasing the loudest symptom.' },
  { letter: 'L', title: 'List', description: 'Open the solution space so the first plausible idea does not become the roadmap.' },
  { letter: 'O', title: 'Optimize', description: 'Use rough but explicit criteria to make the bet defendable.' },
  { letter: 'W', title: 'Win', description: 'Position the call so the listener knows who it is for, why now, and what validates it.' },
]

const COMPANIES = ['Stripe', 'Anthropic', 'OpenAI', 'Meta', 'Notion', 'Ramp', 'Vercel']

const FORMAT_CARDS = [
  {
    icon: '📝',
    title: 'Practice Reps',
    description: 'Submit an answer. Hatch scores every dimension.',
    bullets: ['5 disciplines: Product, System, Data, SQL, Code', 'FLOW rubric — not vibes', 'Score breakdown after every rep'],
    cta: 'Start a rep →',
    href: '/practice',
    highlight: false,
  },
  {
    icon: '🔍',
    title: 'Autopsies',
    description: 'Diagnose real product decisions that shipped.',
    bullets: ['126 cases, new weekly', 'Why did the team choose this?', 'What did they trade away?'],
    cta: 'Read one →',
    href: '/explore/showcase',
    highlight: true,
  },
  {
    icon: '🎙',
    title: 'Live AI Interview',
    description: 'A full mock interview for any discipline, run by Hatch in real time.',
    bullets: ['Any discipline, on demand', 'Hatch asks follow-ups, does not just nod', 'Full debrief with FLOW scores after'],
    cta: 'Start a live interview →',
    href: '/interviews/live-ai-interviews',
    highlight: false,
  },
]

function DisciplineSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sentinelRefs.current.indexOf(entry.target as HTMLDivElement)
            if (idx !== -1) setActiveIndex(idx)
          }
        }
      },
      { threshold: 0, rootMargin: '-40% 0px -40% 0px' }
    )
    const current = sentinelRefs.current
    current.forEach((el) => { if (el) observer.observe(el) })
    return () => { current.forEach((el) => { if (el) observer.unobserve(el) }) }
  }, [])

  return (
    <section className="solid-disciplines" id="disciplines" aria-labelledby="disciplines-title">
      <div className="solid-disciplines__scroll-driver">

        {/* Sticky pair: both columns stay fixed while sentinels scroll past */}
        <div className="solid-disciplines__sticky-pair">

          {/* Left: text content */}
          <div className="solid-disciplines__left">
            <p className="solid-eyebrow">Pick your angle. Every one is graded.</p>
            <h2 id="disciplines-title" className="solid-disciplines__label">
              {DISCIPLINES[activeIndex].label}
            </h2>
            <p className="solid-disciplines__desc">{DISCIPLINES[activeIndex].description}</p>
            <p className={`solid-disciplines__scroll-hint${activeIndex > 0 ? ' is-hidden' : ''}`} aria-hidden="true">
              ↓ scroll to explore
            </p>
            <div className="solid-disciplines__hatch">
              <Image
                src={DISCIPLINES[activeIndex].hatchImg}
                alt={`Hatch ${DISCIPLINES[activeIndex].label}`}
                width={180}
                height={180}
                sizes="180px"
              />
            </div>
          </div>

          {/* Right: overlapping image stack */}
          <div className="solid-disciplines__right">
            <div className="solid-disciplines__image-stack">
              {DISCIPLINES.map((d, i) => (
                <div
                  key={d.key}
                  className={`solid-disciplines__image-frame${activeIndex === i ? ' is-active' : ''}`}
                >
                  <div className="solid-disciplines__card-chip">{d.label}</div>
                  <Image
                    src={d.screenshot}
                    alt={`${d.label} challenge workspace`}
                    width={1280}
                    height={800}
                    sizes="(max-width: 768px) 92vw, 55vw"
                    className="solid-disciplines__screenshot"
                    priority={i === 0}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>
            {/* Progress dots */}
            <div className="solid-disciplines__dots" aria-hidden="true">
              {DISCIPLINES.map((d, i) => (
                <span key={d.key} className={`solid-disciplines__dot${activeIndex === i ? ' is-active' : ''}`} />
              ))}
            </div>
          </div>

        </div>

        {/* Invisible sentinels — drive which discipline is active as they scroll into view */}
        {DISCIPLINES.map((d, i) => (
          <div
            key={`sentinel-${d.key}`}
            ref={(el) => { sentinelRefs.current[i] = el }}
            className="solid-disciplines__sentinel"
            style={{ top: `${(i / DISCIPLINES.length) * 100}%` }}
            aria-hidden="true"
          />
        ))}

      </div>
    </section>
  )
}

export function SolidLanding() {
  return (
    <main className={`solid-landing ${solidUi.variable} ${solidMono.variable}`}>

      {/* ── 1. Nav ── */}
      <nav className="solid-nav" aria-label="Primary">
        <Link href="/" className="solid-wordmark" aria-label="HackProduct home">HackProduct</Link>
        <div className="solid-nav__links" aria-label="Page sections">
          <Link href="#disciplines">Disciplines</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#flow">FLOW</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/login">Sign in</Link>
        </div>
        <div className="solid-nav__actions">
          <Link className="solid-button solid-button--amber" href="/signup">Try a rep →</Link>
          <CuriosityMenu />
        </div>
      </nav>

      {/* ── 2. Hero ── */}
      <section className="solid-hero solid-hero--v2" aria-labelledby="solid-hero-title">
        <ShaderCanvas className="solid-shader-canvas" speed={1} intensity={0.9} />
        <div className="solid-shader-fade" aria-hidden="true" />

        <div className="solid-hero__copy solid-hero__copy--v2">
          <div className="solid-hero__pills">
            <div className="solid-hero__pill">
              <span className="solid-hero__pill-dot" aria-hidden="true" />
              Your last Frame score: 0.08. Ready to beat it?{' '}
              <Link href="/signup" className="solid-hero__pill-link">Take another rep →</Link>
            </div>
            <div className="solid-hero__pill">
              <span className="solid-hero__pill-dot solid-hero__pill-dot--amber" aria-hidden="true" />
              Live coaching is on right now
              <span className="solid-hero__pill-badge">REP 0247</span>
            </div>
          </div>

          <h1 id="solid-hero-title" className="solid-hero__headline">
            Stop <em className="solid-hero__headline-em">winging</em><br />it.
          </h1>

          <p className="solid-hero__sub">
            Practice the answer you&apos;ll give in the room. Hatch grades every word, not the vibe.
          </p>

          <div className="solid-hero__intent-buttons">
            {[
              { label: 'Crack the interview', angle: 'crack-the-interview' },
              { label: 'Get the promo', angle: 'get-the-promo' },
              { label: 'Lead the room', angle: 'lead-the-room' },
              { label: 'Sharpen daily', angle: 'sharpen-daily' },
            ].map(({ label, angle }) => (
              <Link key={label} href={`/signup?angle=${angle}`} className="solid-intent-btn">{label}</Link>
            ))}
          </div>

          <div className="solid-hero__inbox">
            <input
              type="email"
              placeholder="Enter your work email"
              aria-label="Work email for signup"
            />
            <Link className="solid-button solid-button--amber" href="/signup">
              Try a rep →
            </Link>
          </div>
          <p className="solid-hero__cta-note">No account. No credit card. Score in 3 minutes.</p>

          {/* Hatch inline pull quote */}
          <div className="solid-hero__hatch-quote">
            <Image
              src="/hackproduct-marketing/hatch/hatch-speaking.png"
              alt="Hatch speaking"
              width={52}
              height={52}
              sizes="52px"
              className="solid-hero__hatch-quote-img"
            />
            <blockquote className="solid-hero__hatch-quote-text">
              &ldquo;Trained on hours of interviews across every discipline. Hatch knows the mistakes before you make them.&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="solid-hero__mockup" aria-label="Live challenge and Hatch coaching preview">
          <div className="solid-browser-card">
            <div className="solid-browser-chrome">
              <div className="solid-browser-dots" aria-hidden="true">
                <span style={{ background: '#ff5f57' }} />
                <span style={{ background: '#ffbd2e' }} />
                <span style={{ background: '#28c840' }} />
              </div>
              <div className="solid-browser-url">hackproduct.com/rep/0247</div>
              <div className="solid-browser-live">
                <span className="solid-browser-live-dot" aria-hidden="true" />LIVE
              </div>
            </div>
            <div className="solid-browser-panels">
              <div className="solid-browser-panel solid-browser-panel--challenge">
                <p className="solid-browser-label">▶ PRODUCT SENSE · FRAME STEP</p>
                <p className="solid-browser-scenario">SaaS free-trial conversion drops 22% in a week. Pricing was tested.</p>
                <p className="solid-browser-prompt">What do you investigate first?</p>
                <div className="solid-browser-answer">
                  <code>Frame: free-trial drop is the symptom.<br />Real question: activation or pricing?<br />Cut by cohort. Compare TTV.</code>
                  <span className="solid-browser-submitted">↵ Submitted</span>
                </div>
              </div>
              <div className="solid-browser-panel solid-browser-panel--coach">
                <p className="solid-browser-label solid-browser-label--coach">▶ HATCH · COACH</p>
                <div className="solid-browser-hatch-avatar" aria-hidden="true">H</div>
                <p className="solid-browser-feedback">Good frame. Separated symptom from cause. Skipped one test: anchor on the timeline first.</p>
                <div className="solid-browser-score-row">
                  <span className="solid-browser-score-label">▶ SCORE · 8.3 / 10</span>
                </div>
                {[['Framing', 92], ['Trade-offs', 74], ['Structure', 88], ['Risk', 61]].map(([label, pct]) => (
                  <div key={label as string} className="solid-browser-bar-row">
                    <span>{label}</span>
                    <div className="solid-browser-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Social Proof Logos ── */}
      <section className="solid-logos" aria-label="Companies where engineers practice">
        <p className="solid-logos__eyebrow">Engineers from these companies practice here</p>
        <div className="solid-logos__row">
          {COMPANIES.map((c) => (
            <span key={c} className="solid-logos__company">{c}</span>
          ))}
        </div>
      </section>

      {/* ── 4. Five Disciplines ── */}
      <DisciplineSection />

      {/* ── 5. Live Demo ── */}
      <section id="how-it-works" className="solid-section solid-section--ink solid-live-demo" aria-labelledby="demo-title">
        <div className="solid-live-demo__copy">
          <p className="solid-eyebrow solid-eyebrow--light">Watch a rep</p>
          <h2 id="demo-title">Watch the full FLOW loop from prompt to score.</h2>
          <Link className="solid-button solid-button--amber" href="/signup">Try the scored workspace →</Link>
        </div>
        <div className="solid-browser-card solid-live-demo__card">
          <div className="solid-browser-chrome">
            <div className="solid-browser-dots" aria-hidden="true">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#ffbd2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <div className="solid-browser-url">hackproduct.com/workspace</div>
          </div>
          <div className="solid-live-demo__workspace">
            <div className="solid-live-demo__scenario">
              <p className="solid-live-demo__scenario-label">PRODUCT SENSE · FRAME</p>
              <p className="solid-live-demo__scenario-text">Uber Eats driver retention drops 18% in Q3. Support tickets are up. What is the real problem?</p>
              <textarea className="solid-live-demo__textarea" readOnly value="The symptom is driver churn. Before designing a fix, identify whether this is an earnings problem, a friction problem, or an expectation mismatch. I would start by segmenting by driver tenure and earnings tier." />
            </div>
            <div className="solid-live-demo__score">
              <p className="solid-live-demo__score-label">▶ HATCH SCORE · 7.8 / 10</p>
              {DIMENSIONS.map((dim) => (
                <div key={dim} className="solid-live-demo__dim-row">
                  <span>{dim}</span>
                  <div className="solid-live-demo__dim-bar">
                    <i style={{ width: `${40 + Math.abs(dim.charCodeAt(0) - 70) * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Format Picker ── */}
      <section className="solid-section solid-section--cream solid-format-picker" aria-labelledby="format-title">
        <p className="solid-eyebrow">Three ways to practice</p>
        <h2 id="format-title">Every format. Every discipline.</h2>
        <div className="solid-format-picker__grid">
          {FORMAT_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`solid-format-picker__card${card.highlight ? ' solid-format-picker__card--highlight' : ''}`}
            >
              {card.highlight && (
                <span className="solid-format-picker__new-badge">New</span>
              )}
              <span className="solid-format-picker__icon">{card.icon}</span>
              <strong className="solid-format-picker__title">{card.title}</strong>
              <p className="solid-format-picker__desc">{card.description}</p>
              <ul className="solid-format-card__bullets">
                {card.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <span className="solid-format-picker__cta">{card.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7. Calibration / Try It ── */}
      <section className="solid-section solid-section--ink solid-calibration" aria-labelledby="calibration-title">
        <div className="solid-calibration__copy">
          <p className="solid-eyebrow solid-eyebrow--light">Take one rep. See what Hatch sees.</p>
          <h2 id="calibration-title">Answer one scenario. See exactly where you stand.</h2>
        </div>
        <div className="solid-calibration__workspace">
          <div className="solid-calibration__scenario">
            <p className="solid-calibration__scenario-label">PRODUCT SENSE · FRAME STEP</p>
            <p className="solid-calibration__scenario-text">
              Uber Eats driver app sessions drop 22% in Q3. Complaints are up 40%. A new payout UI shipped last month. What is the real problem, and what do you investigate first?
            </p>
          </div>
          <textarea
            className="solid-calibration__textarea"
            placeholder="Frame the real problem before jumping to a solution..."
            rows={5}
          />
          <div className="solid-calibration__rubric">
            <span className="solid-calibration__rubric-label">FLOW rubric: Frame step</span>
            <div className="solid-calibration__rubric-items">
              <span>F1 Symptom → root cause</span>
              <span>F2 Why before how</span>
              <span>F3 Problem statement</span>
              <span>F4 Scope boundary</span>
            </div>
          </div>
          <Link className="solid-button solid-button--amber" href="/signup">Submit answer →</Link>
        </div>
      </section>

      {/* ── 8. Proof (merged Score Proof + Testimonials) ── */}
      <section className="solid-section solid-section--ink solid-testimonials" aria-labelledby="testimonials-title">
        <p className="solid-eyebrow solid-eyebrow--light">What changed after the reps.</p>
        <h2 id="testimonials-title">Results, not vibes.</h2>
        <div className="solid-testimonials__grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="solid-testimonials__card">
              <div className="solid-testimonials__header">
                <span className="solid-testimonials__avatar">{t.initial}</span>
                <div>
                  <strong className="solid-testimonials__name">{t.name}</strong>
                  <span className="solid-testimonials__company">{t.company}</span>
                </div>
              </div>
              <p className="solid-testimonials__quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="solid-testimonials__score-chip">
                <span className="solid-testimonials__score-dim">{t.scoreDim}:</span>
                <span className="solid-testimonials__score-from">{t.scoreFrom}</span>
                <span className="solid-testimonials__score-arrow">→</span>
                <span className="solid-testimonials__score-to">{t.scoreTo}</span>
                <span className="solid-testimonials__score-star">★</span>
                <span className="solid-testimonials__outcome">{t.outcome}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. FLOW Section ── */}
      <section id="flow" className="solid-section solid-section--cream solid-flow-section2" aria-labelledby="flow-title">
        <div className="solid-flow-section2__header">
          <h2 id="flow-title">Four moves. One system.</h2>
          <p className="solid-flow-section2__subline">Every answer scored against the same four moves. No partial credit for almost-right.</p>
        </div>
        <div className="solid-flow-section2__grid">
          {FLOW_CARDS.map((card) => (
            <div key={card.letter} className="solid-flow-section2__card">
              <span className="solid-flow-section2__letter">{card.letter}</span>
              <strong className="solid-flow-section2__title">{card.title}</strong>
              <p className="solid-flow-section2__desc">{card.description}</p>
            </div>
          ))}
        </div>
        <p className="solid-flow-section2__dimensions">
          Every answer graded on: {DIMENSIONS.join(' · ')}
        </p>
      </section>

      {/* ── 10. Pricing ── */}
      <section id="pricing" className="solid-section solid-section--cream solid-pricing" aria-labelledby="pricing-title">
        <p className="solid-eyebrow">Three doors. Start free.</p>
        <h2 id="pricing-title">No cohorts. No wait list. Start tonight.</h2>
        <div className="solid-pricing__grid">
          <div className="solid-pricing__tier">
            <strong className="solid-pricing__name">Try a Rep</strong>
            <span className="solid-pricing__price">$0</span>
            <span className="solid-pricing__period">No signup</span>
            <ul className="solid-pricing__list">
              <li>One rep at a time</li>
              <li>Hatch grades it live</li>
              <li>FLOW score visible</li>
            </ul>
            <Link className="solid-button solid-button--ink" href="/practice">Start now →</Link>
          </div>
          <div className="solid-pricing__tier solid-pricing__tier--featured">
            <strong className="solid-pricing__name">Daily Rep</strong>
            <span className="solid-pricing__price">$0</span>
            <span className="solid-pricing__period">Email required</span>
            <ul className="solid-pricing__list">
              <li>One rep per day</li>
              <li>Full Hatch feedback</li>
              <li>Streak tracking</li>
              <li>Saved progress</li>
            </ul>
            <Link className="solid-button solid-button--amber" href="/signup">Sign up free →</Link>
          </div>
          <div className="solid-pricing__tier">
            <strong className="solid-pricing__name">Full Reps</strong>
            <span className="solid-pricing__price">$29</span>
            <span className="solid-pricing__period">per month</span>
            <ul className="solid-pricing__list">
              <li>Unlimited reps</li>
              <li>Hatch coaching on every step</li>
              <li>Private analytics dashboard</li>
              <li>Live interview rooms</li>
              <li>Study plan sequences</li>
            </ul>
            <Link className="solid-button solid-button--ink" href="/signup">Start full access →</Link>
          </div>
        </div>
      </section>

      {/* ── 11. Final CTA ── */}
      <section className="solid-final-cta" aria-labelledby="solid-final-title">
        <ShaderCanvas className="solid-shader-canvas" speed={0.65} intensity={0.82} />
        <div className="solid-shader-fade solid-shader-fade--cta" aria-hidden="true" />
        <div className="solid-final-cta__content">
          <p className="solid-eyebrow solid-eyebrow--light">REP 0001 · 3 minutes · No signup</p>
          <h2 id="solid-final-title">Be ready.</h2>
          <p className="solid-final-cta__sub">Pick a discipline. Answer one question. Hatch tells you where you actually are.</p>
          <Link className="solid-button solid-button--amber" href="/signup">Start free →</Link>
        </div>
      </section>

      {/* ── 12. Footer ── */}
      <footer className="solid-footer solid-footer--full">
        <div className="solid-footer__brand">
          <Link href="/" className="solid-wordmark">HackProduct</Link>
          <p className="solid-footer__tagline">Practice gym for product thinking.</p>
        </div>
        <div className="solid-footer__col">
          <strong>Reps</strong>
          <Link href="/practice">Practice</Link>
          <Link href="/explore/showcase">Autopsies</Link>
          <Link href="/interviews/live-ai-interviews">Live Sessions</Link>
          <Link href="/study-plans">Study Plans</Link>
          <Link href="#flow">FLOW</Link>
        </div>
        <div className="solid-footer__col">
          <strong>For</strong>
          <Link href="/practice">Engineers</Link>
          <Link href="/interviews/live-ai-interviews">PM interviews</Link>
          <Link href="/study-plans">Onboarding</Link>
        </div>
        <div className="solid-footer__col">
          <strong>Company</strong>
          <Link href="/help">Help</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/changelog">Changelog</Link>
        </div>
        <div className="solid-footer__bottom">
          <span>© 2026 HackProduct. All rights reserved.</span>
        </div>
      </footer>

    </main>
  )
}
