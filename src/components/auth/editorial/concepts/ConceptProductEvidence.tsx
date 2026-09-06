import Image from 'next/image'
import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { AuthCard } from '@/components/auth/editorial/AuthCard'
import '@/components/auth/editorial/editorial-auth-card.css'
import '../concept-product-evidence.css'

const DIMENSIONS = [
  ['System Design', 88],
  ['Product Judgment', 84],
  ['Scalability', 82],
  ['Tradeoffs', 80],
  ['Failure handling', 86],
] as const

const AREA_ICONS = [
  ['⌘', 'Coding'],
  ['▤', 'SQL'],
  ['⌘', 'System Design'],
  ['◉', 'Product'],
  ['✣', 'AI Analytics'],
] as const

const BENEFITS = [
  ['5', 'Practice across 5 areas', 'Coding, SQL, System Design, Product Judgment & AI Analytics'],
  ['◎', 'AI feedback that helps', 'Detailed, fair and actionable feedback on every attempt'],
  ['▥', 'Track & improve', 'See your progress and build consistency over time'],
  ['◌', 'Built for engineers', 'Interview prep that reflects real engineering work'],
] as const

interface ConceptProductEvidenceProps {
  mode: 'login' | 'signup'
  redirectTo?: string
  archetype?: string
}

/**
 * Login concept 01 — Product Evidence (brand default per DESIGN_SYSTEM's
 * production recommendation). Editorial message + concrete product review +
 * Hatch peek + dimension sidecar + real auth card.
 */
export function ConceptProductEvidence({ mode, redirectTo, archetype }: ConceptProductEvidenceProps) {
  return (
    <main className="concept-one hp-auth">
      <header>
        <Link className="brand" href="/" aria-label="HackProduct home">
          <HackProductWordmark priority />
        </Link>
      </header>
      <section className="concept-one-grid">
        <div className="form-zone">
          <AuthCard mode={mode} redirectTo={redirectTo} archetype={archetype} turnstileTheme="light" />
        </div>
        <div className="story">
          <div className="story-kicker">BUILD SKILL. BUILD WHAT&apos;S NEXT.</div>
          <h2>
            Great engineers
            <br />
            think in systems.
            <br />
            We help you <em>prove it.</em>
          </h2>
          <p>Real technical challenges. AI feedback that&apos;s detailed, fair and actionable. Build practical skill and get interview ready.</p>
          <div className="area-icons">
            {AREA_ICONS.map(([icon, label]) => (
              <div key={label}>
                <span>{icon}</span>
                <b>{label}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="evidence-zone">
          <div className="shape taupe" />
          <div className="shape green" />
          <div className="shape amber" />
          <div className="hatch-peek">
            <Image src="/landing-v5/hatch-transparent.png" alt="" width={581} height={747} priority />
          </div>
          <article className="review-card">
            <header>
              <span>⌘</span>
              <strong>SYSTEM DESIGN</strong>
              <i>·</i>
              <strong>URL SHORTENER</strong>
              <span className="example-label">Example feedback</span>
            </header>
            <div className="review-main">
              <div className="score">86</div>
              <div>
                <h3>Strong</h3>
                <ul>
                  <li>Clarified traffic assumptions</li>
                  <li>Separated read/write paths</li>
                  <li>Explained caching tradeoff</li>
                </ul>
              </div>
            </div>
            <div className="needs">
              <h3>Needs work</h3>
              <span>Failure recovery</span>
              <span>Consistency model</span>
            </div>
            <div className="coach-note">
              &ldquo;You chose eventual consistency.
              <br />
              <strong>Defend that decision.</strong>&rdquo;
            </div>
          </article>
          <aside className="dimension-card">
            <div className="dimension-title">DIMENSION BREAKDOWN</div>
            {DIMENSIONS.map(([name, score]) => (
              <div className="dim" key={name}>
                <span>{name}</span>
                <i><b style={{ width: `${score}%` }} /></i>
                <strong>{score}</strong>
              </div>
            ))}
            <Link href="/pricing">View full feedback →</Link>
          </aside>
        </div>
      </section>
      <footer className="benefit-strip">
        {BENEFITS.map(([icon, title, desc]) => (
          <div className="benefit" key={title}>
            <span>{icon}</span>
            <div>
              <b>{title}</b>
              <p>{desc}</p>
            </div>
          </div>
        ))}
      </footer>
    </main>
  )
}
