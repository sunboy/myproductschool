import Link from 'next/link'
import { HeroStageCycler } from './HeroStageCycler'

export function LandingHero() {
  return (
    <section className="land-hero">
      <div className="land-hero-grid">
        <div>
          <div className="land-hero-eyebrow">
            <span className="land-dot" /> AI-native practice gym · Engineers &amp; PMs
          </div>
          <h1 className="land-hero-h1">
            Build with judgment. <br /><em>Or get replaced by a prompt.</em>
          </h1>
          <p className="land-hero-sub">
            Practice <b>real scenarios</b> across product sense, system design, data modeling, and coding, with Hatch coaching you in real time. Engineers stay relevant. PMs stay sharp. Everyone ships better.
          </p>
          <div className="land-hero-cta">
            <Link href="/login" className="land-btn land-btn--primary">Start free, no card →</Link>
            <a href="#disciplines" className="land-btn land-btn--ghost">▸ See all disciplines</a>
          </div>
          <div className="land-hero-stats">
            <div>
              <div className="k"><em>18</em>k</div>
              <div className="l">Engineers &amp; PMs<br />practicing weekly</div>
            </div>
            <div>
              <div className="k">92<em>%</em></div>
              <div className="l">Sharper thinking<br />after 3 weeks</div>
            </div>
            <div>
              <div className="k"><em>5</em></div>
              <div className="l">Disciplines, one<br />AI coach</div>
            </div>
          </div>
        </div>
        <div className="land-hero-stage">
          <HeroStageCycler initial="coach" />
        </div>
      </div>
    </section>
  )
}
