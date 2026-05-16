import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { FeedbackConsole, RoadmapPreview } from './LivePreviews'

const STEPS = [
  ['1', 'Pick a career moment', 'Interview loop, role transition, promotion packet, or proof of level.'],
  ['2', 'Run a realistic rep', 'Answer a product, systems, data, SQL, coding, or AI-native prompt.'],
  ['3', 'Get pushed by Hatch', 'Follow-up questions expose shallow frames and missing trade-offs.'],
  ['4', 'Save the receipt', 'FLOW scores, weak moves, and artifacts become evidence you can revisit.'],
] as const

const PROOF = [
  ['Weak-move map', 'See whether Frame, List, Optimize, or Win is holding you back.'],
  ['Career artifacts', 'Turn strong reps into decision memos, interview notes, and level evidence.'],
  ['Learner DNA', 'Track where your operating judgment is getting stronger over time.'],
] as const

export function Quotes() {
  return (
    <>
      <section className="mkt-section mkt-steps">
        <div className="mkt-section-head">
          <p>Practice gym</p>
          <h2>One loop, repeated until your answer holds up.</h2>
        </div>
        <div className="mkt-step-showcase">
          <div className="mkt-step-grid">
            {STEPS.map(([number, title, body]) => (
              <article key={title} className="mkt-step-card">
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <RoadmapPreview />
        </div>
      </section>

      <section id="proof" className="mkt-section mkt-proof">
        <div className="mkt-proof-panel">
          <div className="mkt-proof-copy">
            <p>Proof of progress</p>
            <h2>Receipts beat vibes.</h2>
            <p>
              HackProduct does not promise compensation outcomes. It helps you
              build inspectable proof of operating judgment before interviews,
              promotion conversations, and negotiation prep.
            </p>
            <Link href="/salary-negotiation" className="mkt-text-link">See salary proof path</Link>
          </div>
          <div className="mkt-proof-list">
            <FeedbackConsole />
            {PROOF.map(([title, body]) => (
              <article key={title}>
                <HatchGlyph state="reviewing" size={30} />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
