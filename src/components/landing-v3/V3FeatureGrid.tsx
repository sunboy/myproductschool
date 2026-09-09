import Link from 'next/link'
import { BarChart3, BookOpen, LineChart, Mic2, Sparkles, Target } from 'lucide-react'

const featureCells = [
  { title: 'Challenges', icon: Target, href: '/challenges' },
  { title: 'Library', icon: BookOpen, href: '/explore' },
  { title: 'Live interviews', icon: Mic2, href: '/live-interviews' },
  { title: 'AI analytics', icon: LineChart, href: '/claude-code-analytics' },
  { title: 'Hatch coach', icon: Sparkles, href: '/hatch-preview' },
  { title: 'Progress', icon: BarChart3, href: '/progress' },
] as const

export function V3FeatureGrid() {
  return (
    <section className="feature-grid-section" id="features" aria-labelledby="feature-grid-heading">
      <div className="shell">
        <div className="feature-grid-copy">
          <h2 id="feature-grid-heading">Everything you need to build judgment.</h2>
          <p>Practice with Hatch, explore the library, use Claude Code analytics, and track your progress.</p>
        </div>

        <div className="feature-grid-frame" aria-label="HackProduct features">
          <div className="feature-grid">
            {featureCells.map((feature) => {
              const Icon = feature.icon
              return (
                <Link className="feature-cell" href={feature.href} key={feature.title}>
                  <Icon aria-hidden="true" strokeWidth={1.85} />
                  <span>{feature.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
