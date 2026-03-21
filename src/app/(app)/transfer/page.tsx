import Link from 'next/link'

const SCENARIOS = [
  {
    id: 'sprint-tradeoffs',
    icon: 'balance',
    title: 'Sprint trade-off conversations',
    description: 'When scope creep hits and you need to cut something — how to frame it as a PM would.',
    concept: 'Trade-off Analysis',
    engineeringContext: 'Negotiating scope in sprint planning with product and design',
    pmSkill: 'prioritization',
  },
  {
    id: 'metric-debugging',
    icon: 'bug_report',
    title: 'Debugging with metrics first',
    description: 'Before writing code, frame the bug in terms of user impact and business cost.',
    concept: 'North Star Metric',
    engineeringContext: 'Triaging production incidents and deciding what to fix first',
    pmSkill: 'metrics-analytics',
  },
  {
    id: 'feature-alignment',
    icon: 'handshake',
    title: 'Getting alignment on features',
    description: 'Use JTBD framing to align stakeholders on WHY a feature matters before HOW to build it.',
    concept: 'Jobs To Be Done',
    engineeringContext: 'Engineering-PM-Design sync meetings for new features',
    pmSkill: 'product-strategy',
  },
  {
    id: 'api-design-ux',
    icon: 'api',
    title: 'API design as user experience',
    description: 'Apply product thinking to developer experience — your API is a product, developers are users.',
    concept: 'User Research',
    engineeringContext: 'Designing internal or external API interfaces',
    pmSkill: 'user-research',
  },
  {
    id: 'ship-it-decision',
    icon: 'rocket_launch',
    title: 'When to ship vs. polish',
    description: 'Frame the ship/polish decision using risk, user segments, and activation signals.',
    concept: 'Product-Market Fit',
    engineeringContext: 'Feature flagging, canary releases, rollout decisions',
    pmSkill: 'go-to-market',
  },
  {
    id: 'tech-debt-prioritization',
    icon: 'engineering',
    title: 'Prioritizing tech debt like a PM',
    description: 'Frame tech debt in terms of user impact and business outcomes to get buy-in.',
    concept: 'ICE Scoring',
    engineeringContext: 'Tech debt backlog refinement and roadmap conversations',
    pmSkill: 'prioritization',
  },
]

export default function TransferHubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Transfer Hub</h1>
        <p className="text-on-surface-variant mt-1">Apply product thinking to your engineering day-to-day.</p>
      </div>

      <div className="p-5 bg-primary-container rounded-2xl">
        <p className="text-on-primary-container text-sm leading-relaxed">
          <strong>Product thinking isn&apos;t just for PM interviews.</strong> Engineers who think like PMs make better technical decisions, get more done with less conflict, and advance faster. These scenarios map product concepts to situations you already face as an engineer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map(scenario => (
          <div
            key={scenario.id}
            className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">{scenario.icon}</span>
              </div>
              <div>
                <h3 className="font-medium text-on-surface">{scenario.title}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{scenario.description}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-outline-variant">
              <p className="text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">In practice:</span> {scenario.engineeringContext}
              </p>
            </div>
            <Link
              href={`/domains/${scenario.pmSkill}`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">school</span>
              Learn {scenario.concept}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
