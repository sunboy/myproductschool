import Link from 'next/link'
import Image from 'next/image'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { HeroShader } from './HeroShader'
import { ProductCommandCenter } from './LivePreviews'

const TRAINING_FORMATS = [
  {
    label: 'Career paths',
    title: 'Guided routes to the next role',
    body: 'Interview prep, engineer-to-product, senior/staff readiness, and proof of level.',
    href: '/role-transitions',
  },
  {
    label: 'Practice reps',
    title: 'Scenario drills with live follow-up',
    body: 'Product sense, systems, SQL, data modeling, coding, and AI-native workflow reps.',
    href: '/practice',
  },
  {
    label: 'FLOW feedback',
    title: 'A scoring system for judgment',
    body: 'Frame, List, Optimize, and Win on every answer so weak moves become visible.',
    href: '/flow',
  },
] as const

const TRENDING_REPS = [
  {
    title: 'Product sense interview sprint',
    meta: '6 reps - Starts with a diagnostic',
    coach: 'Hatch follow-ups',
    href: '/interview-prep',
  },
  {
    title: 'Staff engineer product strategy',
    meta: '4 weeks - Promotion readiness',
    coach: 'Win score receipts',
    href: '/uplevel',
  },
  {
    title: 'Engineer to product-minded builder',
    meta: '3 weeks - Role transition',
    coach: 'Frame practice',
    href: '/role-transitions',
  },
  {
    title: 'SQL analytics for product loops',
    meta: '8 reps - Cohorts and funnels',
    coach: 'Optimize feedback',
    href: '/skills/sql',
  },
  {
    title: 'Realtime notification system design',
    meta: 'System design - Trade-off review',
    coach: 'List pressure',
    href: '/practice/realtime-notification-system',
  },
  {
    title: 'Negotiation proof portfolio',
    meta: 'Evidence trail - Level signal',
    coach: 'Artifact review',
    href: '/salary-negotiation',
  },
] as const

export function LandingHero() {
  return (
    <section className="mkt-hero">
      <HeroShader />
      <div className="mkt-hero-inner">
        <div className="mkt-hero-copy">
          <h1>
            Practice judgment under pressure.
          </h1>
          <p>
            Run realistic reps for interviews, role transitions, promotion,
            and salary proof. Hatch pushes your reasoning, FLOW scores the weak
            move, and every session leaves a receipt.
          </p>
          <div className="mkt-hero-actions">
            <Link href="/login?returnTo=/challenges" prefetch={false} className="mkt-button mkt-button-primary">
              Start a free rep
            </Link>
            <Link href="#career-goals" className="mkt-button mkt-button-secondary">
              Choose your career goal
            </Link>
          </div>
        </div>

        <aside className="mkt-hero-panel" aria-label="Hatch coaching preview">
          <ProductCommandCenter />
          <div className="mkt-hero-hatch-card">
            <Image
              src="/images/hacky_thinking.png"
              width={108}
              height={84}
              alt="Hatch reviewing a practice answer"
              priority
            />
            <p>Hatch is not decoration. It follows the rep, asks the next question, and keeps the weak move visible.</p>
          </div>
        </aside>
      </div>

      <div className="mkt-format-strip" aria-label="Training formats">
        {TRAINING_FORMATS.map((format) => (
          <Link key={format.label} href={format.href} className="mkt-format-card">
            <span>{format.label}</span>
            <h2>{format.title}</h2>
            <p>{format.body}</p>
            <HatchGlyph state={format.label === 'Practice reps' ? 'challenging' : format.label === 'FLOW feedback' ? 'reviewing' : 'speaking'} size={36} />
          </Link>
        ))}
      </div>

      <div className="mkt-trending">
        <div className="mkt-trending-head">
          <h2>Trending practice this week</h2>
          <Link href="/practice">See all</Link>
        </div>
        <div className="mkt-trending-grid">
          {TRENDING_REPS.map((rep, index) => (
            <Link key={rep.title} href={rep.href} className="mkt-rep-card">
              <span className="mkt-rank">{index + 1}</span>
              <h3>{rep.title}</h3>
              <p>{rep.meta}</p>
              <small>{rep.coach}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
