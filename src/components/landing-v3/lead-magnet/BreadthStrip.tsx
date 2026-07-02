import { BREADTH_DISCIPLINES, BREADTH_HEADLINE, BREADTH_SUBLINE } from '@/lib/lead-magnets/config'

/**
 * The "one connected gym" positioning strip, shown above the footer on every
 * /go/* page. Doubles as cross-sell: whichever magnet brought the visitor in,
 * this reinforces that the same tool trains every other skill too.
 *
 * Claim matches disciplines.ts + V3FeatureGrid real/active surfaces — it does
 * NOT list coming-soon items (quick takes, flashcards, vocabulary, notes).
 */
export function BreadthStrip() {
  return (
    <section className="lm-breadth">
      <div className="shell">
        <p className="lm-breadth-proof">Built from 104 real product decisions, dissected move by move.</p>
        <p className="eyebrow"><span className="dot" />One connected gym</p>
        <h2 className="lm-breadth-head">{BREADTH_HEADLINE}</h2>
        <p className="lm-breadth-sub">{BREADTH_SUBLINE}</p>
        <ul className="lm-breadth-list">
          {BREADTH_DISCIPLINES.map((d) => (
            <li key={d} className="lm-breadth-chip">{d}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
