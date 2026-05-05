import Link from 'next/link'
import {
  AnalyticsBoard,
  FeedbackConsole,
  PracticeWorkbench,
  RoadmapPreview,
} from './LivePreviews'

const FEATURES = [
  {
    id: 'build',
    image: 'I',
    title: 'A full roadmap tailored to your interview loop',
    body: "When prep feels fuzzy, HackProduct turns your target role into sequenced tasks: diagnostics, weak moves, live reps, and review blocks.",
    link: 'Learn how to start',
    href: '/study-plans',
    visual: <RoadmapPreview />,
  },
  {
    id: 'practice',
    image: 'II',
    title: 'Build interview answers with specialist AI coaches',
    body: 'Practice with product, systems, SQL, data modeling, and coding coaches that ask the follow-up your interviewer would ask.',
    link: 'Learn how to build',
    href: '/practice',
    visual: <PracticeWorkbench />,
  },
  {
    id: 'review',
    image: 'III',
    title: 'Review every answer with receipts, not vibes',
    body: 'Hatch scores the FLOW moves, highlights the sentence that earned or lost the point, and queues the next drill.',
    link: 'Learn how to review',
    href: '/skills',
    visual: <FeedbackConsole />,
  },
  {
    id: 'scale',
    image: 'IV',
    title: 'Scale from daily reps to hiring-panel readiness',
    body: 'Progress analytics show which disciplines are compounding, which weak moves still leak points, and where to spend the next session.',
    link: 'Learn how to scale',
    href: '/progress',
    visual: <AnalyticsBoard />,
  },
]

export function FeatureRows() {
  return (
    <section className="land-agent-section">
      <div className="land-agent-intro">
        <h2>Build real interview judgment with the help of specialized coaches</h2>
        <p>From your first product-sense case to a final staff panel, HackProduct supports the whole loop.</p>
      </div>

      <div className="land-agent-flow">
        {FEATURES.map((feature) => (
          <article key={feature.id} id={feature.id} className="land-agent-row">
            <div className="land-agent-copy">
              <div className="land-agent-icon">{feature.image}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <Link href={feature.href}>{feature.link}</Link>
            </div>
            <div className="land-agent-divider" aria-hidden />
            <div className="land-agent-visual">
              {feature.visual}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
