import Link from 'next/link'

const DISCIPLINES = [
  ['Product sense', 'Frame ambiguous product changes and recommend a next move.', '/skills/product-sense'],
  ['System design', 'Trade off reliability, latency, data flow, and product constraints.', '/skills/system-design'],
  ['Data modeling', 'Model entities, events, and access patterns for real products.', '/skills/data-modeling'],
  ['SQL', 'Translate product questions into trustworthy cohorts, funnels, and metrics.', '/skills/sql'],
  ['Coding', 'Review, debug, and explain implementation choices under pressure.', '/skills/coding'],
  ['AI-native workflows', 'Use agents and LLMs with the judgment to verify what they produce.', '/skills/ai-native-workflows'],
] as const

export function DisciplinesSection() {
  return (
    <section id="gym" className="mkt-section mkt-catalog">
      <div className="mkt-section-head mkt-section-head-row">
        <div>
          <p>Practice catalog</p>
          <h2>Disciplines are training tracks, not content shelves.</h2>
        </div>
        <Link href="/skills" className="mkt-text-link">Browse all skills</Link>
      </div>
      <div className="mkt-discipline-grid">
        {DISCIPLINES.map(([title, body, href]) => (
          <Link key={title} href={href} className="mkt-discipline-card">
            <span>{title}</span>
            <p>{body}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
