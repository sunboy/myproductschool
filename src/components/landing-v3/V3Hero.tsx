'use client'

import Link from 'next/link'
import { ArrowUpRight, Check, Code2, Database, Network, Sparkles } from 'lucide-react'

const areas = [
  { label: 'Coding & SQL', icon: Code2, href: '/practice' },
  { label: 'System design', icon: Network, href: '/practice' },
  { label: 'Product thinking', icon: Sparkles, href: '/practice' },
  { label: 'AI analytics', icon: Database, href: '/claude-code-analytics' },
]

export function V3Hero() {
  return (
    <section className="hp-launch-hero" id="top">
      <div className="shell hp-launch-grid">
        <div className="hp-launch-copy">
          <p className="hp-launch-kicker">BUILD SKILLS. OPEN POSSIBILITIES.</p>
          <h1>Learn deeply.<br />Think clearly.<br /><em>Build what’s next.</em></h1>
          <p className="hp-launch-description">Real challenges, thoughtful learning material, and guidance that understands your work. Grow your technical skills and prepare for your next interview.</p>
          <div className="hp-launch-actions">
            <Link className="hp-launch-primary" href="/signup">Start learning <ArrowUpRight size={19} aria-hidden /></Link>
            <Link className="hp-launch-secondary" href="/practice">Explore challenges</Link>
          </div>
          <p className="hp-launch-note">Start free. No credit card required.</p>
        </div>
        <div className="hp-launch-example" aria-label="Example of contextual learning feedback">
          <div className="hp-launch-field" aria-hidden />
          <div className="hp-launch-prompt"><Sparkles size={20} aria-hidden /><p>You chose eventual consistency.<br /><strong>What trade-off does that create?</strong></p></div>
          <article className="hp-launch-feedback">
            <p className="hp-launch-kicker">SYSTEM DESIGN · EXAMPLE FEEDBACK</p>
            <h2>A URL shortener,<br />and a clearer way to think.</h2>
            <p className="hp-launch-feedback-intro">Understand what worked and where to go deeper.</p>
            <ul>{['Clear traffic assumptions', 'Separate read and write paths', 'A thoughtful caching strategy'].map(item => <li key={item}><Check size={18} aria-hidden />{item}</li>)}</ul>
            <div className="hp-launch-next"><span>YOUR NEXT STEP</span><p>Explore how the system recovers when a service goes down.</p></div>
            <Link href="/hatch-preview">Meet Hatch, your learning companion <ArrowUpRight size={17} aria-hidden /></Link>
          </article>
        </div>
      </div>
      <nav id="disciplines" className="shell hp-launch-areas" aria-label="Explore learning areas">
        {areas.map(({label,icon:Icon,href}) => <Link href={href} key={label}><Icon size={23} aria-hidden /><span>{label}</span><ArrowUpRight size={16} aria-hidden /></Link>)}
      </nav>
    </section>
  )
}
