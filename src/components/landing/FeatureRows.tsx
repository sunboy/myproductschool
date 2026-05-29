import Link from 'next/link'
import { PracticeWorkbench } from './LivePreviews'

const FEATURES = [
  {
    id: 'frame',
    move: 'Frame',
    title: 'Name the real problem before solving it.',
    body: 'Separate symptoms from the business, user, and technical constraint that actually matters.',
    href: '/flow',
  },
  {
    id: 'list',
    move: 'List',
    title: 'Generate options without collapsing too early.',
    body: 'List hypotheses, architectures, data cuts, and trade-offs before choosing the path.',
    href: '/flow',
  },
  {
    id: 'optimize',
    move: 'Optimize',
    title: 'Use evidence to make the best next move.',
    body: 'Pressure-test metrics, constraints, cost, risk, and reversibility before recommending.',
    href: '/flow',
  },
  {
    id: 'win',
    move: 'Win',
    title: 'Land a crisp recommendation people can act on.',
    body: 'State the decision, the evidence, the risk, and the follow-up in a promotion-ready form.',
    href: '/flow',
  },
] as const

export function FeatureRows() {
  return (
    <section id="flow" className="mkt-section mkt-flow">
      <div className="mkt-section-head">
        <p>FLOW feedback</p>
        <h2>Courses explain. HackProduct trains.</h2>
        <p>
          Every rep is scored against the same four judgment moves. That makes
          progress visible across product, systems, data, SQL, coding, and AI work.
        </p>
      </div>

      <div className="mkt-flow-showcase">
        <div className="mkt-flow-visual">
          <PracticeWorkbench />
        </div>
        <div className="mkt-flow-grid">
        {FEATURES.map((feature) => (
          <article key={feature.id} className="mkt-flow-card">
            <span>{feature.move}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
            <Link href={feature.href}>Explore FLOW</Link>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
